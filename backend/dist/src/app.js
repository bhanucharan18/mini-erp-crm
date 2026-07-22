import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import challanRoutes from "./routes/challan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Mini ERP CRM API is running",
    });
});
app.get("/api/health/db", async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            success: true,
            message: "Database connection successful",
        });
    }
    catch (error) {
        console.error("DATABASE ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);
export default app;
