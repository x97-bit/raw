import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _runtimeSchemaEnsured = false;

async function ensureRuntimeSchema() {
  if (_runtimeSchemaEnsured) return;
  if (!process.env.DATABASE_URL) return;

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const [columns] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'field_config'
        AND COLUMN_NAME = 'display_label'
      LIMIT 1
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE field_config
        ADD COLUMN display_label VARCHAR(255) NULL AFTER sort_order
      `);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_companies_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS entity_aliases (
        id INT NOT NULL AUTO_INCREMENT,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        alias_name VARCHAR(255) NOT NULL,
        source_system VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_entity_alias (entity_type, alias_name),
        KEY idx_entity_alias_lookup (entity_type, entity_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS account_defaults (
        id INT NOT NULL AUTO_INCREMENT,
        account_id INT NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        default_currency VARCHAR(10) DEFAULT NULL,
        default_driver_id INT DEFAULT NULL,
        default_vehicle_id INT DEFAULT NULL,
        default_good_type_id INT DEFAULT NULL,
        default_gov_id INT DEFAULT NULL,
        default_company_id INT DEFAULT NULL,
        default_carrier_id INT DEFAULT NULL,
        default_fee_usd DECIMAL(15,2) DEFAULT NULL,
        default_syr_cus DECIMAL(15,2) DEFAULT NULL,
        default_car_qty INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_account_defaults (account_id, section_key),
        KEY idx_account_defaults_section (section_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS route_defaults (
        id INT NOT NULL AUTO_INCREMENT,
        section_key VARCHAR(100) NOT NULL,
        gov_id INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'IQD',
        default_trans_price DECIMAL(15,2) DEFAULT NULL,
        default_fee_usd DECIMAL(15,2) DEFAULT NULL,
        default_cost_usd DECIMAL(15,2) DEFAULT NULL,
        default_amount_usd DECIMAL(15,2) DEFAULT NULL,
        default_cost_iqd DECIMAL(15,0) DEFAULT NULL,
        default_amount_iqd DECIMAL(15,0) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_route_defaults (section_key, gov_id, currency),
        KEY idx_route_defaults_gov (gov_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [companyIdColumn] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'transactions'
        AND COLUMN_NAME = 'company_id'
      LIMIT 1
    `);

    if (companyIdColumn.length === 0) {
      await connection.query(`
        ALTER TABLE transactions
        ADD COLUMN company_id INT NULL AFTER company_name,
        ADD KEY idx_company_id (company_id)
      `);
    }

    await connection.query(`
      INSERT INTO companies (name)
      SELECT DISTINCT TRIM(company_name)
      FROM transactions
      WHERE company_name IS NOT NULL AND TRIM(company_name) <> ''
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);

    await connection.query(`
      UPDATE transactions t
      JOIN companies c ON c.name = TRIM(t.company_name)
      SET t.company_id = c.id
      WHERE t.company_name IS NOT NULL
        AND TRIM(t.company_name) <> ''
        AND (t.company_id IS NULL OR t.company_id = 0)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'account', id, name, 'current-db' FROM accounts
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'driver', id, name, 'current-db' FROM drivers
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'vehicle', id, plateNumber, 'current-db' FROM vehicles
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'good_type', id, name, 'current-db' FROM goods_types
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'governorate', id, name, 'current-db' FROM governorates
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
      SELECT 'company', id, name, 'current-db' FROM companies
      ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
    `);

    await connection.query(`
      INSERT INTO route_defaults (section_key, gov_id, currency, default_trans_price, notes, active)
      SELECT 'transport-1', id, 'IQD', trance_price, 'Backfilled from governorates.trance_price', 1
      FROM governorates
      WHERE trance_price IS NOT NULL
      ON DUPLICATE KEY UPDATE
        default_trans_price = VALUES(default_trans_price),
        notes = VALUES(notes),
        active = VALUES(active)
    `);
  } finally {
    await connection.end();
  }

  _runtimeSchemaEnsured = true;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }

  if (_db && !_runtimeSchemaEnsured) {
    try {
      await ensureRuntimeSchema();
    } catch (error) {
      console.warn("[Database] Failed to ensure runtime schema:", error);
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
