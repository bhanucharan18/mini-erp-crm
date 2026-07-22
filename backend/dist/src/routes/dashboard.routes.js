import { Router } from "express";
import prisma from "../config/prisma.js";
import authMiddleware from "../middleware/auth.middleware.js";
const router = Router();
/**
 * GET DASHBOARD STATS
 */
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        // 1. Core Counts
        const totalCustomers = await prisma.customer.count();
        const totalProducts = await prisma.product.count();
        // 2. Customers breakdown
        const leadsCount = await prisma.customer.count({
            where: { status: "LEAD" },
        });
        const activeCount = await prisma.customer.count({
            where: { status: "ACTIVE" },
        });
        const inactiveCount = await prisma.customer.count({
            where: { status: "INACTIVE" },
        });
        // 3. Stock Level calculations
        const allProducts = await prisma.product.findMany({
            orderBy: { sku: "asc" },
        });
        const totalItemsInStock = allProducts.reduce((sum, p) => sum + p.currentStock, 0);
        // Identify low stock products
        const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
        const lowStockCount = lowStockProducts.length;
        // 4. Sales calculations (Confirmed Challans only)
        const confirmedChallanItems = await prisma.challanItem.findMany({
            where: {
                challan: {
                    status: "CONFIRMED",
                },
            },
            select: {
                quantity: true,
                productUnitPrice: true,
            },
        });
        const totalSales = confirmedChallanItems.reduce((sum, item) => {
            const price = Number(item.productUnitPrice);
            return sum + item.quantity * price;
        }, 0);
        // 5. Recent Logs (limit to 5)
        const recentChallans = await prisma.challan.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                customer: {
                    select: {
                        name: true,
                        businessName: true,
                    },
                },
            },
        });
        const recentMovements = await prisma.stockMovement.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
                createdBy: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const recentFollowUps = await prisma.followUp.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                customer: {
                    select: {
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            stats: {
                totalCustomers,
                totalProducts,
                leadsCount,
                activeCount,
                inactiveCount,
                totalItemsInStock,
                lowStockCount,
                totalSales,
            },
            lowStockProducts: lowStockProducts.slice(0, 5), // Return top 5 low stock products
            recentChallans,
            recentMovements,
            recentFollowUps,
        });
    }
    catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics",
        });
    }
});
export default router;
