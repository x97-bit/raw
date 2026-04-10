import { Router, Response } from "express";
import { desc } from "drizzle-orm";
import { paymentMatching } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";

export function registerPaymentMatchingListRoutes(router: Router) {
  router.get("/payment-matching", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const result = await db.select().from(paymentMatching).orderBy(desc(paymentMatching.id));
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}
