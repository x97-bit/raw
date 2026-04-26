import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATABASE_DIR = path.join(REPO_ROOT, "database");
const REPORT_DIR = path.join(REPO_ROOT, "database", "import-reports");
const BACKUP_DIR = path.join(DATABASE_DIR, "backups");
const DEFAULT_SOURCE_JSON = path.join(
  REPO_ROOT,
  "old db",
  "AlrawiApp_all_data (1).json"
);
const SOURCE_JSON = path.resolve(
  process.cwd(),
  arg("--source-json") || DEFAULT_SOURCE_JSON
);
const DATABASE_URL = arg("--database-url") || process.env.DATABASE_URL || "";
const APPLY = has("--apply");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const REQUIRED_DATE_FALLBACK = "2000-01-01";

const TARGET_TABLES = [
  "accounts",
  "drivers",
  "vehicles",
  "goods_types",
  "governorates",
  "transactions",
  "debts",
  "expenses",
  "special_accounts",
  "companies",
  "entity_aliases",
  "account_defaults",
  "route_defaults",
  "custom_field_values",
  "audit_logs",
];

const IMPORTED_TABLES = new Set([
  "Tbl_KSA_Triders",
  "Tbl_MNZ_Triders",
  "Tbl_QAIM_Triders",
  "Tbl_TRANS_Carriers",
  "Tbl_SHR_Accounts",
  "Tbl_Goods_Type",
  "Tbl_Goods_Type_MNZ",
  "Tbl_Goods_Type_QAIM",
  "Tbl_Tran_Goverments",
  "Tbl_KSA_Trans",
  "Tbl_MNZ_Trans",
  "Tbl_QAIM_Trans",
  "Tbl_TRANS_Trans",
  "Tbl_SHR_Trans",
  "Tbl_Depet_Basim",
  "Tbl_Depet_Haider",
  "Tbl_Depet_Luay",
  "Tbl_Depet_Luay2",
  "Tbl_Depet_Noman",
  "Tbl_SP_Yaser_Trans",
  "Tbl_Adb_Alkarem_Trans",
  "Tbl_Expenses",
  "Tbl_Expenses_MNZ",
  "Tbl_Expenses_Qaim",
  "Paste Errors",
]);

const SOURCE_TABLE_MAP = {
  Tbl_KSA_Triders: "ksaTraders",
  Tbl_MNZ_Triders: "mnzTraders",
  Tbl_QAIM_Triders: "qaimTraders",
  Tbl_TRANS_Carriers: "transportCarriers",
  Tbl_SHR_Accounts: "partnershipAccounts",
  Tbl_Goods_Type: "goodsCommon",
  Tbl_Goods_Type_MNZ: "goodsMnz",
  Tbl_Goods_Type_QAIM: "goodsQaim",
  Tbl_Tran_Goverments: "govRows",
  Tbl_KSA_Trans: "ksaTx",
  Tbl_MNZ_Trans: "mnzTx",
  Tbl_QAIM_Trans: "qaimTx",
  Tbl_TRANS_Trans: "transportTx",
  Tbl_SHR_Trans: "partnershipTx",
  Tbl_Depet_Basim: "debtBasim",
  Tbl_Depet_Haider: "debtHaider",
  Tbl_Depet_Luay: "debtLuay",
  Tbl_Depet_Luay2: "debtLuay2",
  Tbl_Depet_Noman: "debtNoman",
  Tbl_SP_Yaser_Trans: "yaserSpecial",
  Tbl_Adb_Alkarem_Trans: "adbTx",
  Tbl_Expenses: "exp1",
  Tbl_Expenses_MNZ: "exp2",
  Tbl_Expenses_Qaim: "exp3",
  "Paste Errors": "pasteErrors",
};

function arg(name) {
  const exact = process.argv.find(value => value.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || null : null;
}

function has(name) {
  return process.argv.includes(name);
}

function t(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function k(value) {
  return t(value).toLowerCase();
}

function dateOnly(value) {
  if (value === null || value === undefined) return null;

  const raw = t(value);
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    return raw;
  }

  return null;
}

function requiredDate(value, issues, context = {}) {
  const normalized = dateOnly(value);
  if (normalized) return normalized;

  issues.push({
    type: "missing_required_date_fallback",
    fallbackDate: REQUIRED_DATE_FALLBACK,
    ...context,
  });

  return REQUIRED_DATE_FALLBACK;
}

function money(value) {
  return value === null || value === undefined || t(value) === ""
    ? null
    : value;
}

function joinParts(parts) {
  const values = parts.map(t).filter(Boolean);
  return values.length ? values.join(" | ") : null;
}

function comp(portId, accountType, name) {
  return `${portId}|${accountType}|${k(name)}`;
}

function cfg(url, databaseOverride = null) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: databaseOverride || parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
  };
}

