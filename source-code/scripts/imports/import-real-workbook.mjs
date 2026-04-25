import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import XLSX from "xlsx";
import { buildMySqlConnectionOptions } from "../shared/scriptMysqlConfig.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATABASE_DIR = path.join(REPO_ROOT, "database");
const REPORT_DIR = path.join(DATABASE_DIR, "import-reports");
const BACKUP_DIR = path.join(DATABASE_DIR, "backups");

const SECTION_KEY = "port-1";
const WORKBOOK_SHEET = "جميع الحركات";
const GOV_SHEET = "جدول المحافظات";
const ACCOUNT_TYPE_FALLBACK = "تاجر";
const CUSTOM_CLEARANCE_FIELD_KEY = "ksa_clearance";
const CLEARANCE_FIELD_LABEL = "التخليص";

function getArgValue(flagName) {
  const exact = process.argv.find(arg => arg.startsWith(`${flagName}=`));
  if (exact) return exact.slice(flagName.length + 1);
  const index = process.argv.indexOf(flagName);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return null;
}

function hasFlag(flagName) {
  return process.argv.includes(flagName);
}

function normalizeSpaces(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLookupKey(value) {
  return normalizeSpaces(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[()\-_/\\.,]/g, " ")
    .replace(/[ً-ٟ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function simplifyAccountLookupKey(value) {
  const withoutParenthetical = normalizeSpaces(value).replace(
    /\([^)]*\)/g,
    " "
  );
  const normalized = normalizeLookupKey(withoutParenthetical);
  const filtered = normalized
    .split(" ")
    .filter(
      token =>
        token && !["شركه", "قديم", "جديد", "دولار", "دينار"].includes(token)
    );
  return filtered.join(" ").trim();
}

function parseArabicNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWorkbookDate(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && value > 30000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString().slice(0, 10);
  }

  const text = normalizeSpaces(value);
  const match = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function isMeaningfulTransactionRow(row) {
  return Boolean(
    row.traderName ||
      row.driverName ||
      row.vehiclePlate ||
      row.goodType ||
      row.transDate ||
      row.amountUSD ||
      row.amountIQD ||
      row.costUSD ||
      row.costIQD ||
      row.transPrice ||
      row.clearance ||
      row.recordType ||
      row.notes
  );
}

function normalizeRecordType(value) {
  const text = normalizeSpaces(value);
  if (!text) return "فاتورة";
  return text;
}

function inferDirection(recordType) {
  const text = normalizeLookupKey(recordType);
  if (!text) return "IN";
  const paymentHints = ["تسديد", "سند", "صرف", "استلام", "قبض"];
  return paymentHints.some(hint => text.includes(normalizeLookupKey(hint)))
    ? "OUT"
    : "IN";
}

function inferCurrency(row) {
  const hasUsd = [row.costUSD, row.amountUSD, row.feeUSD].some(
    value => Number(value || 0) !== 0
  );
  const hasIqd = [
    row.costIQD,
    row.amountIQD,
    row.transPrice,
    row.clearance,
  ].some(value => Number(value || 0) !== 0);
  if (hasUsd && hasIqd) return "BOTH";
  if (hasIqd) return "IQD";
  if (hasUsd) return "USD";
  return "USD";
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resolveWorkbookPath() {
  const explicit = getArgValue("--file") || process.env.WORKBOOK_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const downloadsDir = path.join(os.homedir(), "Downloads");
  if (!fs.existsSync(downloadsDir)) {
    throw new Error(
      "Downloads directory not found and no workbook path was provided"
    );
  }

  const candidates = fs
    .readdirSync(downloadsDir)
    .filter(
      name =>
        name.toLowerCase().endsWith(".xlsx") &&
        normalizeLookupKey(name).includes(
          normalizeLookupKey("قاعدة بيانات طي الرواي")
        )
    )
    .map(name => {
      const fullPath = path.join(downloadsDir, name);
      const stats = fs.statSync(fullPath);
      return { name, fullPath, mtime: stats.mtimeMs };
    })
    .sort((left, right) => right.mtime - left.mtime);

  if (candidates.length === 0) {
    throw new Error(
      "Workbook not found in Downloads. Use --file with the real Excel path."
    );
  }

  return candidates[0].fullPath;
}

function loadSheetRows(workbook, sheetName) {
  const matchedSheetName =
    workbook.SheetNames.find(
      name => normalizeLookupKey(name) === normalizeLookupKey(sheetName)
    ) ||
    workbook.SheetNames.find(name =>
      normalizeLookupKey(name).includes(normalizeLookupKey(sheetName))
    );
  const worksheet = matchedSheetName ? workbook.Sheets[matchedSheetName] : null;
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: false,
  });
}

function findHeaderIndex(rows, requiredHeaders) {
  return rows.findIndex(row => {
    const normalizedRow = (row || []).map(cell => normalizeLookupKey(cell));
    return requiredHeaders.every(header =>
      normalizedRow.includes(normalizeLookupKey(header))
    );
  });
}

function mapTransactionSheet(rows) {
  const headerIndex = findHeaderIndex(rows, [
    "اسم التاجر",
    "نوع الحركة",
    "التاريخ",
  ]);
  if (headerIndex < 0) {
    throw new Error(`Could not find header row in sheet "${WORKBOOK_SHEET}"`);
  }

  const headers = rows[headerIndex].map(cell => normalizeLookupKey(cell));
  const getCell = (row, headerName) => {
    const index = headers.indexOf(normalizeLookupKey(headerName));
    return index >= 0 ? row[index] : null;
  };

  return rows
    .slice(headerIndex + 1)
    .map((row, rowOffset) => ({
      sourceRowNumber: headerIndex + rowOffset + 2,
      traderName: normalizeSpaces(getCell(row, "اسم التاجر")),
      sequenceNo: normalizeSpaces(getCell(row, "ت")),
      driverName: normalizeSpaces(getCell(row, "اسم السائق")),
      vehiclePlate: normalizeSpaces(getCell(row, "رقم السيارة")),
      goodType: normalizeSpaces(getCell(row, "نوع البضاعة")),
      transDate: parseWorkbookDate(getCell(row, "التاريخ")),
      weight:
        parseArabicNumber(getCell(row, "الوزن (كغ)")) ??
        parseArabicNumber(getCell(row, "الوزن")),
      meters: parseArabicNumber(getCell(row, "الامتار")),
      costUSD: parseArabicNumber(getCell(row, "الكلفة $")),
      amountUSD: parseArabicNumber(getCell(row, "المبلغ $")),
      costIQD: parseArabicNumber(getCell(row, "الكلفة دينار")),
      amountIQD: parseArabicNumber(getCell(row, "المبلغ دينار")),
      feeUSD: parseArabicNumber(getCell(row, "نقل سعودي $")),
      transPrice: parseArabicNumber(getCell(row, "نقل عراقي (دينار)")),
      governorate: normalizeSpaces(getCell(row, "المحافظة")),
      clearance: parseArabicNumber(getCell(row, "التخليص")),
      recordType: normalizeRecordType(getCell(row, "نوع الحركة")),
      notes: normalizeSpaces(getCell(row, "الملاحظات")),
    }))
    .filter(isMeaningfulTransactionRow)
    .map(row => ({
      ...row,
      direction: inferDirection(row.recordType),
      currency: inferCurrency(row),
    }));
}

function mapGovernorateSheet(rows) {
  const governorateHeader = normalizeLookupKey("المحافظة");
  const transportHeader = normalizeLookupKey("أجر النقل");
  const headerIndex = rows.findIndex(row => {
    const normalizedRow = (row || []).map(cell => normalizeLookupKey(cell));
    return (
      normalizedRow.includes(governorateHeader) &&
      normalizedRow.some(cell => cell.includes(transportHeader))
    );
  });
  if (headerIndex < 0) return [];

  const headers = (rows[headerIndex] || []).map(cell =>
    normalizeLookupKey(cell)
  );
  const governorateIndex = headers.findIndex(
    cell => cell === governorateHeader
  );
  const transportIndex = headers.findIndex(cell =>
    cell.includes(transportHeader)
  );

  return rows
    .slice(headerIndex + 1)
    .map((row, rowOffset) => ({
      sourceRowNumber: headerIndex + rowOffset + 2,
      governorate: normalizeSpaces(row[governorateIndex]),
      transPrice: parseArabicNumber(row[transportIndex]),
    }))
    .filter(row => row.governorate);
}

function addLookupEntry(map, rawName, value) {
  const key = normalizeLookupKey(rawName);
  if (!key || map.has(key)) return;
  map.set(key, value);
}

function createLookupMaps(rows, aliases = []) {
  const byName = new Map();
  for (const row of rows) {
    addLookupEntry(byName, row.name, row);
  }
  for (const alias of aliases) {
    const entity = rows.find(row => row.id === alias.entityId);
    if (!entity) continue;
    addLookupEntry(byName, alias.aliasName, entity);
  }
  return byName;
}

function createAccountLookupMap(rows, aliases = []) {
  const map = new Map();

  const addAccountEntry = (rawName, entity) => {
    addLookupEntry(map, rawName, entity);
    const simplified = simplifyAccountLookupKey(rawName);
    if (simplified && !map.has(simplified)) {
      map.set(simplified, entity);
    }
  };

  for (const row of rows) {
    addAccountEntry(row.name, row);
  }
  for (const alias of aliases) {
    const entity = rows.find(row => row.id === alias.entityId);
    if (!entity) continue;
    addAccountEntry(alias.aliasName, entity);
  }

  return map;
}

function buildTransactionFingerprint(row) {
  return [
    row.accountId || 0,
    row.transDate || "",
    String(row.direction || "")
      .trim()
      .toUpperCase(),
    normalizeLookupKey(row.recordType || ""),
    Number(row.costUSD || 0).toFixed(2),
    Number(row.amountUSD || 0).toFixed(2),
    Number(row.costIQD || 0).toFixed(0),
    Number(row.amountIQD || 0).toFixed(0),
    normalizeLookupKey(row.driverName || ""),
    normalizeLookupKey(row.vehiclePlate || ""),
    normalizeLookupKey(row.goodType || ""),
  ].join("|");
}

function summarizeCounts(items, keyBuilder) {
  return items.reduce((acc, item) => {
    const key = keyBuilder(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildTimestampStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function loadDatabaseContext(connection) {
  const [
    [accounts],
    [drivers],
    [vehicles],
    [goods],
    [governorates],
    [aliases],
    [existingTransactions],
  ] = await Promise.all([
    connection.query(
      "SELECT id, name, accountType, portId FROM accounts WHERE portId = ? ORDER BY name",
      [SECTION_KEY]
    ),
    connection.query("SELECT id, name FROM drivers ORDER BY name"),
    connection.query(
      "SELECT id, plateNumber FROM vehicles ORDER BY plateNumber"
    ),
    connection.query("SELECT id, name FROM goods_types ORDER BY name"),
    connection.query(
      "SELECT id, name, trance_price FROM governorates ORDER BY name"
    ),
    connection.query(`
      SELECT entity_type AS entityType, entity_id AS entityId, alias_name AS aliasName
      FROM entity_aliases
      WHERE entity_type IN ('account', 'driver', 'vehicle', 'good_type', 'governorate')
    `),
    connection.query(
      `
      SELECT
        t.id,
        t.account_id AS accountId,
        t.trans_date AS transDate,
        t.direction,
        t.record_type AS recordType,
        t.cost_usd AS costUSD,
        t.amount_usd AS amountUSD,
        t.cost_iqd AS costIQD,
        t.amount_iqd AS amountIQD,
        d.name AS driverName,
        v.plateNumber AS vehiclePlate,
        g.name AS goodType
      FROM transactions t
      LEFT JOIN drivers d ON d.id = t.driver_id
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN goods_types g ON g.id = t.good_type_id
      WHERE t.port_id = ?
    `,
      [SECTION_KEY]
    ),
  ]);

  const portAccounts = accounts.map(row => ({
    id: row.id,
    name: row.name,
    accountType: row.accountType || ACCOUNT_TYPE_FALLBACK,
  }));
  const portAccountIds = new Set(portAccounts.map(row => row.id));

  return {
    accounts: portAccounts,
    drivers: drivers.map(row => ({ id: row.id, name: row.name })),
    vehicles: vehicles.map(row => ({ id: row.id, name: row.plateNumber })),
    goods: goods.map(row => ({ id: row.id, name: row.name })),
    governorates: governorates.map(row => ({
      id: row.id,
      name: row.name,
      trancePrice: row.trance_price,
    })),
    accountAliases: aliases.filter(
      row => row.entityType === "account" && portAccountIds.has(row.entityId)
    ),
    driverAliases: aliases.filter(row => row.entityType === "driver"),
    vehicleAliases: aliases.filter(row => row.entityType === "vehicle"),
    goodAliases: aliases.filter(row => row.entityType === "good_type"),
    governorateAliases: aliases.filter(row => row.entityType === "governorate"),
    existingTransactions,
  };
}

function prepareGovernoratePriceDiffs(workbookGovRows, dbGovernorates) {
  const dbMap = new Map(
    dbGovernorates.map(row => [normalizeLookupKey(row.name), row])
  );
  return workbookGovRows
    .map(row => {
      const dbRow = dbMap.get(normalizeLookupKey(row.governorate));
      return {
        governorate: row.governorate,
        workbookTransPrice: row.transPrice,
        dbTransPrice:
          dbRow?.trancePrice !== undefined && dbRow?.trancePrice !== null
            ? Number(dbRow.trancePrice)
            : null,
        status: !dbRow
          ? "missing-governorate"
          : Number(dbRow.trancePrice || 0) === Number(row.transPrice || 0)
            ? "match"
            : "different",
      };
    })
    .filter(row => row.status !== "match");
}

function buildImportPlan(
  workbookPath,
  transactionsRows,
  governorateRows,
  dbContext
) {
  const accountMap = createAccountLookupMap(
    dbContext.accounts,
    dbContext.accountAliases
  );
  const driverMap = createLookupMaps(
    dbContext.drivers,
    dbContext.driverAliases
  );
  const vehicleMap = createLookupMaps(
    dbContext.vehicles,
    dbContext.vehicleAliases
  );
  const goodMap = createLookupMaps(dbContext.goods, dbContext.goodAliases);
  const govMap = createLookupMaps(
    dbContext.governorates,
    dbContext.governorateAliases
  );

  const existingFingerprints = new Set(
    dbContext.existingTransactions.map(row => buildTransactionFingerprint(row))
  );

  const unresolvedAccounts = new Map();
  const newDrivers = new Map();
  const newVehicles = new Map();
  const newGoods = new Map();
  const newGovernorates = new Map();

  let readyRows = 0;
  let duplicateRows = 0;
  let blockedRows = 0;
  let rowsWithTransPrice = 0;
  let rowsWithClearance = 0;
  const blockedReasons = {};

  const rowDecisions = transactionsRows.map(row => {
    const account =
      accountMap.get(normalizeLookupKey(row.traderName)) ||
      accountMap.get(simplifyAccountLookupKey(row.traderName));
    const driver = driverMap.get(normalizeLookupKey(row.driverName));
    const vehicle = vehicleMap.get(normalizeLookupKey(row.vehiclePlate));
    const good = goodMap.get(normalizeLookupKey(row.goodType));
    const governorate = govMap.get(normalizeLookupKey(row.governorate));

    if (!account)
      unresolvedAccounts.set(
        row.traderName,
        (unresolvedAccounts.get(row.traderName) || 0) + 1
      );
    if (row.driverName && !driver)
      newDrivers.set(row.driverName, (newDrivers.get(row.driverName) || 0) + 1);
    if (row.vehiclePlate && !vehicle)
      newVehicles.set(
        row.vehiclePlate,
        (newVehicles.get(row.vehiclePlate) || 0) + 1
      );
    if (row.goodType && !good)
      newGoods.set(row.goodType, (newGoods.get(row.goodType) || 0) + 1);
    if (row.governorate && !governorate)
      newGovernorates.set(
        row.governorate,
        (newGovernorates.get(row.governorate) || 0) + 1
      );

    if (Number(row.transPrice || 0) !== 0) rowsWithTransPrice++;
    if (Number(row.clearance || 0) !== 0) rowsWithClearance++;

    const prepared = {
      ...row,
      accountId: account?.id ?? null,
      accountType: account?.accountType ?? ACCOUNT_TYPE_FALLBACK,
      driverId: driver?.id ?? null,
      vehicleId: vehicle?.id ?? null,
      goodTypeId: good?.id ?? null,
      govId: governorate?.id ?? null,
    };

    if (!prepared.accountId || !prepared.transDate) {
      blockedRows++;
      const reason = !prepared.accountId ? "missing-account" : "missing-date";
      blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;
      return {
        ...prepared,
        status: "blocked",
        reason,
      };
    }

    const fingerprint = buildTransactionFingerprint(prepared);
    if (existingFingerprints.has(fingerprint)) {
      duplicateRows++;
      return {
        ...prepared,
        status: "duplicate",
        reason: "already-exists",
      };
    }

    readyRows++;
    return {
      ...prepared,
      status: "ready",
      reason: "importable",
    };
  });

  const report = {
    workbook: {
      path: workbookPath,
      sheet: WORKBOOK_SHEET,
      governorateSheet: GOV_SHEET,
    },
    summary: {
      totalTransactionRows: transactionsRows.length,
      readyRows,
      duplicateRows,
      blockedRows,
      distinctTraders: new Set(
        transactionsRows.map(row => row.traderName).filter(Boolean)
      ).size,
      rowsWithTransPrice,
      rowsWithClearance,
    },
    distribution: {
      recordTypes: summarizeCounts(
        transactionsRows,
        row => row.recordType || "بدون نوع"
      ),
      directions: summarizeCounts(transactionsRows, row => row.direction),
      currencies: summarizeCounts(transactionsRows, row => row.currency),
      blockedReasons,
    },
    blockingIssues: {
      unresolvedAccounts: Array.from(unresolvedAccounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count),
    },
    nonBlockingCreates: {
      drivers: Array.from(newDrivers.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count),
      vehicles: Array.from(newVehicles.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count),
      goodsTypes: Array.from(newGoods.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count),
      governorates: Array.from(newGovernorates.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count),
    },
    workbookGovernorates: {
      totalRows: governorateRows.length,
      differences: prepareGovernoratePriceDiffs(
        governorateRows,
        dbContext.governorates
      ),
    },
    systemReadiness: {
      sectionKey: SECTION_KEY,
      notes: [
        rowsWithTransPrice > 0
          ? "حقل نقل عراقي (دينار) سيُحفظ في transactions.transPrice ويظهر افتراضيًا في شاشات منفذ السعودية."
          : "لا توجد قيم نقل عراقي في هذا الملف.",
        rowsWithClearance > 0
          ? `حقل التخليص يحتاج حفظًا منظّمًا. الأنسب حفظه كحقل مخصص transaction (${CUSTOM_CLEARANCE_FIELD_KEY}) بدل رميه داخل الملاحظات.`
          : "لا توجد قيم تخليص في هذا الملف.",
      ],
    },
    samples: {
      firstReadyRows: rowDecisions
        .filter(row => row.status === "ready")
        .slice(0, 5),
      firstDuplicateRows: rowDecisions
        .filter(row => row.status === "duplicate")
        .slice(0, 5),
      firstBlockedRows: rowDecisions
        .filter(row => row.status === "blocked")
        .slice(0, 5),
    },
  };

  return { report, rowDecisions };
}

function saveReport(prefix, report) {
  ensureDir(REPORT_DIR);
  const outputPath = path.join(
    REPORT_DIR,
    `${prefix}-${buildTimestampStamp()}.json`
  );
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  return outputPath;
}

async function createDatabaseBackup(connection, workbookPath) {
  ensureDir(BACKUP_DIR);
  const [tables] = await connection.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      source: "import-real-workbook",
      workbookPath,
      database: process.env.DATABASE_URL || null,
      tableCount: tables.length,
    },
    data: {},
  };

  for (const table of tables) {
    const tableName = table.table_name;
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    snapshot.data[tableName] = rows;
  }

  const outputPath = path.join(
    BACKUP_DIR,
    `pre-real-workbook-import-${buildTimestampStamp()}.json`
  );
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf8");
  return outputPath;
}

async function ensureEntityAlias(
  connection,
  entityType,
  entityId,
  aliasName,
  sourceSystem = "real-workbook"
) {
  const normalizedAlias = normalizeSpaces(aliasName);
  if (!normalizedAlias) return;
  await connection.query(
    `
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id), source_system = VALUES(source_system)
  `,
    [entityType, entityId, normalizedAlias, sourceSystem]
  );
}

async function ensureCustomFieldConfig(connection, sectionKey, fieldKey) {
  const [existing] = await connection.query(
    `
    SELECT id
    FROM field_config
    WHERE section_key = ? AND field_key = ?
    LIMIT 1
  `,
    [sectionKey, fieldKey]
  );

  if (existing.length > 0) {
    await connection.query(
      `
      UPDATE field_config
      SET visible = 1, display_label = COALESCE(display_label, ?)
      WHERE id = ?
    `,
      [CLEARANCE_FIELD_LABEL, existing[0].id]
    );
    return;
  }

  const [maxOrderRows] = await connection.query(
    `
    SELECT COALESCE(MAX(sort_order), 0) AS maxOrder
    FROM field_config
    WHERE section_key = ?
  `,
    [sectionKey]
  );
  const nextOrder = Math.max(Number(maxOrderRows[0]?.maxOrder || 0) + 1, 900);

  await connection.query(
    `
    INSERT INTO field_config (section_key, field_key, visible, sort_order, display_label)
    VALUES (?, ?, 1, ?, ?)
  `,
    [sectionKey, fieldKey, nextOrder, CLEARANCE_FIELD_LABEL]
  );
}

async function ensureClearanceCustomField(connection) {
  const [existing] = await connection.query(
    `
    SELECT id, field_key AS fieldKey
    FROM custom_fields
    WHERE field_key = ?
    LIMIT 1
  `,
    [CUSTOM_CLEARANCE_FIELD_KEY]
  );

  let fieldId = existing[0]?.id;
  if (!fieldId) {
    const [result] = await connection.query(
      `
      INSERT INTO custom_fields (field_key, label, field_type, placement)
      VALUES (?, ?, 'money', 'transaction')
    `,
      [CUSTOM_CLEARANCE_FIELD_KEY, CLEARANCE_FIELD_LABEL]
    );
    fieldId = Number(result.insertId);
  }

  for (const sectionKey of [
    `${SECTION_KEY}::list`,
    `${SECTION_KEY}::statement`,
    `${SECTION_KEY}::invoice`,
  ]) {
    await ensureCustomFieldConfig(
      connection,
      sectionKey,
      CUSTOM_CLEARANCE_FIELD_KEY
    );
  }

  return fieldId;
}

function createMutableLookupState(dbContext) {
  return {
    accounts: {
      items: [...dbContext.accounts],
      map: createAccountLookupMap(dbContext.accounts, dbContext.accountAliases),
    },
    drivers: {
      items: [...dbContext.drivers],
      map: createLookupMaps(dbContext.drivers, dbContext.driverAliases),
    },
    vehicles: {
      items: [...dbContext.vehicles],
      map: createLookupMaps(dbContext.vehicles, dbContext.vehicleAliases),
    },
    goods: {
      items: [...dbContext.goods],
      map: createLookupMaps(dbContext.goods, dbContext.goodAliases),
    },
    governorates: {
      items: [...dbContext.governorates],
      map: createLookupMaps(
        dbContext.governorates,
        dbContext.governorateAliases
      ),
    },
  };
}

async function findOrCreateLookupEntity(
  connection,
  state,
  entityType,
  rawName,
  extra = {}
) {
  const normalizedName = normalizeSpaces(rawName);
  if (!normalizedName) return null;

  const existing = state.map.get(normalizeLookupKey(normalizedName));
  if (existing) {
    await ensureEntityAlias(
      connection,
      entityType,
      existing.id,
      normalizedName
    );
    return existing;
  }

  let result;
  if (entityType === "driver") {
    [result] = await connection.query("INSERT INTO drivers (name) VALUES (?)", [
      normalizedName,
    ]);
  } else if (entityType === "vehicle") {
    [result] = await connection.query(
      "INSERT INTO vehicles (plateNumber) VALUES (?)",
      [normalizedName]
    );
  } else if (entityType === "good_type") {
    [result] = await connection.query(
      "INSERT INTO goods_types (name) VALUES (?)",
      [normalizedName]
    );
  } else if (entityType === "governorate") {
    [result] = await connection.query(
      "INSERT INTO governorates (name, trance_price) VALUES (?, ?)",
      [normalizedName, extra.transPrice ?? null]
    );
  } else {
    throw new Error(`Unsupported lookup entity type: ${entityType}`);
  }

  const entity = {
    id: Number(result.insertId),
    name: normalizedName,
    ...(entityType === "governorate"
      ? { trancePrice: extra.transPrice ?? null }
      : {}),
  };
  state.items.push(entity);
  addLookupEntry(state.map, normalizedName, entity);
  await ensureEntityAlias(connection, entityType, entity.id, normalizedName);
  return entity;
}

async function upsertRouteDefault(connection, govId, transPrice) {
  if (!govId || transPrice === null || transPrice === undefined) return;
  await connection.query(
    `
    INSERT INTO route_defaults (section_key, gov_id, currency, default_trans_price, notes, active)
    VALUES (?, ?, 'IQD', ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      default_trans_price = VALUES(default_trans_price),
      notes = VALUES(notes),
      active = VALUES(active)
  `,
    [
      SECTION_KEY,
      govId,
      transPrice,
      "Imported from real workbook governorate sheet",
    ]
  );
}

async function syncGovernorateDefaultsFromWorkbook(
  connection,
  governorateRows,
  lookupState
) {
  let synced = 0;
  for (const row of governorateRows) {
    const governorate = await findOrCreateLookupEntity(
      connection,
      lookupState.governorates,
      "governorate",
      row.governorate,
      {
        transPrice: row.transPrice,
      }
    );
    if (!governorate) continue;
    await ensureEntityAlias(
      connection,
      "governorate",
      governorate.id,
      row.governorate
    );
    await upsertRouteDefault(connection, governorate.id, row.transPrice);
    synced++;
  }
  return synced;
}

async function getNextPortRefNumber(connection) {
  const [rows] = await connection.query(
    `
    SELECT MAX(CAST(SUBSTRING(ref_no, 5) AS UNSIGNED)) AS maxRef
    FROM transactions
    WHERE port_id = ? AND ref_no LIKE 'KSA-%'
  `,
    [SECTION_KEY]
  );
  return Number(rows[0]?.maxRef || 0) + 1;
}

async function writeImportAuditLog(connection, afterData) {
  await connection.query(
    `
    INSERT INTO audit_logs (entity_type, action, summary, after_data, metadata, username)
    VALUES ('import', 'create', ?, ?, ?, 'system-import')
  `,
    [
      `Workbook import ${SECTION_KEY}`,
      JSON.stringify(afterData),
      JSON.stringify({
        source: "import-real-workbook",
        sectionKey: SECTION_KEY,
      }),
    ]
  );
}

async function applyImportPlan(connection, plan, governorateRows) {
  const lookupState = createMutableLookupState(plan.dbContext);
  const readyRows = plan.rowDecisions.filter(row => row.status === "ready");
  const blockedRows = plan.rowDecisions.filter(row => row.status === "blocked");
  const duplicateRows = plan.rowDecisions.filter(
    row => row.status === "duplicate"
  );

  const backupPath = await createDatabaseBackup(connection, plan.workbookPath);
  const clearanceFieldId = await ensureClearanceCustomField(connection);

  await connection.beginTransaction();
  try {
    const governorateDefaultsSynced = await syncGovernorateDefaultsFromWorkbook(
      connection,
      governorateRows,
      lookupState
    );
    let refCounter = await getNextPortRefNumber(connection);

    let insertedTransactions = 0;
    let insertedCustomValues = 0;
    let createdDrivers = 0;
    let createdVehicles = 0;
    let createdGoodsTypes = 0;
    let createdGovernorates = 0;

    const insertedIds = [];
    const seenFingerprints = new Set(
      plan.dbContext.existingTransactions.map(row =>
        buildTransactionFingerprint(row)
      )
    );

    for (const row of readyRows) {
      const account =
        lookupState.accounts.map.get(normalizeLookupKey(row.traderName)) ||
        lookupState.accounts.map.get(simplifyAccountLookupKey(row.traderName));
      if (!account?.id) continue;

      await ensureEntityAlias(
        connection,
        "account",
        account.id,
        row.traderName
      );

      let driver = null;
      if (row.driverName) {
        const existingDriver = lookupState.drivers.map.get(
          normalizeLookupKey(row.driverName)
        );
        driver =
          existingDriver ||
          (await findOrCreateLookupEntity(
            connection,
            lookupState.drivers,
            "driver",
            row.driverName
          ));
        if (!existingDriver && driver) createdDrivers++;
      }

      let vehicle = null;
      if (row.vehiclePlate) {
        const existingVehicle = lookupState.vehicles.map.get(
          normalizeLookupKey(row.vehiclePlate)
        );
        vehicle =
          existingVehicle ||
          (await findOrCreateLookupEntity(
            connection,
            lookupState.vehicles,
            "vehicle",
            row.vehiclePlate
          ));
        if (!existingVehicle && vehicle) createdVehicles++;
      }

      let good = null;
      if (row.goodType) {
        const existingGood = lookupState.goods.map.get(
          normalizeLookupKey(row.goodType)
        );
        good =
          existingGood ||
          (await findOrCreateLookupEntity(
            connection,
            lookupState.goods,
            "good_type",
            row.goodType
          ));
        if (!existingGood && good) createdGoodsTypes++;
      }

      let governorate = null;
      if (row.governorate) {
        const existingGovernorate = lookupState.governorates.map.get(
          normalizeLookupKey(row.governorate)
        );
        governorate =
          existingGovernorate ||
          (await findOrCreateLookupEntity(
            connection,
            lookupState.governorates,
            "governorate",
            row.governorate,
            {
              transPrice: row.transPrice,
            }
          ));
        if (!existingGovernorate && governorate) createdGovernorates++;
        if (governorate) {
          await ensureEntityAlias(
            connection,
            "governorate",
            governorate.id,
            row.governorate
          );
        }
      }

      if (
        governorate &&
        row.transPrice !== null &&
        row.transPrice !== undefined
      ) {
        await upsertRouteDefault(connection, governorate.id, row.transPrice);
      }

      const payload = {
        accountId: account.id,
        accountType: account.accountType || ACCOUNT_TYPE_FALLBACK,
        transDate: row.transDate,
        direction: String(row.direction || "IN").toUpperCase(),
        recordType: row.recordType || "فاتورة",
        currency: row.currency || "USD",
        driverId: driver?.id ?? null,
        vehicleId: vehicle?.id ?? null,
        goodTypeId: good?.id ?? null,
        govId: governorate?.id ?? null,
        weight: row.weight ?? null,
        meters: row.meters ?? null,
        costUSD: row.costUSD ?? 0,
        amountUSD: row.amountUSD ?? 0,
        costIQD: row.costIQD ?? 0,
        amountIQD: row.amountIQD ?? 0,
        feeUSD: row.feeUSD ?? 0,
        transPrice: row.transPrice ?? null,
        notes: row.notes || null,
      };

      const fingerprint = buildTransactionFingerprint({
        ...payload,
        driverName: row.driverName,
        vehiclePlate: row.vehiclePlate,
        goodType: row.goodType,
      });
      if (seenFingerprints.has(fingerprint)) continue;
      seenFingerprints.add(fingerprint);

      const refNo = `KSA-${String(refCounter).padStart(4, "0")}`;
      refCounter++;

      const [result] = await connection.query(
        `
        INSERT INTO transactions (
          ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, good_type_id,
          weight, meters, cost_usd, amount_usd, cost_iqd, amount_iqd, fee_usd, trans_price, gov_id,
          notes, trader_note, record_type, port_id, account_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `,
        [
          refNo,
          payload.direction,
          payload.transDate,
          payload.accountId,
          payload.currency,
          payload.driverId,
          payload.vehicleId,
          payload.goodTypeId,
          payload.weight,
          payload.meters,
          payload.costUSD,
          payload.amountUSD,
          payload.costIQD,
          payload.amountIQD,
          payload.feeUSD,
          payload.transPrice,
          payload.govId,
          payload.notes,
          payload.recordType,
          SECTION_KEY,
          payload.accountType,
        ]
      );

      const transactionId = Number(result.insertId);
      insertedIds.push(transactionId);
      insertedTransactions++;

      if (
        row.clearance !== null &&
        row.clearance !== undefined &&
        Number(row.clearance) !== 0
      ) {
        await connection.query(
          `
          INSERT INTO custom_field_values (custom_field_id, entity_type, entity_id, value)
          VALUES (?, 'transaction', ?, ?)
        `,
          [clearanceFieldId, transactionId, String(row.clearance)]
        );
        insertedCustomValues++;
      }
    }

    const applySummary = {
      workbookPath: plan.workbookPath,
      backupPath,
      sectionKey: SECTION_KEY,
      importedTransactions: insertedTransactions,
      insertedCustomValues,
      skippedBlockedRows: blockedRows.length,
      skippedDuplicateRows: duplicateRows.length,
      governorateDefaultsSynced,
      createdLookups: {
        drivers: createdDrivers,
        vehicles: createdVehicles,
        goodsTypes: createdGoodsTypes,
        governorates: createdGovernorates,
      },
      clearanceFieldKey: CUSTOM_CLEARANCE_FIELD_KEY,
      insertedTransactionIdsPreview: insertedIds.slice(0, 20),
    };

    await writeImportAuditLog(connection, applySummary);
    await connection.commit();

    const applyReport = {
      ...applySummary,
      blockedRows: blockedRows.slice(0, 100),
      duplicateRows: duplicateRows.slice(0, 100),
    };
    const applyReportPath = saveReport("real-workbook-apply", applyReport);

    return {
      backupPath,
      applyReportPath,
      applySummary,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const applyMode = hasFlag("--apply");

  const workbookPath = resolveWorkbookPath();
  const workbook = XLSX.readFile(workbookPath, { raw: false });
  const transactionSheetRows = loadSheetRows(workbook, WORKBOOK_SHEET);
  const governorateSheetRows = loadSheetRows(workbook, GOV_SHEET);

  if (transactionSheetRows.length === 0) {
    throw new Error(`Sheet "${WORKBOOK_SHEET}" was not found or is empty`);
  }

  const parsedTransactions = mapTransactionSheet(transactionSheetRows);
  const parsedGovernorates = mapGovernorateSheet(governorateSheetRows);

  const connection = await mysql.createConnection(
    buildMySqlConnectionOptions(process.env.DATABASE_URL)
  );
  try {
    const dbContext = await loadDatabaseContext(connection);
    const plan = buildImportPlan(
      workbookPath,
      parsedTransactions,
      parsedGovernorates,
      dbContext
    );
    const reportPath = saveReport("real-workbook-dry-run", plan.report);

    console.log(`Workbook: ${workbookPath}`);
    console.log(
      `Rows found in "${WORKBOOK_SHEET}": ${plan.report.summary.totalTransactionRows}`
    );
    console.log(`Ready rows: ${plan.report.summary.readyRows}`);
    console.log(`Duplicate rows: ${plan.report.summary.duplicateRows}`);
    console.log(`Blocked rows: ${plan.report.summary.blockedRows}`);
    console.log(
      `Rows with Iraqi transport: ${plan.report.summary.rowsWithTransPrice}`
    );
    console.log(
      `Rows with clearance: ${plan.report.summary.rowsWithClearance}`
    );
    console.log(
      `Unresolved trader accounts: ${plan.report.blockingIssues.unresolvedAccounts.length}`
    );
    console.log(
      `Potential new drivers: ${plan.report.nonBlockingCreates.drivers.length}`
    );
    console.log(
      `Potential new vehicles: ${plan.report.nonBlockingCreates.vehicles.length}`
    );
    console.log(
      `Potential new goods types: ${plan.report.nonBlockingCreates.goodsTypes.length}`
    );
    console.log(
      `Potential new governorates: ${plan.report.nonBlockingCreates.governorates.length}`
    );
    console.log(`Report saved to: ${reportPath}`);

    if (applyMode) {
      const result = await applyImportPlan(
        connection,
        { ...plan, workbookPath, dbContext },
        parsedGovernorates
      );
      console.log(`Backup saved to: ${result.backupPath}`);
      console.log(`Apply report saved to: ${result.applyReportPath}`);
      console.log(
        `Imported transactions: ${result.applySummary.importedTransactions}`
      );
      console.log(
        `Inserted clearance values: ${result.applySummary.insertedCustomValues}`
      );
      console.log(
        `Blocked rows kept for review: ${result.applySummary.skippedBlockedRows}`
      );
      console.log(
        `Duplicate rows skipped: ${result.applySummary.skippedDuplicateRows}`
      );
    }
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(`Workbook import failed: ${error.message}`);
  process.exit(1);
});
