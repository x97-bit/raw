import readline from "node:readline";
import crypto from "node:crypto";

// ============================================================================
// Safety Guard for Dangerous Operations
// ============================================================================
// This module provides safety mechanisms for scripts that perform destructive
// operations on production databases. It enforces:
// 1. Environment verification (prevents running against wrong database)
// 2. Multi-step confirmation with random code verification
// 3. Audit logging of who ran what and when
// 4. Automatic backup verification before proceeding
// ============================================================================

const DANGEROUS_KEYWORDS = ["production", "prod", "live", "main"];

/**
 * Verify that the target database URL is safe to operate on.
 * Blocks execution if the URL appears to be a production database
 * and the script was not explicitly invoked with --production flag.
 */
export function verifyEnvironment(databaseUrl, options = {}) {
  const { allowProduction = false, scriptName = "unknown" } = options;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  const urlLower = databaseUrl.toLowerCase();
  const isProduction = DANGEROUS_KEYWORDS.some(
    (keyword) => urlLower.includes(keyword)
  );

  if (isProduction && !allowProduction) {
    console.error("");
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║  ⚠️  PRODUCTION DATABASE DETECTED                        ║");
    console.error("║                                                          ║");
    console.error("║  This script appears to target a production database.    ║");
    console.error("║  If this is intentional, re-run with --production flag.  ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    console.error("");
    console.error(`  Script: ${scriptName}`);
    console.error(`  Target: ${maskDatabaseUrl(databaseUrl)}`);
    console.error("");
    process.exit(1);
  }

  return { isProduction };
}

/**
 * Require multi-step confirmation before proceeding with a dangerous operation.
 * Generates a random 6-character code that the user must type to confirm.
 */
export async function requireConfirmation(options = {}) {
  const {
    operationName = "dangerous operation",
    description = "",
    targetDatabase = "",
  } = options;

  const confirmCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  ⚠️  CONFIRMATION REQUIRED                               ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Operation: ${operationName.padEnd(43)}║`);
  if (description) {
    console.log(`║  Details: ${description.substring(0, 45).padEnd(45)}║`);
  }
  if (targetDatabase) {
    console.log(`║  Target: ${maskDatabaseUrl(targetDatabase).padEnd(46)}║`);
  }
  console.log("║                                                          ║");
  console.log(`║  To confirm, type this code: ${confirmCode}                  ║`);
  console.log("║  Type 'abort' to cancel.                                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("  Enter confirmation code: ", (answer) => {
      rl.close();
      const trimmed = answer.trim().toUpperCase();

      if (trimmed === "ABORT") {
        console.log("\n  ✅ Operation aborted by user.\n");
        process.exit(0);
      }

      if (trimmed !== confirmCode) {
        console.error("\n  ❌ Invalid confirmation code. Operation aborted.\n");
        process.exit(1);
      }

      console.log("\n  ✅ Confirmed. Proceeding...\n");
      resolve(true);
    });
  });
}

/**
 * Log the execution of a dangerous operation for audit purposes.
 */
export function logOperationExecution(options = {}) {
  const {
    scriptName = "unknown",
    operationName = "unknown",
    targetDatabase = "",
    dryRun = true,
    metadata = {},
  } = options;

  const logEntry = {
    timestamp: new Date().toISOString(),
    script: scriptName,
    operation: operationName,
    target: maskDatabaseUrl(targetDatabase),
    dryRun,
    user: process.env.USER || process.env.USERNAME || "unknown",
    hostname: process.env.HOSTNAME || "unknown",
    pid: process.pid,
    ...metadata,
  };

  // Log to stdout for capture by systemd/journald
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);

  return logEntry;
}

/**
 * Verify that a backup was created recently before allowing destructive operations.
 */
export async function verifyRecentBackup(backupDir, maxAgeMs = 5 * 60 * 1000) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  try {
    const files = await fs.readdir(backupDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      console.warn("⚠️  No backup files found. Creating backup is recommended.");
      return false;
    }

    // Check the most recent backup
    let mostRecent = null;
    for (const file of jsonFiles) {
      const stat = await fs.stat(path.join(backupDir, file));
      if (!mostRecent || stat.mtimeMs > mostRecent.mtimeMs) {
        mostRecent = { file, mtimeMs: stat.mtimeMs };
      }
    }

    const ageMs = Date.now() - mostRecent.mtimeMs;
    if (ageMs > maxAgeMs) {
      console.warn(
        `⚠️  Most recent backup is ${Math.round(ageMs / 60000)} minutes old: ${mostRecent.file}`
      );
      return false;
    }

    console.log(`✅ Recent backup found: ${mostRecent.file}`);
    return true;
  } catch {
    console.warn("⚠️  Could not verify backups directory.");
    return false;
  }
}

/**
 * Create a pre-operation snapshot of affected tables.
 */
export async function createPreOperationSnapshot(connection, tables, outputDir) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotFile = path.join(outputDir, `pre-operation-${timestamp}.json`);

  await fs.mkdir(outputDir, { recursive: true });

  const snapshot = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
      snapshot.tables[table] = {
        count: rows.length,
        rows,
      };
    } catch (error) {
      snapshot.tables[table] = {
        count: 0,
        error: error.message,
      };
    }
  }

  await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`📦 Pre-operation snapshot saved: ${snapshotFile}`);

  return snapshotFile;
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Mask sensitive parts of a database URL for logging.
 */
function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.password = "****";
    return parsed.toString().substring(0, 60);
  } catch {
    return url.substring(0, 30) + "...";
  }
}
