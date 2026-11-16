import "dotenv/config";

import { getDb } from "../server/db";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable; check DATABASE_URL and database connectivity.");
  console.log("Database schema is ready.");
}

main().catch((error) => {
  console.error("Database schema setup failed:", error);
  process.exitCode = 1;
});
