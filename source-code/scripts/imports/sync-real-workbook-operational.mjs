import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import { buildMySqlConnectionOptions } from '../shared/scriptMysqlConfig.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATABASE_DIR = path.join(REPO_ROOT, 'database');
const REPORT_DIR = path.join(DATABASE_DIR, 'import-reports');
const BACKUP_DIR = path.join(DATABASE_DIR, 'backups');

const SECTION_SPECS = [
  {
    id: 'qaim',
    sectionKey: 'port-3',
    accountType: 'تاجر',
    sheetName: 'القائم - حركات',
    kind: 'qaim',
    syntheticPrefix: 'QAIM',
  },
  {
    id: 'mnz',
    sectionKey: 'port-2',
    accountType: 'تاجر',
    sheetName: 'المنذرية - حركات',
    kind: 'mnz',
    syntheticPrefix: 'MNZ',
  },
  {
    id: 'transport',
    sectionKey: 'transport-1',
    accountType: 'نقل',
    sheetName: 'النقل الداخلي',
    kind: 'transport',
    syntheticPrefix: 'TRANS',
  },
];

function getArgValue(flagName) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flagName}=`));
  if (exact) return exact.slice(flagName.length + 1);
  const index = process.argv.indexOf(flagName);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return null;
}

function hasFlag(flagName) {
  return process.argv.includes(flagName);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeSpaces(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeLookupKey(value) {
  return normalizeSpaces(value)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[()\-_/\\.,+]/g, ' ')
    .replace(/[ً-ٟ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function simplifyAccountLookupKey(value) {
  const withoutParenthetical = normalizeSpaces(value).replace(/\([^)]*\)/g, ' ');
  return normalizeLookupKey(withoutParenthetical)
    .split(' ')
    .filter((token) => token && !['شركه', 'شركة', 'قديم', 'جديد', 'دولار', 'دينار'].includes(token))
    .join(' ')
    .trim();
}

function parseArabicNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value)
    .replace(/,/g, '')
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .trim();
  if (!normalized || normalized.toLowerCase() === 'nan') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWorkbookDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && value > 30000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  const text = normalizeSpaces(value);
  if (!text || text.toLowerCase() === 'nan') return null;
  const isoMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;

  return null;
}

function inferDirection(recordType) {
  const text = normalizeLookupKey(recordType);
  if (!text) return 'IN';
  const outHints = ['سند', 'تسديد', 'استلام', 'قبض', 'سحب', 'واصل'];
  return outHints.some((hint) => text.includes(normalizeLookupKey(hint))) ? 'OUT' : 'IN';
}

function inferCurrencyFromAmounts(...values) {
  const usdValues = values.slice(0, 2).some((value) => Number(value || 0) !== 0);
  const iqdValues = values.slice(2).some((value) => Number(value || 0) !== 0);
  if (usdValues && iqdValues) return 'BOTH';
  if (iqdValues) return 'IQD';
  if (usdValues) return 'USD';
  return 'USD';
}

function buildTimestampStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolveWorkbookPath() {
  const explicit = getArgValue('--file') || process.env.WORKBOOK_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const downloadsDir = path.join(os.homedir(), 'Downloads');
  const candidates = fs.readdirSync(downloadsDir)
    .filter((name) => name.toLowerCase().endsWith('.xlsx') && normalizeLookupKey(name).includes(normalizeLookupKey('قاعدة بيانات طي الرواي')))
    .map((name) => ({ fullPath: path.join(downloadsDir, name), mtime: fs.statSync(path.join(downloadsDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (candidates.length === 0) {
    throw new Error('Workbook not found. Use --file with the workbook path.');
  }

  return candidates[0].fullPath;
}

function loadSheetRows(workbook, sheetName) {
  const matchedSheetName = workbook.SheetNames.find((name) => normalizeLookupKey(name) === normalizeLookupKey(sheetName))
    || workbook.SheetNames.find((name) => normalizeLookupKey(name).includes(normalizeLookupKey(sheetName)));
  const worksheet = matchedSheetName ? workbook.Sheets[matchedSheetName] : null;
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });
}

function addLookupEntry(map, rawName, value) {
  const key = normalizeLookupKey(rawName);
  if (!key || map.has(key)) return;
  map.set(key, value);
}

function createLookupMap(rows, aliases = []) {
  const map = new Map();
  for (const row of rows) addLookupEntry(map, row.name, row);
  for (const alias of aliases) {
    const entity = rows.find((row) => row.id === alias.entityId);
    if (!entity) continue;
    addLookupEntry(map, alias.aliasName, entity);
  }
  return map;
}

function createAccountLookupMap(rows, aliases = []) {
  const map = new Map();
  const addAccountEntry = (rawName, entity) => {
    addLookupEntry(map, rawName, entity);
    const simplified = simplifyAccountLookupKey(rawName);
    if (simplified && !map.has(simplified)) map.set(simplified, entity);
  };

  for (const row of rows) addAccountEntry(row.name, row);
  for (const alias of aliases) {
    const entity = rows.find((row) => row.id === alias.entityId);
    if (!entity) continue;
    addAccountEntry(alias.aliasName, entity);
  }

  return map;
}

function meaningfulSectionRow(row, keys) {
  return keys.some((key) => row[key] !== null && row[key] !== undefined && row[key] !== '');
}

function mapQaimRows(rows) {
  return rows.slice(2).map((row, index) => ({
    sourceRowNumber: index + 3,
    refNo: normalizeSpaces(row[2]),
    transDate: parseWorkbookDate(row[1]),
    traderName: normalizeSpaces(row[3]),
    recordType: normalizeSpaces(row[4]),
    driverName: normalizeSpaces(row[5]),
    vehiclePlate: normalizeSpaces(row[6]),
    goodType: normalizeSpaces(row[7]),
    weight: parseArabicNumber(row[8]),
    qty: parseArabicNumber(row[9]),
    costUSD: parseArabicNumber(row[10]),
    amountUSD: parseArabicNumber(row[11]),
    costIQD: parseArabicNumber(row[12]),
    amountIQD: parseArabicNumber(row[13]),
    traderNote: normalizeSpaces(row[14]),
    notes: normalizeSpaces(row[15]),
  }))
    .filter((row) => meaningfulSectionRow(row, ['refNo', 'traderName', 'transDate', 'amountUSD', 'amountIQD', 'notes', 'traderNote']))
    .map((row) => ({
      ...row,
      direction: inferDirection(row.recordType),
      currency: inferCurrencyFromAmounts(row.costUSD, row.amountUSD, row.costIQD, row.amountIQD),
    }));
}

function mapMnzRows(rows) {
  return rows.slice(2).map((row, index) => ({
    sourceRowNumber: index + 3,
    refNo: normalizeSpaces(row[2]),
    transDate: parseWorkbookDate(row[1]),
    traderName: normalizeSpaces(row[3]),
    recordType: normalizeSpaces(row[4]),
    driverName: normalizeSpaces(row[5]),
    vehiclePlate: normalizeSpaces(row[6]),
    weight: parseArabicNumber(row[7]),
    costUSD: parseArabicNumber(row[8]),
    amountUSD: parseArabicNumber(row[9]),
    costIQD: parseArabicNumber(row[10]),
    amountIQD: parseArabicNumber(row[11]),
    notes: normalizeSpaces(row[12]),
  }))
    .filter((row) => meaningfulSectionRow(row, ['refNo', 'traderName', 'transDate', 'amountUSD', 'amountIQD', 'notes']))
    .map((row) => ({
      ...row,
      direction: inferDirection(row.recordType),
      currency: inferCurrencyFromAmounts(row.costUSD, row.amountUSD, row.costIQD, row.amountIQD),
    }));
}

function mapTransportRows(rows) {
  return rows.slice(2).map((row, index) => ({
    sourceRowNumber: index + 3,
    refNo: normalizeSpaces(row[2]),
    transDate: parseWorkbookDate(row[1]),
    carrierName: normalizeSpaces(row[3]),
    traderName: normalizeSpaces(row[4]),
    recordType: normalizeSpaces(row[5]),
    amountUSD: parseArabicNumber(row[6]),
    amountIQD: parseArabicNumber(row[7]),
    carQty: parseArabicNumber(row[8]),
    governorate: normalizeSpaces(row[9]),
    notes: normalizeSpaces(row[10]),
  }))
    .filter((row) => meaningfulSectionRow(row, ['refNo', 'carrierName', 'traderName', 'transDate', 'amountUSD', 'amountIQD', 'notes']))
    .map((row) => ({
      ...row,
      direction: inferDirection(row.recordType),
      currency: inferCurrencyFromAmounts(row.amountUSD, null, row.amountIQD, null),
    }));
}

function buildTransactionFingerprint(row) {
  return [
    row.sectionKey || '',
    row.accountId || 0,
    row.carrierId || 0,
    row.transDate || '',
    String(row.direction || '').trim().toUpperCase(),
    normalizeLookupKey(row.recordType || ''),
    Number(row.costUSD || 0).toFixed(2),
    Number(row.amountUSD || 0).toFixed(2),
    Number(row.costIQD || 0).toFixed(0),
    Number(row.amountIQD || 0).toFixed(0),
    Number(row.weight || 0).toFixed(2),
    Number(row.qty || 0).toFixed(0),
    Number(row.carQty || 0).toFixed(0),
    normalizeLookupKey(row.driverName || ''),
    normalizeLookupKey(row.vehiclePlate || ''),
    normalizeLookupKey(row.goodType || ''),
    normalizeLookupKey(row.governorate || ''),
  ].join('|');
}

async function createDatabaseBackup(connection, workbookPath) {
  ensureDir(BACKUP_DIR);
  const [tables] = await connection.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      source: 'sync-real-workbook-operational',
      workbookPath,
      tableCount: tables.length,
    },
    data: {},
  };

  for (const table of tables) {
    const tableName = table.table_name;
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    snapshot.data[tableName] = rows;
  }

  const outputPath = path.join(BACKUP_DIR, `pre-operational-sync-${buildTimestampStamp()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return outputPath;
}

