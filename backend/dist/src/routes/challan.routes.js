import { Router } from "express";
import prisma from "../config/prisma.js";
import authMiddleware, { authorize } from "../middleware/auth.middleware.js";
const router = Router();
/**
 * GET ALL CHALLANS
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const challans = await prisma.challan.findMany({
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        businessName: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            success: true,
            challans,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch challans",
        });
    }
});
/**
 * GET CHALLAN BY ID
 */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const challan = await prisma.challan.findUnique({
            where: { id },
            include: {
                customer: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                currentStock: true,
                            },
                        },
                    },
                },
            },
        });
        if (!challan) {
            return res.status(404).json({
                success: false,
                message: "Challan not found",
            });
        }
        res.json({
            success: true,
            challan,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch challan details",
        });
    }
});
/**
 * CREATE CHALLAN
 */
router.post("/", authMiddleware, authorize(["ADMIN", "SALES"]), async (req, res) => {
    try {
        const { customerId, status = "DRAFT", items } = req.body;
        if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Customer and at least one product item are required",
            });
        }
        if (status !== "DRAFT" && status !== "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message: "Initial status must be DRAFT or CONFIRMED",
            });
        }
        const result = await prisma.$transaction(async (tx) => {
            // 1. Generate sequential challan number
            const count = await tx.challan.count();
            const challanNumber = `CH-${String(count + 1).padStart(5, "0")}`;
            // 2. Process items and verify products
            const challanItemsData = [];
            let totalQuantity = 0;
            for (const item of items) {
                const { productId, quantity } = item;
                const qty = Number(quantity);
                if (isNaN(qty) || qty <= 0) {
                    throw new Error("Item quantity must be a positive integer");
                }
                const product = await tx.product.findUnique({
                    where: { id: productId },
                });
                if (!product) {
                    throw new Error(`Product not found for ID: ${productId}`);
                }
                // Snapshot of product details
                challanItemsData.push({
                    productId,
                    quantity: qty,
                    productName: product.name,
                    productSku: product.sku,
                    productUnitPrice: product.unitPrice,
                });
                totalQuantity += qty;
                // If CONFIRMED, check stock and deduct
                if (status === "CONFIRMED") {
                    if (product.currentStock < qty) {
                        throw new Error(`Insufficient stock for ${product.name} (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`);
                    }
                    // Deduct stock
                    await tx.product.update({
                        where: { id: productId },
                        data: {
                            currentStock: product.currentStock - qty,
                        },
                    });
                    // Write OUT movement
                    await tx.stockMovement.create({
                        data: {
                            productId,
                            quantity: qty,
                            movementType: "OUT",
                            reason: `Challan ${challanNumber} confirmation`,
                            createdById: req.user.userId,
                        },
                    });
                }
            }
            // 3. Create the Challan with nested ChallanItems
            const challan = await tx.challan.create({
                data: {
                    challanNumber,
                    customerId,
                    totalQuantity,
                    status,
                    createdById: req.user.userId,
                    items: {
                        create: challanItemsData,
                    },
                },
                include: {
                    items: true,
                },
            });
            return challan;
        });
        res.status(201).json({
            success: true,
            message: `Challan ${result.challanNumber} created successfully`,
            challan: result,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create challan",
        });
    }
});
/**
 * UPDATE CHALLAN (includes transition DRAFT -> CONFIRMED, or CONFIRMED -> CANCELLED)
 */
