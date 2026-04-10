import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import type { InsertUser } from "../drizzle/schema";
import { buildMySqlConnectionOptions } from "./_core/mysqlConfig";
import { getUserByOpenIdWithDb, upsertUserWithDb } from "./dbAuthUsers";
import { ensureRuntimeSchemaWithUrl } from "./dbRuntimeSchema";

let _db: any = null;
let _dbClient: mysql.Pool | null = null;
let _runtimeSchemaEnsured = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _dbClient = mysql.createPool(buildMySqlConnectionOptions(process.env.DATABASE_URL));
      _db = drizzle(_dbClient);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
