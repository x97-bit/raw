import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { buildMySqlConnectionOptions } from "../shared/scriptMysqlConfig.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..", "..");
const DATABASE_DIR = path.join(ROOT_DIR, "database");
const BACKUPS_DIR = path.join(DATABASE_DIR, "backups");
const REPORTS_DIR = path.join(DATABASE_DIR, "import-reports");
const SPECIAL_ACCOUNT_NAME = "ياسر عادل";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function parseArgs(argv) {
  const args = { apply: false, file: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--apply") {
      args.apply = true;
      continue;
    }
    if (value === "--file") {
      args.file = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (!args.file) args.file = value;
  }
  return args;
}

function loadDatabaseUrl() {
  const envPath = path.join(ROOT_DIR, ".env");
  const envText = fs.readFileSync(envPath, "utf8");
  const match = envText.match(/DATABASE_URL\s*=\s*(.+)/);
  if (!match) throw new Error("DATABASE_URL is missing from source-code/.env");
  return match[1].trim();
}

function extractPdfRows(pdfPath) {
  const tempOutputPath = path.join(
    DATABASE_DIR,
    "tmp",
    "yaser-pdf-extracted.json"
  );
  ensureDir(path.dirname(tempOutputPath));
  const pythonCode = `
import fitz, json, re, sys
pdf = fitz.open(sys.argv[1])
output_path = sys.argv[2]
pat = re.compile(r'(\\d{1,2}/\\d{1,2}/\\d{4})')
rows = []
for page_index, page in enumerate(pdf, 1):
    tables = page.find_tables().tables
    for table in tables:
        for row in table.extract():
            cells = [(cell or '').strip() for cell in row]
            if any(pat.search(cell) for cell in cells):
                rows.append({'page': page_index, 'cells': cells})
with open(output_path, 'w', encoding='utf-8') as handle:
    json.dump(rows, handle, ensure_ascii=False)
`.trim();

  const result = spawnSync(
    "python",
    ["-c", pythonCode, pdfPath, tempOutputPath],
    {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    }
  );

  if (result.status !== 0) {
    throw new Error(
      `Python PDF extraction failed: ${result.stderr || result.stdout || "unknown error"}`
    );
  }

  return JSON.parse(fs.readFileSync(tempOutputPath, "utf8"));
}

