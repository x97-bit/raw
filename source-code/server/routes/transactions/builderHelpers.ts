import type { AppDb } from "../../db/schema/dbTypes";
import { eq } from "drizzle-orm";
import {
  companies,
  drivers,
  goodsTypes,
  governorates,
  vehicles,
} from "../../../drizzle/schema";
import { normalizeArabicText } from "../../utils/textNormalization";

type LookupInsertTable = typeof drivers | typeof goodsTypes;

export function getTrimmedText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function resolveNewLookupId<TTable extends LookupInsertTable>(
  db: AppDb,
  existingIdValue: unknown,
  table: TTable,
  insertValues: TTable["$inferInsert"],
  newValue: unknown
): Promise<number | string | null>;

export async function resolveNewLookupId(
  db: AppDb,
  existingIdValue: unknown,
  table: typeof vehicles,
  insertValues: typeof vehicles["$inferInsert"],
  newValue: unknown
): Promise<number | string | null>;

export async function resolveNewLookupId(
  db: AppDb,
  existingIdValue: unknown,
  table: LookupInsertTable | typeof vehicles,
  insertValues: Record<string, unknown>,
  newValue: unknown
): Promise<number | string | null> {
  if (existingIdValue) {
    return typeof existingIdValue === "string" ||
      typeof existingIdValue === "number"
      ? existingIdValue
      : null;
  }

  const trimmedValue = getTrimmedText(newValue);
  if (!trimmedValue) {
    return null;
  }

  const normalizedInput = normalizeArabicText(trimmedValue);

  // For vehicles, the display field is plateNumber instead of name
  const isVehicleTable = table === vehicles;
  const nameField = isVehicleTable ? "plateNumber" : "name";

  // Fetch all existing records to find a normalized match
  const allRecords = (await db.select().from(table as LookupInsertTable)) as Array<Record<string, unknown>>;
  const match = allRecords.find((record) => {
    const fieldValue = String(record[nameField] ?? "");
    return normalizeArabicText(fieldValue) === normalizedInput;
  });

  if (match) {
    return match.id as number;
  }

  const result = await db.insert(table as LookupInsertTable).values(insertValues as LookupInsertTable["$inferInsert"]);
  return Number(result[0].insertId);
}

export async function resolveCompanySelection(
  db: AppDb,
  companyIdValue: unknown,
  companyNameValue: unknown
) {
  let companyId: number | null = null;
  let companyName: string | null = getTrimmedText(companyNameValue);

  if (
    companyIdValue !== undefined &&
    companyIdValue !== null &&
    companyIdValue !== ""
  ) {
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
    const trimmedCompanyName = getTrimmedText(companyName);
    if (trimmedCompanyName) {
      const normalizedInput = normalizeArabicText(trimmedCompanyName);
      
      const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);
      const existingCompany = allCompanies.find(
        (c) => normalizeArabicText(c.name) === normalizedInput
      );

      if (existingCompany) {
        companyId = existingCompany.id;
        companyName = existingCompany.name;
      } else {
        companyName = trimmedCompanyName;
      }
    }
  }

  return { companyId, companyName };
}

export async function resolveGovernorateId(
  db: AppDb,
  govIdValue: unknown,
  govNameValue: unknown
): Promise<number | null> {
  if (govIdValue !== undefined && govIdValue !== null && govIdValue !== "") {
    const parsed = Number.parseInt(String(govIdValue), 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  const trimmedName = getTrimmedText(govNameValue);
  if (!trimmedName) return null;

  const normalizedInput = normalizeArabicText(trimmedName);
  const allGovs = await db.select({ id: governorates.id, name: governorates.name }).from(governorates);
  
  const existingGov = allGovs.find(
    (g) => normalizeArabicText(g.name) === normalizedInput
  );

  if (existingGov) return existingGov.id;

  const result = await db.insert(governorates).values({ name: trimmedName });
  return Number(result[0].insertId);
}
