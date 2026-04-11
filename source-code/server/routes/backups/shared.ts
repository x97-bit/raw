import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { z } from "zod";
import { buildMySqlConnectionOptions } from "../../_core/mysqlConfig";
import { RequestValidationError, validateInput } from "../../_core/requestValidation";

export const BACKUP_FORMAT = "alrawi-backup-v1";
export const BACKUP_IMPORT_CONFIRM_PHRASE = "IMPORT_BACKUP";

const HIDDEN_TABLES = new Set(["__drizzle_migrations"]);
const SKIP_IMPORT_BY_DEFAULT = new Set(["__drizzle_migrations", "app_users"]);
const JSON_DATA_TYPES = new Set(["json"]);
const DATE_LIKE_TYPES = new Set(["date", "datetime", "timestamp"]);
const DEFAULT_APP_BACKUP_DIR = path.resolve(process.cwd(), "database", "backups", "app-backups");
const DEFAULT_IMPORT_REPORT_DIR = path.resolve(process.cwd(), "database", "import-reports", "backups");
const DEFAULT_SQL_BACKUP_DIR = process.platform === "win32"
  ? path.resolve(process.cwd(), "database", "backups", "daily-sql")
  : "/var/backups/alrawi/mysql";
const DEFAULT_DAILY_SCRIPT_PATH = process.platform === "win32"
  ? path.resolve(process.cwd(), "deploy", "vps", "backup-db.sh")
  : path.resolve(process.cwd(), "deploy", "vps", "backup-db.sh");
const DEFAULT_RECOMMENDED_CRON = `${DEFAULT_DAILY_SCRIPT_PATH} >> /var/log/alrawi-db-backup.log 2>&1`;
const DEFAULT_DAILY_RETENTION_DAYS = Number.parseInt(process.env.DAILY_BACKUP_RETENTION_DAYS || "14", 10) || 14;

export const APP_BACKUP_DIR = process.env.APP_BACKUP_DIR || DEFAULT_APP_BACKUP_DIR;
export const IMPORT_REPORT_DIR = process.env.IMPORT_REPORT_DIR || DEFAULT_IMPORT_REPORT_DIR;
export const SQL_BACKUP_DIR = process.env.SQL_BACKUP_DIR || DEFAULT_SQL_BACKUP_DIR;
export const DAILY_BACKUP_SCRIPT_PATH = process.env.DAILY_BACKUP_SCRIPT_PATH || DEFAULT_DAILY_SCRIPT_PATH;
export const DAILY_BACKUP_RECOMMENDED_CRON = process.env.DAILY_BACKUP_RECOMMENDED_CRON || `0 3 * * * ${DEFAULT_RECOMMENDED_CRON}`;
export const DAILY_BACKUP_RETENTION_DAYS = DEFAULT_DAILY_RETENTION_DAYS;

const tablePriorityOrder = [
  "users",
  "app_users",
  "ports",
  "account_types",
  "cash_state",
  "goods_types",
  "governorates",
  "drivers",
  "vehicles",
  "companies",
  "accounts",
  "route_defaults",
  "account_defaults",
  "transactions",
  "debts",
  "expenses",
  "payment_matching",
  "field_config",
  "custom_fields",
  "custom_field_values",
  "special_accounts",
  "audit_logs",
  "entity_aliases",
];

const backupImportRequestSchema = z.object({
  backup: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).or(
    z.object({
      meta: z.record(z.string(), z.unknown()).optional(),
      schema: z.record(z.string(), z.unknown()).optional(),
      counts: z.record(z.string(), z.unknown()).optional(),
      data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
    }),
  ),
  confirmPhrase: z.string().trim().optional(),
  includeUsers: z.boolean().optional(),
  sourceFileName: z.string().trim().max(255).optional(),
});

type BackupColumn = {
  name: string;
  type: string;
  dataType: string;
  nullable: boolean;
  defaultValue: string | number | null;
  key: string;
  extra: string;
};

type BackupFileInfo = {
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  return databaseUrl;
}

function parseDatabaseInfo(databaseUrl: string) {
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || ""),
    database: url.pathname.replace(/^\/+/, ""),
  };
}

function sanitizeTimestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function maskDatabaseUrl(databaseUrl: string) {
  return databaseUrl.replace(/:\/\/([^:/?#]+):([^@]+)@/, "://$1:***@");
}

function ensureBackupObjectShape(payload: unknown) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload as {
      meta?: Record<string, unknown>;
      schema?: Record<string, unknown>;
      counts?: Record<string, unknown>;
      data: Record<string, Array<Record<string, unknown>>>;
    };
  }

  if (payload && typeof payload === "object") {
    return {
      data: payload as Record<string, Array<Record<string, unknown>>>,
    };
  }

  throw new RequestValidationError("ملف النسخة الاحتياطية غير صالح.");
}

async function openBackupConnection() {
  const databaseUrl = getDatabaseUrl();
  const connectionOptions = {
    ...buildMySqlConnectionOptions(databaseUrl),
    dateStrings: true,
  };

  return mysql.createConnection(connectionOptions);
}

async function listExportableTables(connection: mysql.Connection) {
  const [rows] = await connection.query("SHOW TABLES");
  const tableRows = rows as Array<Record<string, unknown>>;

  return tableRows
    .map((row) => {
      const firstKey = Object.keys(row)[0];
      return String((row as Record<string, unknown>)[firstKey] || "");
    })
    .filter((tableName) => tableName && !HIDDEN_TABLES.has(tableName));
}

async function getTableSchemas(
  connection: mysql.Connection,
  databaseName: string,
  tableNames: string[],
) {
  if (tableNames.length === 0) {
    return {} as Record<string, BackupColumn[]>;
  }

  const placeholders = tableNames.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `
      SELECT
        TABLE_NAME AS tableName,
        COLUMN_NAME AS columnName,
        COLUMN_TYPE AS columnType,
        DATA_TYPE AS dataType,
        IS_NULLABLE AS isNullable,
        COLUMN_DEFAULT AS columnDefault,
        COLUMN_KEY AS columnKey,
        EXTRA AS extra
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN (${placeholders})
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `,
    [databaseName, ...tableNames],
  );

  const result: Record<string, BackupColumn[]> = {};

  for (const row of rows as Array<Record<string, unknown>>) {
    const tableName = String(row.tableName || "");
    if (!result[tableName]) {
      result[tableName] = [];
    }

    result[tableName].push({
      name: String(row.columnName || ""),
      type: String(row.columnType || ""),
      dataType: String(row.dataType || ""),
      nullable: String(row.isNullable || "").toUpperCase() === "YES",
      defaultValue: (row.columnDefault as string | number | null | undefined) ?? null,
      key: String(row.columnKey || ""),
      extra: String(row.extra || ""),
    });
  }

  return result;
}

async function readTableRows(connection: mysql.Connection, tableName: string) {
  const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
  return rows as Array<Record<string, unknown>>;
}

async function readBackupFiles(directory: string, pattern: RegExp, limit = 8): Promise<BackupFileInfo[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && pattern.test(entry.name))
        .map(async (entry) => {
          const filePath = path.join(directory, entry.name);
          const stats = await fs.stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            sizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          };
        }),
    );

    return files
      .sort((left, right) => Date.parse(right.modifiedAt) - Date.parse(left.modifiedAt))
      .slice(0, limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function sortTablesByPriority(tableNames: string[]) {
  const priorityMap = new Map(tablePriorityOrder.map((tableName, index) => [tableName, index]));

  return [...tableNames].sort((left, right) => {
    const leftPriority = priorityMap.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priorityMap.get(right) ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.localeCompare(right);
  });
}

function normalizeValueForInsert(tableName: string, column: BackupColumn, value: unknown) {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value === "" && DATE_LIKE_TYPES.has(column.dataType)) {
    if (!column.nullable) {
      throw new RequestValidationError(`الحقل ${column.name} في الجدول ${tableName} يحتوي تاريخاً فارغاً غير صالح.`);
    }

    return null;
  }

  if (value !== null && JSON_DATA_TYPES.has(column.dataType) && typeof value !== "string") {
    return JSON.stringify(value);
  }

  return value;
}