function cleanCell(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\(cid:\d+\)/g, "")
    .replace(/[\u1680\u1800-\u18AF\u2000-\u206F\u2C7C-\u2C7F]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArabic(value) {
  return cleanCell(value)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{Script=Arabic}0-9/ ]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function reverseToken(token) {
  return [...token].reverse().join("");
}

function humanizeRtlText(value) {
  const base = normalizeArabic(value);
  if (!base) return "";
  const tokens = base.split(" ").filter(Boolean);
  return tokens.reverse().map(reverseToken).join(" ").trim();
}

function parseNumber(value) {
  const normalized = cleanCell(value).replace(/,/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value, scale = 2) {
  const numberValue = Number(value || 0);
  return numberValue.toFixed(scale);
}

function toIsoDate(value) {
  const cleaned = cleanCell(value);
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function compactSpaces(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCommonArabicFragments(value) {
  return compactSpaces(String(value ?? ""))
    .replace(/سورا/gu, "سوريا")
    .replace(/هامح/gu, "حماه")
    .replace(/بلح/gu, "حلب")
    .replace(/لدبا/gu, "ادلب");
}

function normalizeNotes(value) {
  const normalized = normalizeArabic(value);
  if (!normalized) return null;
  if (normalized.includes("قباس") && normalized.includes("بلط"))
    return "طلب سابق";
  if (normalized === "لصاو") return "واصل";
  if (normalized.includes("لصاو") && normalized.includes("لداع"))
    return "واصل من ياسر عادل";
  if (normalized.includes("قرف") && normalized.includes("ددع"))
    return "فرق عدد الاغنام";
  return (
    compactSpaces(humanizeRtlText(value)) ||
    compactSpaces(cleanCell(value)) ||
    null
  );
}

function normalizeGoodType(value) {
  const normalized = normalizeArabic(value);
  if (!normalized) return null;
  if (normalized.includes("زعام")) return "ماعز";
  if (normalized.includes("غ") || normalized.includes("ن")) return "غنم";
  return (
    compactSpaces(humanizeRtlText(value)) ||
    compactSpaces(cleanCell(value)) ||
    null
  );
}

function normalizePort(value) {
  const normalized = normalizeArabic(value);
  if (!normalized) return null;
  if (normalized.includes("ك") || normalized.includes("ت")) return "كويت";
  return (
    compactSpaces(humanizeRtlText(value)) ||
    compactSpaces(cleanCell(value)) ||
    null
  );
}

function normalizeVehiclePlate(value) {
  const cleaned = cleanCell(value);
  if (!cleaned) return null;
  const parts = String(value ?? "")
    .split(/\r?\n+/)
    .map(part => normalizeCommonArabicFragments(compactSpaces(cleanCell(part))))
    .filter(Boolean);

  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const suffix =
    normalizeCommonArabicFragments(
      compactSpaces(humanizeRtlText(parts.slice(1).join(" ")))
    ) || parts.slice(1).join(" / ");
  return suffix ? `${parts[0]} / ${suffix}` : parts[0];
}

function scoreText(a, b) {
  const left = a.replace(/\s+/g, "");
  const right = b.replace(/\s+/g, "");
  if (!left || !right) return 0;
  let common = 0;
  for (const char of new Set(left)) {
    if (right.includes(char)) common += 1;
  }
  const diversityScore =
    common / Math.max(new Set(left).size, new Set(right).size, 1);
  const prefixScore = left.slice(0, 2) === right.slice(0, 2) ? 0.15 : 0;
  return diversityScore + prefixScore;
}

function buildTextCandidates(rawValue) {
  const normalized = normalizeArabic(rawValue);
  if (!normalized) return [];
  const tokens = normalized.split(" ").filter(Boolean);
  const variants = new Set([normalized, humanizeRtlText(rawValue)]);
  variants.add([...normalized].reverse().join(""));
  if (tokens.length) {
    variants.add(tokens.slice().reverse().join(" "));
    variants.add(tokens.map(reverseToken).join(" "));
    variants.add(tokens.slice().reverse().map(reverseToken).join(" "));
  }
  return [...variants].map(compactSpaces).filter(Boolean);
}

const DRIVER_MANUAL_MAP = {
  "سح رطاخ مولسلا": "خاطر حسين السلوم",
  "سح دمحم يملا": "محمد حسين المصري",
  "ح رماس": "سامر يحيى",
  "سح دومحم قازر": "محمود حسين رزاق",
  "زعلا دع مسا خيش": "باسم عبد العزيز شيخ",
  "نادز دمحم دومحلا": "محمد زيدان الحمود",
  "رت قازرلا دع": "عبد الرزاق تركي",
  "سح قراط يملا": "طارق حسين المصري",
  "طصم رياث حلا": "ثائر مصطفى الحاج",
  "ضار دمحا فوطسلا": "احمد رياض السطوف",
  "زياف فطللا دع": "عبد اللطيف فايز",
  "زياف فطللادع": "عبد اللطيف فايز",
  "ومش سح دمحا": "احمد حسين شمو",
  "ناندع سراف": "فارس عدنان",
  "قاقد دمحا مثيه": "هيثم احمد دقاق",
  "للاه ناوضر ا": "ياسر رضوان هلال",
  "زعلا دع ق": "قيس عبد العزيز",
  "مساجلا ع للا": "بلال علي الجاسم",
  "دع رداقلا دع ملا": "عبد القادر عبد الكريم",
  "يويلعلا رد ضار": "رياض بدر العليوي",
  "دومحم ملا دع فاطس": "عبد الكريم محمود سطاف",
  "دومحم ملا دع فاطص": "عبد الكريم محمود سطاف",
  "فسوي رامع شدرك": "عمار يوسف كردش",
  "وهسلا دع رهوج": "جوهر عبد السهو",
  "نمحرلا دع داز جاحلا": "زياد عبد الرحمن الحاج",
};

const COMPANY_MANUAL_MAP = {
  "هملاسلا هك": "شركة السلامة",
  "هادلا هك": "شركة البداية",
  "هعلا هقراشلا": "الشارقة العربية",
  "هدحتملا روحلا هك": "شركة الحور المتحدة",
  "هوخلاا هك": "شركة الاخوة",
  "هدحتملا هملاسلا": "السلامة المتحدة",
  "رعلا زكرملا": "المركز العربي",
  "يرمشلا هك": "شركة الشمري",
  "هقراشلا هسسوم": "مؤسسة الشارقة",
  "هرادصلا هك": "شركة الصدارة",
  "مس لا راونا": "انوار النسيم",
  "فورخلا همحلم هك": "شركة ملحمة الخروف",
  "هذلا ناتسلا هك": "شركة البستان الذهبي",
};

function normalizeCompanyName(value) {
  const normalized = normalizeArabic(value);
  if (!normalized) return null;
  if (COMPANY_MANUAL_MAP[normalized]) return COMPANY_MANUAL_MAP[normalized];
  const humanized = humanizeRtlText(value);
  return humanized ? humanized.replace(/^(?:هك|كه)\s+/u, "شركة ") : null;
}

function pickDriverName(rawValue, driverCandidates) {
  const normalized = normalizeArabic(rawValue);
  if (!normalized) return { value: null, confidence: 0, source: "empty" };
  if (DRIVER_MANUAL_MAP[normalized])
    return {
      value: DRIVER_MANUAL_MAP[normalized],
      confidence: 1,
      source: "manual",
    };

  const readable = compactSpaces(humanizeRtlText(rawValue));
  const variants = buildTextCandidates(rawValue);
  let best = {
    value: readable || compactSpaces(cleanCell(rawValue)),
    confidence: 0,
    source: "humanized",
  };

  for (const variant of variants) {
    for (const candidate of driverCandidates) {
      const similarity = scoreText(variant, candidate.norm);
      if (similarity > best.confidence) {
        best = {
          value: candidate.raw,
          confidence: similarity,
          source: "lookup",
        };
      }
    }
  }

  if (best.source === "lookup" && best.confidence >= 0.9) return best;
  return {
    value: normalizeCommonArabicFragments(readable || best.value),
    confidence: best.confidence,
    source: best.source === "lookup" ? "humanized_fallback" : best.source,
  };
}

function buildExtractedRecord(entry, driverCandidates) {
  const cells = [...entry.cells];
  while (cells.length < 13) cells.push("");
  const [
    companyRaw,
    notesRaw,
    taxiWaterRaw,
    differenceRaw,
    clrRaw,
    amountPartnerRaw,
    amountRaw,
    portRaw,
    dateRaw,
    qtyRaw,
    goodTypeRaw,
    plateRaw,
    driverRaw,
  ] = cells;

  const driver = pickDriverName(driverRaw, driverCandidates);
  const isoDate = toIsoDate(dateRaw);

  return {
    page: entry.page,
    date: isoDate,
    companyName: normalizeCompanyName(companyRaw),
    notes: normalizeNotes(notesRaw),
    taxiWater: parseNumber(taxiWaterRaw),
    differenceIQD: parseNumber(differenceRaw),
    clr: parseNumber(clrRaw),
    amountUSDPartner: parseNumber(amountPartnerRaw),
    amountUSD: parseNumber(amountRaw),
    portName: normalizePort(portRaw),
    qty: parseNumber(qtyRaw) || null,
    goodType: normalizeGoodType(goodTypeRaw),
    vehiclePlate: normalizeVehiclePlate(plateRaw),
    driverName: driver.value || null,
    driverConfidence: driver.confidence,
    driverSource: driver.source,
    raw: {
      company: companyRaw || null,
      notes: notesRaw || null,
      port: portRaw || null,
      goodType: goodTypeRaw || null,
      plate: plateRaw || null,
      driver: driverRaw || null,
    },
  };
}

function countByDate(rows, key) {
  return rows.reduce((acc, row) => {
    const date = row[key];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
}

function sameDistribution(left, right) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key, index) => key === rightKeys[index] && left[key] === right[key]
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error(
      'Usage: node scripts/imports/import-yaser-pdf.mjs --file "C:\\path\\to\\yaser.pdf" [--apply]'
    );
  }

  const pdfPath = path.resolve(args.file);
  if (!fs.existsSync(pdfPath))
    throw new Error(`PDF file not found: ${pdfPath}`);

  ensureDir(BACKUPS_DIR);
  ensureDir(REPORTS_DIR);

  const extractedRows = extractPdfRows(pdfPath);
  const databaseUrl = loadDatabaseUrl();
  const connection = await mysql.createConnection(
    buildMySqlConnectionOptions(databaseUrl)
  );

  try {
    const [existingRows] = await connection.query(
      `select * from special_accounts where type in ('yaser', 'partnership') order by date asc, id asc`
    );
    const [drivers] = await connection.query(
      `select name from drivers order by name asc`
    );

    const driverCandidates = drivers.map(row => ({
      raw: row.name,
      norm: normalizeArabic(row.name),
    }));

    const parsedRows = extractedRows.map(entry =>
      buildExtractedRecord(entry, driverCandidates)
    );
    const extractedByDate = countByDate(parsedRows, "date");
    const existingByDate = countByDate(existingRows, "date");

    if (existingRows.length !== parsedRows.length) {
      throw new Error(
        `Row count mismatch: DB=${existingRows.length}, PDF=${parsedRows.length}`
      );
    }
    if (!sameDistribution(existingByDate, extractedByDate)) {
      throw new Error(
        "Date distribution mismatch between DB rows and PDF rows"
      );
    }

    const mergedRows = existingRows.map((row, index) => {
      const extracted = parsedRows[index];
      return {
        id: row.id,
        legacyType: row.type,
        nextType: "partnership",
        date: extracted.date,
        name: SPECIAL_ACCOUNT_NAME,
        traderName: SPECIAL_ACCOUNT_NAME,
        driverName: extracted.driverName,
        vehiclePlate: extracted.vehiclePlate,
        goodType: extracted.goodType,
        govName: null,
        portName: extracted.portName,
        companyName: extracted.companyName,
        batchName: null,
        destination: null,
        amountUSD: formatDecimal(extracted.amountUSD, 2),
        amountIQD: formatDecimal(0, 0),
        costUSD: formatDecimal(0, 2),
        costIQD: formatDecimal(0, 0),
        amountUSDPartner: formatDecimal(extracted.amountUSDPartner, 2),
        differenceIQD: formatDecimal(extracted.differenceIQD, 0),
        clr: formatDecimal(extracted.clr, 2),
        tx: formatDecimal(0, 2),
        taxiWater: formatDecimal(extracted.taxiWater, 2),
        weight: null,
        meters: null,
        qty: extracted.qty,
        description: extracted.notes || "",
        notes: extracted.notes || "",
        extracted,
      };
    });

    const lowConfidenceDrivers = mergedRows
      .filter(
        row =>
          row.extracted.driverSource !== "manual" &&
          row.extracted.driverSource !== "lookup"
      )
      .map(row => ({
        id: row.id,
        date: row.date,
        driverName: row.driverName,
        rawDriver: row.extracted.raw.driver,
        confidence: row.extracted.driverConfidence,
      }));

    const report = {
      sourcePdf: pdfPath,
      mode: args.apply ? "apply" : "dry-run",
      totalRows: mergedRows.length,
      dateDistribution: extractedByDate,
      migratedFromLegacyType: existingRows.filter(row => row.type === "yaser")
        .length,
      lowConfidenceDriverRows: lowConfidenceDrivers.length,
      lowConfidenceDriverSamples: lowConfidenceDrivers.slice(0, 20),
      sampleRows: mergedRows.slice(0, 10).map(row => ({
        id: row.id,
        date: row.date,
        driverName: row.driverName,
        vehiclePlate: row.vehiclePlate,
        goodType: row.goodType,
        qty: row.qty,
        portName: row.portName,
        companyName: row.companyName,
        amountUSD: row.amountUSD,
        amountUSDPartner: row.amountUSDPartner,
        clr: row.clr,
        differenceIQD: row.differenceIQD,
        taxiWater: row.taxiWater,
        notes: row.notes,
      })),
    };

    const reportPath = path.join(
      REPORTS_DIR,
      `yaser-pdf-import-${timestampForFile()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    if (!args.apply) {
      console.log(
        JSON.stringify(
          { message: "dry-run complete", reportPath, report },
          null,
          2
        )
      );
      return;
    }

    const backupPath = path.join(
      BACKUPS_DIR,
      `pre-yaser-pdf-import-${timestampForFile()}.json`
    );
    fs.writeFileSync(backupPath, JSON.stringify(existingRows, null, 2), "utf8");

    await connection.beginTransaction();
    for (const row of mergedRows) {
      await connection.query(
        `update special_accounts
         set type = ?, name = ?, traderName = ?, driverName = ?, vehiclePlate = ?, goodType = ?,
             govName = ?, portName = ?, companyName = ?, batchName = ?, destination = ?,
             amountUSD = ?, amountIQD = ?, costUSD = ?, costIQD = ?, amountUSDPartner = ?,
             differenceIQD = ?, clr = ?, tx = ?, taxiWater = ?, weight = ?, meters = ?,
             qty = ?, description = ?, notes = ?, date = ?
         where id = ?`,
        [
          row.nextType,
          row.name,
          row.traderName,
          row.driverName,
          row.vehiclePlate,
          row.goodType,
          row.govName,
          row.portName,
          row.companyName,
          row.batchName,
          row.destination,
          row.amountUSD,
          row.amountIQD,
          row.costUSD,
          row.costIQD,
          row.amountUSDPartner,
          row.differenceIQD,
          row.clr,
          row.tx,
          row.taxiWater,
          row.weight,
          row.meters,
          row.qty,
          row.description,
          row.notes,
          row.date,
          row.id,
        ]
      );
    }

    await connection.query(
      `insert into audit_logs (entity_type, entity_id, action, summary, after_data, metadata, user_id, username, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, now())`,
      [
        "special_account_import",
        0,
        "import",
        "استيراد وتطبيع بيانات ياسر عادل من PDF",
        JSON.stringify({
          totalRows: mergedRows.length,
          migratedFromLegacyType: report.migratedFromLegacyType,
        }),
        JSON.stringify({
          sourcePdf: pdfPath,
          reportPath,
          backupPath,
        }),
        null,
        "system-import",
      ]
    );

    await connection.commit();
    console.log(
      JSON.stringify(
        { message: "apply complete", reportPath, backupPath, report },
        null,
        2
      )
    );
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