function currency(id) {
  const numeric = Number(id);
  if (numeric === 2) return "IQD";
  if (numeric === 3) return "BOTH";
  return "USD";
}

function direction(id) {
  return Number(id) === 2 ? "OUT" : "IN";
}

function recordType(id) {
  return Number(id) === 2 ? "payment" : "shipment";
}

function normalizeKey(key) {
  return String(key ?? "")
    .trim()
    .replace(/[\s/-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    return row;
  }
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeKey(key), value])
  );
}

function hasMeaningfulTransactionData(row) {
  return Boolean(
    t(row.driver_name) ||
      t(row.car_number) ||
      t(row.note) ||
      t(row.trider_note) ||
      t(row.goverment) ||
      t(row.goverment_name) ||
      t(row.company_name) ||
      Number(row.amount_usd || 0) !== 0 ||
      Number(row.amount_iqd || 0) !== 0 ||
      Number(row.cost_usd || 0) !== 0 ||
      Number(row.cost_iqd || 0) !== 0 ||
      Number(row.ksa_trance || 0) !== 0 ||
      Number(row.amount_iqd2 || 0) !== 0 ||
      Number(row.syr_cus || 0) !== 0 ||
      Number(row.trans_price || 0) !== 0 ||
      Number(row.car_qty || 0) !== 0
  );
}

function splitDestinationCompany(note) {
  const parts = t(note).split("/").map(t).filter(Boolean);
  return { destination: parts[0] || null, company: parts[1] || null };
}

function legacyFallbackAccountName(sectionKey, legacyId) {
  if (sectionKey === "port-1")
    return `حساب قديم السعودية ${legacyId || "بدون-معرف"}`;
  if (sectionKey === "port-2")
    return `حساب قديم المنذرية ${legacyId || "بدون-معرف"}`;
  if (sectionKey === "port-3")
    return `حساب قديم القائم ${legacyId || "بدون-معرف"}`;
  return `حساب قديم ${legacyId || "بدون-معرف"}`;
}

function collector() {
  const values = new Map();
  return {
    add(name, extra = {}) {
      const normalized = t(name);
      if (!normalized) return;
      const key = k(normalized);
      if (!values.has(key)) values.set(key, { name: normalized, ...extra });
    },
    list() {
      return [...values.values()];
    },
  };
}

function loadTables(parsed) {
  return Object.fromEntries(
    Object.entries(parsed).map(([name, rows]) => [
      name,
      Array.isArray(rows) ? rows.map(normalizeRow) : [],
    ])
  );
}

function getCount(rows) {
  return Array.isArray(rows) ? rows.length : 0;
}

async function countTable(conn, table) {
  const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c || 0);
}

async function snapshotTarget(conn) {
  const [tableRows] = await conn.query("SHOW TABLES");
  const names = tableRows.map(row => row[Object.keys(row)[0]]);
  const data = {};
  const counts = {};

  for (const name of names) {
    const [rows] = await conn.query(`SELECT * FROM \`${name}\``);
    data[name] = rows;
    counts[name] = rows.length;
  }

  return { data, counts };
}

async function backupTarget(conn) {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const snap = await snapshotTarget(conn);
  const backupPath = path.join(
    BACKUP_DIR,
    `pre-old-trade-json-import-${stamp}.json`
  );
  await fs.writeFile(
    backupPath,
    JSON.stringify(
      {
        meta: {
          createdAt: new Date().toISOString(),
          sourceJson: SOURCE_JSON,
        },
        counts: snap.counts,
        data: snap.data,
      },
      null,
      2
    ),
    "utf8"
  );
  return backupPath;
}

function traderNameForTransport(id, ctx) {
  return (
    ctx.ksaById.get(id)?.name ||
    ctx.mnzById.get(id)?.name ||
    ctx.qaimById.get(id)?.name ||
    null
  );
}

async function insertLookups(conn, table, rows, mapper) {
  const ids = new Map();
  for (const row of rows) {
    const [res] = await conn.query(
      `INSERT INTO \`${table}\` SET ?`,
      mapper(row)
    );
    ids.set(k(row.name), res.insertId);
  }
  return ids;
}

