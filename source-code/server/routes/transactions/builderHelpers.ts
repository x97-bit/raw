import type { AppDb } from "../../dbTypes";
import { eq } from "drizzle-orm";
import { companies, drivers, goodsTypes, vehicles } from "../../../drizzle/schema";

type LookupInsertTable = typeof drivers | typeof vehicles | typeof goodsTypes;

export function getTrimmedText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function resolveNewLookupId<TTable extends LookupInsertTable>(
  db: AppDb,
  existingIdValue: unknown,
  table: TTable,
  insertValues: TTable["$inferInsert"],
  newValue: unknown,
): Promise<number | string | null> {
  if (existingIdValue) {
    return typeof existingIdValue === "string" || typeof existingIdValue === "number" ? existingIdValue : null;
  }

  const normalizedValue = getTrimmedText(newValue);
  if (!normalizedValue) {
    return null;
  }

  const result = await db.insert(table).values(insertValues);
  return Number(result[0].insertId);
}

export async function resolveCompanySelection(db: AppDb, companyIdValue: unknown, companyNameValue: unknown) {
  let companyId: number | null = null;
  let companyName: string | null = getTrimmedText(companyNameValue);

  if (companyIdValue !== undefined && companyIdValue !== null && companyIdValue !== "") {
    companyId = Number.parseInt(String(companyIdValue), 10);
  }

  if (companyId) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (company) {
      companyId = company.id;
      companyName = company.name;
    }
  } else {
    const normalizedCompanyName = getTrimmedText(companyName);
    if (normalizedCompanyName) {
      const [existingCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.name, normalizedCompanyName))
        .limit(1);

      if (existingCompany) {
        companyId = existingCompany.id;
        companyName = existingCompany.name;
      } else {
        companyName = normalizedCompanyName;
      }
    }
  }

  return { companyId, companyName };
}
