import prisma from "../src/config/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clean up existing tables
  await prisma.followUp.deleteMany({});
  await prisma.challanItem.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users for all roles
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("erp123", salt); // Simple common password for case study testing

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@erp.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: "Sales Rep",
      email: "sales@erp.com",
      password: passwordHash,
      role: "SALES",
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: "Warehouse Manager",
      email: "warehouse@erp.com",
      password: passwordHash,
      role: "WAREHOUSE",
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: "Accounts Auditor",
      email: "accounts@erp.com",
      password: passwordHash,
      role: "ACCOUNTS",
    },
  });

  console.log("✅ Users created.");

  // 3. Create Sample Products
  const p1 = await prisma.product.create({
    data: {
      name: "Dell XPS 15 Laptop",
      sku: "DELL-XPS15-001",
      category: "Electronics",
      unitPrice: 1549.99,
      currentStock: 25,
      minStockAlert: 5,
      warehouseLocation: "Aisle A, Shelf 3",
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Logitech MX Master 3S Mouse",
      sku: "LOGI-MX3S-002",
      category: "Accessories",
      unitPrice: 99.99,
      currentStock: 60,
      minStockAlert: 10,
      warehouseLocation: "Aisle B, Shelf 1",
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Sony WH-1000XM5 Headphones",
      sku: "SONY-XM5-003",
      category: "Electronics",
      unitPrice: 349.99,
      currentStock: 4, // Trigger stock alert
      minStockAlert: 8,
      warehouseLocation: "Aisle A, Shelf 12",
    },
  });

  console.log("✅ Products created.");

  // Create initial stock movements for products
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: p1.id,
        quantity: 25,
        movementType: "IN",
        reason: "Initial stock ingestion",
        createdById: admin.id,
      },
      {
        productId: p2.id,
        quantity: 60,
        movementType: "IN",
        reason: "Initial stock ingestion",
        createdById: admin.id,
      },
      {
        productId: p3.id,
        quantity: 4,
        movementType: "IN",
        reason: "Initial stock ingestion",
        createdById: admin.id,
      },
    ],
  });

  // 4. Create Sample Customers
  const c1 = await prisma.customer.create({
    data: {
      name: "Alice Johnson",
      mobile: "9876543210",
      email: "alice@retailtech.com",
      businessName: "RetailTech Solutions",
      gstNumber: "07AAAAA1111A1Z1",
      customerType: "RETAIL",
      address: "123 Technology Park, Sector 62, Noida, UP",
      status: "ACTIVE",
      notes: "Preferred retail buyer. Prefers evening dispatches.",
      createdById: sales.id,
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      name: "Bob Smith",
      mobile: "9123456789",
      email: "bob@wholesaledirect.com",
      businessName: "WholesaleDirect Inc.",
      gstNumber: "08BBBBB2222B2Z2",
      customerType: "WHOLESALE",
      address: "456 Warehouse District, Ghaziabad, UP",
      status: "LEAD",
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
      notes: "Follow up about volume discounts on MX Master mice.",
      createdById: sales.id,
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      name: "Charlie Brown",
      mobile: "9988776655",
      email: "charlie@globeldist.com",
      businessName: "Global Distributors",
      gstNumber: "09CCCCC3333C3Z3",
      customerType: "DISTRIBUTOR",
      address: "Plot 789, Industrial Area Phase 2, Okhla, New Delhi",
      status: "ACTIVE",
      notes: "Large distributor. Handles northern region shipping logistics.",
      createdById: sales.id,
    },
  });

  console.log("✅ Customers created.");

  // 5. Create Sample Follow-up
  await prisma.followUp.create({
    data: {
      note: "Emailed catalog details and volume discounting tiers. Awaiting customer reply.",
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      customerId: c2.id,
      createdById: sales.id,
    },
  });

  console.log("✅ Seed complete! 🌱");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
