import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { buildMySqlConnectionOptions } from "../shared/scriptMysqlConfig.mjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const projectRoot = process.cwd();
const backupDir = path.join(projectRoot, "database", "backups");
const backupPath = path.join(backupDir, `pre-keep-schema-wipe-${timestamp}.json`);
const reportPath = path.join(backupDir, `keep-schema-wipe-report-${timestamp}.json`);
const applyMode = process.argv.includes("--apply");
const dropMigrationMeta = process.argv.includes("--drop-migration-meta");

function getTableName(row) {
  const firstKey = Object.keys(row)[0];
  return row[firstKey];
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

async function readAllTables(connection) {
  const [tableRows] = await connection.query("SHOW TABLES");
  const tableNames = tableRows.map(getTableName);
  const data = {};
  const counts = {};

  for (const tableName of tableNames) {
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    data[tableName] = rows;
    counts[tableName] = rows.length;
  }

  return { tableNames, data, counts };
}

async function countTable(connection, tableName) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  return Number(rows[0]?.count || 0);
}

async function main() {
  const connection = await mysql.createConnection(buildMySqlConnectionOptions(databaseUrl));

  try {
    const snapshot = await readAllTables(connection);
    const preservedTables = dropMigrationMeta ? [] : ["__drizzle_migrations"];
    const tablesToClear = snapshot.tableNames.filter((tableName) => !preservedTables.includes(tableName));

    const backupPayload = {
      meta: {
        action: applyMode ? "wipe-keep-schema-apply" : "wipe-keep-schema-dry-run",
        createdAt: new Date().toISOString(),
        databaseUrl: databaseUrl.replace(/:[^:@/]+@/, ":***@"),
        tablesToClear,
        preservedTables,
      },
      counts: snapshot.counts,
      data: snapshot.data,
    };

    await writeJson(backupPath, backupPayload);

    if (!applyMode) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            backupPath,
            tablesToClear,
            preservedTables,
            beforeCounts: snapshot.counts,
          },
          null,
          2
        )
      );
      return;
    }

    await connection.beginTransaction();
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const tableName of tablesToClear) {
      await connection.query(`DELETE FROM \`${tableName}\``);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    await connection.commit();

    for (const tableName of tablesToClear) {
      await connection.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
    }

    const afterCounts = {};

    for (const tableName of snapshot.tableNames) {
      afterCounts[tableName] = await countTable(connection, tableName);
    }

    await writeJson(reportPath, {
      meta: {
        action: "wipe-keep-schema-apply",
        createdAt: new Date().toISOString(),
        backupPath,
        droppedMigrationMeta: dropMigrationMeta,
      },
      beforeCounts: snapshot.counts,
      afterCounts,
      tablesCleared: tablesToClear,
      tablesPreserved: preservedTables,
    });

    console.log(
      JSON.stringify(
        {
          mode: "apply",
          backupPath,
          reportPath,
          tablesToClear,
          preservedTables,
          beforeCounts: snapshot.counts,
          afterCounts,
        },
        null,
        2
      )
    );
  } finally {
    await connection.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
