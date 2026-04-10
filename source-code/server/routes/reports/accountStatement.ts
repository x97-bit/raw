import { Router, Response } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { accounts, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { mapAccount } from "../../utils/accountMappings";
import { enrichTransactions } from "../../utils/transactionEnrichment";
import { addRunningBalances, calculateTransactionTotals } from "../../utils/transactionSummaries";

export function registerReportAccountStatementRoutes(router: Router) {
  router.get("/reports/account-statement/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const accountId = parseInt(req.params.id, 10);
      const { startDate, endDate, portId, accountType } = req.query;
      const conditions: any[] = [eq(transactions.accountId, accountId)];
      if (portId) conditions.push(eq(transactions.portId, String(portId)));
      if (accountType) conditions.push(eq(transactions.accountType, String(accountType)));
      if (startDate) conditions.push(sql`${transactions.transDate} >= ${startDate}`);
      if (endDate) conditions.push(sql`${transactions.transDate} <= ${endDate}`);

      const rows = await db.select().from(transactions).where(and(...conditions)).orderBy(asc(transactions.transDate), asc(transactions.id));
      const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      const enrichedRows = await enrichTransactions(db, rows);
      const totals = calculateTransactionTotals(rows);
      const statementRows = addRunningBalances(enrichedRows).map((transaction: any) => ({
        ...transaction,
        AccountName: account?.name || transaction.AccountName,
      }));

      return res.json({
        account: account ? mapAccount(account) : null,
        transactions: statementRows,
        statement: statementRows,
        shipmentCount: totals.shipmentCount,
        totals,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}
