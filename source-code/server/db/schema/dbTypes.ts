import type { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "../../../drizzle/schema";

export { schema };

export type AppDb = MySql2Database<typeof schema>;
export type AppUserRecord = typeof schema.appUsers.$inferSelect;
export type MerchantUserRecord = typeof schema.merchantUsers.$inferSelect;