function buildApplyPayload(src) {
  const goods = collector();
  const govs = collector();
  const comps = collector();
  const drivers = collector();
  const vehicles = collector();
  const accountMap = new Map();
  const transactions = [];
  const debts = [];
  const expenses = [];
  const specialAccounts = [];
  const routeDefaults = [];
  const issues = [];

  const addAccount = ({
    name,
    accountType,
    portId,
    currency = null,
    merchantReport = null,
    notes = null,
  }) => {
    const normalized = t(name);
    if (!normalized) return null;
    const key = comp(portId, accountType, normalized);
    if (!accountMap.has(key)) {
      accountMap.set(key, {
        name: normalized,
        accountType: String(accountType),
        portId,
        currency,
        merchantReport,
        notes,
      });
    }
    return key;
  };

  for (const row of src.goodsCommon) goods.add(row.good_type);
  for (const row of src.goodsMnz) goods.add(row.good_type_mnz);
  for (const row of src.goodsQaim) goods.add(row.good_type_qaim);
  for (const row of src.govRows) {
    govs.add(row.tran_goverment_name, { trancePrice: row.trance_price });
    if (Number(row.trance_price || 0) !== 0) {
      routeDefaults.push({
        sectionKey: "transport-1",
        govName: t(row.tran_goverment_name),
        defaultTransPrice: row.trance_price,
      });
    }
  }

  for (const row of src.ksaTraders) {
    addAccount({
      name: row.ksa_trider_name,
      accountType: "1",
      portId: "port-1",
      currency: currency(row.currency_id),
      notes: "source:tbl_ksa_triders",
    });
  }

  for (const row of src.mnzTraders) {
    addAccount({
      name: row.mnz_trider_name,
      accountType: "1",
      portId: "port-2",
      currency: currency(row.currency_id),
      notes: "source:tbl_mnz_triders",
    });
  }

  for (const row of src.qaimTraders) {
    addAccount({
      name: row.qaim_trider_name,
      accountType: "1",
      portId: "port-3",
      currency: currency(row.currency_id),
      merchantReport: row.merchant_report || null,
      notes: "source:tbl_qaim_triders",
    });
  }

  for (const row of src.transportCarriers) {
    addAccount({
      name: row.trans_carrier_name,
      accountType: "2",
      portId: "transport-1",
      currency: currency(row.currency_id),
      notes: "source:tbl_trans_carriers",
    });
  }

  for (const row of src.partnershipAccounts) {
    addAccount({
      name: row.shr_account_name,
      accountType: "5",
      portId: "partnership-1",
      currency: currency(row.currency_id),
      notes: "source:tbl_shr_accounts",
    });
  }

  for (const id of new Set(
    src.transportTx
      .map(row => row.trider_id)
      .filter(value => value !== null && value !== undefined)
  )) {
    const name = traderNameForTransport(id, src);
    if (name) {
      addAccount({
        name,
        accountType: "2",
        portId: "transport-1",
        notes: "source:tbl_trans_trans.trider_id",
      });
    }
  }

  const addTransaction = row => {
    if (row.driverName) drivers.add(row.driverName);
    if (row.vehiclePlate) vehicles.add(row.vehiclePlate);
    if (row.goodTypeName) goods.add(row.goodTypeName);
    if (row.governorateName) govs.add(row.governorateName);
    if (row.companyName) comps.add(row.companyName);
    transactions.push(row);
  };

  for (const row of src.ksaTx) {
    let accountName = src.ksaById.get(row.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(row)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "Tbl_KSA_Trans",
        refNo: t(row.ref_no),
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-1", row.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "Tbl_KSA_Trans",
        refNo: t(row.ref_no),
        accountName,
      });
    }
    addTransaction({
      refNo: t(row.ref_no),
      sectionKey: "port-1",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-1",
      }),
      carrierKey: null,
      transDate: requiredDate(row.tran_date, issues, {
        table: "Tbl_KSA_Trans",
        refNo: t(row.ref_no),
        legacyId: row.trans_id ?? null,
      }),
      direction: direction(row.tran_type_id),
      recordType: recordType(row.tran_type_id),
      currency: currency(row.currency_id),
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodTypeName: src.goodCommonById.get(row.good_type) || null,
      governorateName: t(row.goverment),
      companyName: null,
      weight: money(row.weight),
      meters: money(row.meters),
      qty: null,
      costUsd: money(row.cost_usd),
      amountUsd: money(row.amount_usd),
      costIqd: money(row.cost_iqd),
      amountIqd: money(row.amount_iqd),
      feeUsd: money(row.ksa_trance),
      syrCus: null,
      carQty: null,
      transPrice: money(row.amount_iqd2),
      notes: t(row.note),
      traderNote: t(row.trider_note),
    });
  }

  for (const row of src.mnzTx) {
    let accountName = src.mnzById.get(row.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(row)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "Tbl_MNZ_Trans",
        refNo: t(row.ref_no_mnz),
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-2", row.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "Tbl_MNZ_Trans",
        refNo: t(row.ref_no_mnz),
        accountName,
      });
    }
    addTransaction({
      refNo: t(row.ref_no_mnz),
      sectionKey: "port-2",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-2",
      }),
      carrierKey: null,
      transDate: requiredDate(row.tran_date, issues, {
        table: "Tbl_MNZ_Trans",
        refNo: t(row.ref_no_mnz),
        legacyId: row.trans_id ?? null,
      }),
      direction: direction(row.tran_type_id),
      recordType: recordType(row.tran_type_id),
      currency: currency(row.currency_id),
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodTypeName: null,
      governorateName: null,
      companyName: null,
      weight: money(row.weight),
      meters: null,
      qty: null,
      costUsd: money(row.cost_usd),
      amountUsd: money(row.amount_usd),
      costIqd: money(row.cost_iqd),
      amountIqd: money(row.amount_iqd),
      feeUsd: null,
      syrCus: money(row.syr_cus),
      carQty: null,
      transPrice: null,
      notes: t(row.note),
      traderNote: t(row.trider_note),
    });
  }

  for (const row of src.qaimTx) {
    let accountName = src.qaimById.get(row.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(row)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "Tbl_QAIM_Trans",
        refNo: t(row.ref_no_qaim),
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-3", row.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "Tbl_QAIM_Trans",
        refNo: t(row.ref_no_qaim),
        accountName,
      });
    }
    if (t(row.company_name)) comps.add(row.company_name);
    addTransaction({
      refNo: t(row.ref_no_qaim),
      sectionKey: "port-3",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-3",
      }),
      carrierKey: null,
      transDate: requiredDate(row.tran_date, issues, {
        table: "Tbl_QAIM_Trans",
        refNo: t(row.ref_no_qaim),
        legacyId: row.trans_id ?? null,
      }),
      direction: direction(row.tran_type_id),
      recordType: recordType(row.tran_type_id),
      currency: currency(row.currency_id),
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodTypeName: src.goodQaimById.get(row.good_type_qaim) || null,
      governorateName: null,
      companyName: t(row.company_name),
      weight: money(row.weight),
      meters: null,
      qty: money(row.qty),
      costUsd: money(row.cost_usd),
      amountUsd: money(row.amount_usd),
      costIqd: money(row.cost_iqd),
      amountIqd: money(row.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: null,
      transPrice: null,
      notes: joinParts([row.note, row.note_iq]),
      traderNote: t(row.trider_note),
    });
  }

  for (const row of src.transportTx) {
    const carrierName =
      src.transportCarrierById.get(row.carrier_id)?.name || null;
    let accountName =
      traderNameForTransport(row.trider_id, src) || carrierName || null;
    if (!accountName && !hasMeaningfulTransactionData(row)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "Tbl_TRANS_Trans",
        refNo: t(row.ref_no_trans),
      });
      continue;
    }
    if (!accountName) {
      accountName = "نقل داخلي عام";
      issues.push({
        type: "transaction_account_fallback",
        table: "Tbl_TRANS_Trans",
        refNo: t(row.ref_no_trans),
        accountName,
      });
    }
    addTransaction({
      refNo: t(row.ref_no_trans),
      sectionKey: "transport-1",
      accountType: "2",
      accountKey: addAccount({
        name: accountName,
        accountType: "2",
        portId: "transport-1",
      }),
      carrierKey: carrierName
        ? addAccount({
            name: carrierName,
            accountType: "2",
            portId: "transport-1",
          })
        : null,
      transDate: requiredDate(row.tran_date, issues, {
        table: "Tbl_TRANS_Trans",
        refNo: t(row.ref_no_trans),
        legacyId: row.trans_id ?? null,
      }),
      direction: direction(row.tran_type_id),
      recordType: recordType(row.tran_type_id),
      currency: currency(row.currency_id),
      driverName: null,
      vehiclePlate: null,
      goodTypeName: src.goodCommonById.get(row.good_type) || null,
      governorateName: t(row.goverment_name),
      companyName: null,
      weight: null,
      meters: null,
      qty: null,
      costUsd: null,
      amountUsd: money(row.amount_usd),
      costIqd: null,
      amountIqd: money(row.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: money(row.car_qty),
      transPrice: money(row.trans_price),
      notes: t(row.note),
      traderNote: null,
    });
  }

  for (const row of src.partnershipTx) {
    const accountName = src.partnershipById.get(row.account_id)?.name || null;
    if (!accountName) {
      issues.push({
        type: "transaction_account_unresolved",
        table: "Tbl_SHR_Trans",
        refNo: t(row.ref_no_shr),
      });
      continue;
    }
    addTransaction({
      refNo: t(row.ref_no_shr),
      sectionKey: "partnership-1",
      accountType: "5",
      accountKey: addAccount({
        name: accountName,
        accountType: "5",
        portId: "partnership-1",
      }),
      carrierKey: null,
      transDate: requiredDate(row.tran_date, issues, {
        table: "Tbl_SHR_Trans",
        refNo: t(row.ref_no_shr),
        legacyId: row.trans_id ?? null,
      }),
      direction: direction(row.tran_type_id),
      recordType: recordType(row.tran_type_id),
      currency: currency(row.currency_id),
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodTypeName: null,
      governorateName: null,
      companyName: null,
      weight: null,
      meters: null,
      qty: null,
      costUsd: null,
      amountUsd: money(row.amount_usd),
      costIqd: null,
      amountIqd: money(row.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: null,
      transPrice: null,
      notes: t(row.note),
      traderNote: null,
    });
  }

  const pushDebt = row => {
    debts.push({
      debtorName: row.debtorName,
      date: dateOnly(row.date),
      amountUSD: money(row.amountUSD),
      amountIQD: money(row.amountIQD),
      feeUSD: money(row.feeUSD),
      feeIQD: money(row.feeIQD),
      transType: t(row.transType),
      fxRate: money(row.fxRate),
      driverName: t(row.driverName),
      carNumber: t(row.carNumber),
      goodType: t(row.goodType),
      weight: money(row.weight),
      meters: money(row.meters),
      description: t(row.description),
      state: t(row.state),
      fxNote: t(row.fxNote),
    });
  };

  for (const row of src.debtBasim) {
    pushDebt({
      debtorName: "باسم الجميلي",
      date: row.d_b_date,
      amountUSD: row.amount_usd,
      amountIQD: row.amount_iqd,
      feeUSD: row.fee_usd,
      feeIQD: row.fee_iqd,
      transType: row.trans_type,
      fxRate: row.fx_rate,
      description: row.notes,
      state: row.state,
      fxNote: null,
    });
  }

  for (const row of src.debtLuay) {
    if (row.driver_name) drivers.add(row.driver_name);
    if (row.car_number) vehicles.add(row.car_number);
    pushDebt({
      debtorName: "لؤي",
      date: row.d_l_date,
      amountUSD: row.amount_usd,
      amountIQD: null,
      feeUSD: null,
      feeIQD: null,
      transType: null,
      fxRate: null,
      driverName: row.driver_name,
      carNumber: row.car_number,
      goodType: row.good_type,
      weight: row.weight,
      meters: null,
      description: joinParts([row.notes, row.note2]),
      state: null,
      fxNote: null,
    });
  }

  for (const row of src.debtLuay2) {
    pushDebt({
      debtorName: "لؤي 2",
      date: row.d_l2_date,
      amountUSD: row.amount_usd,
      amountIQD: row.amount_iqd,
      feeUSD: null,
      feeIQD: null,
      transType: row.trans_type,
      fxRate: row.fx_rate,
      description: row.notes,
      state: null,
      fxNote: row.fx_note,
    });
  }

  for (const row of src.debtNoman) {
    pushDebt({
      debtorName: "نومان",
      date: row.d_n_date,
      amountUSD: row.amount_usd,
      amountIQD: row.amount_iqd,
      feeUSD: row.fee_usd,
      feeIQD: row.fee_iqd,
      transType: row.trans_type,
      fxRate: row.fx_rate,
      description: row.notes,
      state: row.state,
      fxNote: null,
    });
  }

  for (const row of src.adbTx) {
    if (row.driver_name) drivers.add(row.driver_name);
    if (row.car_number) vehicles.add(row.car_number);
    const parsed = splitDestinationCompany(row.note);
    if (parsed.destination) govs.add(parsed.destination);
    if (parsed.company) comps.add(parsed.company);
    pushDebt({
      debtorName: "عبد الكريم الشمري",
      date: row.tran_date,
      amountUSD: row.amount_usd,
      amountIQD: row.amount_iqd,
      feeUSD: null,
      feeIQD: null,
      transType: Number(row.tran_type_id) === 2 ? "سند" : "فاتورة",
      fxRate: null,
      driverName: row.driver_name,
      carNumber: row.car_number,
      goodType: row.good_type,
      weight: null,
      meters: null,
      description: joinParts([
        row.ref_no ? `Ref:${t(row.ref_no)}` : null,
        row.trider_name ? `التاجر:${t(row.trider_name)}` : null,
        row.port_name ? `المنفذ:${t(row.port_name)}` : null,
        parsed.destination ? `الوجهة:${parsed.destination}` : null,
        parsed.company ? `الشركة:${parsed.company}` : null,
      ]),
      state: row.port_name,
      fxNote: row.note,
    });
  }

  for (const row of src.debtHaider) {
    if (row.driver_name) drivers.add(row.driver_name);
    if (row.car_number) vehicles.add(row.car_number);
    specialAccounts.push({
      type: "haider",
      name: "حيدر شركة الأنوار",
      traderName: null,
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodType: t(row.good_type),
      govName: null,
      portName: null,
      companyName: null,
      batchName: t(row.meal_no),
      destination: null,
      amountUSD: money(row.amount_usd),
      amountIQD: money(row.amount_iqd),
      costUSD: money(row.cost_usd),
      costIQD: money(row.cost_iqd),
      amountUSDPartner: null,
      differenceIQD: money(row.amount_iqd2),
      clr: null,
      tx: null,
      taxiWater: null,
      weight: money(row.weight),
      meters: money(row.meters),
      qty: null,
      description: null,
      notes: t(row.trider_note),
      date: dateOnly(row.trans_date),
    });
  }

  for (const row of src.yaserSpecial) {
    if (row.driver_name) drivers.add(row.driver_name);
    if (row.car_number) vehicles.add(row.car_number);
    if (t(row.gov)) comps.add(row.gov);
    specialAccounts.push({
      type: "partnership",
      name: "ياسر عادل",
      traderName: t(row.trider_name),
      driverName: t(row.driver_name),
      vehiclePlate: t(row.car_number),
      goodType: t(row.good_type),
      govName: null,
      portName: t(row.port_name),
      companyName: t(row.gov),
      batchName: null,
      destination: null,
      amountUSD: money(row.amount_usd),
      amountIQD: null,
      costUSD: null,
      costIQD: null,
      amountUSDPartner: money(row.amount_usd_ya),
      differenceIQD: money(row.diff),
      clr: money(row.clr),
      tx: money(row.tx),
      taxiWater: money(row.sup),
      weight: null,
      meters: null,
      qty: money(row.qty),
      description: null,
      notes: t(row.note),
      date: dateOnly(row.trans_date),
    });
  }

  for (const row of src.exp1) {
    expenses.push({
      expenseDate: requiredDate(row.expense_date, issues, {
        table: "Tbl_Expenses",
        legacyId: row.expense_id ?? row.id ?? null,
      }),
      amountUSD: money(row.amount_usd),
      amountIQD: money(row.amount_iqd),
      description: t(row.notes),
      portId: "port-1",
    });
  }

  for (const row of src.exp2) {
    expenses.push({
      expenseDate: requiredDate(row.expense_date, issues, {
        table: "Tbl_Expenses_MNZ",
        legacyId: row.expense_id ?? row.id ?? null,
      }),
      amountUSD: money(row.amount_usd),
      amountIQD: money(row.amount_iqd),
      description: t(row.notes),
      portId: "port-2",
    });
  }

  for (const row of src.exp3) {
    expenses.push({
      expenseDate: requiredDate(row.expense_date, issues, {
        table: "Tbl_Expenses_Qaim",
        legacyId: row.expense_id ?? row.id ?? null,
      }),
      amountUSD: money(row.amount_usd),
      amountIQD: money(row.amount_iqd),
      description: t(row.notes),
      portId: "port-3",
    });
  }

  for (const row of src.pasteErrors) {
    issues.push({
      type: "legacy_paste_error_row",
      table: "Paste Errors",
      refNo: t(row.ref_no_trans),
      summary: joinParts([
        row.trans_id ? `legacy-id:${row.trans_id}` : null,
        row.tran_date ? `date:${dateOnly(row.tran_date)}` : null,
        row.amount_usd ? `usd:${row.amount_usd}` : null,
        row.amount_iqd ? `iqd:${row.amount_iqd}` : null,
      ]),
    });
  }

  return {
    goods: goods.list(),
    governorates: govs.list(),
    companies: comps.list(),
    drivers: drivers.list(),
    vehicles: vehicles.list(),
    accounts: [...accountMap.values()],
    transactions,
    debts,
    expenses,
    specialAccounts,
    routeDefaults,
    issues,
  };
}

