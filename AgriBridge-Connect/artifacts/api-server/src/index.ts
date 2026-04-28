import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url"; // needed for ES modules

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from your .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import your database and app after dotenv config
import { db } from "../../../lib/db/src/index.js"; // note: add .js if using ES modules
import app from "./app.js"; // note: add .js if using ES modules

// Get port from env or default to 8080
const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});