async function ensureEntityAlias(connection, entityType, entityId, aliasName, sourceSystem = 'real-workbook-operational') {
  const normalizedAlias = normalizeSpaces(aliasName);
  if (!normalizedAlias) return;
  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id), source_system = VALUES(source_system)
  `, [entityType, entityId, normalizedAlias, sourceSystem]);
}

async function loadDatabaseContext(connection) {
  const [
    [accounts],
    [drivers],
    [vehicles],
    [goods],
    [governorates],
    [aliases],
    [transactions],
  ] = await Promise.all([
    connection.query('SELECT id, name, accountType, portId, currency, merchantReport FROM accounts ORDER BY name'),
    connection.query('SELECT id, name FROM drivers ORDER BY name'),
    connection.query('SELECT id, plateNumber FROM vehicles ORDER BY plateNumber'),
    connection.query('SELECT id, name FROM goods_types ORDER BY name'),
    connection.query('SELECT id, name, trance_price FROM governorates ORDER BY name'),
    connection.query(`
      SELECT entity_type AS entityType, entity_id AS entityId, alias_name AS aliasName
      FROM entity_aliases
      WHERE entity_type IN ('account', 'driver', 'vehicle', 'good_type', 'governorate')
    `),
    connection.query(`
      SELECT
        t.id,
        t.ref_no AS refNo,
        t.port_id AS sectionKey,
        t.account_id AS accountId,
        t.carrier_id AS carrierId,
        t.trans_date AS transDate,
        t.direction,
        t.record_type AS recordType,
        t.cost_usd AS costUSD,
        t.amount_usd AS amountUSD,
        t.cost_iqd AS costIQD,
        t.amount_iqd AS amountIQD,
        t.weight,
        t.qty,
        t.car_qty AS carQty,
        d.name AS driverName,
        v.plateNumber AS vehiclePlate,
        g.name AS goodType,
        gov.name AS governorate
      FROM transactions t
      LEFT JOIN drivers d ON d.id = t.driver_id
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN goods_types g ON g.id = t.good_type_id
      LEFT JOIN governorates gov ON gov.id = t.gov_id
      WHERE t.port_id IN ('port-2', 'port-3', 'transport-1')
    `),
  ]);

  return {
    accounts: accounts.map((row) => ({
      id: row.id,
      name: row.name,
      accountType: row.accountType,
      portId: row.portId,
      currency: row.currency,
      merchantReport: row.merchantReport,
    })),
    drivers: drivers.map((row) => ({ id: row.id, name: row.name })),
    vehicles: vehicles.map((row) => ({ id: row.id, name: row.plateNumber })),
    goods: goods.map((row) => ({ id: row.id, name: row.name })),
    governorates: governorates.map((row) => ({ id: row.id, name: row.name, trancePrice: row.trance_price })),
    aliases,
    existingTransactions: transactions,
  };
}

function createSectionState(dbContext) {
  const state = {
    accountsBySection: {},
    drivers: {
      items: [...dbContext.drivers],
      map: createLookupMap(dbContext.drivers, dbContext.aliases.filter((row) => row.entityType === 'driver')),
    },
    vehicles: {
      items: [...dbContext.vehicles],
      map: createLookupMap(dbContext.vehicles, dbContext.aliases.filter((row) => row.entityType === 'vehicle')),
    },
    goods: {
      items: [...dbContext.goods],
      map: createLookupMap(dbContext.goods, dbContext.aliases.filter((row) => row.entityType === 'good_type')),
    },
    governorates: {
      items: [...dbContext.governorates],
      map: createLookupMap(dbContext.governorates, dbContext.aliases.filter((row) => row.entityType === 'governorate')),
    },
  };

  for (const spec of [...SECTION_SPECS, { sectionKey: 'port-3', accountType: 'تاجر' }]) {
    if (state.accountsBySection[spec.sectionKey]) continue;
    const items = dbContext.accounts.filter((row) => row.portId === spec.sectionKey);
    const aliases = dbContext.aliases.filter((row) => row.entityType === 'account' && items.some((item) => item.id === row.entityId));
    state.accountsBySection[spec.sectionKey] = {
      items: [...items],
      map: createAccountLookupMap(items, aliases),
    };
  }

  return state;
}

async function findOrCreateAccount(connection, state, rawName, { sectionKey, accountType, currency = null, merchantReport = null }) {
  const normalizedName = normalizeSpaces(rawName);
  if (!normalizedName) return null;

  const sectionState = state.accountsBySection[sectionKey];
  const existing = sectionState.map.get(normalizeLookupKey(normalizedName)) || sectionState.map.get(simplifyAccountLookupKey(normalizedName));
  if (existing) {
    await ensureEntityAlias(connection, 'account', existing.id, normalizedName);
    return existing;
  }

  const [result] = await connection.query(`
    INSERT INTO accounts (name, accountType, portId, currency, merchantReport)
    VALUES (?, ?, ?, ?, ?)
  `, [normalizedName, accountType, sectionKey, currency, merchantReport]);

  const entity = {
    id: Number(result.insertId),
    name: normalizedName,
    accountType,
    portId: sectionKey,
    currency,
    merchantReport,
  };
  sectionState.items.push(entity);
  addLookupEntry(sectionState.map, normalizedName, entity);
  const simplified = simplifyAccountLookupKey(normalizedName);
  if (simplified && !sectionState.map.has(simplified)) sectionState.map.set(simplified, entity);
  await ensureEntityAlias(connection, 'account', entity.id, normalizedName);
  return entity;
}

async function findOrCreateLookupEntity(connection, state, entityType, rawName, extra = {}) {
  const normalizedName = normalizeSpaces(rawName);
  if (!normalizedName) return null;

  const existing = state.map.get(normalizeLookupKey(normalizedName));
  if (existing) {
    await ensureEntityAlias(connection, entityType, existing.id, normalizedName);
    return existing;
  }

  let result;
  if (entityType === 'driver') {
    [result] = await connection.query('INSERT INTO drivers (name) VALUES (?)', [normalizedName]);
  } else if (entityType === 'vehicle') {
    [result] = await connection.query('INSERT INTO vehicles (plateNumber) VALUES (?)', [normalizedName]);
  } else if (entityType === 'good_type') {
    [result] = await connection.query('INSERT INTO goods_types (name) VALUES (?)', [normalizedName]);
  } else if (entityType === 'governorate') {
    [result] = await connection.query('INSERT INTO governorates (name, trance_price) VALUES (?, ?)', [normalizedName, extra.trancePrice ?? null]);
  } else {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const entity = {
    id: Number(result.insertId),
    name: normalizedName,
    ...(entityType === 'governorate' ? { trancePrice: extra.trancePrice ?? null } : {}),
  };
  state.items.push(entity);
  addLookupEntry(state.map, normalizedName, entity);
  await ensureEntityAlias(connection, entityType, entity.id, normalizedName);
  return entity;
}

function getExistingRefSet(dbContext, sectionKey) {
  return new Set(
    dbContext.existingTransactions
      .filter((row) => row.sectionKey === sectionKey)
      .map((row) => normalizeSpaces(row.refNo))
      .filter(Boolean),
  );
}

function getExistingFingerprintSet(dbContext, sectionKey) {
  return new Set(
    dbContext.existingTransactions
      .filter((row) => row.sectionKey === sectionKey)
      .map((row) => buildTransactionFingerprint(row)),
  );
}

function saveReport(prefix, report) {
  ensureDir(REPORT_DIR);
  const outputPath = path.join(REPORT_DIR, `${prefix}-${buildTimestampStamp()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  return outputPath;
}