async function insertRowsInChunks(
  connection: mysql.Connection,
  tableName: string,
  columns: BackupColumn[],
  rows: Array<Record<string, unknown>>,
) {
  if (rows.length === 0 || columns.length === 0) {
    return;
  }

  const chunkSize = 200;
  const columnNames = columns.map((column) => column.name);
  const escapedColumnList = columnNames.map((columnName) => `\`${columnName}\``).join(", ");
  const rowPlaceholder = `(${columnNames.map(() => "?").join(", ")})`;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const placeholders = chunk.map(() => rowPlaceholder).join(", ");
    const values = chunk.flatMap((row) => (
      columns.map((column) => normalizeValueForInsert(tableName, column, row[column.name]))
    ));

    await connection.query(
      `INSERT INTO \`${tableName}\` (${escapedColumnList}) VALUES ${placeholders}`,
      values,
    );
  }
}

async function writeJsonFile(filePath: string, payload: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function buildBackupPayload({
  templateOnly = false,
  generatedBy,
}: {
  templateOnly?: boolean;
  generatedBy?: string | null;
}) {
  const databaseUrl = getDatabaseUrl();
  const databaseInfo = parseDatabaseInfo(databaseUrl);
  const connection = await openBackupConnection();

  try {
    const tableNames = sortTablesByPriority(await listExportableTables(connection));
    const schema = await getTableSchemas(connection, databaseInfo.database, tableNames);
    const data: Record<string, Array<Record<string, unknown>>> = {};
    const counts: Record<string, number> = {};

    for (const tableName of tableNames) {
      const rows = templateOnly ? [] : await readTableRows(connection, tableName);
      data[tableName] = rows;
      counts[tableName] = rows.length;
    }

    return {
      meta: {
        format: BACKUP_FORMAT,
        templateOnly,
        createdAt: new Date().toISOString(),
        generatedBy: generatedBy || null,
        database: {
          host: databaseInfo.host,
          port: databaseInfo.port,
          name: databaseInfo.database,
          user: databaseInfo.user,
        },
        databaseUrlMasked: maskDatabaseUrl(databaseUrl),
        notes: templateOnly
          ? [
            "هذا قالب قاعدة بيانات بدون بيانات تشغيلية.",
            "الاستيراد من القالب غير مسموح حفاظاً على سلامة البيانات.",
          ]
          : [
            "هذه نسخة احتياطية كاملة بصيغة JSON.",
            "استيراد النسخة يحفظ مستخدمي النظام الحاليين بشكل افتراضي.",
          ],
      },
      schema,
      counts,
      data,
    };
  } finally {
    await connection.end();
  }
}

export async function saveBackupPayload(payload: unknown, prefix = "alrawi-backup") {
  const fileName = `${prefix}-${sanitizeTimestampForFile()}.json`;
  const filePath = path.join(APP_BACKUP_DIR, fileName);

  await writeJsonFile(filePath, payload);

  return {
    fileName,
    filePath,
  };
}

export async function saveImportReport(payload: unknown) {
  const fileName = `backup-import-report-${sanitizeTimestampForFile()}.json`;
  const filePath = path.join(IMPORT_REPORT_DIR, fileName);

  await writeJsonFile(filePath, payload);

  return {
    fileName,
    filePath,
  };
}

export async function getBackupStatus() {
  const databaseUrl = getDatabaseUrl();
  const databaseInfo = parseDatabaseInfo(databaseUrl);
  const connection = await openBackupConnection();

  try {
    const tableNames = sortTablesByPriority(await listExportableTables(connection));
    const tableCounts: Record<string, number> = {};

    for (const tableName of tableNames) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
      tableCounts[tableName] = Number((rows as Array<Record<string, unknown>>)[0]?.count || 0);
    }

    const appGenerated = await readBackupFiles(APP_BACKUP_DIR, /\.json$/i);
    const dailySql = await readBackupFiles(SQL_BACKUP_DIR, /\.sql(?:\.gz)?$/i);
    const scriptExists = await pathExists(DAILY_BACKUP_SCRIPT_PATH);
    const sqlDirectoryExists = await pathExists(SQL_BACKUP_DIR);
    const latestDailyBackup = dailySql[0] || null;
    const latestDailyBackupAgeMs = latestDailyBackup
      ? Date.now() - Date.parse(latestDailyBackup.modifiedAt)
      : Number.POSITIVE_INFINITY;

    return {
      format: BACKUP_FORMAT,
      generatedAt: new Date().toISOString(),
      database: {
        host: databaseInfo.host,
        port: databaseInfo.port,
        name: databaseInfo.database,
        user: databaseInfo.user,
        urlMasked: maskDatabaseUrl(databaseUrl),
      },
      directories: {
        appJson: APP_BACKUP_DIR,
        importReports: IMPORT_REPORT_DIR,
        dailySql: SQL_BACKUP_DIR,
      },
      tableCounts,
      latestBackups: {
        appGenerated,
        dailySql,
      },
      dailyBackup: {
        scriptPath: DAILY_BACKUP_SCRIPT_PATH,
        scriptExists,
        sqlDirectoryExists,
        recommendedCron: DAILY_BACKUP_RECOMMENDED_CRON,
        retentionDays: DAILY_BACKUP_RETENTION_DAYS,
        latestBackup: latestDailyBackup,
        healthy: Boolean(latestDailyBackup) && latestDailyBackupAgeMs <= 36 * 60 * 60 * 1000,
      },
    };
  } finally {
    await connection.end();
  }
}

