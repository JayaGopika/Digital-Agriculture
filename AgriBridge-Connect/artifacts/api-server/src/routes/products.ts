import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte, avg, count } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, farmerId } = req.query;

    let products = await db
      .select({
        id: productsTable.id,
        farmerId: productsTable.farmerId,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        quantity: productsTable.quantity,
        unit: productsTable.unit,
        category: productsTable.category,
        imageUrl: productsTable.imageUrl,
        location: productsTable.location,
        available: productsTable.available,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
        farmerName: usersTable.name,
        farmName: usersTable.farmName,
        farmerPhone: usersTable.phone,
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.farmerId, usersTable.id))
      .where(eq(productsTable.available, true));

    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (farmerId) {
      products = products.filter(p => p.farmerId === Number(farmerId));
    }
    if (minPrice) {
      products = products.filter(p => parseFloat(p.price) >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter(p => parseFloat(p.price) <= parseFloat(maxPrice as string));
    }

    const productsWithRatings = await Promise.all(
      products.map(async (p) => {
        const reviews = await db.select({ rating: reviewsTable.rating })
          .from(reviewsTable)
          .where(eq(reviewsTable.productId, p.id));
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        return { ...p, averageRating: avgRating, reviewCount: reviews.length };
      })
    );

    return res.json(productsWithRatings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/my", authenticate, async (req: AuthRequest, res) => {
  try {
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.farmerId, req.user!.id));
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select({
        id: productsTable.id,
        farmerId: productsTable.farmerId,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        quantity: productsTable.quantity,
        unit: productsTable.unit,
        category: productsTable.category,
        imageUrl: productsTable.imageUrl,
        location: productsTable.location,
        available: productsTable.available,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
        farmerName: usersTable.name,
        farmName: usersTable.farmName,
        farmerPhone: usersTable.phone,
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(productsTable.farmerId, usersTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviews = await db.select({ rating: reviewsTable.rating })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, id));
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({ ...product, averageRating: avgRating, reviewCount: reviews.length });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product" });
  }
});

router.post("/add", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can add products" });
    }
    const { name, description, price, quantity, unit, category, imageUrl, location } = req.body;
    const [product] = await db.insert(productsTable).values({
      farmerId: req.user!.id,
      name,
      description,
      price: price.toString(),
      quantity: quantity.toString(),
      unit: unit || "kg",
      category,
      imageUrl,
      location,
    }).returning();
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add product" });
  }
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, description, price, quantity, unit, category, imageUrl, location, available } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price.toString();
    if (quantity !== undefined) updateData.quantity = quantity.toString();
    if (unit !== undefined) updateData.unit = unit;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (location !== undefined) updateData.location = location;
    if (available !== undefined) updateData.available = available;

    const [product] = await db.update(productsTable)
      .set(updateData)
      .where(and(eq(productsTable.id, id), eq(productsTable.farmerId, req.user!.id)))
      .returning();
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.farmerId, req.user!.id)));
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
