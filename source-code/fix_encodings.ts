import { getDb } from "./server/db/db";
import { sql } from "drizzle-orm";

const portUpdates = [
  { id: 1, name: "السعودية" },
  { id: 2, name: "المنذرية" },
  { id: 3, name: "القائم" },
  { id: 4, name: "النقل" },
  { id: 5, name: "شراكة" },
  { id: 6, name: "صرافة" },
];

const accountTypeUpdates = [
  { id: 1, name: "منفذ السعودية" },
  { id: 2, name: "منفذ المنذرية" },
  { id: 3, name: "منفذ القائم" },
  { id: 4, name: "نقل" },
  { id: 5, name: "شراكة" },
  { id: 6, name: "صرافة" },
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("No db");
    process.exit(1);
  }

  for (const update of portUpdates) {
    await db.execute(sql`UPDATE ports SET name = ${update.name} WHERE id = ${update.id}`);
  }
  console.log("Ports updated successfully.");

  for (const update of accountTypeUpdates) {
    await db.execute(sql`UPDATE account_types SET name = ${update.name} WHERE id = ${update.id}`);
  }
  console.log("Account types updated successfully.");

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