export function buildDownloadFileName(prefix: string, extension = "json") {
  return `${prefix}-${sanitizeTimestampForFile()}.${extension}`;
}

export function parseImportRequest(payload: unknown) {
  return validateInput(backupImportRequestSchema, payload, "طلب الاستيراد غير صالح.");
}

export async function importBackupPayload({
  backup,
  includeUsers = false,
  sourceFileName,
  generatedBy,
}: {
  backup: unknown;
  includeUsers?: boolean;
  sourceFileName?: string;
  generatedBy?: string | null;
}) {
  const normalizedBackup = ensureBackupObjectShape(backup);
  const backupMeta = normalizedBackup.meta || {};

  if (backupMeta.templateOnly) {
    throw new RequestValidationError("لا يمكن استيراد قالب القاعدة. استخدم نسخة احتياطية فعلية فقط.");
  }

  if (backupMeta.format && backupMeta.format !== BACKUP_FORMAT) {
    throw new RequestValidationError("صيغة ملف النسخة الاحتياطية غير مدعومة.");
  }

  const liveSnapshot = await buildBackupPayload({
    templateOnly: false,
    generatedBy: generatedBy || "system",
  });
  const preImportBackup = await saveBackupPayload(liveSnapshot, "alrawi-pre-import");

  const connection = await openBackupConnection();

  try {
    const databaseInfo = parseDatabaseInfo(getDatabaseUrl());
    const availableTables = new Set(await listExportableTables(connection));
    const requestedTables = Object.keys(normalizedBackup.data || {});
    const skippedTables: string[] = [];

    const importableTables = sortTablesByPriority(
      requestedTables.filter((tableName) => {
        if (!availableTables.has(tableName)) {
          skippedTables.push(tableName);
          return false;
        }

        if (!includeUsers && SKIP_IMPORT_BY_DEFAULT.has(tableName)) {
          skippedTables.push(tableName);
          return false;
        }

        return true;
      }),
    );

    if (importableTables.length === 0) {
      throw new RequestValidationError("لا توجد جداول قابلة للاستيراد داخل الملف.");
    }

    const liveSchema = await getTableSchemas(connection, databaseInfo.database, importableTables);
    const tableImportCounts: Record<string, number> = {};

    await connection.beginTransaction();

    try {
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      for (const tableName of importableTables) {
        await connection.query(`DELETE FROM \`${tableName}\``);
      }

      for (const tableName of importableTables) {
        const tableRows = normalizedBackup.data[tableName] || [];
        const tableColumns = (liveSchema[tableName] || []).filter((column) => !column.extra.includes("VIRTUAL GENERATED"));
        await insertRowsInChunks(connection, tableName, tableColumns, tableRows);
        tableImportCounts[tableName] = tableRows.length;
      }

      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      throw error;
    }

    const report = {
      meta: {
        action: "backup-import",
        createdAt: new Date().toISOString(),
        generatedBy: generatedBy || null,
        sourceFileName: sourceFileName || null,
        includeUsers,
        format: backupMeta.format || BACKUP_FORMAT,
        preImportBackupPath: preImportBackup.filePath,
      },
      importedTables: importableTables,
      skippedTables,
      counts: tableImportCounts,
    };

    const reportFile = await saveImportReport(report);

    return {
      message: "تم استيراد النسخة الاحتياطية بنجاح.",
      preImportBackup,
      reportFile,
      importedTables: importableTables,
      skippedTables,
      counts: tableImportCounts,
    };
  } finally {
    await connection.end();
  }
}