async function loadSourceFromJson(sourceJsonPath) {
  const fileContent = await fs.readFile(sourceJsonPath, "utf8");
  const raw = JSON.parse(fileContent.replace(/^\uFEFF/, ''));
  const dataToLoad = raw.tables ? raw.tables : raw;
  const tables = loadTables(dataToLoad);
  const source = {};

  for (const [legacyName, sourceKey] of Object.entries(SOURCE_TABLE_MAP)) {
    source[sourceKey] = tables[legacyName] || [];
  }

  source.ksaById = new Map(
    source.ksaTraders.map(row => [
      row.ksa_trider_id,
      { name: t(row.ksa_trider_name) },
    ])
  );
  source.mnzById = new Map(
    source.mnzTraders.map(row => [
      row.mnz_trider_id,
      { name: t(row.mnz_trider_name) },
    ])
  );
  source.qaimById = new Map(
    source.qaimTraders.map(row => [
      row.qaim_trider_id,
      { name: t(row.qaim_trider_name) },
    ])
  );
  source.transportCarrierById = new Map(
    source.transportCarriers.map(row => [
      row.trans_carrier_id,
      { name: t(row.trans_carrier_name) },
    ])
  );
  source.partnershipById = new Map(
    source.partnershipAccounts.map(row => [
      row.shr_id,
      { name: t(row.shr_account_name) },
    ])
  );
  source.goodCommonById = new Map(
    source.goodsCommon.map(row => [row.good_id, t(row.good_type)])
  );
  source.goodQaimById = new Map(
    source.goodsQaim.map(row => [row.good_id_qaim, t(row.good_type_qaim)])
  );

  const tableCounts = Object.fromEntries(
    Object.entries(tables).map(([name, rows]) => [name, getCount(rows)])
  );
  const ignoredTables = Object.entries(tableCounts)
    .filter(([name]) => !IMPORTED_TABLES.has(name))
    .map(([name, count]) => ({ table: name, count }))
    .sort((a, b) => b.count - a.count || a.table.localeCompare(b.table));

  return { source, tableCounts, ignoredTables };
}

