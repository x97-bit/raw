import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { buildMySqlConnectionOptions } from "../../shared/scriptMysqlConfig.mjs";

dotenv.config();

const UPLOAD_DIR = "/home/ubuntu/upload";

// Excel file → trader name mapping (must match MySQL account names)
const EXCEL_FILES = [
  { file: "ابوحسنبعقوبة.xlsx", trader: "أبو حسن بعقوبة", type: "usd" },
  { file: "ابوعلي.xlsx", trader: "أبو علي", type: "usd" },
  { file: "ابوفاروق.xlsx", trader: "أبو فاروق", type: "usd" },
  { file: "ابومشعان.xlsx", trader: "أبو مشعان", type: "usd" },
  { file: "جاسمجراد.xlsx", trader: "جاسم جراد", type: "usd" },
  { file: "حسنتاجالدين.xlsx", trader: "حسن شركة تاج الدين", type: "usd" },
  { file: "حيدرشركةتاجالدين.xlsx", trader: "حيدر شركة تاج الدين", type: "usd" },
  { file: "سجادابوزيد.xlsx", trader: "سجاد أبو زيد", type: "usd" },
  { file: "سجادابوزيددينار.xlsx", trader: "سجاد أبو زيد", type: "iqd" },
  { file: "سعدشركةبلقيس.xlsx", trader: "سعد شركة بلقيس", type: "usd" },
  { file: "طارقعمران.xlsx", trader: "طارق عمران", type: "usd" },
  // عمرالدليميجديد is the newer/complete version, use it instead of عمرالدليمي
  { file: "عمرالدليميجديد.xlsx", trader: "عمر الدليمي", type: "usd" },
  {
    file: "مرتضىابوجعفرالنجف.xlsx",
    trader: "مرتضى أبو جعفر النجف",
    type: "usd",
  },
  { file: "نصرت.xlsx", trader: "نصرت", type: "usd" },
  {
    file: "هيثمالراويابواية.xlsx",
    trader: "هيثم الراوي  أبو اية",
    type: "usd",
  },
  { file: "واثقجاسم.xlsx", trader: "واثق جاسم", type: "usd" },
];

// Column mapping per file type
// Each file has headers in row 3, data starts row 4
// Common columns: ت, اسم السائق, رقم السيارة, نوع البضاعة, التاريخ
// Then varies: الوزن/امتار order, الكلفة$/المبلغ$, نقل, etc.

function parseExcelDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  // Format: 2025/12/02 or 2025-12-02
  const m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  // Excel serial number
  if (!isNaN(val) && Number(val) > 40000) {
    const d = new Date((Number(val) - 25569) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseNum(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(String(val).replace(/,/g, "").trim());
  return isNaN(n) ? null : n;
}

function parseStr(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function getHeaderMap(ws) {
  // Headers are in row 3
  const headers = {};
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 2, c })]; // row 3 = index 2
    if (cell && cell.v) {
      const h = String(cell.v).trim().replace(/\s+/g, " ");
      headers[h] = c;
    }
  }
  return headers;
}

function getCellVal(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? cell.v : null;
}

