import { createConnection } from "mysql2/promise";

async function fixData() {
  const c = await createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    database: "alrawi_db",
  });

  // Fix invalid dates in trans_date (1900-01-00 is invalid)
  await c.execute(`SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'`);

  const [badDates] = await c.execute(
    `SELECT id, trans_date FROM transactions WHERE trans_date < '1970-01-01' OR trans_date IS NULL`
  );
  const rows = badDates as Array<{ id: number; trans_date: string }>;
  console.log(`Found ${rows.length} rows with invalid dates`);

  if (rows.length > 0) {
    await c.execute(
      `UPDATE transactions SET trans_date = '2000-01-01' WHERE trans_date < '1970-01-01' OR trans_date IS NULL`
    );
    console.log(`Fixed ${rows.length} rows - set to 2000-01-01`);
  }

  // Also fix debts dates
  const [badDebtDates] = await c.execute(
    `SELECT id FROM debts WHERE date < '1970-01-01'`
  );
  const debtRows = badDebtDates as Array<{ id: number }>;
  if (debtRows.length > 0) {
    await c.execute(`UPDATE debts SET date = NULL WHERE date < '1970-01-01'`);
    console.log(`Fixed ${debtRows.length} debt rows`);
  }

  // Check for NULL account_id in transactions
  const [nullAccounts] = await c.execute(
    `SELECT COUNT(*) as cnt FROM transactions WHERE account_id NOT IN (SELECT id FROM accounts)`
  );
  console.log("Orphan account_ids:", JSON.stringify(nullAccounts));

  await c.end();
  console.log("\nData fix done!");
}

fixData().catch(console.error);
