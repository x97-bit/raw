import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_DIR = path.join(REPO_ROOT, 'database', 'backups');

const DEBTOR_NAME_FIXES = new Map([
  ['???? ???????', 'باسم الجميلي'],
  ['?????', 'نعمان'],
  ['??? 2', 'لؤي 2'],
  ['??? ?????? ??????', 'عبد الكريم الشمري'],
]);

const ABDALKAREM_BROKEN_NAME = '??? ?????? ??????';
const ABDALKAREM_FIXED_TRANS_TYPE = 'فاتورة';
const DESCRIPTION_LABELS = ['التاجر', 'المنفذ', 'الوجهة', 'الشركة'];

function buildConnectionOptions(databaseUrl) {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\/+/, '');

  if (!database) {
    throw new Error('DATABASE_URL is missing the database name.');
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || ''),
    password: decodeURIComponent(url.password || ''),
    database,
    charset: 'utf8mb4',
    dateStrings: ['DATE'],
  };
}

function hasBrokenQuestionMarks(value) {
  return typeof value === 'string' && value.includes('?');
}

function repairDescription(value) {
  if (!hasBrokenQuestionMarks(value)) return value;

  let labelIndex = 0;
  const parts = String(value)
    .split('|')
    .map((part) => part.trim())
    .map((part) => {
      if (!/^\?+\s*:/.test(part)) return part;
      const label = DESCRIPTION_LABELS[labelIndex] || DESCRIPTION_LABELS[DESCRIPTION_LABELS.length - 1];
      labelIndex += 1;
      return part.replace(/^\?+\s*:/, `${label}:`);
    });

  return parts.join(' | ');
}

function buildUpdateQuery(tableName, rowId, updates) {
  const keys = Object.keys(updates);
  const assignments = keys.map((key) => `\`${key}\` = ?`).join(', ');
  const values = keys.map((key) => updates[key]);
  return {
    sql: `UPDATE \`${tableName}\` SET ${assignments} WHERE id = ?`,
    params: [...values, rowId],
  };
}

function buildDebtUpdates(row) {
  const updates = {};

  const fixedName = DEBTOR_NAME_FIXES.get(row.debtorName);
  if (fixedName && fixedName !== row.debtorName) {
    updates.debtorName = fixedName;
  }

  if (row.debtorName === ABDALKAREM_BROKEN_NAME && row.transType === '??????') {
    updates.transType = ABDALKAREM_FIXED_TRANS_TYPE;
  }

  const fixedDescription = repairDescription(row.description);
  if (fixedDescription !== row.description) {
    updates.description = fixedDescription;
  }

  return updates;
}

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in source-code/.env');
  }

  const connection = await mysql.createConnection(buildConnectionOptions(databaseUrl));

  try {
    const [rows] = await connection.query(`
      SELECT id, debtorName, transType, description, state, fxNote
      FROM debts
      ORDER BY id ASC
    `);

    const affectedRows = rows
      .map((row) => ({
        row,
        updates: buildDebtUpdates(row),
      }))
      .filter(({ updates }) => Object.keys(updates).length > 0);

    if (affectedRows.length === 0) {
      console.log(JSON.stringify({
        updatedRows: 0,
        message: 'No broken debt encoding was found.',
      }, null, 2));
      return;
    }

    await ensureBackupDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `debts-encoding-repair-${stamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify({
      createdAt: new Date().toISOString(),
      updatedRowCount: affectedRows.length,
      rows: affectedRows.map(({ row, updates }) => ({ before: row, updates })),
    }, null, 2), 'utf8');

    await connection.beginTransaction();
    try {
      for (const { row, updates } of affectedRows) {
        const { sql, params } = buildUpdateQuery('debts', row.id, updates);
        await connection.query(sql, params);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    const [verification] = await connection.query(`
      SELECT COUNT(*) AS brokenCount
      FROM debts
      WHERE debtorName LIKE '%?%'
         OR transType LIKE '%?%'
         OR description LIKE '%?%'
    `);

    console.log(JSON.stringify({
      backupPath,
      updatedRows: affectedRows.length,
      brokenCountAfterRepair: Number(verification[0]?.brokenCount || 0),
      repairedIds: affectedRows.map(({ row }) => row.id),
    }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