function extractTransactions(filePath, fileType) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets["A"];
  if (!ws) return [];

  const headers = getHeaderMap(ws);
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const transactions = [];

  // Find column indices by header name (flexible matching)
  const findCol = (...names) => {
    for (const name of names) {
      for (const [h, c] of Object.entries(headers)) {
        if (h.includes(name) || name.includes(h)) return c;
      }
    }
    return -1;
  };

  const colSeq = findCol("ت");
  const colDriver = findCol("اسم السائق");
  const colCar = findCol("رقم السيارة");
  const colGoods = findCol("نوع البضاعة");
  const colDate = findCol("التاريخ");
  const colWeight = findCol("الوزن");
  const colMeters = findCol("امتار", "الامتار");
  const colType = findCol("نوع الحركة");
  const colNotes = findCol("الملاحظات");
  const colTransSA = findCol("نقل (سعودية", "نقل (سعودية )");
  const colTransIQ = findCol("نقل ( عراقية", "نقل ( عراقية )");
  const colGov = findCol("المحافظة");

  let colCostUSD = -1,
    colAmountUSD = -1,
    colCostIQD = -1,
    colAmountIQD = -1;

  if (fileType === "iqd") {
    // IQD file: الكلفة دينار, المبلغ دينار
    colCostIQD = findCol("الكلفة دينار");
    colAmountIQD = findCol("المبلغ دينار");
    // May also have المبلغ$ for USD
    colAmountUSD = findCol("المبلغ$");
  } else {
    // USD file: الكلفة$, المبلغ$
    colCostUSD = findCol("الكلفة$", "الكلفة");
    colAmountUSD = findCol("المبلغ$", "المبلغ");
    // Some files also have دينار columns
    colCostIQD = findCol("كلفة الدينار", "الكلفة دينار");
    colAmountIQD = findCol("مبلغ الدينار", "المبلغ الدينار", "المبلغ دينار");
  }

  // Data starts at row 4 (index 3)
  for (let r = 3; r <= range.e.r; r++) {
    const seq = getCellVal(ws, r, colSeq);
    const driver = parseStr(getCellVal(ws, r, colDriver));
    const car = parseStr(getCellVal(ws, r, colCar));
    const goods = parseStr(getCellVal(ws, r, colGoods));
    const date = parseExcelDate(getCellVal(ws, r, colDate));
    const weight = parseNum(getCellVal(ws, r, colWeight));
    const meters = parseNum(getCellVal(ws, r, colMeters));
    const costUsd =
      colCostUSD >= 0 ? parseNum(getCellVal(ws, r, colCostUSD)) : null;
    const amountUsd =
      colAmountUSD >= 0 ? parseNum(getCellVal(ws, r, colAmountUSD)) : null;
    const costIqd =
      colCostIQD >= 0 ? parseNum(getCellVal(ws, r, colCostIQD)) : null;
    const amountIqd =
      colAmountIQD >= 0 ? parseNum(getCellVal(ws, r, colAmountIQD)) : null;
    const transType = parseStr(getCellVal(ws, r, colType));
    const notes = parseStr(getCellVal(ws, r, colNotes));
    const transSA =
      colTransSA >= 0 ? parseNum(getCellVal(ws, r, colTransSA)) : null;
    const transIQ =
      colTransIQ >= 0 ? parseNum(getCellVal(ws, r, colTransIQ)) : null;
    const gov = colGov >= 0 ? parseStr(getCellVal(ws, r, colGov)) : null;

    // Skip empty rows - must have at least an amount or a note
    const hasAmount =
      (amountUsd && amountUsd !== 0) ||
      (amountIqd && amountIqd !== 0) ||
      (costUsd && costUsd !== 0) ||
      (costIqd && costIqd !== 0);
    const hasNote = notes && notes.length > 0;
    if (!hasAmount && !hasNote && !transType) continue;

    // Determine record_type from نوع الحركة
    let recordType = "فاتورة";
    if (transType) {
      const t = transType.trim();
      if (
        t === "فاتورة" ||
        t === "تسديد" ||
        t === "طلب سابق" ||
        t === "صرف" ||
        t === "استلام"
      ) {
        recordType = t;
      } else {
        recordType = t;
      }
    }

    // Determine direction
    let direction = "in";
    if (recordType === "تسديد" || recordType === "صرف") {
      direction = "out";
    }

    transactions.push({
      driver,
      car,
      goods,
      date,
      weight,
      meters,
      costUsd,
      amountUsd,
      costIqd,
      amountIqd,
      recordType,
      direction,
      notes,
      transSA,
      transIQ,
      gov,
      fileType,
    });
  }

  return transactions;
}

