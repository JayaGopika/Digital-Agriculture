import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, productsTable, ordersTable, coldStorageTable, storageBookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [users, products, orders, storages, bookings] = await Promise.all([
      db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable),
      db.select({ id: productsTable.id }).from(productsTable),
      db.select({ id: ordersTable.id, totalAmount: ordersTable.totalAmount, status: ordersTable.status }).from(ordersTable),
      db.select({ id: coldStorageTable.id }).from(coldStorageTable),
      db.select({ id: storageBookingsTable.id }).from(storageBookingsTable),
    ]);

    const totalRevenue = orders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    return res.json({
      totalUsers: users.length,
      totalFarmers: users.filter(u => u.role === "farmer").length,
      totalCustomers: users.filter(u => u.role === "customer").length,
      totalManagers: users.filter(u => u.role === "storage_manager").length,
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === "pending").length,
      totalRevenue,
      totalStorages: storages.length,
      totalBookings: bookings.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      role: usersTable.role,
      location: usersTable.location,
      farmName: usersTable.farmName,
      isBlocked: usersTable.isBlocked,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(usersTable.createdAt);
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.put("/users/:id/toggle-block", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (id === req.user!.id) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }
    const [user] = await db.select({ isBlocked: usersTable.isBlocked }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    const [updated] = await db.update(usersTable)
      .set({ isBlocked: !user.isBlocked })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, isBlocked: usersTable.isBlocked });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to toggle block" });
  }
});

router.delete("/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

router.get("/products", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        quantity: productsTable.quantity,
        unit: productsTable.unit,
        category: productsTable.category,
        available: productsTable.available,
        createdAt: productsTable.createdAt,
        farmerName: usersTable.name,
        farmerLocation: usersTable.location,
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.farmerId, usersTable.id))
      .orderBy(productsTable.createdAt);
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.delete("/products/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

router.get("/orders", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        quantity: ordersTable.quantity,
        totalAmount: ordersTable.totalAmount,
        status: ordersTable.status,
        deliveryAddress: ordersTable.deliveryAddress,
        createdAt: ordersTable.createdAt,
        productName: productsTable.name,
        customerName: usersTable.name,
      })
      .from(ordersTable)
      .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .leftJoin(usersTable, eq(ordersTable.customerId, usersTable.id))
      .orderBy(ordersTable.createdAt);
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.put("/orders/:id/status", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    const [order] = await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order" });
  }
});

router.get("/storage", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const storages = await db
      .select({
        id: coldStorageTable.id,
        name: coldStorageTable.name,
        location: coldStorageTable.location,
        totalCapacity: coldStorageTable.totalCapacity,
        availableCapacity: coldStorageTable.availableCapacity,
        pricePerKgPerDay: coldStorageTable.pricePerKgPerDay,
        available: coldStorageTable.available,
        createdAt: coldStorageTable.createdAt,
        managerName: usersTable.name,
      })
      .from(coldStorageTable)
      .leftJoin(usersTable, eq(coldStorageTable.managerId, usersTable.id))
      .orderBy(coldStorageTable.createdAt);
    return res.json(storages);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch storage" });
  }
});

router.delete("/storage/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(coldStorageTable).where(eq(coldStorageTable.id, id));
    return res.json({ message: "Storage deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete storage" });
  }
});

export default router;
