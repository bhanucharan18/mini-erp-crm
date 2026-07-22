import { Router } from "express";
import prisma from "../config/prisma.js";
import authMiddleware, { authorize } from "../middleware/auth.middleware.js";
const router = Router();
/**
 * GET ALL STOCK MOVEMENTS
 */
router.get("/movements", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.query;
        const whereClause = productId ? { productId: String(productId) } : {};
        const movements = await prisma.stockMovement.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        category: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            success: true,
            movements,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stock movements",
        });
    }
});
/**
 * RECORD STOCK MOVEMENT (Manual Adjustment)
 */
router.post("/movements", authMiddleware, authorize(["ADMIN", "WAREHOUSE"]), async (req, res) => {
    try {
        const { productId, quantity, movementType, reason } = req.body;
        if (!productId || !quantity || !movementType || !reason) {
            return res.status(400).json({
                success: false,
                message: "Product ID, quantity, movement type (IN/OUT), and reason are required",
            });
        }
        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive number",
            });
        }
        if (movementType !== "IN" && movementType !== "OUT") {
            return res.status(400).json({
                success: false,
                message: "Movement type must be either 'IN' or 'OUT'",
            });
        }
        // Run updates in a transaction
        const movement = await prisma.$transaction(async (tx) => {
            // 1. Fetch the product
            const product = await tx.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                throw new Error("Product not found");
            }
            // 2. If OUT, check stock availability
            if (movementType === "OUT" && product.currentStock < qty) {
                throw new Error("Insufficient stock. Cannot perform OUT movement.");
            }
            // 3. Calculate new stock
            const stockChange = movementType === "IN" ? qty : -qty;
            const newStock = product.currentStock + stockChange;
            // 4. Update product currentStock
            await tx.product.update({
                where: { id: productId },
                data: {
                    currentStock: newStock,
                },
            });
            // 5. Create stock movement record
            const record = await tx.stockMovement.create({
                data: {
                    productId,
                    quantity: qty,
                    movementType,
                    reason,
                    createdById: req.user.userId,
                },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                },
            });
            return record;
        });
        res.status(201).json({
            success: true,
            message: "Stock adjustment recorded successfully",
            movement,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to record stock movement",
        });
    }
});
export default router;
