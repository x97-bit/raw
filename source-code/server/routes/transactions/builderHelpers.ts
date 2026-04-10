import { eq } from "drizzle-orm";
import { companies } from "../../../drizzle/schema";

export function getTrimmedText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function resolveNewLookupId(
  db: any,
  existingIdValue: unknown,
  table: unknown,
  insertValues: Record<string, unknown>,
  newValue: unknown,
) {
  if (existingIdValue) {
    return existingIdValue;
  }

  const normalizedValue = getTrimmedText(newValue);
  if (!normalizedValue) {
    return null;
  }

  const result = await db.insert(table).values(insertValues);
  return Number(result[0].insertId);
}

export async function resolveCompanySelection(db: any, companyIdValue: unknown, companyNameValue: unknown) {
  let companyId = companyIdValue ?? null;
  let companyName = companyNameValue ?? null;

  if (companyId) {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, parseInt(String(companyId), 10)))
      .limit(1);

    if (company) {
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
