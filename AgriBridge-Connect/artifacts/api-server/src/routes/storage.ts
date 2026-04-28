import { Router } from "express";
import { db } from "@workspace/db";
import { coldStorageTable, storageBookingsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const allCenters = await db
      .select({
        id: coldStorageTable.id,
        managerId: coldStorageTable.managerId,
        name: coldStorageTable.name,
        description: coldStorageTable.description,
        location: coldStorageTable.location,
        totalCapacity: coldStorageTable.totalCapacity,
        availableCapacity: coldStorageTable.availableCapacity,
        pricePerKgPerDay: coldStorageTable.pricePerKgPerDay,
        temperature: coldStorageTable.temperature,
        phone: coldStorageTable.phone,
        imageUrl: coldStorageTable.imageUrl,
        available: coldStorageTable.available,
        createdAt: coldStorageTable.createdAt,
        managerName: usersTable.name,
      })
      .from(coldStorageTable)
      .leftJoin(usersTable, eq(coldStorageTable.managerId, usersTable.id));
    return res.json(allCenters);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch storage centers" });
  }
});

router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const centers = await db.select().from(coldStorageTable)
      .where(eq(coldStorageTable.managerId, req.user!.id));
    return res.json(centers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch storage centers" });
  }
});

router.post("/add", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "storage_manager") {
      return res.status(403).json({ message: "Only storage managers can create storage centers" });
    }
    const { name, description, location, totalCapacity, availableCapacity, pricePerKgPerDay, temperature, phone, imageUrl } = req.body;
    const [storage] = await db.insert(coldStorageTable).values({
      managerId: req.user!.id,
      name,
      description,
      location,
      totalCapacity: totalCapacity.toString(),
      availableCapacity: (availableCapacity ?? totalCapacity).toString(),
      pricePerKgPerDay: pricePerKgPerDay.toString(),
      temperature,
      phone,
      imageUrl,
    }).returning();
    return res.json(storage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create storage center" });
  }
});

router.post("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "storage_manager") {
      return res.status(403).json({ message: "Only storage managers can create storage centers" });
    }
    const { name, description, location, totalCapacity, availableCapacity, pricePerKgPerDay, temperature, phone, imageUrl } = req.body;
    const [storage] = await db.insert(coldStorageTable).values({
      managerId: req.user!.id,
      name,
      description,
      location,
      totalCapacity: totalCapacity.toString(),
      availableCapacity: (availableCapacity ?? totalCapacity).toString(),
      pricePerKgPerDay: pricePerKgPerDay.toString(),
      temperature,
      phone,
      imageUrl,
    }).returning();
    return res.json(storage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create storage center" });
  }
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, description, location, totalCapacity, availableCapacity, pricePerKgPerDay, temperature, phone, imageUrl, available } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (totalCapacity !== undefined) updateData.totalCapacity = totalCapacity.toString();
    if (availableCapacity !== undefined) updateData.availableCapacity = availableCapacity.toString();
    if (pricePerKgPerDay !== undefined) updateData.pricePerKgPerDay = pricePerKgPerDay.toString();
    if (temperature !== undefined) updateData.temperature = temperature;
    if (phone !== undefined) updateData.phone = phone;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (available !== undefined) updateData.available = available;

    const [storage] = await db.update(coldStorageTable)
      .set(updateData)
      .where(eq(coldStorageTable.id, id))
      .returning();
    if (!storage) return res.status(404).json({ message: "Storage not found" });
    return res.json(storage);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update storage" });
  }
});

router.get("/bookings", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let bookings;
    if (role === "storage_manager") {
      bookings = await db
        .select({
          id: storageBookingsTable.id,
          farmerId: storageBookingsTable.farmerId,
          storageId: storageBookingsTable.storageId,
          managerId: storageBookingsTable.managerId,
          productName: storageBookingsTable.productName,
          quantity: storageBookingsTable.quantity,
          startDate: storageBookingsTable.startDate,
          endDate: storageBookingsTable.endDate,
          totalCost: storageBookingsTable.totalCost,
          status: storageBookingsTable.status,
          paymentStatus: storageBookingsTable.paymentStatus,
          notes: storageBookingsTable.notes,
          createdAt: storageBookingsTable.createdAt,
          storageName: coldStorageTable.name,
          storageLocation: coldStorageTable.location,
          pricePerKgPerDay: coldStorageTable.pricePerKgPerDay,
          farmerName: usersTable.name,
        })
        .from(storageBookingsTable)
        .leftJoin(coldStorageTable, eq(storageBookingsTable.storageId, coldStorageTable.id))
        .leftJoin(usersTable, eq(storageBookingsTable.farmerId, usersTable.id))
        .where(eq(storageBookingsTable.managerId, userId));
    } else {
      bookings = await db
        .select({
          id: storageBookingsTable.id,
          farmerId: storageBookingsTable.farmerId,
          storageId: storageBookingsTable.storageId,
          managerId: storageBookingsTable.managerId,
          productName: storageBookingsTable.productName,
          quantity: storageBookingsTable.quantity,
          startDate: storageBookingsTable.startDate,
          endDate: storageBookingsTable.endDate,
          totalCost: storageBookingsTable.totalCost,
          status: storageBookingsTable.status,
          paymentStatus: storageBookingsTable.paymentStatus,
          notes: storageBookingsTable.notes,
          createdAt: storageBookingsTable.createdAt,
          storageName: coldStorageTable.name,
          storageLocation: coldStorageTable.location,
          pricePerKgPerDay: coldStorageTable.pricePerKgPerDay,
        })
        .from(storageBookingsTable)
        .leftJoin(coldStorageTable, eq(storageBookingsTable.storageId, coldStorageTable.id))
        .leftJoin(usersTable, eq(storageBookingsTable.farmerId, usersTable.id))
        .where(eq(storageBookingsTable.farmerId, userId));
    }

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.post("/book", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can book storage" });
    }
    const { storageId, productName, quantity, startDate, endDate, notes } = req.body;

    const [storage] = await db.select().from(coldStorageTable).where(eq(coldStorageTable.id, storageId)).limit(1);
    if (!storage) return res.status(404).json({ message: "Storage not found" });

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalCost = (parseFloat(storage.pricePerKgPerDay) * (quantity || 1) * days).toFixed(2);

    const [booking] = await db.insert(storageBookingsTable).values({
      farmerId: req.user!.id,
      storageId,
      managerId: storage.managerId,
      productName,
      quantity: (quantity || 1).toString(),
      startDate: start,
      endDate: end,
      totalCost,
      notes: notes || null,
    }).returning();

    return res.json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to book storage" });
  }
});

router.put("/bookings/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;

    const [booking] = await db.update(storageBookingsTable)
      .set({ status })
      .where(eq(storageBookingsTable.id, id))
      .returning();

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update booking" });
  }
});

router.put("/bookings/:id/approve", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;

    const [booking] = await db.update(storageBookingsTable)
      .set({ status })
      .where(eq(storageBookingsTable.id, id))
      .returning();

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update booking" });
  }
});

router.put("/bookings/:id/pay", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { paymentMethod } = req.body;

    const [booking] = await db.update(storageBookingsTable)
      .set({ paymentStatus: "paid" })
      .where(eq(storageBookingsTable.id, id))
      .returning();

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.json({ ...booking, paymentMethod });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process payment" });
  }
});

export default router;