router.put("/:id", authMiddleware, authorize(["ADMIN", "SALES", "WAREHOUSE"]), async (req, res) => {
    try {
        const id = req.params.id;
        const { customerId, status, items } = req.body;
        const existingChallan = await prisma.challan.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!existingChallan) {
            return res.status(404).json({
                success: false,
                message: "Challan not found",
            });
        }
        if (existingChallan.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cancelled challans cannot be modified",
            });
        }
        const targetStatus = status || existingChallan.status;
        // Run updates in a transaction
        const updatedChallan = await prisma.$transaction(async (tx) => {
            // Case 1: Challan is currently DRAFT
            if (existingChallan.status === "DRAFT") {
                if (targetStatus === "DRAFT") {
                    // Normal edit of Draft Challan details and items
                    if (items && Array.isArray(items)) {
                        // Delete existing items
                        await tx.challanItem.deleteMany({
                            where: { challanId: id },
                        });
                        // Create new items and calculate total qty
                        const challanItemsData = [];
                        let totalQuantity = 0;
                        for (const item of items) {
                            const { productId, quantity } = item;
                            const qty = Number(quantity);
                            if (isNaN(qty) || qty <= 0) {
                                throw new Error("Item quantity must be a positive integer");
                            }
                            const product = await tx.product.findUnique({
                                where: { id: productId },
                            });
                            if (!product) {
                                throw new Error(`Product not found for ID: ${productId}`);
                            }
                            challanItemsData.push({
                                productId,
                                quantity: qty,
                                productName: product.name,
                                productSku: product.sku,
                                productUnitPrice: product.unitPrice,
                                challanId: id,
                            });
                            totalQuantity += qty;
                        }
                        await tx.challanItem.createMany({
                            data: challanItemsData,
                        });
                        return tx.challan.update({
                            where: { id },
                            data: {
                                customerId: customerId || existingChallan.customerId,
                                totalQuantity,
                            },
                            include: { items: true },
                        });
                    }
                    else {
                        // Only update customer details
                        return tx.challan.update({
                            where: { id },
                            data: {
                                customerId: customerId || existingChallan.customerId,
                            },
                            include: { items: true },
                        });
                    }
                }
                else if (targetStatus === "CONFIRMED") {
                    // Transition DRAFT -> CONFIRMED
                    // Fetch current items (or use updated items if provided)
                    const itemsToConfirm = items && Array.isArray(items) ? items : existingChallan.items;
                    const finalItemsData = [];
                    let totalQuantity = 0;
                    // If items are modified during confirmation, update database items
                    if (items && Array.isArray(items)) {
                        await tx.challanItem.deleteMany({
                            where: { challanId: id },
                        });
                    }
                    for (const item of itemsToConfirm) {
                        const { productId, quantity } = item;
                        const qty = Number(quantity);
                        const product = await tx.product.findUnique({
                            where: { id: productId },
                        });
                        if (!product) {
                            throw new Error(`Product not found for ID: ${productId}`);
                        }
                        if (product.currentStock < qty) {
                            throw new Error(`Insufficient stock for ${product.name} (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}`);
                        }
                        // Deduct stock
                        await tx.product.update({
                            where: { id: productId },
                            data: {
                                currentStock: product.currentStock - qty,
                            },
                        });
                        // Write OUT movement
                        await tx.stockMovement.create({
                            data: {
                                productId,
                                quantity: qty,
                                movementType: "OUT",
                                reason: `Challan ${existingChallan.challanNumber} confirmation`,
                                createdById: req.user.userId,
                            },
                        });
                        if (items && Array.isArray(items)) {
                            finalItemsData.push({
                                productId,
                                quantity: qty,
                                productName: product.name,
                                productSku: product.sku,
                                productUnitPrice: product.unitPrice,
                                challanId: id,
                            });
                        }
                        totalQuantity += qty;
                    }
                    if (items && Array.isArray(items)) {
                        await tx.challanItem.createMany({
                            data: finalItemsData,
                        });
                    }
                    return tx.challan.update({
                        where: { id },
                        data: {
                            customerId: customerId || existingChallan.customerId,
                            status: "CONFIRMED",
                            totalQuantity: items && Array.isArray(items) ? totalQuantity : existingChallan.totalQuantity,
                        },
                        include: { items: true },
                    });
                }
                else if (targetStatus === "CANCELLED") {
                    // Transition DRAFT -> CANCELLED
                    return tx.challan.update({
                        where: { id },
                        data: {
                            status: "CANCELLED",
                        },
                        include: { items: true },
                    });
                }
            }
            // Case 2: Challan is currently CONFIRMED
            if (existingChallan.status === "CONFIRMED") {
                if (targetStatus === "CANCELLED") {
                    // Transition CONFIRMED -> CANCELLED (Inventory Reversal)
                    for (const item of existingChallan.items) {
                        const product = await tx.product.findUnique({
                            where: { id: item.productId },
                        });
                        if (!product) {
                            throw new Error(`Product not found for item: ${item.productName}`);
                        }
                        // Add back stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                currentStock: product.currentStock + item.quantity,
                            },
                        });
                        // Write IN movement
                        await tx.stockMovement.create({
                            data: {
                                productId: item.productId,
                                quantity: item.quantity,
                                movementType: "IN",
                                reason: `Challan ${existingChallan.challanNumber} cancellation`,
                                createdById: req.user.userId,
                            },
                        });
                    }
                    return tx.challan.update({
                        where: { id },
                        data: {
                            status: "CANCELLED",
                        },
                        include: { items: true },
                    });
                }
                else if (targetStatus === "DRAFT") {
                    throw new Error("Cannot change status from CONFIRMED back to DRAFT.");
                }
                else {
                    throw new Error("Cannot edit items of a CONFIRMED challan. You must cancel it first.");
                }
            }
            throw new Error("Invalid status transition");
        });
        res.json({
            success: true,
            message: `Challan ${updatedChallan.challanNumber} updated successfully`,
            challan: updatedChallan,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update challan",
        });
    }
});
/**
 * DELETE CHALLAN (Allowed only for DRAFT and CANCELLED statuses)
 */
router.delete("/:id", authMiddleware, authorize(["ADMIN", "SALES"]), async (req, res) => {
    try {
        const id = req.params.id;
        const challan = await prisma.challan.findUnique({
            where: { id },
        });
        if (!challan) {
            return res.status(404).json({
                success: false,
                message: "Challan not found",
            });
        }
        if (challan.status === "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message: "Cannot delete a CONFIRMED challan. Please cancel it first to roll back inventory.",
            });
        }
        // ChallanItem has onDelete: Cascade, but we can do a transaction to be safe
        await prisma.$transaction([
            prisma.challanItem.deleteMany({
                where: { challanId: id },
            }),
            prisma.challan.delete({
                where: { id },
            }),
        ]);
        res.json({
            success: true,
            message: "Challan deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete challan",
        });
    }
});
export default router;
