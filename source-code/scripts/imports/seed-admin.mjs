import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL not found in .env");
  }

  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log("Seeding admin user...");
  try {
    await conn.query(
      "INSERT INTO app_users (id, username, password, name, role, active) VALUES (1, 'admin', 'admin', 'System Admin', 'admin', 1)"
    );
    console.log("Admin user seeded successfully.");
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log("Admin user already exists.");
    } else {
      console.error(err);
    }
  }
  
  await conn.end();
}

seed().catch(console.error);
