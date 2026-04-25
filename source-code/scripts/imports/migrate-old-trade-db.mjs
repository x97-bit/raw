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
const REPORT_DIR = path.join(DATABASE_DIR, "import-reports");
const BACKUP_DIR = path.join(DATABASE_DIR, "backups");
const SOURCE_DB = arg("--source-db") || "trade_management_db";
const APPLY = has("--apply");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const TABLES = [
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

function arg(name) {
  const exact = process.argv.find(x => x.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] || null : null;
}

function has(name) {
  return process.argv.includes(name);
}
function t(v) {
  return String(v ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function k(v) {
  return t(v).toLowerCase();
}
function dateOnly(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? t(v).split(" ")[0]
    : d.toISOString().slice(0, 10);
}
function money(v) {
  return v === null || v === undefined || t(v) === "" ? null : v;
}
function joinParts(parts) {
  const vals = parts.map(t).filter(Boolean);
  return vals.length ? vals.join(" | ") : null;
}
function comp(portId, accountType, name) {
  return `${portId}|${accountType}|${k(name)}`;
}
function cfg(url, db = null) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: db || u.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
  };
}
function currency(id) {
  const n = Number(id);
  if (n === 2) return "IQD";
  if (n === 3) return "BOTH";
  return "USD";
}
function direction(id) {
  return Number(id) === 2 ? "OUT" : "IN";
}
function recordType(id) {
  return Number(id) === 2 ? "payment" : "shipment";
}
function collector() {
  const m = new Map();
  return {
    add(name, extra = {}) {
      const v = t(name);
      if (!v) return;
      const key = k(v);
      if (!m.has(key)) m.set(key, { name: v, ...extra });
    },
    list() {
      return [...m.values()];
    },
  };
}
function splitDestinationCompany(note) {
  const parts = t(note).split("/").map(t).filter(Boolean);
  return { destination: parts[0] || null, company: parts[1] || null };
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
function legacyFallbackAccountName(sectionKey, legacyId) {
  if (sectionKey === "port-1")
    return `حساب قديم السعودية ${legacyId || "بدون-معرف"}`;
  if (sectionKey === "port-2")
    return `حساب قديم المنذرية ${legacyId || "بدون-معرف"}`;
  if (sectionKey === "port-3")
    return `حساب قديم القائم ${legacyId || "بدون-معرف"}`;
  return `حساب قديم ${legacyId || "بدون-معرف"}`;
}

async function ensure(dir) {
  await fs.mkdir(dir, { recursive: true });
}
async function all(conn, sql) {
  const [rows] = await conn.query(sql);
  return rows;
}
async function count(conn, table) {
  const [r] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(r[0]?.c || 0);
}

async function snapshot(conn) {
  const [tableRows] = await conn.query("SHOW TABLES");
  const names = tableRows.map(r => r[Object.keys(r)[0]]);
  const data = {},
    counts = {};
  for (const name of names) {
    const [rows] = await conn.query(`SELECT * FROM \`${name}\``);
    data[name] = rows;
    counts[name] = rows.length;
  }
  return { data, counts };
}

async function backup(conn) {
  await ensure(BACKUP_DIR);
  const snap = await snapshot(conn);
  const backupPath = path.join(
    BACKUP_DIR,
    `pre-old-trade-migration-${stamp}.json`
  );
  await fs.writeFile(
    backupPath,
    JSON.stringify(
      {
        meta: { createdAt: new Date().toISOString(), sourceDb: SOURCE_DB },
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

function buildPayload(src) {
  const goods = collector();
  const govs = collector();
  const comps = collector();
  const drivers = collector();
  const vehicles = collector();
  const accountMap = new Map();
  const txs = [],
    debts = [],
    expenses = [],
    specials = [],
    routeDefaults = [],
    issues = [];

  const addAccount = ({
    name,
    accountType,
    portId,
    currency = null,
    merchantReport = null,
    notes = null,
  }) => {
    const nm = t(name);
    if (!nm) return null;
    const key = comp(portId, accountType, nm);
    if (!accountMap.has(key))
      accountMap.set(key, {
        name: nm,
        accountType: String(accountType),
        portId,
        currency,
        merchantReport,
        notes,
      });
    return key;
  };

  for (const r of src.goodsCommon) goods.add(r.good_type);
  for (const r of src.goodsMnz) goods.add(r.good_type_mnz);
  for (const r of src.goodsQaim) goods.add(r.good_type_qaim);
  for (const r of src.govRows) {
    govs.add(r.tran_goverment_name, { trancePrice: r.trance_price });
    if (Number(r.trance_price || 0) !== 0)
      routeDefaults.push({
        sectionKey: "transport-1",
        govName: t(r.tran_goverment_name),
        defaultTransPrice: r.trance_price,
      });
  }

  for (const r of src.ksaTraders)
    addAccount({
      name: r.ksa_trider_name,
      accountType: "1",
      portId: "port-1",
      currency: currency(r.currency_id),
      notes: "source:tbl_ksa_triders",
    });
  for (const r of src.mnzTraders)
    addAccount({
      name: r.mnz_trider_name,
      accountType: "1",
      portId: "port-2",
      currency: currency(r.currency_id),
      notes: "source:tbl_mnz_triders",
    });
  for (const r of src.qaimTraders)
    addAccount({
      name: r.qaim_trider_name,
      accountType: "1",
      portId: "port-3",
      currency: currency(r.currency_id),
      merchantReport: r.merchant_report || null,
      notes: "source:tbl_qaim_triders",
    });
  for (const r of src.transportCarriers)
    addAccount({
      name: r.trans_carrier_name,
      accountType: "2",
      portId: "transport-1",
      currency: currency(r.currency_id),
      notes: "source:tbl_trans_carriers",
    });
  for (const r of src.partnershipAccounts)
    addAccount({
      name: r.shr_account_name,
      accountType: "5",
      portId: "partnership-1",
      currency: currency(r.currency_id),
      notes: "source:tbl_shr_accounts",
    });

  for (const id of new Set(
    src.transportTx
      .map(r => r.trider_id)
      .filter(v => v !== null && v !== undefined)
  )) {
    const name = traderNameForTransport(id, src);
    if (name)
      addAccount({
        name,
        accountType: "2",
        portId: "transport-1",
        notes: "source:tbl_trans_trans.trider_id",
      });
  }

  const addTx = row => {
    if (row.driverName) drivers.add(row.driverName);
    if (row.vehiclePlate) vehicles.add(row.vehiclePlate);
    if (row.goodTypeName) goods.add(row.goodTypeName);
    if (row.governorateName) govs.add(row.governorateName);
    if (row.companyName) comps.add(row.companyName);
    txs.push(row);
  };

  for (const r of src.ksaTx) {
    let accountName = src.ksaById.get(r.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(r)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "tbl_ksa_trans",
        refNo: r.ref_no,
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-1", r.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "tbl_ksa_trans",
        refNo: r.ref_no,
        accountName,
      });
    }
    addTx({
      sourceTable: "tbl_ksa_trans",
      refNo: t(r.ref_no),
      sectionKey: "port-1",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-1",
      }),
      carrierKey: null,
      transDate: dateOnly(r.tran_date),
      direction: direction(r.tran_type_id),
      recordType: recordType(r.tran_type_id),
      currency: currency(r.currency_id),
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodTypeName: src.goodCommonById.get(r.good_type) || null,
      governorateName: t(r.goverment),
      companyName: null,
      weight: money(r.weight),
      meters: money(r.meters),
      qty: null,
      costUsd: money(r.cost_usd),
      amountUsd: money(r.amount_usd),
      costIqd: money(r.cost_iqd),
      amountIqd: money(r.amount_iqd),
      feeUsd: money(r.ksa_trance),
      syrCus: null,
      carQty: null,
      transPrice: money(r.amount_iqd2),
      notes: t(r.note),
      traderNote: t(r.trider_note),
    });
  }

  for (const r of src.mnzTx) {
    let accountName = src.mnzById.get(r.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(r)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "tbl_mnz_trans",
        refNo: r.ref_no_mnz,
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-2", r.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "tbl_mnz_trans",
        refNo: r.ref_no_mnz,
        accountName,
      });
    }
    addTx({
      sourceTable: "tbl_mnz_trans",
      refNo: t(r.ref_no_mnz),
      sectionKey: "port-2",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-2",
      }),
      carrierKey: null,
      transDate: dateOnly(r.tran_date),
      direction: direction(r.tran_type_id),
      recordType: recordType(r.tran_type_id),
      currency: currency(r.currency_id),
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodTypeName: null,
      governorateName: null,
      companyName: null,
      weight: money(r.weight),
      meters: null,
      qty: null,
      costUsd: money(r.cost_usd),
      amountUsd: money(r.amount_usd),
      costIqd: money(r.cost_iqd),
      amountIqd: money(r.amount_iqd),
      feeUsd: null,
      syrCus: money(r.syr_cus),
      carQty: null,
      transPrice: null,
      notes: t(r.note),
      traderNote: t(r.trider_note),
    });
  }

  for (const r of src.qaimTx) {
    let accountName = src.qaimById.get(r.trider_id)?.name || null;
    if (!accountName && !hasMeaningfulTransactionData(r)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "tbl_qaim_trans",
        refNo: r.ref_no_qaim,
      });
      continue;
    }
    if (!accountName) {
      accountName = legacyFallbackAccountName("port-3", r.trider_id);
      issues.push({
        type: "transaction_account_fallback",
        table: "tbl_qaim_trans",
        refNo: r.ref_no_qaim,
        accountName,
      });
    }
    if (t(r.company_name)) comps.add(r.company_name);
    addTx({
      sourceTable: "tbl_qaim_trans",
      refNo: t(r.ref_no_qaim),
      sectionKey: "port-3",
      accountType: "1",
      accountKey: addAccount({
        name: accountName,
        accountType: "1",
        portId: "port-3",
      }),
      carrierKey: null,
      transDate: dateOnly(r.tran_date),
      direction: direction(r.tran_type_id),
      recordType: recordType(r.tran_type_id),
      currency: currency(r.currency_id),
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodTypeName: src.goodQaimById.get(r.good_type_qaim) || null,
      governorateName: null,
      companyName: t(r.company_name),
      weight: money(r.weight),
      meters: null,
      qty: money(r.qty),
      costUsd: money(r.cost_usd),
      amountUsd: money(r.amount_usd),
      costIqd: money(r.cost_iqd),
      amountIqd: money(r.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: null,
      transPrice: null,
      notes: joinParts([r.note, r.note_iq]),
      traderNote: t(r.trider_note),
    });
  }

  for (const r of src.transportTx) {
    const carrierName =
      src.transportCarrierById.get(r.carrier_id)?.name || null;
    let accountName =
      traderNameForTransport(r.trider_id, src) || carrierName || null;
    if (!accountName && !hasMeaningfulTransactionData(r)) {
      issues.push({
        type: "transaction_skipped_empty_orphan",
        table: "tbl_trans_trans",
        refNo: r.ref_no_trans,
      });
      continue;
    }
    if (!accountName) {
      accountName = "نقل داخلي عام";
      issues.push({
        type: "transaction_account_fallback",
        table: "tbl_trans_trans",
        refNo: r.ref_no_trans,
        accountName,
      });
    }
    addTx({
      sourceTable: "tbl_trans_trans",
      refNo: t(r.ref_no_trans),
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
      transDate: dateOnly(r.tran_date),
      direction: direction(r.tran_type_id),
      recordType: recordType(r.tran_type_id),
      currency: currency(r.currency_id),
      driverName: null,
      vehiclePlate: null,
      goodTypeName: src.goodCommonById.get(r.good_type) || null,
      governorateName: t(r.goverment_name),
      companyName: null,
      weight: null,
      meters: null,
      qty: null,
      costUsd: null,
      amountUsd: money(r.amount_usd),
      costIqd: null,
      amountIqd: money(r.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: money(r.car_qty),
      transPrice: money(r.trans_price),
      notes: t(r.note),
      traderNote: null,
    });
  }

  for (const r of src.partnershipTx) {
    const accountName = src.partnershipById.get(r.account_id)?.name || null;
    if (!accountName) {
      issues.push({
        type: "transaction_account_unresolved",
        table: "tbl_shr_trans",
        refNo: r.ref_no_shr,
      });
      continue;
    }
    addTx({
      sourceTable: "tbl_shr_trans",
      refNo: t(r.ref_no_shr),
      sectionKey: "partnership-1",
      accountType: "5",
      accountKey: addAccount({
        name: accountName,
        accountType: "5",
        portId: "partnership-1",
      }),
      carrierKey: null,
      transDate: dateOnly(r.tran_date),
      direction: direction(r.tran_type_id),
      recordType: recordType(r.tran_type_id),
      currency: currency(r.currency_id),
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodTypeName: null,
      governorateName: null,
      companyName: null,
      weight: null,
      meters: null,
      qty: null,
      costUsd: null,
      amountUsd: money(r.amount_usd),
      costIqd: null,
      amountIqd: money(r.amount_iqd),
      feeUsd: null,
      syrCus: null,
      carQty: null,
      transPrice: null,
      notes: t(r.note),
      traderNote: null,
    });
  }

  const pushDebt = row =>
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

  for (const r of src.debtBasim)
    pushDebt({
      debtorName: "باسم الجميلي",
      date: r.d_b_date,
      amountUSD: r.amount_usd,
      amountIQD: r.amount_iqd,
      feeUSD: r.fee_usd,
      feeIQD: r.fee_iqd,
      transType: r.trans_type,
      fxRate: r.fx_rate,
      description: r.notes,
      state: r.state,
      fxNote: null,
    });
  for (const r of src.debtLuay) {
    if (r.driver_name) drivers.add(r.driver_name);
    if (r.car_number) vehicles.add(r.car_number);
    pushDebt({
      debtorName: "لؤي",
      date: r.d_l_date,
      amountUSD: r.amount_usd,
      amountIQD: null,
      feeUSD: null,
      feeIQD: null,
      transType: null,
      fxRate: null,
      driverName: r.driver_name,
      carNumber: r.car_number,
      goodType: r.good_type,
      weight: r.weight,
      meters: null,
      description: joinParts([r.notes, r.note2]),
      state: null,
      fxNote: null,
    });
  }
  for (const r of src.debtLuay2)
    pushDebt({
      debtorName: "لؤي 2",
      date: r.d_l2_date,
      amountUSD: r.amount_usd,
      amountIQD: r.amount_iqd,
      feeUSD: null,
      feeIQD: null,
      transType: r.trans_type,
      fxRate: r.fx_rate,
      description: r.notes,
      state: null,
      fxNote: r.fx_note,
    });
  for (const r of src.debtNoman)
    pushDebt({
      debtorName: "نومان",
      date: r.d_n_date,
      amountUSD: r.amount_usd,
      amountIQD: r.amount_iqd,
      feeUSD: r.fee_usd,
      feeIQD: r.fee_iqd,
      transType: r.trans_type,
      fxRate: r.fx_rate,
      description: r.notes,
      state: r.state,
      fxNote: null,
    });
  for (const r of src.adbTx) {
    if (r.driver_name) drivers.add(r.driver_name);
    if (r.car_number) vehicles.add(r.car_number);
    const parsed = splitDestinationCompany(r.note);
    if (parsed.destination) govs.add(parsed.destination);
    if (parsed.company) comps.add(parsed.company);
    pushDebt({
      debtorName: "عبد الكريم الشمري",
      date: r.tran_date,
      amountUSD: r.amount_usd,
      amountIQD: r.amount_iqd,
      feeUSD: null,
      feeIQD: null,
      transType: Number(r.tran_type_id) === 2 ? "سند" : "فاتورة",
      fxRate: null,
      driverName: r.driver_name,
      carNumber: r.car_number,
      goodType: r.good_type,
      weight: null,
      meters: null,
      description: joinParts([
        r.ref_no ? `Ref:${t(r.ref_no)}` : null,
        r.trider_name ? `التاجر:${t(r.trider_name)}` : null,
        r.port_name ? `المنفذ:${t(r.port_name)}` : null,
        parsed.destination ? `الوجهة:${parsed.destination}` : null,
        parsed.company ? `الشركة:${parsed.company}` : null,
      ]),
      state: r.port_name,
      fxNote: r.note,
    });
  }

  for (const r of src.haiderSpecial) {
    if (r.driver_name) drivers.add(r.driver_name);
    if (r.car_number) vehicles.add(r.car_number);
    specials.push({
      type: "haider",
      name: "حيدر شركة الأنوار",
      traderName: null,
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodType: t(r.good_type),
      govName: null,
      portName: null,
      companyName: null,
      batchName: t(r.meal_no),
      destination: null,
      amountUSD: money(r.amount_usd),
      amountIQD: money(r.amount_iqd),
      costUSD: money(r.cost_usd),
      costIQD: money(r.cost_iqd),
      amountUSDPartner: null,
      differenceIQD: money(r.amount_iqd2),
      clr: null,
      tx: null,
      taxiWater: null,
      weight: money(r.weight),
      meters: money(r.meters),
      qty: null,
      description: null,
      notes: t(r.trider_note),
      date: dateOnly(r.trans_date),
    });
  }
  for (const r of src.yaserSpecial) {
    if (r.driver_name) drivers.add(r.driver_name);
    if (r.car_number) vehicles.add(r.car_number);
    if (t(r.gov)) comps.add(r.gov);
    specials.push({
      type: "partnership",
      name: "ياسر عادل",
      traderName: t(r.trider_name),
      driverName: t(r.driver_name),
      vehiclePlate: t(r.car_number),
      goodType: t(r.good_type),
      govName: null,
      portName: t(r.port_name),
      companyName: t(r.gov),
      batchName: null,
      destination: null,
      amountUSD: money(r.amount_usd),
      amountIQD: null,
      costUSD: null,
      costIQD: null,
      amountUSDPartner: money(r.amount_usd_ya),
      differenceIQD: money(r.diff),
      clr: money(r.clr),
      tx: money(r.tx),
      taxiWater: money(r.sup),
      weight: null,
      meters: null,
      qty: money(r.qty),
      description: null,
      notes: t(r.note),
      date: dateOnly(r.trans_date),
    });
  }

  for (const r of src.exp1)
    expenses.push({
      expenseDate: dateOnly(r.expense_date),
      amountUSD: money(r.amount_usd),
      amountIQD: money(r.amount_iqd),
      description: t(r.notes),
      portId: "port-1",
    });
  for (const r of src.exp2)
    expenses.push({
      expenseDate: dateOnly(r.expense_date),
      amountUSD: money(r.amount_usd),
      amountIQD: money(r.amount_iqd),
      description: t(r.notes),
      portId: "port-2",
    });
  for (const r of src.exp3)
    expenses.push({
      expenseDate: dateOnly(r.expense_date),
      amountUSD: money(r.amount_usd),
      amountIQD: money(r.amount_iqd),
      description: t(r.notes),
      portId: "port-3",
    });

  return {
    goods: goods.list(),
    governorates: govs.list(),
    companies: comps.list(),
    drivers: drivers.list(),
    vehicles: vehicles.list(),
    accounts: [...accountMap.values()],
    transactions: txs,
    debts,
    expenses,
    specialAccounts: specials,
    routeDefaults,
    issues,
  };
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

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is missing in source-code/.env");
  await ensure(REPORT_DIR);
  await ensure(BACKUP_DIR);
  const target = await mysql.createConnection(cfg(dbUrl));
  const source = await mysql.createConnection(cfg(dbUrl, SOURCE_DB));
  try {
    const before = {};
    for (const table of TABLES) before[table] = await count(target, table);
    const nonEmpty = Object.entries(before)
      .filter(([, c]) => c > 0)
      .map(([name, c]) => `${name}=${c}`);
    if (APPLY && nonEmpty.length)
      throw new Error(`Target database is not empty: ${nonEmpty.join(", ")}`);

    const [
      ksaTraders,
      mnzTraders,
      qaimTraders,
      transportCarriers,
      partnershipAccounts,
      goodsCommon,
      goodsMnz,
      goodsQaim,
      govRows,
      ksaTx,
      mnzTx,
      qaimTx,
      transportTx,
      partnershipTx,
      debtBasim,
      debtHaider,
      debtLuay,
      debtLuay2,
      debtNoman,
      yaserSpecial,
      adbTx,
      exp1,
      exp2,
      exp3,
    ] = await Promise.all([
      all(source, "SELECT * FROM tbl_ksa_triders"),
      all(source, "SELECT * FROM tbl_mnz_triders"),
      all(source, "SELECT * FROM tbl_qaim_triders"),
      all(source, "SELECT * FROM tbl_trans_carriers"),
      all(source, "SELECT * FROM tbl_shr_accounts"),
      all(source, "SELECT * FROM tbl_goods_type"),
      all(source, "SELECT * FROM tbl_goods_type_mnz"),
      all(source, "SELECT * FROM tbl_goods_type_qaim"),
      all(source, "SELECT * FROM tbl_tran_goverments"),
      all(source, "SELECT * FROM tbl_ksa_trans"),
      all(source, "SELECT * FROM tbl_mnz_trans"),
      all(source, "SELECT * FROM tbl_qaim_trans"),
      all(source, "SELECT * FROM tbl_trans_trans"),
      all(source, "SELECT * FROM tbl_shr_trans"),
      all(source, "SELECT * FROM tbl_depet_basim"),
      all(source, "SELECT * FROM tbl_depet_haider"),
      all(source, "SELECT * FROM tbl_depet_luay"),
      all(source, "SELECT * FROM tbl_depet_luay2"),
      all(source, "SELECT * FROM tbl_depet_noman"),
      all(source, "SELECT * FROM tbl_sp_yaser_trans"),
      all(source, "SELECT * FROM tbl_adb_alkarem_trans"),
      all(source, "SELECT * FROM tbl_expenses"),
      all(source, "SELECT * FROM tbl_expenses_mnz"),
      all(source, "SELECT * FROM tbl_expenses_qaim"),
    ]);

    const payload = buildPayload({
      ksaTraders,
      mnzTraders,
      qaimTraders,
      transportCarriers,
      partnershipAccounts,
      goodsCommon,
      goodsMnz,
      goodsQaim,
      govRows,
      ksaTx,
      mnzTx,
      qaimTx,
      transportTx,
      partnershipTx,
      debtBasim,
      haiderSpecial: debtHaider,
      debtLuay,
      debtLuay2,
      debtNoman,
      yaserSpecial,
      adbTx,
      exp1,
      exp2,
      exp3,
      ksaById: new Map(
        ksaTraders.map(r => [r.ksa_trider_id, { name: t(r.ksa_trider_name) }])
      ),
      mnzById: new Map(
        mnzTraders.map(r => [r.mnz_trider_id, { name: t(r.mnz_trider_name) }])
      ),
      qaimById: new Map(
        qaimTraders.map(r => [
          r.qaim_trider_id,
          { name: t(r.qaim_trider_name) },
        ])
      ),
      transportCarrierById: new Map(
        transportCarriers.map(r => [
          r.trans_carrier_id,
          { name: t(r.trans_carrier_name) },
        ])
      ),
      partnershipById: new Map(
        partnershipAccounts.map(r => [
          r.shr_id,
          { name: t(r.shr_account_name) },
        ])
      ),
      goodCommonById: new Map(
        goodsCommon.map(r => [r.good_id, t(r.good_type)])
      ),
      goodQaimById: new Map(
        goodsQaim.map(r => [r.good_id_qaim, t(r.good_type_qaim)])
      ),
    });

    const report = {
      meta: {
        mode: APPLY ? "apply" : "dry-run",
        createdAt: new Date().toISOString(),
        sourceDb: SOURCE_DB,
        targetDb: cfg(dbUrl).database,
      },
      sourceCounts: {
        tbl_ksa_trans: ksaTx.length,
        tbl_mnz_trans: mnzTx.length,
        tbl_qaim_trans: qaimTx.length,
        tbl_trans_trans: transportTx.length,
        tbl_shr_trans: partnershipTx.length,
        tbl_depet_basim: debtBasim.length,
        tbl_depet_haider: debtHaider.length,
        tbl_depet_luay: debtLuay.length,
        tbl_depet_luay2: debtLuay2.length,
        tbl_depet_noman: debtNoman.length,
        tbl_sp_yaser_trans: yaserSpecial.length,
        tbl_adb_alkarem_trans: adbTx.length,
      },
      targetCountsBefore: before,
      projected: {
        goods: payload.goods.length,
        governorates: payload.governorates.length,
        companies: payload.companies.length,
        drivers: payload.drivers.length,
        vehicles: payload.vehicles.length,
        accounts: payload.accounts.length,
        transactions: payload.transactions.length,
        debts: payload.debts.length,
        expenses: payload.expenses.length,
        specialAccounts: payload.specialAccounts.length,
        routeDefaults: payload.routeDefaults.length,
      },
      issues: payload.issues,
    };

    const reportPath = path.join(
      REPORT_DIR,
      `old-trade-db-migration-${APPLY ? "apply" : "dry-run"}-${stamp}.json`
    );
    if (!APPLY) {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
      console.log(JSON.stringify({ reportPath, ...report }, null, 2));
      return;
    }

    const backupPath = await backup(target);
    await target.beginTransaction();
    try {
      const goodsIds = await insertLookups(
        target,
        "goods_types",
        payload.goods,
        r => ({ name: r.name })
      );
      const govIds = await insertLookups(
        target,
        "governorates",
        payload.governorates,
        r => ({ name: r.name, trance_price: r.trancePrice ?? null })
      );
      const compIds = await insertLookups(
        target,
        "companies",
        payload.companies,
        r => ({ name: r.name })
      );
      const driverIds = await insertLookups(
        target,
        "drivers",
        payload.drivers,
        r => ({ name: r.name })
      );
      const vehicleIds = await insertLookups(
        target,
        "vehicles",
        payload.vehicles,
        r => ({ plateNumber: r.name })
      );

      const accountIds = new Map();
      for (const r of payload.accounts) {
        const [res] = await target.query("INSERT INTO `accounts` SET ?", {
          name: r.name,
          accountType: r.accountType,
          portId: r.portId,
          currency: r.currency,
          merchantReport: r.merchantReport,
          notes: r.notes,
        });
        accountIds.set(comp(r.portId, r.accountType, r.name), res.insertId);
      }

      for (const r of payload.transactions) {
        const accountId = accountIds.get(r.accountKey);
        if (!accountId)
          throw new Error(`Missing account for transaction ${r.refNo}`);
        const carrierId = r.carrierKey
          ? accountIds.get(r.carrierKey) || null
          : null;
        await target.query("INSERT INTO `transactions` SET ?", {
          ref_no: r.refNo || null,
          direction: r.direction,
          trans_date: r.transDate,
          account_id: accountId,
          currency: r.currency,
          driver_id: r.driverName
            ? driverIds.get(k(r.driverName)) || null
            : null,
          vehicle_id: r.vehiclePlate
            ? vehicleIds.get(k(r.vehiclePlate)) || null
            : null,
          good_type_id: r.goodTypeName
            ? goodsIds.get(k(r.goodTypeName)) || null
            : null,
          weight: r.weight ?? null,
          meters: r.meters ?? null,
          qty: r.qty ?? null,
          cost_usd: r.costUsd ?? "0",
          amount_usd: r.amountUsd ?? "0",
          cost_iqd: r.costIqd ?? "0",
          amount_iqd: r.amountIqd ?? "0",
          fee_usd: r.feeUsd ?? "0",
          syr_cus: r.syrCus ?? "0",
          car_qty: r.carQty ?? null,
          trans_price: r.transPrice ?? null,
          carrier_id: carrierId,
          company_name: r.companyName || null,
          company_id: r.companyName
            ? compIds.get(k(r.companyName)) || null
            : null,
          gov_id: r.governorateName
            ? govIds.get(k(r.governorateName)) || null
            : null,
          notes: r.notes || null,
          trader_note: r.traderNote || null,
          record_type: r.recordType,
          port_id: r.sectionKey,
          account_type: r.accountType,
          created_by: 1,
        });
      }

      for (const r of payload.debts)
        await target.query("INSERT INTO `debts` SET ?", {
          debtorName: r.debtorName,
          amountUSD: r.amountUSD ?? "0",
          amountIQD: r.amountIQD ?? "0",
          feeUSD: r.feeUSD ?? "0",
          feeIQD: r.feeIQD ?? "0",
          transType: r.transType || null,
          fxRate: r.fxRate ?? null,
          driverName: r.driverName || null,
          carNumber: r.carNumber || null,
          goodType: r.goodType || null,
          weight: r.weight ?? null,
          meters: r.meters ?? null,
          description: r.description || null,
          date: r.date || null,
          status: "pending",
          paidAmountUSD: "0",
          paidAmountIQD: "0",
          state: r.state || null,
          fxNote: r.fxNote || null,
        });
      for (const r of payload.expenses)
        await target.query("INSERT INTO `expenses` SET ?", {
          expense_date: r.expenseDate,
          amount_usd: r.amountUSD ?? "0",
          amount_iqd: r.amountIQD ?? "0",
          description: r.description || null,
          port_id: r.portId,
          created_by: 1,
        });
      for (const r of payload.specialAccounts)
        await target.query("INSERT INTO `special_accounts` SET ?", {
          type: r.type,
          name: r.name,
          traderName: r.traderName || null,
          driverName: r.driverName || null,
          vehiclePlate: r.vehiclePlate || null,
          goodType: r.goodType || null,
          govName: r.govName || null,
          portName: r.portName || null,
          companyName: r.companyName || null,
          batchName: r.batchName || null,
          destination: r.destination || null,
          amountUSD: r.amountUSD ?? "0",
          amountIQD: r.amountIQD ?? "0",
          costUSD: r.costUSD ?? "0",
          costIQD: r.costIQD ?? "0",
          amountUSDPartner: r.amountUSDPartner ?? "0",
          differenceIQD: r.differenceIQD ?? "0",
          clr: r.clr ?? "0",
          tx: r.tx ?? "0",
          taxiWater: r.taxiWater ?? "0",
          weight: r.weight ?? null,
          meters: r.meters ?? null,
          qty: r.qty ?? null,
          description: r.description || null,
          notes: r.notes || null,
          date: r.date || null,
        });
      for (const r of payload.routeDefaults) {
        const govId = govIds.get(k(r.govName));
        if (govId)
          await target.query("INSERT INTO `route_defaults` SET ?", {
            section_key: r.sectionKey,
            gov_id: govId,
            currency: "IQD",
            default_trans_price: r.defaultTransPrice ?? null,
            active: 1,
          });
      }
      await target.query("INSERT INTO `audit_logs` SET ?", {
        entity_type: "migration",
        action: "create",
        summary: "ترحيل بيانات trade_management_db إلى النظام الجديد",
        after_data: JSON.stringify({
          sourceDb: SOURCE_DB,
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
      for (const table of TABLES) after[table] = await count(target, table);
      const finalReport = { ...report, backupPath, targetCountsAfter: after };
      await fs.writeFile(
        reportPath,
        JSON.stringify(finalReport, null, 2),
        "utf8"
      );
      console.log(
        JSON.stringify({ reportPath, backupPath, ...finalReport }, null, 2)
      );
    } catch (error) {
      await target.rollback();
      throw error;
    }
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
