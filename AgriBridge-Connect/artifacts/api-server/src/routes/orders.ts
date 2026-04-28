import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let orders;
    if (role === "farmer") {
      orders = await db
        .select({
          id: ordersTable.id,
          customerId: ordersTable.customerId,
          farmerId: ordersTable.farmerId,
          productId: ordersTable.productId,
          quantity: ordersTable.quantity,
          totalAmount: ordersTable.totalAmount,
          status: ordersTable.status,
          deliveryAddress: ordersTable.deliveryAddress,
          notes: ordersTable.notes,
          paymentId: ordersTable.paymentId,
          createdAt: ordersTable.createdAt,
          updatedAt: ordersTable.updatedAt,
          productName: productsTable.name,
          productImage: productsTable.imageUrl,
          productCategory: productsTable.category,
          customerName: usersTable.name,
        })
        .from(ordersTable)
        .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
        .leftJoin(usersTable, eq(ordersTable.customerId, usersTable.id))
        .where(eq(ordersTable.farmerId, userId));
    } else {
      orders = await db
        .select({
          id: ordersTable.id,
          customerId: ordersTable.customerId,
          farmerId: ordersTable.farmerId,
          productId: ordersTable.productId,
          quantity: ordersTable.quantity,
          totalAmount: ordersTable.totalAmount,
          status: ordersTable.status,
          deliveryAddress: ordersTable.deliveryAddress,
          notes: ordersTable.notes,
          paymentId: ordersTable.paymentId,
          createdAt: ordersTable.createdAt,
          updatedAt: ordersTable.updatedAt,
          productName: productsTable.name,
          productImage: productsTable.imageUrl,
          productCategory: productsTable.category,
          farmerName: usersTable.name,
        })
        .from(ordersTable)
        .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
        .leftJoin(usersTable, eq(ordersTable.farmerId, usersTable.id))
        .where(eq(ordersTable.customerId, userId));
    }

    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.post("/place", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "customer") {
      return res.status(403).json({ message: "Only customers can place orders" });
    }
    const { productId, quantity, deliveryAddress, notes, paymentId } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const totalAmount = (parseFloat(product.price) * quantity).toFixed(2);

    const [order] = await db.insert(ordersTable).values({
      customerId: req.user!.id,
      farmerId: product.farmerId,
      productId,
      quantity: quantity.toString(),
      totalAmount,
      deliveryAddress,
      notes,
      paymentId,
    }).returning();

    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to place order" });
  }
});

router.put("/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;

    const [order] = await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order" });
  }
});

export default router;
