import mysql from "mysql2/promise";
import { buildMySqlConnectionOptions } from "./_core/mysqlConfig";
import { backfillRuntimeSupportData } from "./dbRuntimeSchemaBackfill";
import { ensureRuntimeSchemaConstraints } from "./dbRuntimeSchemaConstraints";
import { ensureSpecialAccountCompatibility } from "./dbRuntimeSchemaSpecialAccounts";
import { ensureRuntimeSupportTables } from "./dbRuntimeSchemaTables";

export async function ensureRuntimeSchemaWithUrl(databaseUrl: string) {
  const connection = await mysql.createConnection(buildMySqlConnectionOptions(databaseUrl));

  try {
    await ensureRuntimeSupportTables(connection);
    await backfillRuntimeSupportData(connection);
    await ensureSpecialAccountCompatibility(connection);
    await ensureRuntimeSchemaConstraints(connection);
  } finally {
    await connection.end();
  }
}
