import path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/schema/**/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});