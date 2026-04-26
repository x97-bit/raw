import { appRouter } from "./server/routers";
import { getDb } from "./server/db/db";

async function main() {
  try {
    const db = await getDb();
    const caller = appRouter.createCaller({ db, req: {}, res: {}, user: { id: 1 } } as any);
    const result = await caller.trialBalance.getTrialBalance({});
    console.log("Total rows:", result.rows.length);
    console.log("Totals:", result.totals);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

main();
