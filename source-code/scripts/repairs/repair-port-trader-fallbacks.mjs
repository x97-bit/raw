import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { buildMySqlConnectionOptions } from '../shared/scriptMysqlConfig.mjs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_DIR = path.join(REPO_ROOT, 'database', 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const FIXES = [
  {
    portId: 'port-1',
    brokenName: '???? ???? ???????? ????-????',
    fixedName: 'حساب قديم السعودية بدون-معرف',
  },
  {
    portId: 'port-3',
    brokenName: '???? ???? ?????? 71',
    fixedName: 'حساب قديم القائم 71',
  },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const conn = await mysql.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));

  try {
    const matched = [];

    for (const fix of FIXES) {
      const [rows] = await conn.query(
        `SELECT id, name, portId, accountType, currency, phone, merchantReport, notes, createdAt, updatedAt
         FROM accounts
         WHERE portId = ? AND name = ?`,
        [fix.portId, fix.brokenName]
      );

      for (const row of rows) {
        const [transactions] = await conn.query(
          `SELECT *
           FROM transactions
           WHERE account_id = ?
           ORDER BY id`,
          [row.id]
        );

        matched.push({
          ...fix,
          account: row,
          transactions,
        });
      }
    }

    if (!matched.length) {
      console.log('No matching broken fallback trader accounts found.');
      return;
    }

    await ensureDir(BACKUP_DIR);
    const backupPath = path.join(BACKUP_DIR, `port-trader-fallback-fix-${stamp}.json`);
    await fs.writeFile(
      backupPath,
      JSON.stringify(
        {
          meta: {
            createdAt: new Date().toISOString(),
            totalMatches: matched.length,
          },
          rows: matched,
        },
        null,
        2
      ),
      'utf8'
    );

    for (const item of matched) {
      await conn.query(
        'UPDATE accounts SET name = ? WHERE id = ?',
        [item.fixedName, item.account.id]
      );
    }

    const [remaining] = await conn.query(
      `SELECT id, name, portId
       FROM accounts
       WHERE portId IN ('port-1', 'port-3') AND name LIKE '%?%'`
    );

    const [updated] = await conn.query(
      `SELECT id, name, portId
       FROM accounts
       WHERE id IN (${matched.map(() => '?').join(',')})
       ORDER BY id`,
      matched.map((item) => item.account.id)
    );

    console.log(
      JSON.stringify(
        {
          backupPath,
          updated,
          remainingBroken: remaining,
        },
        null,
        2
      )
    );
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
