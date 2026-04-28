import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/:productId", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const reviews = await db
      .select({
        id: reviewsTable.id,
        customerId: reviewsTable.customerId,
        productId: reviewsTable.productId,
        orderId: reviewsTable.orderId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        customerName: usersTable.name,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.customerId, usersTable.id))
      .where(eq(reviewsTable.productId, productId));
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const [review] = await db.insert(reviewsTable).values({
      customerId: req.user!.id,
      productId,
      orderId,
      rating,
      comment,
    }).returning();
    return res.json(review);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add review" });
  }
});

export default router;
