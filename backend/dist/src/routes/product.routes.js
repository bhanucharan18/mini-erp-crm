import { Router } from "express";
import prisma from "../config/prisma.js";
import authMiddleware, { authorize } from "../middleware/auth.middleware.js";
const router = Router();
/**
 * GET ALL PRODUCTS
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                sku: "asc",
            },
        });
        res.json({
            success: true,
            products,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
});
/**
 * GET PRODUCT BY ID
 */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                stockMovements: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 10,
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            product,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
});
/**
 * CREATE PRODUCT
 */
router.post("/", authMiddleware, authorize(["ADMIN", "WAREHOUSE"]), async (req, res) => {
    try {
        const { name, sku, category, unitPrice, initialStock = 0, minStockAlert = 0, warehouseLocation, } = req.body;
        if (!name || !sku || !category || unitPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU, Category, and Unit Price are required",
            });
        }
        // Check SKU unique
        const existingSku = await prisma.product.findUnique({
            where: { sku },
        });
        if (existingSku) {
            return res.status(409).json({
                success: false,
                message: "Product with this SKU already exists",
            });
        }
        // Run creation in a transaction if initialStock > 0
        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    sku,
                    category,
                    unitPrice: Number(unitPrice),
                    currentStock: Number(initialStock),
                    minStockAlert: Number(minStockAlert),
                    warehouseLocation,
                },
            });
            if (Number(initialStock) > 0) {
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        quantity: Number(initialStock),
                        movementType: "IN",
                        reason: "Initial stock ingestion",
                        createdById: req.user.userId,
                    },
                });
            }
            return product;
        });
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: result,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
});
/**
 * UPDATE PRODUCT
 */
router.put("/:id", authMiddleware, authorize(["ADMIN", "WAREHOUSE"]), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, sku, category, unitPrice, minStockAlert, warehouseLocation, } = req.body;
        if (!name || !sku || !category || unitPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, SKU, Category, and Unit Price are required",
            });
        }
        // SKU unique check (excluding current product)
        const existingSku = await prisma.product.findFirst({
            where: {
                sku,
                id: { not: id },
            },
        });
        if (existingSku) {
            return res.status(409).json({
                success: false,
                message: "Product with this SKU already exists",
            });
        }
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                sku,
                category,
                unitPrice: Number(unitPrice),
                minStockAlert: Number(minStockAlert),
                warehouseLocation,
            },
        });
        res.json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
});
/**
 * DELETE PRODUCT
 */
router.delete("/:id", authMiddleware, authorize(["ADMIN", "WAREHOUSE"]), async (req, res) => {
    try {
        const id = req.params.id;
        // Check if referenced in challan items
        const challanItem = await prisma.challanItem.findFirst({
            where: { productId: id },
        });
        if (challanItem) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete product. It is referenced in existing delivery challans.",
            });
        }
        // Check if referenced in stock movements
        const stockMovement = await prisma.stockMovement.findFirst({
            where: { productId: id },
        });
        if (stockMovement) {
            // Rather than deleting stock movements, we restrict delete to preserve inventory history.
            return res.status(400).json({
                success: false,
                message: "Cannot delete product. It has associated inventory history (stock movements).",
            });
        }
        await prisma.product.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
});
export default router;
