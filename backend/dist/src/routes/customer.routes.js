import { Router } from "express";
import prisma from "../config/prisma.js";
import authMiddleware, { authorize, } from "../middleware/auth.middleware.js";
const router = Router();
/**
 * GET ALL CUSTOMERS
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            success: true,
            customers,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
});
/**
 * CREATE CUSTOMER
 */
router.post("/", authMiddleware, authorize(["ADMIN", "SALES"]), async (req, res) => {
    try {
        const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes, } = req.body;
        if (!name || !mobile || !customerType || !address) {
            return res.status(400).json({
                success: false,
                message: "Name, Mobile, Customer Type and Address are required",
            });
        }
        const customer = await prisma.customer.create({
            data: {
                name,
                mobile,
                email,
                businessName,
                gstNumber,
                customerType,
                address,
                status,
                followUpDate: followUpDate
                    ? new Date(followUpDate)
                    : null,
                notes,
                createdById: req.user.userId,
            },
        });
        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customer,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to create customer",
        });
    }
});
/**
 * GET CUSTOMER BY ID (with follow-up history)
 */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                followUps: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }
        res.json({
            success: true,
            customer,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer details",
        });
    }
});
/**
 * UPDATE CUSTOMER
 */
router.put("/:id", authMiddleware, authorize(["ADMIN", "SALES"]), async (req, res) => {
    try {
        const id = req.params.id;
        const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes, } = req.body;
        if (!name || !mobile || !customerType || !address) {
            return res.status(400).json({
                success: false,
                message: "Name, Mobile, Customer Type and Address are required",
            });
        }
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                mobile,
                email,
                businessName,
                gstNumber,
                customerType,
                address,
                status,
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                notes,
            },
        });
        res.json({
            success: true,
            message: "Customer updated successfully",
            customer: updatedCustomer,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update customer",
        });
    }
});
/**
 * DELETE CUSTOMER
 */
router.delete("/:id", authMiddleware, authorize(["ADMIN"]), async (req, res) => {
    try {
        const id = req.params.id;
        // Check if customer has any confirmed challans
        const confirmedChallans = await prisma.challan.findFirst({
            where: {
                customerId: id,
                status: "CONFIRMED",
            },
        });
        if (confirmedChallans) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete customer with confirmed delivery challans",
            });
        }
        // Use transaction to clean up customer, related draft/cancelled challans & followups
        await prisma.$transaction([
            prisma.followUp.deleteMany({
                where: { customerId: id },
            }),
            prisma.challanItem.deleteMany({
                where: {
                    challan: {
                        customerId: id,
                    },
                },
            }),
            prisma.challan.deleteMany({
                where: { customerId: id },
            }),
            prisma.customer.delete({
                where: { id },
            }),
        ]);
        res.json({
            success: true,
            message: "Customer deleted successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete customer",
        });
    }
});
/**
 * ADD CRM FOLLOW-UP
 */
router.post("/:id/follow-ups", authMiddleware, authorize(["ADMIN", "SALES"]), async (req, res) => {
    try {
        const id = req.params.id;
        const { note, followUpDate } = req.body;
        if (!note) {
            return res.status(400).json({
                success: false,
                message: "Follow-up note is required",
            });
        }
        const nextDate = followUpDate ? new Date(followUpDate) : null;
        // Run in transaction to log FollowUp and update Customer fields
        const [followUp, updatedCustomer] = await prisma.$transaction([
            prisma.followUp.create({
                data: {
                    note,
                    followUpDate: nextDate || new Date(),
                    customerId: id,
                    createdById: req.user.userId,
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.customer.update({
                where: { id },
                data: {
                    followUpDate: nextDate,
                    status: "ACTIVE", // Automatically mark as active when we perform follow-up operations
                },
            }),
        ]);
        res.status(201).json({
            success: true,
            message: "Follow-up logged successfully",
            followUp,
            customer: updatedCustomer,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to log follow-up",
        });
    }
});
export default router;
