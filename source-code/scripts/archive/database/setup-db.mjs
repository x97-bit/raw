import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL = 'mysql://2cBVipAbwinYH8r.51d8aa2cb634:2tZPFCYk49Th7paXPS12@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/cfYuqJ2Pd2vDCCsiAMFgrf';

const conn = await mysql.createConnection({
  uri: DB_URL,
  ssl: { rejectUnauthorized: true },
  multipleStatements: false,
});

function splitStatements(sql) {
  sql = sql.replace(/CREATE\s+DATABASE[^;]*;/gis, '');
  sql = sql.replace(/^\s*USE\s+\w+\s*;\s*$/gim, '');
  sql = sql.replace(/JSON\s+DEFAULT\s+\('[^']*'\)/gi, 'JSON NULL DEFAULT NULL');

  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (inString && ch === stringChar) {
      inString = false;
      current += ch;
    } else if (!inString && ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      current += '\n';
    } else if (!inString && ch === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
    } else {
      current += ch;
    }
  }
  const last = current.trim();
  if (last.length > 0) statements.push(last);
  return statements;
}

const files = [
  '../../../database/sql/01_schema.sql',
  '../../../database/sql/02_seed_data.sql',
  '../../../database/sql/03_indexes.sql',
];

for (const file of files) {
  const raw = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const statements = splitStatements(raw);
  console.log(`\nRunning ${file} (${statements.length} statements)...`);
  let ok = 0, skip = 0, fail = 0;
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      ok++;
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('Duplicate entry')) {
        skip++;
      } else {
        console.error(`  ❌ ${e.message.substring(0, 150)}`);
        console.error(`     SQL: ${stmt.substring(0, 120)}`);
        fail++;
      }
    }
  }
  console.log(`  ✅ OK: ${ok}  ⏭ Skipped: ${skip}  ❌ Failed: ${fail}`);
}

await conn.end();
console.log('\nDone!');