function getSyntheticRef(spec, row) {
  return `${spec.syntheticPrefix}-ROW${String(row.sourceRowNumber).padStart(4, '0')}`;
}

function summarizeSectionRows(spec, rows, dbContext) {
  const refSet = getExistingRefSet(dbContext, spec.sectionKey);
  const fingerprintSet = getExistingFingerprintSet(dbContext, spec.sectionKey);

  const decisions = [];
  for (const row of rows) {
    const effectiveRef = normalizeSpaces(row.refNo) || getSyntheticRef(spec, row);
    const candidate = { ...row, sectionKey: spec.sectionKey, refNo: effectiveRef };

    if (!candidate.transDate) {
      decisions.push({ ...candidate, status: 'blocked', reason: 'missing-date' });
      continue;
    }

    if ((spec.kind !== 'transport' && !candidate.traderName) || (spec.kind === 'transport' && !candidate.carrierName)) {
      decisions.push({ ...candidate, status: 'blocked', reason: 'missing-account-name' });
      continue;
    }

    if (normalizeSpaces(row.refNo) && refSet.has(normalizeSpaces(row.refNo))) {
      decisions.push({ ...candidate, status: 'duplicate', reason: 'existing-ref' });
      continue;
    }

    const fingerprint = buildTransactionFingerprint(candidate);
    if (fingerprintSet.has(fingerprint)) {
      decisions.push({ ...candidate, status: 'duplicate', reason: 'existing-fingerprint' });
      continue;
    }

    decisions.push({ ...candidate, status: 'ready', reason: 'importable' });
  }

  return {
    totalRows: rows.length,
    readyRows: decisions.filter((row) => row.status === 'ready').length,
    duplicateRows: decisions.filter((row) => row.status === 'duplicate').length,
    blockedRows: decisions.filter((row) => row.status === 'blocked').length,
    decisions,
  };
}

