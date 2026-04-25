import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportPath = path.resolve(
  __dirname,
  "..",
  "..",
  "database",
  "exports",
  "alrawi-database-export.json"
);

const DB_NAME = process.env.LOCAL_DB_NAME || "alrawi_db";
const DB_HOST = process.env.LOCAL_DB_HOST || "localhost";
const DB_PORT = Number(process.env.LOCAL_DB_PORT || 3306);
const DB_USER = process.env.LOCAL_DB_USER || "root";
const DB_PASSWORD = process.env.LOCAL_DB_PASSWORD || "";

function normalizeValue(value, dataType) {
  if (value === undefined) return null;
  if (value === null) return null;

  if (dataType === "json") {
    return JSON.stringify(value);
  }

  if (
    (dataType === "timestamp" || dataType === "datetime") &&
    typeof value === "string"
  ) {
    return value
      .replace("T", " ")
      .replace("Z", "")
      .replace(/\.\d{3}$/, "");
  }

  if (dataType === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }

  return value;
}

function buildInsertQuery(tableName, columns, rowCount) {
  const columnSql = columns.map(column => `\`${column}\``).join(", ");
  const valueGroup = `(${columns.map(() => "?").join(", ")})`;
  const valuesSql = Array.from({ length: rowCount }, () => valueGroup).join(
    ", "
  );
  return `INSERT INTO \`${tableName}\` (${columnSql}) VALUES ${valuesSql}`;
}

async function main() {
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportPath}`);
  }

  const exported = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const schemaEntries = Object.entries(exported.schema);
  const dataEntries = Object.entries(exported.data);

  console.log(
    `Rebuilding local database '${DB_NAME}' from ${path.basename(exportPath)}...`
  );

  const adminConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await adminConn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  await adminConn.query(
    `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await adminConn.end();

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    charset: "utf8mb4",
  });

  try {
    for (const [tableName, tableSchema] of schemaEntries) {
      await conn.query(tableSchema.createSQL);
      console.log(`Created table: ${tableName}`);
    }

    await ensureSchemaPatches(conn);

    for (const [tableName, rows] of dataEntries) {
      if (!Array.isArray(rows) || rows.length === 0) {
        console.log(`Imported 0 rows into ${tableName}`);
        continue;
      }

      const columns = tableSchemaColumns(exported.schema[tableName]);
      const dataTypes = new Map(
        columns.map(column => [column.name, column.dataType])
      );
      const insertColumns = Object.keys(rows[0]);
      const chunkSize = 100;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const query = buildInsertQuery(tableName, insertColumns, chunk.length);
        const values = [];

        for (const row of chunk) {
          for (const column of insertColumns) {
            values.push(normalizeValue(row[column], dataTypes.get(column)));
          }
        }

        await conn.query(query, values);
      }

      console.log(`Imported ${rows.length} rows into ${tableName}`);
    }

    const [summaryRows] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM transactions) AS transactions_count,
        (SELECT COUNT(*) FROM accounts) AS accounts_count,
        (SELECT COUNT(*) FROM app_users) AS app_users_count
    `);

    console.log("Local database rebuild complete.");
    console.log(summaryRows[0]);
  } finally {
    await conn.end();
  }
}

async function ensureSchemaPatches(conn) {
  const [fieldConfigColumns] = await conn.query(
    "SHOW COLUMNS FROM `field_config` LIKE 'display_label'"
  );
  if (Array.isArray(fieldConfigColumns) && fieldConfigColumns.length === 0) {
    await conn.query(
      "ALTER TABLE `field_config` ADD COLUMN `display_label` VARCHAR(255) NULL AFTER `sort_order`"
    );
    console.log("Patched table: field_config.display_label");
  }
}

function tableSchemaColumns(tableSchema) {
  return Array.isArray(tableSchema?.columns) ? tableSchema.columns : [];
}

main().catch(error => {
  console.error("Failed to rebuild local database.");
  console.error(error);
  process.exit(1);
});
