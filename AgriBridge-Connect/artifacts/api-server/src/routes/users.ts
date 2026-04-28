import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, productsTable, ordersTable, storageBookingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      phone: usersTable.phone,
      role: usersTable.role,
      location: usersTable.location,
      farmName: usersTable.farmName,
      bio: usersTable.bio,
      profileImage: usersTable.profileImage,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.put("/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, phone, location, farmName, bio, profileImage } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (farmName !== undefined) updateData.farmName = farmName;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const [user] = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, req.user!.id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        phone: usersTable.phone,
        role: usersTable.role,
        location: usersTable.location,
        farmName: usersTable.farmName,
        bio: usersTable.bio,
        profileImage: usersTable.profileImage,
        createdAt: usersTable.createdAt,
      });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.put("/fcm-token", authenticate, async (req: AuthRequest, res) => {
  try {
    const { fcmToken } = req.body;
    await db.update(usersTable).set({ fcmToken }).where(eq(usersTable.id, req.user!.id));
    return res.json({ message: "FCM token updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update FCM token" });
  }
});

router.get("/farmer-stats", authenticate, async (req: AuthRequest, res) => {
  try {
    const farmerId = req.user!.id;

    const products = await db.select().from(productsTable).where(eq(productsTable.farmerId, farmerId));
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.farmerId, farmerId));
    const bookings = await db.select().from(storageBookingsTable).where(eq(storageBookingsTable.farmerId, farmerId));

    const totalEarnings = orders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    const pendingOrders = orders.filter(o => o.status === "pending").length;

    return res.json({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalEarnings,
      storageBookings: bookings.length,
      pendingOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
