import fs from "node:fs/promises";
import path from "node:path";

const LOGS_DIR = path.resolve(process.cwd(), "database", "logs");
const ERROR_LOG_PATH = path.join(LOGS_DIR, "server-errors.log");
const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

async function ensureLogsDirectory() {
  try {
    await fs.access(LOGS_DIR);
  } catch {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  }
}

async function rotateLogIfNeeded() {
  try {
    const stat = await fs.stat(ERROR_LOG_PATH);
    if (stat.size >= MAX_LOG_SIZE_BYTES) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const archivePath = path.join(LOGS_DIR, `server-errors.${timestamp}.log`);
      await fs.rename(ERROR_LOG_PATH, archivePath);
    }
  } catch {
    // File doesn't exist yet or rotation failed — both are non-fatal.
  }
}

/**
 * Logs an error to a persistent file with automatic rotation at 10 MB.
 */
export async function logSystemError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
) {
  try {
    await ensureLogsDirectory();
    await rotateLogIfNeeded();

    const timestamp = new Date().toISOString();
    let errorMessage = "Unknown error";
    let stackTrace = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      stackTrace = error.stack || "";
    } else if (typeof error === "string") {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    const formattedLog = `[${timestamp}] [${context}] ${errorMessage}\n${
      stackTrace ? `${stackTrace}\n` : ""
    }${
      additionalData ? `Data: ${JSON.stringify(additionalData)}\n` : ""
    }--------------------------------------------------\n`;

    await fs.appendFile(ERROR_LOG_PATH, formattedLog, "utf8");

    // Also log to console in development or if needed
    console.error(`[Error Tracking] ${context}:`, errorMessage);
  } catch (fsError) {
    console.error("[Error Tracking] Failed to write to error log file:", fsError);
    console.error("[Error Tracking] Original Error:", error);
  }
}
