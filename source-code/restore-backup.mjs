import { createConnection } from "mysql2/promise";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const backup = require("./database/backups/pre-safe-reset-2026-04-13T13-25-16-675Z.json");
const data = backup.data;

// Convert ISO datetime strings to MySQL format
function fixDatetime(val) {
  if (
    typeof val === "string" &&
    val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  ) {
    return val
      .replace("T", " ")
      .replace(/\.\d+Z$/, "")
      .replace("Z", "");
  }
  return val;
}

function fixRow(row) {
  const fixed = {};
  for (const [k, v] of Object.entries(row)) {
    fixed[k] = fixDatetime(v);
  }
  return fixed;
}

async function getTableColumns(conn, table) {
  const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${table}\``);
  return cols.map(c => c.Field);
}

async function restore() {
  const conn = await createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    database: "alrawi_db",
  });

  const order = [
    "app_users",
    "ports",
    "account_types",
    "goods_types",
    "governorates",
    "drivers",
    "vehicles",
    "companies",
    "accounts",
    "cash_state",
    "custom_fields",
    "field_config",
    "transactions",
    "debts",
    "expenses",
    "special_accounts",
    "entity_aliases",
    "account_defaults",
    "route_defaults",
    "custom_field_values",
    "payment_matching",
    "audit_logs",
  ];

  await conn.execute("SET FOREIGN_KEY_CHECKS=0");
  await conn.execute("SET SESSION sql_mode = ''");

  let totalInserted = 0;
  for (const table of order) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      console.log(`${table}: skipped (empty)`);
      continue;
    }

    try {
      // Get actual columns that exist in current DB
      const dbCols = await getTableColumns(conn, table);
      await conn.execute(`TRUNCATE TABLE \`${table}\``);

      let inserted = 0;
      for (const rawRow of rows) {
        const fixedRow = fixRow(rawRow);
        // Only use columns that exist in DB
        const cols = Object.keys(fixedRow).filter(c => dbCols.includes(c));
        if (cols.length === 0) continue;

        const placeholders = `(${cols.map(() => "?").join(",")})`;
        const sql = `INSERT INTO \`${table}\` (\`${cols.join("`,`")}\`) VALUES ${placeholders}`;
        const vals = cols.map(c =>
          fixedRow[c] === undefined ? null : fixedRow[c]
        );

        try {
          await conn.execute(sql, vals);
          inserted++;
        } catch (rowErr) {
          // Skip individual row errors silently
        }
      }

      totalInserted += inserted;
      console.log(`${table}: ${inserted}/${rows.length} rows restored ✓`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message.substring(0, 100)}`);
    }
  }

  await conn.execute("SET FOREIGN_KEY_CHECKS=1");
  await conn.end();
  console.log(`\n✅ Done! Total: ${totalInserted} rows restored`);
}

restore().catch(console.error);
