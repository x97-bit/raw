import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { buildMySqlConnectionOptions } from "../shared/scriptMysqlConfig.mjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATABASE_DIR = path.join(REPO_ROOT, "database");
const BACKUP_DIR = path.join(DATABASE_DIR, "backups");
const REPORT_DIR = path.join(DATABASE_DIR, "import-reports");
const SOURCE_DB = arg("--source-db") || "alrawi_import";
const TARGET_URL = process.env.DATABASE_URL || "";
const APPLY = has("--apply");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const CORE_TABLES = [
  "accounts",
  "drivers",
  "vehicles",
  "transactions",
  "debts",
  "special_accounts",
];

const LOOKUP_TABLES = [
  { table: "companies", column: "name" },
  { table: "goods_types", column: "name" },
  { table: "governorates", column: "name" },
];

function arg(name) {
  const exact = process.argv.find(value => value.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || null : null;
}

function has(name) {
  return process.argv.includes(name);
}

async function tableCount(connection, table, databaseName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS c FROM \`${databaseName}\`.\`${table}\``
  );
  return Number(rows[0]?.c || 0);
}

async function getDatabaseName(connection) {
  const [rows] = await connection.query("SELECT DATABASE() AS db");
  return rows[0]?.db || "";
}

async function loadMissingLookupRows(
  connection,
  sourceDb,
  targetDb,
  table,
  column
) {
  const [rows] = await connection.query(
    `
      SELECT s.*
      FROM \`${sourceDb}\`.\`${table}\` s
      LEFT JOIN \`${targetDb}\`.\`${table}\` t
        ON t.\`${column}\` = s.\`${column}\`
      WHERE t.id IS NULL
      ORDER BY s.id
    `
  );

  return rows;
}

async function backupTarget(connection, targetDb, payload) {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(
    BACKUP_DIR,
    `pre-import-production-sync-${stamp}.json`
  );
  await fs.writeFile(
    backupPath,
    JSON.stringify(
      {
        meta: {
          createdAt: new Date().toISOString(),
          sourceDb: SOURCE_DB,
          targetDb,
        },
        ...payload,
      },
      null,
      2
    ),
    "utf8"
  );
  return backupPath;
}

async function writeReport(report) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const reportPath = path.join(
    REPORT_DIR,
    `import-production-sync-${stamp}.json`
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

async function main() {
  if (!TARGET_URL) {
    throw new Error("DATABASE_URL is missing in source-code/.env");
  }

  const target = await mysql.createConnection(
    buildMySqlConnectionOptions(TARGET_URL)
  );

  try {
    const targetDb = await getDatabaseName(target);
    if (!targetDb) {
      throw new Error(
        "Could not determine target database name from DATABASE_URL"
      );
    }

    if (targetDb === SOURCE_DB) {
      throw new Error("Source and target databases are identical");
    }

    const sourceCounts = {};
    const targetCounts = {};
    for (const table of [
      ...CORE_TABLES,
      ...LOOKUP_TABLES.map(item => item.table),
    ]) {
      sourceCounts[table] = await tableCount(target, table, SOURCE_DB);
      targetCounts[table] = await tableCount(target, table, targetDb);
    }

    const missingLookups = {};
    for (const lookup of LOOKUP_TABLES) {
      missingLookups[lookup.table] = await loadMissingLookupRows(
        target,
        SOURCE_DB,
        targetDb,
        lookup.table,
        lookup.column
      );
    }

    const coreDelta = {};
    for (const table of CORE_TABLES) {
      coreDelta[table] = {
        source: sourceCounts[table],
        target: targetCounts[table],
        matches: sourceCounts[table] === targetCounts[table],
      };
    }

    const allCoreMatch = Object.values(coreDelta).every(item => item.matches);

    const backupPath = await backupTarget(target, targetDb, {
      sourceCounts,
      targetCounts,
      missingLookups,
      coreDelta,
      mode: APPLY ? "apply" : "dry-run",
    });

    if (!allCoreMatch) {
      throw new Error(
        "Core production tables do not match staging counts. Refusing add-only sync."
      );
    }

    let applied = {};

    if (APPLY) {
      await target.beginTransaction();
      try {
        applied = {
          companies: 0,
          goods_types: 0,
          governorates: 0,
        };

        for (const row of missingLookups.companies) {
          const [res] = await target.query("INSERT INTO `companies` SET ?", {
            name: row.name,
            active: row.active ?? 1,
            notes: row.notes ?? null,
          });
          if (res.affectedRows > 0) applied.companies += 1;
        }

        for (const row of missingLookups.goods_types) {
          const [res] = await target.query("INSERT INTO `goods_types` SET ?", {
            name: row.name,
          });
          if (res.affectedRows > 0) applied.goods_types += 1;
        }

        for (const row of missingLookups.governorates) {
          const [res] = await target.query("INSERT INTO `governorates` SET ?", {
            name: row.name,
            trance_price: row.trance_price ?? null,
          });
          if (res.affectedRows > 0) applied.governorates += 1;
        }

        await target.query("INSERT INTO `audit_logs` SET ?", {
          entity_type: "migration",
          action: "create",
          summary: "Completed add-only sync from alrawi_import to production",
          after_data: JSON.stringify({
            sourceDb: SOURCE_DB,
            applied,
          }),
          metadata: JSON.stringify({ backupPath }),
          user_id: 1,
          username: "admin",
        });

        await target.commit();
      } catch (error) {
        await target.rollback();
        throw error;
      }
    }

    const targetCountsAfter = {};
    for (const table of [
      ...CORE_TABLES,
      ...LOOKUP_TABLES.map(item => item.table),
      "audit_logs",
    ]) {
      targetCountsAfter[table] = await tableCount(target, table, targetDb);
    }

    const report = {
      meta: {
        mode: APPLY ? "apply" : "dry-run",
        createdAt: new Date().toISOString(),
        sourceDb: SOURCE_DB,
        targetDb,
      },
      sourceCounts,
      targetCountsBefore: targetCounts,
      targetCountsAfter,
      coreDelta,
      missingLookups: Object.fromEntries(
        Object.entries(missingLookups).map(([table, rows]) => [
          table,
          rows.map(row => row.name ?? row.id),
        ])
      ),
      applied,
      backupPath,
    };

    const reportPath = await writeReport(report);
    console.log(JSON.stringify({ reportPath, ...report }, null, 2));
  } finally {
    await target.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
