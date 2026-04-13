import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import type { InsertUser } from "../drizzle/schema";
import { buildMySqlConnectionOptions } from "./_core/mysqlConfig";
import type { AppDb } from "./dbTypes";
import { schema } from "./dbTypes";
import { getUserByOpenIdWithDb, upsertUserWithDb } from "./dbAuthUsers";
import { ensureRuntimeSchemaWithUrl } from "./dbRuntimeSchema";

let _db: AppDb | null = null;
let _dbClient: mysql.Pool | null = null;
let _runtimeSchemaEnsured = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb(): Promise<AppDb | null> {
  if (!_db && process.env.DATABASE_URL) {
    let nextClient: mysql.Pool | null = null;

    try {
      nextClient = mysql.createPool(buildMySqlConnectionOptions(process.env.DATABASE_URL));
      await nextClient.query("SELECT 1");

      _dbClient = nextClient;
      _db = drizzle(_dbClient, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      if (nextClient) {
        try {
          await nextClient.end();
        } catch {
          // Ignore pool shutdown errors after a failed connection attempt.
        }
      }
      _db = null;
      _dbClient = null;
    }
  }

  if (_db && !_runtimeSchemaEnsured && process.env.DATABASE_URL) {
    try {
      await ensureRuntimeSchemaWithUrl(process.env.DATABASE_URL);
      _runtimeSchemaEnsured = true;
    } catch (error) {
      console.warn("[Database] Failed to ensure runtime schema:", error);
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  return upsertUserWithDb(getDb, user);
}

export async function getUserByOpenId(openId: string) {
  return getUserByOpenIdWithDb(getDb, openId);
}

export async function closeDb() {
  if (_dbClient) {
    await _dbClient.end();
  }

  _dbClient = null;
  _db = null;
  _runtimeSchemaEnsured = false;
}

// TODO: add feature queries here as your schema grows.
