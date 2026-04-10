import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCHEMA_FILE = path.join(REPO_ROOT, "database", "sql", "01_schema.sql");
const INDEX_FILE = path.join(REPO_ROOT, "database", "sql", "03_indexes.sql");

const DATABASE_URL = arg("--database-url") || process.env.DATABASE_URL || "";
const TARGET_DB_NAME = arg("--database-name") || "alrawi_import";
const RESET = has("--reset");

const ADMIN_USER = {
  username: "admin",
  password: "$2b$10$YxOJeaNjXh8tG7pGM1DODuNrXAsAoLU3e2RfT04xJLaPX9ZYBPFty",
  name: "المدير",
  role: "admin",
  permissions: JSON.stringify([
    "port-1",
    "port-2",
    "port-3",
    "transport",
    "partnership",
    "fx",
    "debts",
    "special",
    "reports",
    "add_invoice",
    "add_payment",
    "edit_transaction",
    "delete_transaction",
    "export",
    "add_trader",
    "manage_debts",
  ]),
  active: 1,
};

const PORTS = [
  { portId: "port-1", name: "السعودية", section: "ports" },
  { portId: "port-2", name: "المنذرية", section: "ports" },
  { portId: "port-3", name: "القائم", section: "ports" },
  { portId: "transport-1", name: "النقل", section: "transport" },
  { portId: "partnership-1", name: "شراكة", section: "partnership" },
  { portId: "fx-1", name: "صرافة", section: "fx" },
];

const ACCOUNT_TYPES = [
  { typeId: "port-1", name: "منفذ السعودية" },
  { typeId: "port-2", name: "منفذ المنذرية" },
  { typeId: "port-3", name: "منفذ القائم" },
  { typeId: "transport", name: "نقل" },
  { typeId: "partnership", name: "شراكة" },
  { typeId: "fx", name: "صرافة" },
];

function arg(name) {
  const exact = process.argv.find((value) => value.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || null : null;
}

function has(name) {
  return process.argv.includes(name);
}

function cfg(url, databaseOverride) {
  const parsed = new URL(url);
  const config = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    charset: "utf8mb4",
    multipleStatements: false,
  };

  if (databaseOverride !== false) {
    config.database = databaseOverride || parsed.pathname.replace(/^\//, "");
  }

  return config;
}

function toStatements(sqlText) {
  return sqlText
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .replace(/--.*$/gm, "")
    .replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;/i, "")
    .replace(/USE\s+`?[\w-]+`?\s*;/gi, "")
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runSqlFile(connection, filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const statements = toStatements(content);

  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function ensureColumn(connection, tableName, columnName, definitionSql) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  if (Array.isArray(rows) && rows.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definitionSql}`);
  }
}

async function ensureRuntimeSupportTables(connection) {
  await ensureColumn(connection, "field_config", "display_label", "`display_label` VARCHAR(255) NULL AFTER `sort_order`");
  await ensureColumn(connection, "app_users", "profile_image", "`profile_image` LONGTEXT NULL AFTER `name`");

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

  await ensureColumn(connection, "transactions", "company_id", "`company_id` INT NULL AFTER `company_name`");
}

async function seedBaseLookups(connection) {
  await connection.query("INSERT IGNORE INTO `app_users` SET ?", ADMIN_USER);
  await connection.query("INSERT IGNORE INTO `users` (`openId`, `name`, `role`) VALUES ('system', 'System', 'admin')");

  for (const row of PORTS) {
    await connection.query("INSERT IGNORE INTO `ports` SET ?", row);
  }

  for (const row of ACCOUNT_TYPES) {
    await connection.query("INSERT IGNORE INTO `account_types` SET ?", row);
  }
}

async function main() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Set it in source-code/.env or pass --database-url");
  }

  const admin = await mysql.createConnection(cfg(DATABASE_URL, false));

  try {
    const [existing] = await admin.query("SHOW DATABASES LIKE ?", [TARGET_DB_NAME]);
    const exists = Array.isArray(existing) && existing.length > 0;

    if (exists && !RESET) {
      throw new Error(`Database '${TARGET_DB_NAME}' already exists. Re-run with --reset to rebuild it.`);
    }

    if (exists) {
      await admin.query(`DROP DATABASE \`${TARGET_DB_NAME}\``);
    }

    await admin.query(
      `CREATE DATABASE \`${TARGET_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await admin.end();
  }

  const target = await mysql.createConnection(cfg(DATABASE_URL, TARGET_DB_NAME));

  try {
    await runSqlFile(target, SCHEMA_FILE);
    await runSqlFile(target, INDEX_FILE);
    await ensureRuntimeSupportTables(target);
    await seedBaseLookups(target);

    const [[summary]] = await target.query(`
      SELECT
        (SELECT COUNT(*) FROM app_users) AS app_users_count,
        (SELECT COUNT(*) FROM ports) AS ports_count,
        (SELECT COUNT(*) FROM account_types) AS account_types_count,
        (SELECT COUNT(*) FROM companies) AS companies_count,
        (SELECT COUNT(*) FROM goods_types) AS goods_types_count,
        (SELECT COUNT(*) FROM governorates) AS governorates_count,
        (SELECT COUNT(*) FROM accounts) AS accounts_count,
        (SELECT COUNT(*) FROM transactions) AS transactions_count
    `);

    console.log(
      JSON.stringify(
        {
          status: "ready",
          database: TARGET_DB_NAME,
          summary,
          next: [
            `node scripts/imports/import-old-trade-json.mjs --apply --database-url "${DATABASE_URL.replace(/\/[^/]*$/, `/${TARGET_DB_NAME}`)}"`,
          ],
        },
        null,
        2
      )
    );
  } finally {
    await target.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
