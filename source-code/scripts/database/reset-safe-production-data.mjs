import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { buildMySqlConnectionOptions } from '../shared/scriptMysqlConfig.mjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const projectRoot = process.cwd();
const backupDir = path.join(projectRoot, 'database', 'backups');
const backupPath = path.join(backupDir, `pre-safe-reset-${timestamp}.json`);
const reportPath = path.join(backupDir, `safe-reset-report-${timestamp}.json`);
const applyMode = process.argv.includes('--apply');

const tablesToClear = [
  'custom_field_values',
  'payment_matching',
  'route_defaults',
  'account_defaults',
  'entity_aliases',
  'special_accounts',
  'expenses',
  'debts',
  'transactions',
  'companies',
  'accounts',
  'drivers',
  'vehicles',
  'goods_types',
  'governorates',
  'audit_logs',
];

const preservedTables = [
  '__drizzle_migrations',
  'app_users',
  'cash_state',
  'ports',
  'account_types',
  'field_config',
  'custom_fields',
  'users',
];

function getTablesInResultRow(row) {
  const firstKey = Object.keys(row)[0];
  return row[firstKey];
}

async function readAllTables(connection) {
  const [tableRows] = await connection.query('SHOW TABLES');
  const tableNames = tableRows.map(getTablesInResultRow);
  const data = {};
  const counts = {};

  for (const tableName of tableNames) {
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    data[tableName] = rows;
    counts[tableName] = rows.length;
  }

  return { tableNames, data, counts };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function countTable(connection, tableName) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  return Number(rows[0]?.count || 0);
}

async function main() {
  const connection = await mysql.createConnection(buildMySqlConnectionOptions(databaseUrl));

  try {
    const beforeSnapshot = await readAllTables(connection);
    const adminRows = beforeSnapshot.data.app_users.filter((row) => row.username === 'admin');

    if (adminRows.length !== 1) {
      throw new Error(`Expected exactly one admin user before reset, found ${adminRows.length}`);
    }

    const backupPayload = {
      meta: {
        action: applyMode ? 'safe-reset-apply' : 'safe-reset-dry-run',
        createdAt: new Date().toISOString(),
        databaseUrl: databaseUrl.replace(/:[^:@/]+@/, ':***@'),
        tablesToClear,
        preservedTables,
      },
      counts: beforeSnapshot.counts,
      data: beforeSnapshot.data,
    };

    await writeJson(backupPath, backupPayload);

    if (!applyMode) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        backupPath,
        tablesToClear,
        preservedTables,
        beforeCounts: beforeSnapshot.counts,
      }, null, 2));
      return;
    }

    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of tablesToClear) {
      await connection.query(`DELETE FROM \`${tableName}\``);
    }

    await connection.query("DELETE FROM `app_users` WHERE `username` <> 'admin'");
    await connection.query("UPDATE `app_users` SET `active` = 1, `role` = 'admin' WHERE `username` = 'admin'");

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    for (const tableName of tablesToClear) {
      await connection.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
    }

    const afterCounts = {};
    for (const tableName of [...tablesToClear, 'app_users', 'field_config', 'custom_fields', 'ports', 'account_types', 'cash_state']) {
      afterCounts[tableName] = await countTable(connection, tableName);
    }

    const reportPayload = {
      meta: {
        action: 'safe-reset-apply',
        createdAt: new Date().toISOString(),
        backupPath,
      },
      beforeCounts: beforeSnapshot.counts,
      afterCounts,
      tablesCleared: tablesToClear,
      tablesPreserved: preservedTables,
      admin: {
        username: 'admin',
        remainingCount: await countTable(connection, 'app_users'),
      },
    };

    await writeJson(reportPath, reportPayload);

    console.log(JSON.stringify({
      mode: 'apply',
      backupPath,
      reportPath,
      beforeCounts: beforeSnapshot.counts,
      afterCounts,
    }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
