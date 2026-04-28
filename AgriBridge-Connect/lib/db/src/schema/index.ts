import { pgTable, text, serial, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Enums
export const userRoleEnum = pgEnum("user_role", ["farmer", "customer", "storage_manager", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "packed", "shipped", "delivered", "cancelled"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "approved", "rejected", "cancelled"]);

// Users table
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull(),
  fcmToken: text("fcm_token"),
  location: text("location"),
  farmName: text("farm_name"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// Products table
export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("kg"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  location: text("location"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

// Orders table
export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  farmerId: integer("farmer_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

// Cold storage table
export const coldStorageTable = pgTable("cold_storage", {
  id: serial("id").primaryKey(),
  managerId: integer("manager_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  totalCapacity: decimal("total_capacity", { precision: 10, scale: 2 }).notNull(),
  availableCapacity: decimal("available_capacity", { precision: 10, scale: 2 }).notNull(),
  pricePerKgPerDay: decimal("price_per_kg_per_day", { precision: 10, scale: 2 }).notNull(),
  temperature: text("temperature"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertColdStorageSchema = createInsertSchema(coldStorageTable).omit({ id: true, createdAt: true });
export type InsertColdStorage = z.infer<typeof insertColdStorageSchema>;
export type ColdStorage = typeof coldStorageTable.$inferSelect;

// Storage bookings
export const storageBookingsTable = pgTable("storage_bookings", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => usersTable.id),
  storageId: integer("storage_id").notNull().references(() => coldStorageTable.id),
  managerId: integer("manager_id").notNull().references(() => usersTable.id),
  productName: text("product_name").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(storageBookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type StorageBooking = typeof storageBookingsTable.$inferSelect;

// Reviews
export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  orderId: integer("order_id").references(() => ordersTable.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
