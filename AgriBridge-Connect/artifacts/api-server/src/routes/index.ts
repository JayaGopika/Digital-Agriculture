import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import storageRouter from "./storage.js";
import reviewsRouter from "./reviews.js";
import usersRouter from "./users.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/storage", storageRouter);
router.use("/reviews", reviewsRouter);
router.use("/users", usersRouter);
router.use("/stats", usersRouter);
router.use("/admin", adminRouter);

export default router;