async function insertSectionRow(connection, state, spec, row, counters) {
  if (spec.kind === 'qaim') {
    const account = await findOrCreateAccount(connection, state, row.traderName, { sectionKey: 'port-3', accountType: 'تاجر' });
    const driver = row.driverName ? await findOrCreateLookupEntity(connection, state.drivers, 'driver', row.driverName) : null;
    const vehicle = row.vehiclePlate ? await findOrCreateLookupEntity(connection, state.vehicles, 'vehicle', row.vehiclePlate) : null;
    const good = row.goodType ? await findOrCreateLookupEntity(connection, state.goods, 'good_type', row.goodType) : null;
    if (!account) return false;
    await connection.query(`
      INSERT INTO transactions (
        ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, good_type_id,
        weight, qty, cost_usd, amount_usd, cost_iqd, amount_iqd, company_name, notes, trader_note,
        record_type, port_id, account_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)
    `, [
      row.refNo,
      row.direction,
      row.transDate,
      account.id,
      row.currency,
      driver?.id ?? null,
      vehicle?.id ?? null,
      good?.id ?? null,
      row.weight ?? null,
      row.qty ?? null,
      row.costUSD ?? 0,
      row.amountUSD ?? 0,
      row.costIQD ?? 0,
      row.amountIQD ?? 0,
      row.notes || null,
      row.traderNote || null,
      row.recordType || 'فاتورة',
      'port-3',
      'تاجر',
    ]);
    counters.port3++;
    return true;
  }

  if (spec.kind === 'mnz') {
    const account = await findOrCreateAccount(connection, state, row.traderName, { sectionKey: 'port-2', accountType: 'تاجر' });
    const driver = row.driverName ? await findOrCreateLookupEntity(connection, state.drivers, 'driver', row.driverName) : null;
    const vehicle = row.vehiclePlate ? await findOrCreateLookupEntity(connection, state.vehicles, 'vehicle', row.vehiclePlate) : null;
    if (!account) return false;
    await connection.query(`
      INSERT INTO transactions (
        ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id,
        weight, cost_usd, amount_usd, cost_iqd, amount_iqd, notes,
        record_type, port_id, account_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      row.refNo,
      row.direction,
      row.transDate,
      account.id,
      row.currency,
      driver?.id ?? null,
      vehicle?.id ?? null,
      row.weight ?? null,
      row.costUSD ?? 0,
      row.amountUSD ?? 0,
      row.costIQD ?? 0,
      row.amountIQD ?? 0,
      row.notes || null,
      row.recordType || 'فاتورة',
      'port-2',
      'تاجر',
    ]);
    counters.port2++;
    return true;
  }

  if (spec.kind === 'transport') {
    const carrierAccount = await findOrCreateAccount(connection, state, row.carrierName, { sectionKey: 'transport-1', accountType: 'نقل' });
    const traderAccount = row.traderName
      ? await findOrCreateAccount(connection, state, row.traderName, { sectionKey: 'port-3', accountType: 'تاجر' })
      : null;
    const governorate = row.governorate ? await findOrCreateLookupEntity(connection, state.governorates, 'governorate', row.governorate) : null;
    if (!carrierAccount) return false;
    await connection.query(`
      INSERT INTO transactions (
        ref_no, direction, trans_date, account_id, currency, amount_usd, amount_iqd, car_qty, gov_id,
        notes, carrier_id, trans_price, record_type, port_id, account_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
    `, [
      row.refNo,
      row.direction,
      row.transDate,
      carrierAccount.id,
      row.currency,
      row.amountUSD ?? 0,
      row.amountIQD ?? 0,
      row.carQty ?? null,
      governorate?.id ?? null,
      row.notes || null,
      traderAccount?.id ?? null,
      row.recordType || 'فاتورة',
      'transport-1',
      'نقل',
    ]);
    counters.transport++;
    return true;
  }

  return false;
}

async function writeAuditLog(connection, summary) {
  await connection.query(`
    INSERT INTO audit_logs (entity_type, action, summary, after_data, metadata, username)
    VALUES ('import', 'create', ?, ?, ?, 'system-import')
  `, [
    'Workbook operational sync',
    JSON.stringify(summary),
    JSON.stringify({ source: 'sync-real-workbook-operational' }),
  ]);
}

async function main() {
  const applyMode = hasFlag('--apply');
  const workbookPath = resolveWorkbookPath();
  const workbook = XLSX.readFile(workbookPath, { raw: false });
  const connection = await mysql.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));

  try {
    const dbContext = await loadDatabaseContext(connection);
    const sheetData = {
      qaim: mapQaimRows(loadSheetRows(workbook, 'القائم - حركات')),
      mnz: mapMnzRows(loadSheetRows(workbook, 'المنذرية - حركات')),
      transport: mapTransportRows(loadSheetRows(workbook, 'النقل الداخلي')),
    };

    const sectionPlans = SECTION_SPECS.map((spec) => ({
      ...spec,
      ...summarizeSectionRows(spec, sheetData[spec.id], dbContext),
    }));

    const dryRunReport = {
      workbookPath,
      sections: sectionPlans.map((plan) => ({
        id: plan.id,
        sectionKey: plan.sectionKey,
        sheetName: plan.sheetName,
        totalRows: plan.totalRows,
        readyRows: plan.readyRows,
        duplicateRows: plan.duplicateRows,
        blockedRows: plan.blockedRows,
        firstReadyRows: plan.decisions.filter((row) => row.status === 'ready').slice(0, 10),
        firstBlockedRows: plan.decisions.filter((row) => row.status === 'blocked').slice(0, 10),
      })),
    };

    const dryRunReportPath = saveReport('real-workbook-operational-dry-run', dryRunReport);
    console.log(`Workbook: ${workbookPath}`);
    for (const plan of sectionPlans) {
      console.log(`${plan.sectionKey}: total=${plan.totalRows}, ready=${plan.readyRows}, duplicate=${plan.duplicateRows}, blocked=${plan.blockedRows}`);
    }
    console.log(`Dry-run report: ${dryRunReportPath}`);

    if (!applyMode) return;

    const totalReady = sectionPlans.reduce((sum, plan) => sum + plan.readyRows, 0);
    if (totalReady === 0) {
      const backupPath = await createDatabaseBackup(connection, workbookPath);
      const applyReportPath = saveReport('real-workbook-operational-apply', {
        workbookPath,
        backupPath,
        importedRows: 0,
        message: 'No new operational rows to import.',
        sections: sectionPlans.map((plan) => ({
          sectionKey: plan.sectionKey,
          readyRows: plan.readyRows,
          duplicateRows: plan.duplicateRows,
          blockedRows: plan.blockedRows,
        })),
      });
      await writeAuditLog(connection, { workbookPath, importedRows: 0, sections: sectionPlans.map((plan) => ({ sectionKey: plan.sectionKey, importedRows: 0 })) });
      console.log(`Backup saved to: ${backupPath}`);
      console.log(`Apply report saved to: ${applyReportPath}`);
      console.log('Imported rows: 0');
      return;
    }

    const backupPath = await createDatabaseBackup(connection, workbookPath);
    const state = createSectionState(dbContext);
    const counters = { port2: 0, port3: 0, transport: 0 };
    const existingRefs = new Map(SECTION_SPECS.map((spec) => [spec.sectionKey, getExistingRefSet(dbContext, spec.sectionKey)]));
    const existingFingerprints = new Map(SECTION_SPECS.map((spec) => [spec.sectionKey, getExistingFingerprintSet(dbContext, spec.sectionKey)]));
    const importedPreview = [];

    await connection.beginTransaction();
    try {
      for (const plan of sectionPlans) {
        for (const row of plan.decisions.filter((entry) => entry.status === 'ready')) {
          const sectionRefSet = existingRefs.get(plan.sectionKey);
          const sectionFingerprintSet = existingFingerprints.get(plan.sectionKey);
          if (sectionRefSet.has(row.refNo)) continue;
          const fingerprint = buildTransactionFingerprint({ ...row, sectionKey: plan.sectionKey });
          if (sectionFingerprintSet.has(fingerprint)) continue;

          const inserted = await insertSectionRow(connection, state, plan, row, counters);
          if (!inserted) continue;
          sectionRefSet.add(row.refNo);
          sectionFingerprintSet.add(fingerprint);
          if (importedPreview.length < 30) {
            importedPreview.push({
              sectionKey: plan.sectionKey,
              refNo: row.refNo,
              transDate: row.transDate,
              recordType: row.recordType,
            });
          }
        }
      }

      const summary = {
        workbookPath,
        backupPath,
        importedRows: counters.port2 + counters.port3 + counters.transport,
        sections: [
          { sectionKey: 'port-2', importedRows: counters.port2 },
          { sectionKey: 'port-3', importedRows: counters.port3 },
          { sectionKey: 'transport-1', importedRows: counters.transport },
        ],
        preview: importedPreview,
      };

      await writeAuditLog(connection, summary);
      await connection.commit();

      const applyReportPath = saveReport('real-workbook-operational-apply', {
        ...summary,
        sectionsDetail: sectionPlans.map((plan) => ({
          sectionKey: plan.sectionKey,
          readyRows: plan.readyRows,
          duplicateRows: plan.duplicateRows,
          blockedRows: plan.blockedRows,
        })),
      });

      console.log(`Backup saved to: ${backupPath}`);
      console.log(`Apply report saved to: ${applyReportPath}`);
      console.log(`Imported rows: ${summary.importedRows}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Operational workbook sync failed: ${error.message}`);
  process.exit(1);
});