async function main() {
  const conn = await mysql2.createConnection(
    buildMySqlConnectionOptions(process.env.DATABASE_URL)
  );

  console.log("=== استيراد البيانات من ملفات Excel ===\n");

  // Load existing accounts
  const [accounts] = await conn.query(
    "SELECT id, name FROM accounts WHERE portId = 'port-1'"
  );
  const accountMap = {};
  for (const a of accounts) {
    accountMap[a.name] = a.id;
  }
  console.log(`حسابات السعودية الموجودة: ${accounts.length}`);

  // Load existing transactions for KSA
  const [existingTrans] = await conn.query(
    "SELECT id, account_id, trans_date, amount_usd, amount_iqd, cost_usd, cost_iqd, notes, record_type FROM transactions WHERE port_id = 'port-1'"
  );
  console.log(`معاملات السعودية الموجودة: ${existingTrans.length}\n`);

  // Build fingerprint set for deduplication
  // Key: accountId|date|amountUsd|amountIqd|recordType
  const existingFingerprints = new Set();
  for (const t of existingTrans) {
    const fp = `${t.account_id}|${t.trans_date}|${Number(t.amount_usd) || 0}|${Number(t.amount_iqd) || 0}|${t.record_type}`;
    existingFingerprints.add(fp);
  }

  // Load existing drivers, vehicles, goods types
  const [drivers] = await conn.query("SELECT id, name FROM drivers");
  const driverMap = {};
  for (const d of drivers) driverMap[d.name] = d.id;

  const [vehicles] = await conn.query("SELECT id, plateNumber FROM vehicles");
  const vehicleMap = {};
  for (const v of vehicles) vehicleMap[v.plateNumber] = v.id;

  const [goodsTypes] = await conn.query("SELECT id, name FROM goods_types");
  const goodsMap = {};
  for (const g of goodsTypes) goodsMap[g.name] = g.id;

  const [govs] = await conn.query("SELECT id, name FROM governorates");
  const govMap = {};
  for (const g of govs) govMap[g.name] = g.id;

  // Get max ref_no
  const [maxRef] = await conn.query(
    "SELECT MAX(CAST(SUBSTRING(ref_no, 5) AS UNSIGNED)) as maxNum FROM transactions WHERE ref_no LIKE 'KSA-%'"
  );
  let refCounter = (maxRef[0].maxNum || 0) + 1;

  let totalImported = 0;
  let totalSkipped = 0;
  let totalDuplicate = 0;

  for (const { file, trader, type } of EXCEL_FILES) {
    const filePath = path.join(UPLOAD_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ملف غير موجود: ${file}`);
      continue;
    }

    const accountId = accountMap[trader];
    if (!accountId) {
      console.log(`⚠️ تاجر غير موجود في قاعدة البيانات: ${trader} (${file})`);
      continue;
    }

    const transactions = extractTransactions(filePath, type);
    let imported = 0;
    let skipped = 0;
    let duplicate = 0;

    for (const t of transactions) {
      // Build fingerprint for dedup
      const amtUsd = t.amountUsd || 0;
      const amtIqd = t.amountIqd || 0;
      const fp = `${accountId}|${t.date}|${amtUsd}|${amtIqd}|${t.recordType}`;

      if (existingFingerprints.has(fp)) {
        duplicate++;
        continue;
      }

      // Resolve driver
      let driverId = null;
      if (t.driver) {
        if (driverMap[t.driver]) {
          driverId = driverMap[t.driver];
        } else {
          const [res] = await conn.query(
            "INSERT INTO drivers (name) VALUES (?)",
            [t.driver]
          );
          driverId = res.insertId;
          driverMap[t.driver] = driverId;
        }
      }

      // Resolve vehicle
      let vehicleId = null;
      if (t.car) {
        if (vehicleMap[t.car]) {
          vehicleId = vehicleMap[t.car];
        } else {
          const [res] = await conn.query(
            "INSERT INTO vehicles (plateNumber) VALUES (?)",
            [t.car]
          );
          vehicleId = res.insertId;
          vehicleMap[t.car] = vehicleId;
        }
      }

      // Resolve goods type
      let goodsId = null;
      if (t.goods) {
        if (goodsMap[t.goods]) {
          goodsId = goodsMap[t.goods];
        } else {
          const [res] = await conn.query(
            "INSERT INTO goods_types (name) VALUES (?)",
            [t.goods]
          );
          goodsId = res.insertId;
          goodsMap[t.goods] = goodsId;
        }
      }

      // Resolve governorate
      let govId = null;
      if (t.gov) {
        const govName = t.gov.trim();
        if (govMap[govName]) {
          govId = govMap[govName];
        } else {
          // Try partial match
          for (const [name, id] of Object.entries(govMap)) {
            if (name.includes(govName) || govName.includes(name)) {
              govId = id;
              break;
            }
          }
        }
      }

      const refNo = `KSA-${String(refCounter++).padStart(4, "0")}`;
      const transDate = t.date || "2025-01-01";

      // Determine currency
      const currency = t.fileType === "iqd" && !t.amountUsd ? "IQD" : "USD";

      // fee_usd = transport Saudi
      const feeUsd = t.transSA || null;

      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, good_type_id, weight, meters, cost_usd, amount_usd, cost_iqd, amount_iqd, fee_usd, gov_id, notes, record_type, port_id, account_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'port-1', 'تاجر', 1)`,
        [
          refNo,
          t.direction,
          transDate,
          accountId,
          currency,
          driverId,
          vehicleId,
          goodsId,
          t.weight,
          t.meters,
          t.costUsd,
          t.amountUsd,
          t.costIqd,
          t.amountIqd,
          feeUsd,
          govId,
          t.notes,
          t.recordType,
        ]
      );

      // Add to fingerprints to prevent duplicates within same import
      existingFingerprints.add(fp);
      imported++;
    }

    totalImported += imported;
    totalSkipped += skipped;
    totalDuplicate += duplicate;

    const icon = imported > 0 ? "✅" : duplicate > 0 ? "🔄" : "⚠️";
    console.log(
      `${icon} ${file} → ${trader}: ${transactions.length} إجمالي, ${imported} جديد, ${duplicate} مكرر`
    );
  }

  // Final counts
  const [finalCount] = await conn.query(
    "SELECT COUNT(*) as cnt FROM transactions WHERE port_id = 'port-1'"
  );
  const [driverCount] = await conn.query("SELECT COUNT(*) as cnt FROM drivers");
  const [vehicleCount] = await conn.query(
    "SELECT COUNT(*) as cnt FROM vehicles"
  );
  const [goodsCount] = await conn.query(
    "SELECT COUNT(*) as cnt FROM goods_types"
  );

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ملخص الاستيراد:`);
  console.log(`  معاملات جديدة مضافة: ${totalImported}`);
  console.log(`  معاملات مكررة (تم تخطيها): ${totalDuplicate}`);
  console.log(`  إجمالي معاملات السعودية الآن: ${finalCount[0].cnt}`);
  console.log(`  إجمالي السائقين: ${driverCount[0].cnt}`);
  console.log(`  إجمالي المركبات: ${vehicleCount[0].cnt}`);
  console.log(`  إجمالي أنواع البضائع: ${goodsCount[0].cnt}`);
  console.log(`${"=".repeat(60)}`);

  await conn.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