async function mainApply(payload, tableCounts, ignoredTables) {
  const dbUrl = DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL is missing. Set it in source-code/.env or pass --database-url"
    );
  }

  const target = await mysql.createConnection(cfg(dbUrl));
  const reportPath = path.join(
    REPORT_DIR,
    `old-trade-json-import-apply-${stamp}.json`
  );

  try {
    const before = {};
    for (const table of TARGET_TABLES) {
      before[table] = await countTable(target, table);
    }

    const nonEmpty = Object.entries(before)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => `${name}=${value}`);

    if (nonEmpty.length) {
      throw new Error(`Target database is not empty: ${nonEmpty.join(", ")}`);
    }

    const backupPath = await backupTarget(target);

    await target.beginTransaction();
    try {
      const goodsIds = await insertLookups(
        target,
        "goods_types",
        payload.goods,
        row => ({ name: row.name })
      );
      const govIds = await insertLookups(
        target,
        "governorates",
        payload.governorates,
        row => ({ name: row.name, trance_price: row.trancePrice ?? null })
      );
      const compIds = await insertLookups(
        target,
        "companies",
        payload.companies,
        row => ({ name: row.name })
      );
      const driverIds = await insertLookups(
        target,
        "drivers",
        payload.drivers,
        row => ({ name: row.name })
      );
      const vehicleIds = await insertLookups(
        target,
        "vehicles",
        payload.vehicles,
        row => ({ plateNumber: row.name })
      );

      const accountIds = new Map();
      for (const row of payload.accounts) {
        const [res] = await target.query("INSERT INTO `accounts` SET ?", {
          name: row.name,
          accountType: row.accountType,
          portId: row.portId,
          currency: row.currency,
          merchantReport: row.merchantReport,
          notes: row.notes,
        });
        accountIds.set(
          comp(row.portId, row.accountType, row.name),
          res.insertId
        );
      }

      for (const row of payload.transactions) {
        const accountId = accountIds.get(row.accountKey);
        if (!accountId)
          throw new Error(`Missing account for transaction ${row.refNo}`);
        const carrierId = row.carrierKey
          ? accountIds.get(row.carrierKey) || null
          : null;

        await target.query("INSERT INTO `transactions` SET ?", {
          ref_no: row.refNo || null,
          direction: row.direction,
          trans_date: row.transDate,
          account_id: accountId,
          currency: row.currency,
          driver_id: row.driverName
            ? driverIds.get(k(row.driverName)) || null
            : null,
          vehicle_id: row.vehiclePlate
            ? vehicleIds.get(k(row.vehiclePlate)) || null
            : null,
          good_type_id: row.goodTypeName
            ? goodsIds.get(k(row.goodTypeName)) || null
            : null,
          weight: row.weight ?? null,
          meters: row.meters ?? null,
          qty: row.qty ?? null,
          cost_usd: row.costUsd ?? "0",
          amount_usd: row.amountUsd ?? "0",
          cost_iqd: row.costIqd ?? "0",
          amount_iqd: row.amountIqd ?? "0",
          fee_usd: row.feeUsd ?? "0",
          syr_cus: row.syrCus ?? "0",
          car_qty: row.carQty ?? null,
          trans_price: row.transPrice ?? null,
          carrier_id: carrierId,
          company_name: row.companyName || null,
          company_id: row.companyName
            ? compIds.get(k(row.companyName)) || null
            : null,
          gov_id: row.governorateName
            ? govIds.get(k(row.governorateName)) || null
            : null,
          notes: row.notes || null,
          trader_note: row.traderNote || null,
          record_type: row.recordType,
          port_id: row.sectionKey,
          account_type: row.accountType,
          created_by: 1,
        });
      }

      for (const row of payload.debts) {
        await target.query("INSERT INTO `debts` SET ?", {
          debtorName: row.debtorName,
          amountUSD: row.amountUSD ?? "0",
          amountIQD: row.amountIQD ?? "0",
          feeUSD: row.feeUSD ?? "0",
          feeIQD: row.feeIQD ?? "0",
          transType: row.transType || null,
          fxRate: row.fxRate ?? null,
          driverName: row.driverName || null,
          carNumber: row.carNumber || null,
          goodType: row.goodType || null,
          weight: row.weight ?? null,
          meters: row.meters ?? null,
          description: row.description || null,
          date: row.date || null,
          status: "pending",
          paidAmountUSD: "0",
          paidAmountIQD: "0",
          state: row.state || null,
          fxNote: row.fxNote || null,
        });
      }

      for (const row of payload.expenses) {
        await target.query("INSERT INTO `expenses` SET ?", {
          expense_date: row.expenseDate,
          amount_usd: row.amountUSD ?? "0",
          amount_iqd: row.amountIQD ?? "0",
          description: row.description || null,
          port_id: row.portId,
          created_by: 1,
        });
      }

      for (const row of payload.specialAccounts) {
        await target.query("INSERT INTO `special_accounts` SET ?", {
          type: row.type,
          name: row.name,
          traderName: row.traderName || null,
          driverName: row.driverName || null,
          vehiclePlate: row.vehiclePlate || null,
          goodType: row.goodType || null,
          govName: row.govName || null,
          portName: row.portName || null,
          companyName: row.companyName || null,
          batchName: row.batchName || null,
          destination: row.destination || null,
          amountUSD: row.amountUSD ?? "0",
          amountIQD: row.amountIQD ?? "0",
          costUSD: row.costUSD ?? "0",
          costIQD: row.costIQD ?? "0",
          amountUSDPartner: row.amountUSDPartner ?? "0",
          differenceIQD: row.differenceIQD ?? "0",
          clr: row.clr ?? "0",
          tx: row.tx ?? "0",
          taxiWater: row.taxiWater ?? "0",
          weight: row.weight ?? null,
          meters: row.meters ?? null,
          qty: row.qty ?? null,
          description: row.description || null,
          notes: row.notes || null,
          date: row.date || null,
        });
      }

      for (const row of payload.routeDefaults) {
        const govId = govIds.get(k(row.govName));
        if (govId) {
          await target.query("INSERT INTO `route_defaults` SET ?", {
            section_key: row.sectionKey,
            gov_id: govId,
            currency: "IQD",
            default_trans_price: row.defaultTransPrice ?? null,
            active: 1,
          });
        }
      }

      await target.query("INSERT INTO `audit_logs` SET ?", {
        entity_type: "migration",
        action: "create",
        summary: "Imported legacy JSON data into the new system",
        after_data: JSON.stringify({
          sourceJson: SOURCE_JSON,
          transactions: payload.transactions.length,
          debts: payload.debts.length,
          specialAccounts: payload.specialAccounts.length,
        }),
        metadata: JSON.stringify({ backupPath, reportPath }),
        user_id: 1,
        username: "admin",
      });

      await target.commit();

      const after = {};
      for (const table of TARGET_TABLES) {
        after[table] = await countTable(target, table);
      }

      const report = {
        meta: {
          mode: "apply",
          createdAt: new Date().toISOString(),
          sourceJson: SOURCE_JSON,
        },
        sourceCounts: tableCounts,
        ignoredTables,
        projected: {
          accounts: payload.accounts.length,
          goods: payload.goods.length,
          governorates: payload.governorates.length,
          companies: payload.companies.length,
          drivers: payload.drivers.length,
          vehicles: payload.vehicles.length,
          transactions: payload.transactions.length,
          debts: payload.debts.length,
          expenses: payload.expenses.length,
          specialAccounts: payload.specialAccounts.length,
          routeDefaults: payload.routeDefaults.length,
          pasteErrors: payload.issues.filter(
            item => item.table === "Paste Errors"
          ).length,
        },
        targetCountsBefore: before,
        targetCountsAfter: after,
        backupPath,
        issues: payload.issues,
      };

      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
      console.log(JSON.stringify({ reportPath, ...report }, null, 2));
    } catch (error) {
      await target.rollback();
      throw error;
    }
  } finally {
    await target.end();
  }
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const { source, tableCounts, ignoredTables } =
    await loadSourceFromJson(SOURCE_JSON);
  const payload = buildApplyPayload(source);

  if (APPLY) {
    await mainApply(payload, tableCounts, ignoredTables);
    return;
  }

  const report = {
    meta: {
      mode: "dry-run",
      createdAt: new Date().toISOString(),
      sourceJson: SOURCE_JSON,
    },
    sourceCounts: tableCounts,
    projected: {
      accounts: payload.accounts.length,
      goods: payload.goods.length,
      governorates: payload.governorates.length,
      companies: payload.companies.length,
      drivers: payload.drivers.length,
      vehicles: payload.vehicles.length,
      transactions: payload.transactions.length,
      debts: payload.debts.length,
      expenses: payload.expenses.length,
      specialAccounts: payload.specialAccounts.length,
      routeDefaults: payload.routeDefaults.length,
      pasteErrors: source.pasteErrors.length,
    },
    ignoredTables,
    issues: payload.issues,
  };

  const reportPath = path.join(
    REPORT_DIR,
    `old-trade-json-import-dry-run-${stamp}.json`
  );
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ reportPath, ...report }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
