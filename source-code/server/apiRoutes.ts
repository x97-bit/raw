import { Router, Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { appUsers, accounts, transactions, debts, goodsTypes, governorates, ports, accountTypes, paymentMatching, specialAccounts, drivers, vehicles, fieldConfig, customFields, customFieldValues, expenses, companies, accountDefaults, routeDefaults } from "../drizzle/schema";
import { eq, and, sql, desc, asc, like, or, inArray } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getAbsoluteAmount, getDirectionAliases, getStoredDirectionValue, isInvoiceDirection, isPaymentDirection } from "./utils/direction";
import { addRunningBalances, calculateTransactionTotals } from "./utils/transactionSummaries";
import { buildTransactionFormDefaults } from "./utils/formDefaults";

const router = Router();

// ==================== JWT HELPERS ====================
const getSecret = () => new TextEncoder().encode(ENV.cookieSecret || "alrawi-secret-key-2024");

async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret());
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

// ==================== AUTH MIDDLEWARE ====================
interface AuthRequest extends Request {
  appUser?: any;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
  }
  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "ط§ظ†طھظ‡طھ ط§ظ„ط¬ظ„ط³ط©" });
  }
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "Database unavailable" });
  const [user] = await db.select().from(appUsers).where(eq(appUsers.id, payload.userId as number)).limit(1);
  if (!user || !user.active) {
    return res.status(401).json({ error: "ط§ظ„ظ…ط³طھط®ط¯ظ… ط؛ظٹط± ظ†ط´ط·" });
  }
  req.appUser = user;
  next();
}

// ==================== HELPER: Map DB row to legacy field names ====================
function mapAccount(a: any) {
  return {
    ...a,
    AccountID: a.id,
    AccountName: a.name,
    AccountTypeID: a.accountType,
    DefaultPortID: a.portId,
    Phone: a.phone,
    Notes: a.notes,
  };
}

// Map new schema transaction to legacy frontend field names
function mapTransaction(t: any, driverName?: string, vehiclePlate?: string, goodTypeName?: string, govName?: string, customFieldData: Record<string, unknown> = {}) {
  const invoiceDirection = isInvoiceDirection(t.direction);
  return {
    TransID: t.id,
    RefNo: t.refNo || `REF-${t.id}`,
    TransTypeID: invoiceDirection ? 1 : 2,
    TransTypeName: invoiceDirection ? 'له' : 'عليه',
    TransDate: t.transDate,
    AccountID: t.accountId,
    AccountName: t._accountName || '',
    Currency: t.currency,
    DriverID: t.driverId,
    DriverName: driverName || t._driverName || '',
    VehicleID: t.vehicleId,
    VehiclePlate: vehiclePlate || t._vehiclePlate || '',
    GoodTypeID: t.goodTypeId,
    GoodTypeName: goodTypeName || t._goodTypeName || '',
    GoodType: goodTypeName || t._goodTypeName || '',
    Weight: t.weight ? parseFloat(t.weight) : null,
    Meters: t.meters ? parseFloat(t.meters) : null,
    CostUSD: t.costUsd ? parseFloat(t.costUsd) : 0,
    AmountUSD: t.amountUsd ? parseFloat(t.amountUsd) : 0,
    CostIQD: t.costIqd ? parseFloat(t.costIqd) : 0,
    AmountIQD: t.amountIqd ? parseFloat(t.amountIqd) : 0,
    FeeUSD: t.feeUsd ? parseFloat(t.feeUsd) : 0,
    SyrCus: t.syrCus ? parseFloat(t.syrCus) : 0,
    CarQty: t.carQty || null,
    TransPrice: t.transPrice ? parseFloat(t.transPrice) : null,
    CarrierID: t.carrierId || null,
    CarrierName: t._carrierName || '',
    Qty: t.qty || null,
    CompanyID: t.companyId || null,
    CompanyName: t._companyName || t.companyName || '',
    GovID: t.govId,
    Governorate: govName || t._govName || '',
    Notes: t.notes,
    TraderNote: t.traderNote,
    RecordType: t.recordType,
    PortID: t.portId,
    AccountType: t.accountType,
    CreatedBy: t.createdBy,
    // Profit calculation: Amount - Cost (only for DR/ظ„ظ‡ transactions)
    ProfitUSD: invoiceDirection ? (t.amountUsd ? parseFloat(t.amountUsd) : 0) - (t.costUsd ? parseFloat(t.costUsd) : 0) : 0,
    ProfitIQD: invoiceDirection ? (t.amountIqd ? parseFloat(t.amountIqd) : 0) - (t.costIqd ? parseFloat(t.costIqd) : 0) : 0,
    // Keep raw fields too for backend processing
    direction: t.direction,
    amount_usd: t.amountUsd ? parseFloat(t.amountUsd) : 0,
    amount_iqd: t.amountIqd ? parseFloat(t.amountIqd) : 0,
    cost_usd: t.costUsd ? parseFloat(t.costUsd) : 0,
    cost_iqd: t.costIqd ? parseFloat(t.costIqd) : 0,
    fee_usd: t.feeUsd ? parseFloat(t.feeUsd) : 0,
    company_id: t.companyId || null,
    company_name: t._companyName || t.companyName || null,
    CustomFieldValues: customFieldData,
    ...customFieldData,
  };
}

function mapDebt(d: any) {
  return {
    ...d,
    DebtID: d.id,
    TransDate: d.date,
    AccountName: d.debtorName,
    AmountUSD: d.amountUSD ? parseFloat(d.amountUSD) : 0,
    AmountIQD: d.amountIQD ? parseFloat(d.amountIQD) : 0,
    FeeUSD: 0,
    FeeIQD: 0,
    PaidAmountUSD: d.paidAmountUSD ? parseFloat(d.paidAmountUSD) : 0,
    PaidAmountIQD: d.paidAmountIQD ? parseFloat(d.paidAmountIQD) : 0,
    State: d.status,
    TransType: 'debt',
    Notes: d.description,
  };
}

// Helper: enrich transactions with joined names
async function enrichTransactions(db: any, txns: any[]) {
  if (txns.length === 0) return [];
  const txnIds = txns.map((t: any) => t.id).filter(Boolean);
  const [
    allAccs,
    allDrivers,
    allVehicles,
    allGoods,
    allGovs,
    allCompanies,
    allCustomFields,
    allCustomValues,
  ] = await Promise.all([
    db.select().from(accounts),
    db.select().from(drivers),
    db.select().from(vehicles),
    db.select().from(goodsTypes),
    db.select().from(governorates),
    db.select().from(companies),
    db.select().from(customFields),
    txnIds.length > 0
      ? db.select().from(customFieldValues).where(and(
          eq(customFieldValues.entityType, "transaction"),
          inArray(customFieldValues.entityId, txnIds),
        ))
      : Promise.resolve([]),
  ]);
  const accMap = new Map(allAccs.map((a: any) => [a.id, a.name]));
  const drvMap = new Map(allDrivers.map((d: any) => [d.id, d.name]));
  const vehMap = new Map(allVehicles.map((v: any) => [v.id, v.plateNumber]));
  const goodMap = new Map(allGoods.map((g: any) => [g.id, g.name]));
  const govMap = new Map(allGovs.map((g: any) => [g.id, g.name]));
  const companyMap = new Map(allCompanies.map((c: any) => [c.id, c.name]));
  const customFieldMap = new Map(allCustomFields.map((field: any) => [field.id, field]));
  const customValuesByEntity = new Map<number, Record<string, unknown>>();

  for (const valueRow of allCustomValues as any[]) {
    const field = customFieldMap.get(valueRow.customFieldId);
    if (!field) continue;
    const entityValues = customValuesByEntity.get(valueRow.entityId) || {};
    const rawValue = valueRow.value;
    let normalizedValue: unknown = rawValue;
    if (field.fieldType === "number" || field.fieldType === "money") {
      const parsed = Number(rawValue);
      normalizedValue = Number.isFinite(parsed) ? parsed : rawValue;
    }
    entityValues[field.fieldKey] = normalizedValue;
    customValuesByEntity.set(valueRow.entityId, entityValues);
  }

  return txns.map((t: any) => {
    t._accountName = accMap.get(t.accountId) as string || '';
    t._driverName = drvMap.get(t.driverId) as string || '';
    t._vehiclePlate = vehMap.get(t.vehicleId) as string || '';
    t._goodTypeName = goodMap.get(t.goodTypeId) as string || '';
    t._govName = govMap.get(t.govId) as string || '';
    t._carrierName = accMap.get(t.carrierId) as string || '';
    t._companyName = companyMap.get(t.companyId) as string || t.companyName || '';
    const dn = t._driverName;
    const vp = t._vehiclePlate;
    const gn = t._goodTypeName;
    const gv = t._govName;
    const customData = customValuesByEntity.get(t.id) || {};
    return mapTransaction(t, dn, vp, gn, gv, customData);
  });
}

async function getCustomFieldsWithSections(db: any, sectionKey?: string) {
  const [fields, configs] = await Promise.all([
    db.select().from(customFields),
    db.select({
      fieldKey: fieldConfig.fieldKey,
      sectionKey: fieldConfig.sectionKey,
      visible: fieldConfig.visible,
      sortOrder: fieldConfig.sortOrder,
      displayLabel: fieldConfig.displayLabel,
    }).from(fieldConfig),
  ]);

  const configMap = new Map<string, Array<{ sectionKey: string; visible: number; sortOrder: number; displayLabel: string | null }>>();
  for (const config of configs as any[]) {
    const entries = configMap.get(config.fieldKey) || [];
    entries.push({
      sectionKey: config.sectionKey,
      visible: config.visible,
      sortOrder: config.sortOrder,
      displayLabel: config.displayLabel ?? null,
    });
    configMap.set(config.fieldKey, entries);
  }

  let mapped = (fields as any[]).map((field) => {
    const sectionConfig = configMap.get(field.fieldKey) || [];
    return {
      ...field,
      sectionKeys: sectionConfig.map((entry) => entry.sectionKey),
      sectionConfig,
    };
  });

  if (sectionKey) {
    mapped = mapped
      .filter((field) => field.sectionKeys.includes(sectionKey))
      .map((field) => {
        const scopedConfig = field.sectionConfig.find((entry: any) => entry.sectionKey === sectionKey);
        return {
          ...field,
          visible: scopedConfig?.visible ?? 1,
          sortOrder: scopedConfig?.sortOrder ?? 999,
          displayLabel: scopedConfig?.displayLabel ?? null,
        };
      })
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }

  return mapped;
}

async function syncCustomFieldSections(db: any, fieldKey: string, sections: string[]) {
  const targetSections = Array.from(new Set((sections || []).filter(Boolean).map((section) => String(section))));
  const existingConfigs = await db.select().from(fieldConfig).where(eq(fieldConfig.fieldKey, fieldKey));
  const existingSectionKeys = new Set((existingConfigs as any[]).map((config) => config.sectionKey));

  for (const existingConfig of existingConfigs as any[]) {
    if (!targetSections.includes(existingConfig.sectionKey)) {
      await db.delete(fieldConfig).where(and(
        eq(fieldConfig.fieldKey, fieldKey),
        eq(fieldConfig.sectionKey, existingConfig.sectionKey),
      ));
    }
  }

  for (const sectionKey of targetSections) {
    if (existingSectionKeys.has(sectionKey)) continue;
    const maxOrder = await db.select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 0)` })
      .from(fieldConfig)
      .where(eq(fieldConfig.sectionKey, sectionKey));
    const nextOrder = (maxOrder[0]?.maxOrder || 0) + 1;
    await db.insert(fieldConfig).values({
      sectionKey,
      fieldKey,
      visible: 1,
      sortOrder: nextOrder,
      displayLabel: null,
    });
  }
}

async function getLookupNameById(db: any, type: string, id?: number | null) {
  if (!id) return null;

  if (type === "driver") {
    const [row] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "vehicle") {
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return row ? { id: row.id, name: row.plateNumber } : null;
  }
  if (type === "goodType") {
    const [row] = await db.select().from(goodsTypes).where(eq(goodsTypes.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "governorate") {
    const [row] = await db.select().from(governorates).where(eq(governorates.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "company") {
    const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "account") {
    const [row] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }

  return null;
}

function hasBodyValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function parseOptionalInt(value: unknown) {
  if (!hasBodyValue(value)) return undefined;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalDecimal(value: unknown) {
  if (!hasBodyValue(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : undefined;
}

function parseNullableNumber(value: unknown) {
  if (!hasBodyValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickBodyField(body: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (hasBodyValue(body?.[key])) return body[key];
  }
  return undefined;
}

function hasBodyKey(body: Record<string, any>, ...keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(body, key));
}

// ==================== AUTH ====================
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط§ظ†" });
    }
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const [user] = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©" });
    }
    if (!user.active) {
      return res.status(403).json({ error: "ط§ظ„ط­ط³ط§ط¨ ظ…ط¹ط·ظ„" });
    }
    const token = await signToken({ userId: user.id, role: user.role });
    const { password: _, ...safeUser } = user;
    return res.json({
      token,
      user: { ...safeUser, UserID: safeUser.id, FullName: safeUser.name, Username: safeUser.username, Role: safeUser.role, IsActive: safeUser.active }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.get("/auth/me", authMiddleware, (req: AuthRequest, res: Response) => {
  const { password: _, ...safeUser } = req.appUser;
  return res.json({ ...safeUser, UserID: safeUser.id, FullName: safeUser.name, Username: safeUser.username, Role: safeUser.role, IsActive: safeUser.active });
});

// ==================== USER MANAGEMENT ====================
router.get("/auth/users", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const allUsers = await db.select({ id: appUsers.id, username: appUsers.username, name: appUsers.name, role: appUsers.role, permissions: appUsers.permissions, active: appUsers.active, createdAt: appUsers.createdAt }).from(appUsers);
    return res.json(allUsers.map(u => ({ ...u, UserID: u.id, FullName: u.name, Username: u.username, Role: u.role, IsActive: u.active, LastLogin: u.createdAt })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/auth/users", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
    const { username, password, name, fullName, role, permissions } = req.body;
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.insert(appUsers).values({ username, password: hashed, name: name || fullName || username, role: role || "user", permissions: permissions || [] });
    return res.json({ id: Number(result[0].insertId), message: "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ…" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/auth/users/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const id = parseInt(req.params.id);
    const updates: any = {};
    if (req.body.name || req.body.fullName) updates.name = req.body.name || req.body.fullName;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.role || req.body.Role) updates.role = req.body.role || req.body.Role;
    if (req.body.permissions !== undefined) updates.permissions = req.body.permissions;
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (req.body.IsActive !== undefined) updates.active = req.body.IsActive ? 1 : 0;
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
    await db.update(appUsers).set(updates).where(eq(appUsers.id, id));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھط®ط¯ظ…" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/auth/users/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(appUsers).where(eq(appUsers.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/auth/change-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.appUser.password);
    if (!valid) return res.status(400).json({ error: "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط© ط؛ظٹط± طµط­ظٹط­ط©" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(appUsers).set({ password: hashed }).where(eq(appUsers.id, req.appUser.id));
    return res.json({ message: "طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/auth/users/:id/reset-password", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const hashed = await bcrypt.hash(req.body.password || "123456", 10);
    await db.update(appUsers).set({ password: hashed }).where(eq(appUsers.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/auth/users/:id/permissions", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const [user] = await db.select({ permissions: appUsers.permissions }).from(appUsers).where(eq(appUsers.id, parseInt(req.params.id))).limit(1);
    return res.json(user?.permissions || []);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/auth/users/:id/permissions", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "ط؛ظٹط± ظ…طµط±ط­" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.update(appUsers).set({ permissions: req.body.permissions || req.body }).where(eq(appUsers.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„طµظ„ط§ط­ظٹط§طھ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== ACCOUNTS (TRADERS) ====================
router.get("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { accountType, portId, port, type } = req.query;
    const conditions: any[] = [];
    if (accountType) conditions.push(eq(accounts.accountType, accountType as string));
    if (type) conditions.push(eq(accounts.accountType, type as string));
    if (portId) conditions.push(eq(accounts.portId, portId as string));
    if (port && port !== 'null') conditions.push(eq(accounts.portId, port as string));
    let query = db.select().from(accounts);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const result = await query;
    return res.json(result.map(mapAccount));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const data = {
      name: req.body.name || req.body.AccountName,
      accountType: req.body.accountType || req.body.AccountTypeID || '',
      portId: req.body.portId || req.body.DefaultPortID || null,
      phone: req.body.phone || req.body.Phone || null,
      notes: req.body.notes || req.body.Notes || null,
    };
    // Check for duplicate name (same name + same accountType + same port)
    if (data.name) {
      const conditions: any[] = [eq(accounts.name, data.name)];
      if (data.accountType) conditions.push(eq(accounts.accountType, String(data.accountType)));
      if (data.portId) conditions.push(eq(accounts.portId, String(data.portId)));
      const [existing] = await db.select().from(accounts).where(and(...conditions)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, message: "ط§ظ„طھط§ط¬ط± ظ…ظˆط¬ظˆط¯ ظ…ط³ط¨ظ‚ط§ظ‹", existing: true });
      }
    }
    const result = await db.insert(accounts).values(data);
    return res.json({ id: Number(result[0].insertId), message: "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ط­ط³ط§ط¨" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const updates: any = {};
    if (req.body.name || req.body.AccountName) updates.name = req.body.name || req.body.AccountName;
    if (req.body.phone || req.body.Phone) updates.phone = req.body.phone || req.body.Phone;
    if (req.body.accountType || req.body.AccountTypeID) updates.accountType = req.body.accountType || req.body.AccountTypeID;
    if (req.body.portId || req.body.DefaultPortID) updates.portId = req.body.portId || req.body.DefaultPortID;
    if (req.body.notes || req.body.Notes) updates.notes = req.body.notes || req.body.Notes;
    await db.update(accounts).set(updates).where(eq(accounts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ط­ط³ط§ط¨" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(accounts).where(eq(accounts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ط­ط³ط§ط¨" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== DRIVERS ====================
router.get("/lookups/drivers", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(drivers);
    return res.json(result.map(d => ({ ...d, DriverID: d.id, DriverName: d.name })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/lookups/drivers", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const name = req.body.name || req.body.DriverName;
    // Check for duplicate driver name
    if (name) {
      const [existing] = await db.select().from(drivers).where(eq(drivers.name, name)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, DriverID: existing.id, DriverName: existing.name, existing: true });
      }
    }
    const result = await db.insert(drivers).values({ name });
    return res.json({ id: Number(result[0].insertId), DriverID: Number(result[0].insertId), DriverName: name });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== VEHICLES ====================
router.get("/lookups/vehicles", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(vehicles);
    return res.json(result.map(v => ({ ...v, VehicleID: v.id, PlateNumber: v.plateNumber })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/lookups/vehicles", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const plateNumber = req.body.plateNumber || req.body.PlateNumber;
    // Check for duplicate vehicle plate
    if (plateNumber) {
      const [existing] = await db.select().from(vehicles).where(eq(vehicles.plateNumber, plateNumber)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, VehicleID: existing.id, PlateNumber: existing.plateNumber, existing: true });
      }
    }
    const result = await db.insert(vehicles).values({ plateNumber });
    return res.json({ id: Number(result[0].insertId), VehicleID: Number(result[0].insertId), PlateNumber: plateNumber });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== COMPANIES ====================
router.get("/lookups/companies", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(companies).orderBy(asc(companies.name));
    return res.json(result.map((company) => ({
      ...company,
      CompanyID: company.id,
      CompanyName: company.name,
    })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/lookups/companies", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const name = String(req.body.name || req.body.CompanyName || "").trim();
    if (!name) return res.status(400).json({ error: "اسم الشركة مطلوب" });

    const [existing] = await db.select().from(companies).where(eq(companies.name, name)).limit(1);
    if (existing) {
      return res.json({ id: existing.id, CompanyID: existing.id, CompanyName: existing.name, existing: true });
    }

    const result = await db.insert(companies).values({ name });
    const companyId = Number(result[0].insertId);
    return res.json({ id: companyId, CompanyID: companyId, CompanyName: name });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== FORM DEFAULTS ====================
router.get("/defaults/transaction-form", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const accountId = parseInt(String(req.query.accountId || "0"), 10);
    const sectionKey = String(req.query.sectionKey || req.query.portId || "");
    const govId = req.query.govId ? parseInt(String(req.query.govId), 10) : null;
    const formType = String(req.query.formType || "invoice");
    const requestedCurrency = req.query.currency ? String(req.query.currency) : null;
    const direction = formType === "payment" ? "OUT" : "IN";

    if (!accountId || !sectionKey) {
      return res.status(400).json({ error: "accountId and sectionKey are required" });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    const [defaultRow] = await db.select().from(accountDefaults).where(and(
      eq(accountDefaults.accountId, accountId),
      eq(accountDefaults.sectionKey, sectionKey),
    )).limit(1);

    let routeRow = null;
    if (govId) {
      const matchingRouteRows = await db.select().from(routeDefaults).where(and(
        eq(routeDefaults.sectionKey, sectionKey),
        eq(routeDefaults.govId, govId),
      ));
      routeRow = matchingRouteRows.find((row: any) => requestedCurrency && row.currency === requestedCurrency)
        || matchingRouteRows.find((row: any) => row.active === 1)
        || matchingRouteRows[0]
        || null;
    }

    let recentTransaction = null;
    const recentRows = await db.select().from(transactions).where(and(
      eq(transactions.accountId, accountId),
      eq(transactions.portId, sectionKey),
      inArray(transactions.direction, getDirectionAliases(direction)),
    )).orderBy(desc(transactions.id)).limit(1);

    if (recentRows.length > 0) {
      const [enriched] = await enrichTransactions(db, recentRows);
      recentTransaction = enriched || null;
    }

    const [
      defaultDriver,
      defaultVehicle,
      defaultGoodType,
      defaultGov,
      defaultCompany,
      defaultCarrier,
      routeGov,
    ] = await Promise.all([
      getLookupNameById(db, "driver", defaultRow?.defaultDriverId),
      getLookupNameById(db, "vehicle", defaultRow?.defaultVehicleId),
      getLookupNameById(db, "goodType", defaultRow?.defaultGoodTypeId),
      getLookupNameById(db, "governorate", defaultRow?.defaultGovId),
      getLookupNameById(db, "company", defaultRow?.defaultCompanyId),
      getLookupNameById(db, "account", defaultRow?.defaultCarrierId),
      getLookupNameById(db, "governorate", routeRow?.govId),
    ]);

    const defaults = buildTransactionFormDefaults({
      accountCurrency: account?.currency || null,
      accountDefaults: defaultRow ? {
        defaultCurrency: defaultRow.defaultCurrency,
        defaultDriver: defaultDriver || undefined,
        defaultVehicle: defaultVehicle || undefined,
        defaultGoodType: defaultGoodType || undefined,
        defaultGov: defaultGov || undefined,
        defaultCompany: defaultCompany || undefined,
        defaultCarrier: defaultCarrier || undefined,
        defaultFeeUsd: parseNullableNumber(defaultRow.defaultFeeUsd),
        defaultSyrCus: parseNullableNumber(defaultRow.defaultSyrCus),
        defaultCarQty: defaultRow.defaultCarQty ?? null,
      } : null,
      routeDefaults: routeRow ? {
        gov: routeGov || undefined,
        defaultTransPrice: parseNullableNumber(routeRow.defaultTransPrice),
        defaultFeeUsd: parseNullableNumber(routeRow.defaultFeeUsd),
        defaultCostUsd: parseNullableNumber(routeRow.defaultCostUsd),
        defaultAmountUsd: parseNullableNumber(routeRow.defaultAmountUsd),
        defaultCostIqd: parseNullableNumber(routeRow.defaultCostIqd),
        defaultAmountIqd: parseNullableNumber(routeRow.defaultAmountIqd),
      } : null,
      recentTransaction,
    });

    return res.json(defaults);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/defaults/account", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const conditions: any[] = [];
    const sectionKey = req.query.sectionKey ? String(req.query.sectionKey).trim() : "";
    const accountId = parseOptionalInt(req.query.accountId);
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : "";

    if (sectionKey) conditions.push(eq(accountDefaults.sectionKey, sectionKey));
    if (accountId) conditions.push(eq(accountDefaults.accountId, accountId));

    let query = db.select().from(accountDefaults).orderBy(desc(accountDefaults.updatedAt), desc(accountDefaults.id));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query;

    const [allAccounts, allDrivers, allVehicles, allGoods, allGovs, allCompanies] = await Promise.all([
      db.select().from(accounts),
      db.select().from(drivers),
      db.select().from(vehicles),
      db.select().from(goodsTypes),
      db.select().from(governorates),
      db.select().from(companies),
    ]);

    const accountMap = new Map(allAccounts.map((row: any) => [row.id, row.name]));
    const driverMap = new Map(allDrivers.map((row: any) => [row.id, row.name]));
    const vehicleMap = new Map(allVehicles.map((row: any) => [row.id, row.plateNumber]));
    const goodTypeMap = new Map(allGoods.map((row: any) => [row.id, row.name]));
    const govMap = new Map(allGovs.map((row: any) => [row.id, row.name]));
    const companyMap = new Map(allCompanies.map((row: any) => [row.id, row.name]));

    let result = rows.map((row: any) => ({
      id: row.id,
      accountId: row.accountId,
      accountName: accountMap.get(row.accountId) || "",
      sectionKey: row.sectionKey,
      defaultCurrency: row.defaultCurrency ?? null,
      defaultDriverId: row.defaultDriverId ?? null,
      defaultDriverName: row.defaultDriverId ? driverMap.get(row.defaultDriverId) || "" : "",
      defaultVehicleId: row.defaultVehicleId ?? null,
      defaultVehicleName: row.defaultVehicleId ? vehicleMap.get(row.defaultVehicleId) || "" : "",
      defaultGoodTypeId: row.defaultGoodTypeId ?? null,
      defaultGoodTypeName: row.defaultGoodTypeId ? goodTypeMap.get(row.defaultGoodTypeId) || "" : "",
      defaultGovId: row.defaultGovId ?? null,
      defaultGovName: row.defaultGovId ? govMap.get(row.defaultGovId) || "" : "",
      defaultCompanyId: row.defaultCompanyId ?? null,
      defaultCompanyName: row.defaultCompanyId ? companyMap.get(row.defaultCompanyId) || "" : "",
      defaultCarrierId: row.defaultCarrierId ?? null,
      defaultCarrierName: row.defaultCarrierId ? accountMap.get(row.defaultCarrierId) || "" : "",
      defaultFeeUsd: parseNullableNumber(row.defaultFeeUsd),
      defaultSyrCus: parseNullableNumber(row.defaultSyrCus),
      defaultCarQty: row.defaultCarQty ?? null,
      notes: row.notes ?? "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    if (search) {
      result = result.filter((row) =>
        row.accountName.toLowerCase().includes(search)
        || row.sectionKey.toLowerCase().includes(search)
        || row.defaultDriverName.toLowerCase().includes(search)
        || row.defaultGovName.toLowerCase().includes(search)
      );
    }

    return res.json(result);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/defaults/account", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const replaceMode = req.body.replace === true;

    const accountId = parseOptionalInt(req.body.accountId);
    const sectionKey = String(req.body.sectionKey || "").trim();
    if (!accountId || !sectionKey) {
      return res.status(400).json({ error: "accountId and sectionKey are required" });
    }

    const [existing] = await db.select().from(accountDefaults).where(and(
      eq(accountDefaults.accountId, accountId),
      eq(accountDefaults.sectionKey, sectionKey),
    )).limit(1);

    const payload: any = {
      accountId,
      sectionKey,
      defaultCurrency: replaceMode
        ? (hasBodyValue(req.body.defaultCurrency) ? String(req.body.defaultCurrency) : null)
        : (hasBodyValue(req.body.defaultCurrency) ? String(req.body.defaultCurrency) : existing?.defaultCurrency ?? null),
      defaultDriverId: replaceMode
        ? (parseOptionalInt(req.body.defaultDriverId) ?? null)
        : (parseOptionalInt(req.body.defaultDriverId) ?? existing?.defaultDriverId ?? null),
      defaultVehicleId: replaceMode
        ? (parseOptionalInt(req.body.defaultVehicleId) ?? null)
        : (parseOptionalInt(req.body.defaultVehicleId) ?? existing?.defaultVehicleId ?? null),
      defaultGoodTypeId: replaceMode
        ? (parseOptionalInt(req.body.defaultGoodTypeId) ?? null)
        : (parseOptionalInt(req.body.defaultGoodTypeId) ?? existing?.defaultGoodTypeId ?? null),
      defaultGovId: replaceMode
        ? (parseOptionalInt(req.body.defaultGovId) ?? null)
        : (parseOptionalInt(req.body.defaultGovId) ?? existing?.defaultGovId ?? null),
      defaultCompanyId: replaceMode
        ? (parseOptionalInt(req.body.defaultCompanyId) ?? null)
        : (parseOptionalInt(req.body.defaultCompanyId) ?? existing?.defaultCompanyId ?? null),
      defaultCarrierId: replaceMode
        ? (parseOptionalInt(req.body.defaultCarrierId) ?? null)
        : (parseOptionalInt(req.body.defaultCarrierId) ?? existing?.defaultCarrierId ?? null),
      defaultFeeUsd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultFeeUsd) ?? null)
        : (parseOptionalDecimal(req.body.defaultFeeUsd) ?? existing?.defaultFeeUsd ?? null),
      defaultSyrCus: replaceMode
        ? (parseOptionalDecimal(req.body.defaultSyrCus) ?? null)
        : (parseOptionalDecimal(req.body.defaultSyrCus) ?? existing?.defaultSyrCus ?? null),
      defaultCarQty: replaceMode
        ? (parseOptionalInt(req.body.defaultCarQty) ?? null)
        : (parseOptionalInt(req.body.defaultCarQty) ?? existing?.defaultCarQty ?? null),
      notes: replaceMode
        ? (hasBodyValue(req.body.notes) ? String(req.body.notes) : null)
        : (hasBodyValue(req.body.notes) ? String(req.body.notes) : existing?.notes ?? null),
    };

    await db.insert(accountDefaults).values(payload).onDuplicateKeyUpdate({
      set: {
        defaultCurrency: payload.defaultCurrency,
        defaultDriverId: payload.defaultDriverId,
        defaultVehicleId: payload.defaultVehicleId,
        defaultGoodTypeId: payload.defaultGoodTypeId,
        defaultGovId: payload.defaultGovId,
        defaultCompanyId: payload.defaultCompanyId,
        defaultCarrierId: payload.defaultCarrierId,
        defaultFeeUsd: payload.defaultFeeUsd,
        defaultSyrCus: payload.defaultSyrCus,
        defaultCarQty: payload.defaultCarQty,
        notes: payload.notes,
      },
    });

    return res.json({ message: "تم حفظ افتراضيات التاجر" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/defaults/account/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(accountDefaults).where(eq(accountDefaults.id, parseInt(req.params.id, 10)));
    return res.json({ message: "تم حذف افتراضيات التاجر" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/defaults/route", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const conditions: any[] = [];
    const sectionKey = req.query.sectionKey ? String(req.query.sectionKey).trim() : "";
    const govId = parseOptionalInt(req.query.govId);
    const currency = req.query.currency ? String(req.query.currency).trim() : "";
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : "";

    if (sectionKey) conditions.push(eq(routeDefaults.sectionKey, sectionKey));
    if (govId) conditions.push(eq(routeDefaults.govId, govId));
    if (currency) conditions.push(eq(routeDefaults.currency, currency));

    let query = db.select().from(routeDefaults).orderBy(desc(routeDefaults.updatedAt), desc(routeDefaults.id));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await query;

    const allGovs = await db.select().from(governorates);
    const govMap = new Map(allGovs.map((row: any) => [row.id, row.name]));

    let result = rows.map((row: any) => ({
      id: row.id,
      sectionKey: row.sectionKey,
      govId: row.govId,
      govName: govMap.get(row.govId) || "",
      currency: row.currency,
      defaultTransPrice: parseNullableNumber(row.defaultTransPrice),
      defaultFeeUsd: parseNullableNumber(row.defaultFeeUsd),
      defaultCostUsd: parseNullableNumber(row.defaultCostUsd),
      defaultAmountUsd: parseNullableNumber(row.defaultAmountUsd),
      defaultCostIqd: parseNullableNumber(row.defaultCostIqd),
      defaultAmountIqd: parseNullableNumber(row.defaultAmountIqd),
      notes: row.notes ?? "",
      active: row.active === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    if (search) {
      result = result.filter((row) =>
        row.govName.toLowerCase().includes(search)
        || row.sectionKey.toLowerCase().includes(search)
        || String(row.currency || "").toLowerCase().includes(search)
      );
    }

    return res.json(result);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/defaults/route", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const replaceMode = req.body.replace === true;

    const sectionKey = String(req.body.sectionKey || "").trim();
    const govId = parseOptionalInt(req.body.govId);
    const currency = String(req.body.currency || "IQD").trim() || "IQD";
    if (!sectionKey || !govId) {
      return res.status(400).json({ error: "sectionKey and govId are required" });
    }

    const [existing] = await db.select().from(routeDefaults).where(and(
      eq(routeDefaults.sectionKey, sectionKey),
      eq(routeDefaults.govId, govId),
      eq(routeDefaults.currency, currency),
    )).limit(1);

    const payload: any = {
      sectionKey,
      govId,
      currency,
      defaultTransPrice: replaceMode
        ? (parseOptionalDecimal(req.body.defaultTransPrice) ?? null)
        : (parseOptionalDecimal(req.body.defaultTransPrice) ?? existing?.defaultTransPrice ?? null),
      defaultFeeUsd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultFeeUsd) ?? null)
        : (parseOptionalDecimal(req.body.defaultFeeUsd) ?? existing?.defaultFeeUsd ?? null),
      defaultCostUsd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultCostUsd) ?? null)
        : (parseOptionalDecimal(req.body.defaultCostUsd) ?? existing?.defaultCostUsd ?? null),
      defaultAmountUsd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultAmountUsd) ?? null)
        : (parseOptionalDecimal(req.body.defaultAmountUsd) ?? existing?.defaultAmountUsd ?? null),
      defaultCostIqd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultCostIqd) ?? null)
        : (parseOptionalDecimal(req.body.defaultCostIqd) ?? existing?.defaultCostIqd ?? null),
      defaultAmountIqd: replaceMode
        ? (parseOptionalDecimal(req.body.defaultAmountIqd) ?? null)
        : (parseOptionalDecimal(req.body.defaultAmountIqd) ?? existing?.defaultAmountIqd ?? null),
      notes: replaceMode
        ? (hasBodyValue(req.body.notes) ? String(req.body.notes) : null)
        : (hasBodyValue(req.body.notes) ? String(req.body.notes) : existing?.notes ?? null),
      active: 1,
    };

    await db.insert(routeDefaults).values(payload).onDuplicateKeyUpdate({
      set: {
        defaultTransPrice: payload.defaultTransPrice,
        defaultFeeUsd: payload.defaultFeeUsd,
        defaultCostUsd: payload.defaultCostUsd,
        defaultAmountUsd: payload.defaultAmountUsd,
        defaultCostIqd: payload.defaultCostIqd,
        defaultAmountIqd: payload.defaultAmountIqd,
        notes: payload.notes,
        active: 1,
      },
    });

    return res.json({ message: "تم حفظ افتراضيات المسار" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/defaults/route/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.appUser.role !== "admin") return res.status(403).json({ error: "غير مصرح" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(routeDefaults).where(eq(routeDefaults.id, parseInt(req.params.id, 10)));
    return res.json({ message: "تم حذف افتراضيات المسار" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== TRANSACTIONS ====================
router.get("/transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { portId, port, accountType, type, accountId, startDate, endDate, search, limit, offset } = req.query;
    const conditions: any[] = [];
    const pId = portId || port;
    if (pId && pId !== 'null') conditions.push(eq(transactions.portId, pId as string));
    if (accountType) conditions.push(eq(transactions.accountType, accountType as string));
    if (type) {
      const dir = getStoredDirectionValue(type);
      conditions.push(inArray(transactions.direction, getDirectionAliases(dir)));
    }
    if (accountId) conditions.push(eq(transactions.accountId, parseInt(accountId as string)));
    if (startDate) conditions.push(sql`${transactions.transDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${transactions.transDate} <= ${endDate}`);
    if (search) {
      conditions.push(or(
        like(transactions.refNo, `%${search}%`),
        like(transactions.notes, `%${search}%`),
        like(transactions.traderNote, `%${search}%`)
      ));
    }

    // Count total
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(transactions);
    if (conditions.length > 0) countQuery = countQuery.where(and(...conditions)) as any;
    const [{ count: total }] = await countQuery;

    // Get paginated results
    let query = db.select().from(transactions).orderBy(desc(transactions.id));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    if (limit) query = query.limit(parseInt(limit as string)) as any;
    if (offset) query = query.offset(parseInt(offset as string)) as any;
    const result = await query;

    let summaryQuery = db.select().from(transactions);
    if (conditions.length > 0) summaryQuery = summaryQuery.where(and(...conditions)) as any;
    const summaryRows = await summaryQuery;

    const enriched = await enrichTransactions(db, result);
    const summaryTotals = calculateTransactionTotals(summaryRows);

    return res.json({
      transactions: enriched,
      total: Number(total),
      summary: {
        count: summaryTotals.count,
        shipmentCount: summaryTotals.shipmentCount,
        totalInvoicesUSD: summaryTotals.totalInvoicesUSD,
        totalInvoicesIQD: summaryTotals.totalInvoicesIQD,
        totalPaymentsUSD: summaryTotals.totalPaymentsUSD,
        totalPaymentsIQD: summaryTotals.totalPaymentsIQD,
        totalCostUSD: summaryTotals.totalCostUSD,
        totalCostIQD: summaryTotals.totalCostIQD,
        totalProfitUSD: summaryTotals.totalProfitUSD,
        totalProfitIQD: summaryTotals.totalProfitIQD,
        balanceUSD: summaryTotals.balanceUSD,
        balanceIQD: summaryTotals.balanceIQD,
      },
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const b = req.body;
    const accountId = pickBodyField(b, "accountId", "AccountID", "account_id");
    // Look up account name for search enrichment
    let accountName = '';
    if (accountId) {
      const [acc] = await db.select().from(accounts).where(eq(accounts.id, parseInt(String(accountId), 10))).limit(1);
      if (acc) accountName = acc.name;
    }
    // Determine direction
    const typeVal = pickBodyField(b, "type", "TransTypeID", "direction");
    const direction = getStoredDirectionValue(typeVal);
    // Generate ref_no
    const [lastTx] = await db.select({ id: transactions.id }).from(transactions).orderBy(desc(transactions.id)).limit(1);
    const nextNum = (lastTx?.id || 0) + 1;
    const rawPort = String(pickBodyField(b, "portId", "PortID", "port_id") ?? "GEN");
    const prefix = rawPort.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5) || 'GEN';
    const refNo = `${prefix}-${isInvoiceDirection(direction) ? 'INV' : 'PAY'}${String(nextNum).padStart(6, '0')}`;

    // Handle driver auto-create
    let driverId = pickBodyField(b, "driverId", "DriverID", "driver_id") ?? null;
    if (!driverId && b._newDriverName?.trim()) {
      const r = await db.insert(drivers).values({ name: b._newDriverName.trim() });
      driverId = Number(r[0].insertId);
    }
    // Handle vehicle auto-create
    let vehicleId = pickBodyField(b, "vehicleId", "VehicleID", "vehicle_id") ?? null;
    if (!vehicleId && b._newPlateNumber?.trim()) {
      const r = await db.insert(vehicles).values({ plateNumber: b._newPlateNumber.trim() });
      vehicleId = Number(r[0].insertId);
    }
    // Handle goods type auto-create
    let goodTypeId = pickBodyField(b, "goodTypeId", "GoodTypeID", "good_type_id") ?? null;
    if (!goodTypeId && b._newGoodType?.trim()) {
      const r = await db.insert(goodsTypes).values({ name: b._newGoodType.trim() });
      goodTypeId = Number(r[0].insertId);
    }
    let companyId = pickBodyField(b, "companyId", "CompanyID", "company_id") ?? null;
    let companyName = pickBodyField(b, "companyName", "CompanyName", "company_name") ?? null;
    if (companyId) {
      const [company] = await db.select().from(companies).where(eq(companies.id, parseInt(String(companyId), 10))).limit(1);
      if (company) companyName = company.name;
    } else if (typeof companyName === "string" && companyName.trim()) {
      const normalizedCompanyName = companyName.trim();
      const [existingCompany] = await db.select().from(companies).where(eq(companies.name, normalizedCompanyName)).limit(1);
      if (existingCompany) {
        companyId = existingCompany.id;
        companyName = existingCompany.name;
      }
    }

    const data = {
      refNo,
      direction,
      transDate: String(pickBodyField(b, "transDate", "TransDate", "trans_date", "date") ?? new Date().toISOString().split('T')[0]),
      accountId: parseInt(String(accountId), 10),
      currency: String(pickBodyField(b, "currency", "Currency") ?? "BOTH"),
      driverId: parseOptionalInt(driverId) ?? null,
      vehicleId: parseOptionalInt(vehicleId) ?? null,
      goodTypeId: parseOptionalInt(goodTypeId) ?? null,
      weight: pickBodyField(b, "weight", "Weight") ?? null,
      meters: pickBodyField(b, "meters", "Meters") ?? null,
      costUsd: parseOptionalDecimal(pickBodyField(b, "costUsd", "CostUSD", "cost_usd")) ?? "0",
      amountUsd: parseOptionalDecimal(pickBodyField(b, "amountUsd", "AmountUSD", "amount_usd")) ?? "0",
      costIqd: parseOptionalDecimal(pickBodyField(b, "costIqd", "CostIQD", "cost_iqd")) ?? "0",
      amountIqd: parseOptionalDecimal(pickBodyField(b, "amountIqd", "AmountIQD", "amount_iqd")) ?? "0",
      feeUsd: parseOptionalDecimal(pickBodyField(b, "feeUsd", "FeeUSD", "fee_usd")) ?? "0",
      syrCus: parseOptionalDecimal(pickBodyField(b, "syrCus", "SyrCus", "syr_cus")) ?? "0",
      carQty: parseOptionalInt(pickBodyField(b, "carQty", "CarQty", "car_qty")) ?? null,
      transPrice: parseOptionalDecimal(pickBodyField(b, "transPrice", "TransPrice", "trans_price")) ?? null,
      carrierId: parseOptionalInt(pickBodyField(b, "carrierId", "CarrierID", "carrier_id")) ?? null,
      qty: parseOptionalInt(pickBodyField(b, "qty", "Qty")) ?? null,
      companyId: parseOptionalInt(companyId) ?? null,
      companyName,
      govId: parseOptionalInt(pickBodyField(b, "govId", "GovID", "gov_id")) ?? null,
      notes: pickBodyField(b, "notes", "Notes") ?? null,
      traderNote: pickBodyField(b, "traderNote", "TraderNote", "trader_note") ?? null,
      recordType: String(pickBodyField(b, "recordType", "RecordType", "record_type") ?? "shipment"),
      portId: String(pickBodyField(b, "portId", "PortID", "port_id") ?? ""),
      accountType: String(pickBodyField(b, "accountType", "AccountTypeID", "account_type") ?? ""),
      createdBy: req.appUser.id,
    };
    const result = await db.insert(transactions).values(data);
    return res.json({ id: Number(result[0].insertId), refNo, message: "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ…ط¹ط§ظ…ظ„ط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/transactions/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const b = req.body;
    const updates: any = {};
    if (hasBodyKey(b, "transDate", "TransDate", "trans_date", "date")) updates.transDate = pickBodyField(b, "transDate", "TransDate", "trans_date", "date") ?? null;
    if (hasBodyKey(b, "amountUsd", "AmountUSD", "amount_usd")) updates.amountUsd = parseOptionalDecimal(pickBodyField(b, "amountUsd", "AmountUSD", "amount_usd")) ?? "0";
    if (hasBodyKey(b, "amountIqd", "AmountIQD", "amount_iqd")) updates.amountIqd = parseOptionalDecimal(pickBodyField(b, "amountIqd", "AmountIQD", "amount_iqd")) ?? "0";
    if (hasBodyKey(b, "costUsd", "CostUSD", "cost_usd")) updates.costUsd = parseOptionalDecimal(pickBodyField(b, "costUsd", "CostUSD", "cost_usd")) ?? "0";
    if (hasBodyKey(b, "costIqd", "CostIQD", "cost_iqd")) updates.costIqd = parseOptionalDecimal(pickBodyField(b, "costIqd", "CostIQD", "cost_iqd")) ?? "0";
    if (hasBodyKey(b, "feeUsd", "FeeUSD", "fee_usd")) updates.feeUsd = parseOptionalDecimal(pickBodyField(b, "feeUsd", "FeeUSD", "fee_usd")) ?? "0";
    if (hasBodyKey(b, "weight", "Weight")) updates.weight = pickBodyField(b, "weight", "Weight") ?? null;
    if (hasBodyKey(b, "meters", "Meters")) updates.meters = pickBodyField(b, "meters", "Meters") ?? null;
    if (hasBodyKey(b, "notes", "Notes")) updates.notes = pickBodyField(b, "notes", "Notes") ?? null;
    if (hasBodyKey(b, "traderNote", "TraderNote", "trader_note")) updates.traderNote = pickBodyField(b, "traderNote", "TraderNote", "trader_note") ?? null;
    if (hasBodyKey(b, "driverId", "DriverID", "driver_id")) updates.driverId = parseOptionalInt(pickBodyField(b, "driverId", "DriverID", "driver_id")) ?? null;
    if (hasBodyKey(b, "vehicleId", "VehicleID", "vehicle_id")) updates.vehicleId = parseOptionalInt(pickBodyField(b, "vehicleId", "VehicleID", "vehicle_id")) ?? null;
    if (hasBodyKey(b, "goodTypeId", "GoodTypeID", "good_type_id")) updates.goodTypeId = parseOptionalInt(pickBodyField(b, "goodTypeId", "GoodTypeID", "good_type_id")) ?? null;
    if (hasBodyKey(b, "govId", "GovID", "gov_id")) updates.govId = parseOptionalInt(pickBodyField(b, "govId", "GovID", "gov_id")) ?? null;
    if (hasBodyKey(b, "syrCus", "SyrCus", "syr_cus")) updates.syrCus = parseOptionalDecimal(pickBodyField(b, "syrCus", "SyrCus", "syr_cus")) ?? "0";
    if (hasBodyKey(b, "carQty", "CarQty", "car_qty")) updates.carQty = parseOptionalInt(pickBodyField(b, "carQty", "CarQty", "car_qty")) ?? null;
    if (hasBodyKey(b, "transPrice", "TransPrice", "trans_price")) updates.transPrice = parseOptionalDecimal(pickBodyField(b, "transPrice", "TransPrice", "trans_price")) ?? null;
    if (hasBodyKey(b, "carrierId", "CarrierID", "carrier_id")) updates.carrierId = parseOptionalInt(pickBodyField(b, "carrierId", "CarrierID", "carrier_id")) ?? null;
    if (hasBodyKey(b, "qty", "Qty")) updates.qty = parseOptionalInt(pickBodyField(b, "qty", "Qty")) ?? null;
    const companyId = pickBodyField(b, "companyId", "CompanyID", "company_id");
    const companyName = pickBodyField(b, "companyName", "CompanyName", "company_name");
    if (companyId) {
      updates.companyId = parseInt(String(companyId), 10);
      const [company] = await db.select().from(companies).where(eq(companies.id, parseInt(String(companyId), 10))).limit(1);
      if (company) updates.companyName = company.name;
    } else if (hasBodyKey(b, "companyName", "CompanyName", "company_name")) {
      if (hasBodyValue(companyName)) {
        updates.companyName = String(companyName);
        const [existingCompany] = await db.select().from(companies).where(eq(companies.name, String(companyName))).limit(1);
        updates.companyId = existingCompany?.id ?? null;
      } else {
        updates.companyName = null;
        updates.companyId = null;
      }
    }
    if (hasBodyKey(b, "accountId", "AccountID", "account_id")) updates.accountId = parseOptionalInt(pickBodyField(b, "accountId", "AccountID", "account_id")) ?? null;
    await db.update(transactions).set(updates).where(eq(transactions.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط¹ط§ظ…ظ„ط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/transactions/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(transactions).where(eq(transactions.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ظ…ط¹ط§ظ…ظ„ط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== REPORTS ====================

// Dashboard
router.get("/reports/dashboard", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const [{ count: totalAccounts }] = await db.select({ count: sql<number>`count(*)` }).from(accounts);
    const [{ count: totalTransactions }] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const allPorts = await db.select().from(ports);
    const allTxns = await db.select().from(transactions);
    const portStats = allPorts.map(p => {
      const portTxns = allTxns.filter(t => t.portId === p.portId);
      const totals = calculateTransactionTotals(portTxns);
      return {
        PortID: p.portId, PortName: p.name, transCount: portTxns.length,
        invoicesUSD: totals.totalInvoicesUSD,
        invoicesIQD: totals.totalInvoicesIQD,
        paymentsUSD: totals.totalPaymentsUSD,
        paymentsIQD: totals.totalPaymentsIQD,
      };
    });
    const monthlyTrend: any[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthTxns = allTxns.filter(t => t.transDate?.startsWith(monthStr));
      const monthTotals = calculateTransactionTotals(monthTxns);
      monthlyTrend.push({
        month: monthStr,
        invoicesUSD: monthTotals.totalInvoicesUSD,
        paymentsUSD: monthTotals.totalPaymentsUSD,
      });
    }
    const allDebts = await db.select().from(debts);
    const totalDebts = {
      totalUSD: allDebts.reduce((s, d) => s + parseFloat(d.amountUSD || "0"), 0),
      totalIQD: allDebts.reduce((s, d) => s + parseFloat(d.amountIQD || "0"), 0),
    };
    const recentTxns = await db.select().from(transactions).orderBy(desc(transactions.id)).limit(10);
    const enrichedRecent = await enrichTransactions(db, recentTxns);
    const allAccs = await db.select().from(accounts);
    const topTraders = allAccs.map(a => {
      const accTxns = allTxns.filter(t => t.accountId === a.id);
      const totals = calculateTransactionTotals(accTxns);
      return { AccountID: a.id, AccountName: a.name, transCount: accTxns.length, balanceUSD: totals.balanceUSD };
    }).sort((a, b) => Math.abs(b.balanceUSD) - Math.abs(a.balanceUSD)).slice(0, 10);
    return res.json({ totalAccounts: Number(totalAccounts), totalTransactions: Number(totalTransactions), portStats, monthlyTrend, totalDebts, recentTransactions: enrichedRecent, topTraders });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Account statement
router.get("/reports/account-statement/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const accountId = parseInt(req.params.id);
    const { startDate, endDate, portId, accountType } = req.query;
    const conditions: any[] = [eq(transactions.accountId, accountId)];
    if (portId) conditions.push(eq(transactions.portId, portId as string));
    if (accountType) conditions.push(eq(transactions.accountType, accountType as string));
    if (startDate) conditions.push(sql`${transactions.transDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${transactions.transDate} <= ${endDate}`);
    const txns = await db.select().from(transactions).where(and(...conditions)).orderBy(asc(transactions.transDate), asc(transactions.id));
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    const enriched = await enrichTransactions(db, txns);
    const totals = calculateTransactionTotals(txns);
    const stmtRows = addRunningBalances(enriched).map((t: any) => ({
      ...t,
      AccountName: account?.name || t.AccountName,
    }));
    return res.json({ account: account ? mapAccount(account) : null, transactions: stmtRows, statement: stmtRows, shipmentCount: totals.shipmentCount, totals });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Expenses report
router.get("/reports/expenses/:portId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const portId = req.params.portId;
    const { startDate, endDate, from, to } = req.query;
    const conditions: any[] = [eq(transactions.portId, portId)];
    const sDate = startDate || from;
    const eDate = endDate || to;
    if (sDate) conditions.push(sql`${transactions.transDate} >= ${sDate}`);
    if (eDate) conditions.push(sql`${transactions.transDate} <= ${eDate}`);
    const txns = await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.transDate));
    const enriched = await enrichTransactions(db, txns);
    const totals = calculateTransactionTotals(txns);
    return res.json({
      rows: enriched, transactions: enriched,
      totals: {
        totalInvoicesUSD: totals.totalInvoicesUSD,
        totalInvoicesIQD: totals.totalInvoicesIQD,
        totalPaymentsUSD: totals.totalPaymentsUSD,
        totalPaymentsIQD: totals.totalPaymentsIQD,
        totalCostUSD: totals.totalInvoicesUSD,
        totalAmountUSD: totals.totalInvoicesUSD,
        balanceUSD: totals.balanceUSD,
        balanceIQD: totals.balanceIQD,
      },
      summary: {
        totalInvoicesUSD: totals.totalInvoicesUSD,
        totalInvoicesIQD: totals.totalInvoicesIQD,
        totalPaymentsUSD: totals.totalPaymentsUSD,
        totalPaymentsIQD: totals.totalPaymentsIQD,
        balanceUSD: totals.balanceUSD,
        balanceIQD: totals.balanceIQD,
      }
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Profits report
router.get("/reports/profits", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { startDate, endDate, from, to, port } = req.query;
    const conditions: any[] = [];
    const sDate = startDate || from;
    const eDate = endDate || to;
    if (sDate) conditions.push(sql`${transactions.transDate} >= ${sDate}`);
    if (eDate) conditions.push(sql`${transactions.transDate} <= ${eDate}`);
    if (port) conditions.push(eq(transactions.portId, port as string));
    let query = db.select().from(transactions);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const txns = await query;
    const enriched = await enrichTransactions(db, txns);
    // Only DR (ظ„ظ‡) transactions have profit (Amount - Cost)
    const drRows = enriched.filter((t: any) => t.TransTypeID === 1);
    const totalCostUSD = drRows.reduce((s: number, t: any) => s + (t.CostUSD || 0), 0);
    const totalCostIQD = drRows.reduce((s: number, t: any) => s + (t.CostIQD || 0), 0);
    const totalAmountUSD = drRows.reduce((s: number, t: any) => s + getAbsoluteAmount(t.AmountUSD), 0);
    const totalAmountIQD = drRows.reduce((s: number, t: any) => s + getAbsoluteAmount(t.AmountIQD), 0);
    const totalProfitUSD = drRows.reduce((s: number, t: any) => s + (t.ProfitUSD || 0), 0);
    const totalProfitIQD = drRows.reduce((s: number, t: any) => s + (t.ProfitIQD || 0), 0);
    // Per-trader profit summary
    const traderMap: Record<string, any> = {};
    for (const t of drRows) {
      const key = (t as any).AccountName || 'ط؛ظٹط± ظ…ط­ط¯ط¯';
      if (!traderMap[key]) traderMap[key] = { AccountName: key, shipmentCount: 0, totalCostUSD: 0, totalAmountUSD: 0, totalProfitUSD: 0, totalCostIQD: 0, totalAmountIQD: 0, totalProfitIQD: 0 };
      traderMap[key].shipmentCount++;
      traderMap[key].totalCostUSD += (t as any).CostUSD || 0;
      traderMap[key].totalAmountUSD += (t as any).AmountUSD || 0;
      traderMap[key].totalProfitUSD += (t as any).ProfitUSD || 0;
      traderMap[key].totalCostIQD += (t as any).CostIQD || 0;
      traderMap[key].totalAmountIQD += (t as any).AmountIQD || 0;
      traderMap[key].totalProfitIQD += (t as any).ProfitIQD || 0;
    }
    const traderProfits = Object.values(traderMap).sort((a: any, b: any) => b.totalProfitUSD - a.totalProfitUSD);
    return res.json({
      rows: drRows,
      traderProfits,
      totals: { totalCostUSD, totalCostIQD, totalAmountUSD, totalAmountIQD, totalProfitUSD, totalProfitIQD, shipmentCount: drRows.length },
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Debts summary
router.get("/reports/debts-summary", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const allDebts = await db.select().from(debts);
    const totalUSD = allDebts.reduce((s, d) => s + parseFloat(d.amountUSD || "0"), 0);
    const totalIQD = allDebts.reduce((s, d) => s + parseFloat(d.amountIQD || "0"), 0);
    const paidUSD = allDebts.reduce((s, d) => s + parseFloat(d.paidAmountUSD || "0"), 0);
    const paidIQD = allDebts.reduce((s, d) => s + parseFloat(d.paidAmountIQD || "0"), 0);
    const debtorMap: Record<string, any> = {};
    for (const d of allDebts) {
      const key = d.debtorName;
      if (!debtorMap[key]) debtorMap[key] = { AccountID: key, AccountName: key, totalUSD: 0, totalIQD: 0, paidUSD: 0, paidIQD: 0, count: 0 };
      debtorMap[key].totalUSD += parseFloat(d.amountUSD || "0");
      debtorMap[key].totalIQD += parseFloat(d.amountIQD || "0");
      debtorMap[key].paidUSD += parseFloat(d.paidAmountUSD || "0");
      debtorMap[key].paidIQD += parseFloat(d.paidAmountIQD || "0");
      debtorMap[key].count++;
    }
    return res.json({ debts: allDebts.map(mapDebt), summary: Object.values(debtorMap), totals: { totalUSD, totalIQD, paidUSD, paidIQD, remainingUSD: totalUSD - paidUSD, remainingIQD: totalIQD - paidIQD } });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Trial balance with opening/closing balances and profit
router.get("/reports/trial-balance", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { startDate, endDate, portId, accountType } = req.query;
    const allAccs = await db.select().from(accounts);
    const allAccountTypes = await db.select().from(accountTypes);
    const accountTypeNameMap = new Map(allAccountTypes.map(t => [t.typeId, t.name]));

    // Build conditions for the period
    const periodConditions: any[] = [];
    if (startDate) periodConditions.push(sql`${transactions.transDate} >= ${startDate}`);
    if (endDate) periodConditions.push(sql`${transactions.transDate} <= ${endDate}`);
    if (portId) periodConditions.push(eq(transactions.portId, portId as string));
    if (accountType) periodConditions.push(eq(transactions.accountType, accountType as string));

    // Get ALL transactions (for opening balance calculation)
    const portAcctConditions: any[] = [];
    if (portId) portAcctConditions.push(eq(transactions.portId, portId as string));
    if (accountType) portAcctConditions.push(eq(transactions.accountType, accountType as string));
    let allTxQuery = db.select().from(transactions);
    if (portAcctConditions.length > 0) allTxQuery = allTxQuery.where(and(...portAcctConditions)) as any;
    const allTxns = await allTxQuery;

    // Get period transactions
    let periodTxQuery = db.select().from(transactions);
    if (periodConditions.length > 0) periodTxQuery = periodTxQuery.where(and(...periodConditions)) as any;
    const periodTxns = await periodTxQuery;

    const rows = allAccs.map(a => {
      const accPeriodTxns = periodTxns.filter(t => t.accountId === a.id);
      const accAllTxns = allTxns.filter(t => t.accountId === a.id);

      // Skip accounts with no transactions at all
      if (accAllTxns.length === 0) return null;

      const priorTxns = startDate
        ? accAllTxns.filter(t => t.transDate && t.transDate < (startDate as string))
        : [];
      const openingTotals = calculateTransactionTotals(priorTxns);
      const periodTotals = calculateTransactionTotals(accPeriodTxns);

      const openingBalanceUSD = openingTotals.balanceUSD;
      const openingBalanceIQD = openingTotals.balanceIQD;

      // Period movements
      const debitUSD = periodTotals.totalInvoicesUSD;
      const debitIQD = periodTotals.totalInvoicesIQD;
      const creditUSD = periodTotals.totalPaymentsUSD;
      const creditIQD = periodTotals.totalPaymentsIQD;

      // Closing balance = Opening + Period Debit - Period Credit
      const closingBalanceUSD = openingBalanceUSD + debitUSD - creditUSD;
      const closingBalanceIQD = openingBalanceIQD + debitIQD - creditIQD;

      // Profit: Amount - Cost for invoice transactions in period
      const costUSD = periodTotals.totalCostUSD;
      const costIQD = periodTotals.totalCostIQD;
      const profitUSD = periodTotals.totalProfitUSD;
      const profitIQD = periodTotals.totalProfitIQD;

      const shipmentCount = periodTotals.shipmentCount;

      // Skip if no period transactions and no opening balance
      if (accPeriodTxns.length === 0 && openingBalanceUSD === 0 && openingBalanceIQD === 0) return null;

      return {
        AccountID: a.id,
        AccountName: a.name,
        AccountType: a.accountType,
        AccountTypeName: accountTypeNameMap.get(a.accountType) || a.accountType,
        // Opening balance
        opening_usd: openingBalanceUSD, opening_iqd: openingBalanceIQD,
        // Period movements
        debit_usd: debitUSD, debit_iqd: debitIQD, credit_usd: creditUSD, credit_iqd: creditIQD,
        // Closing balance
        balance_usd: closingBalanceUSD, balance_iqd: closingBalanceIQD,
        // Profit
        profit_usd: profitUSD, profit_iqd: profitIQD,
        cost_usd: costUSD, cost_iqd: costIQD,
        // Counts
        shipment_count: shipmentCount, trans_count: accPeriodTxns.length,
      };
    }).filter(Boolean);

    const totals = {
      account_count: rows.length,
      opening_usd: rows.reduce((s, r: any) => s + r.opening_usd, 0),
      opening_iqd: rows.reduce((s, r: any) => s + r.opening_iqd, 0),
      debit_usd: rows.reduce((s, r: any) => s + r.debit_usd, 0),
      debit_iqd: rows.reduce((s, r: any) => s + r.debit_iqd, 0),
      credit_usd: rows.reduce((s, r: any) => s + r.credit_usd, 0),
      credit_iqd: rows.reduce((s, r: any) => s + r.credit_iqd, 0),
      balance_usd: rows.reduce((s, r: any) => s + r.balance_usd, 0),
      balance_iqd: rows.reduce((s, r: any) => s + r.balance_iqd, 0),
      profit_usd: rows.reduce((s, r: any) => s + r.profit_usd, 0),
      profit_iqd: rows.reduce((s, r: any) => s + r.profit_iqd, 0),
      cost_usd: rows.reduce((s, r: any) => s + r.cost_usd, 0),
      cost_iqd: rows.reduce((s, r: any) => s + r.cost_iqd, 0),
      shipment_count: rows.reduce((s, r: any) => s + r.shipment_count, 0),
      trans_count: rows.reduce((s, r: any) => s + r.trans_count, 0),
    };
    return res.json({ rows, totals });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== DEBTS ====================
router.get("/debts", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(debts).orderBy(desc(debts.id));
    return res.json(result.map(mapDebt));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/debts", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const data = {
      debtorName: req.body.debtorName || req.body.AccountName || req.body.AccountID || '',
      amountUSD: req.body.amountUSD || req.body.AmountUSD || '0',
      amountIQD: req.body.amountIQD || req.body.AmountIQD || '0',
      description: req.body.description || req.body.Notes || '',
      date: req.body.date || req.body.TransDate || new Date().toISOString().split('T')[0],
      status: req.body.status || req.body.State || 'pending',
    };
    const result = await db.insert(debts).values(data);
    return res.json({ id: Number(result[0].insertId), message: "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ط¯ظٹظ†" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/debts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.update(debts).set(req.body).where(eq(debts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ط¯ظٹظ†" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/debts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(debts).where(eq(debts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ط¯ظٹظ†" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== LOOKUPS ====================
router.get("/lookups/goods-types", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(goodsTypes);
    return res.json(result.map(g => ({ ...g, GoodTypeID: g.id, TypeName: g.name })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/lookups/goods-types", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const name = req.body.name || req.body.TypeName;
    // Check for duplicate goods type
    if (name) {
      const [existing] = await db.select().from(goodsTypes).where(eq(goodsTypes.name, name)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, GoodTypeID: existing.id, TypeName: existing.name, existing: true });
      }
    }
    const result = await db.insert(goodsTypes).values({ name });
    return res.json({ id: Number(result[0].insertId), GoodTypeID: Number(result[0].insertId), TypeName: name });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/lookups/governorates", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(governorates);
    return res.json(result.map(g => ({
      ...g,
      GovID: g.id,
      GovName: g.name,
      GovernorateID: g.id,
      GovernorateName: g.name,
    })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/lookups/ports", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(ports);
    return res.json(result.map(p => ({ ...p, PortID: p.portId, PortName: p.name })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/lookups/account-types", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(accountTypes);
    return res.json(result.map(at => ({ ...at, AccountTypeID: at.typeId, TypeName: at.name })));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== PAYMENT MATCHING ====================
router.get("/payment-matching", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(paymentMatching).orderBy(desc(paymentMatching.id));
    return res.json(result);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Payment Matching Dashboard (real data) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/payment-matching/dashboard", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Get all invoices (DR = shipments/ظپظˆط§طھظٹط±) with their allocated amounts
    const shipmentRows: any[] = await db.execute(sql`
      SELECT
        t.id AS shipment_id,
        t.ref_no,
        t.trans_date,
        t.account_id,
        a.name AS AccountName,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
        COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
        COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
      LEFT JOIN (
        SELECT invoiceId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
        FROM payment_matching
        GROUP BY invoiceId
      ) pm_agg ON pm_agg.invoiceId = t.id
      WHERE t.direction IN ('IN', 'in', 'DR', 'dr')
    `);

    // Classify each shipment
    let paidCount = 0, paidTotalUsd = 0, paidTotalIqd = 0;
    let partialCount = 0, partialRemUsd = 0, partialRemIqd = 0;
    let unpaidCount = 0, unpaidRemUsd = 0, unpaidRemIqd = 0;

    // Track per-account remaining
    const accountMap: Record<number, { account_id: number; AccountName: string; unpaid_count: number; remaining_usd: number; remaining_iqd: number }> = {};

    for (const row of shipmentRows) {
      const amtUsd = Number(row.amount_usd) || 0;
      const amtIqd = Number(row.amount_iqd) || 0;
      const paidUsd = Number(row.paid_usd) || 0;
      const paidIqd = Number(row.paid_iqd) || 0;
      const remUsd = Math.max(0, amtUsd - paidUsd);
      const remIqd = Math.max(0, amtIqd - paidIqd);

      if (remUsd <= 0 && remIqd <= 0) {
        // Fully paid
        paidCount++;
        paidTotalUsd += amtUsd;
        paidTotalIqd += amtIqd;
      } else if (paidUsd > 0 || paidIqd > 0) {
        // Partially paid
        partialCount++;
        partialRemUsd += remUsd;
        partialRemIqd += remIqd;
      } else {
        // Unpaid
        unpaidCount++;
        unpaidRemUsd += remUsd;
        unpaidRemIqd += remIqd;
      }

      // Track accounts with remaining
      if (remUsd > 0 || remIqd > 0) {
        const aid = row.account_id;
        if (!accountMap[aid]) {
          accountMap[aid] = { account_id: aid, AccountName: row.AccountName || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ', unpaid_count: 0, remaining_usd: 0, remaining_iqd: 0 };
        }
        accountMap[aid].unpaid_count++;
        accountMap[aid].remaining_usd += remUsd;
        accountMap[aid].remaining_iqd += remIqd;
      }
    }

    // Get unallocated payments (CR = ط³ظ†ط¯ط§طھ/طھط³ط¯ظٹط¯ط§طھ)
    const paymentRows: any[] = await db.execute(sql`
      SELECT
        COALESCE(SUM(CAST(t.amount_usd AS DECIMAL(15,2))), 0) AS total_payment_usd,
        COALESCE(SUM(CAST(t.amount_iqd AS DECIMAL(15,0))), 0) AS total_payment_iqd
      FROM transactions t
      WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
    `);
    const allocatedRows: any[] = await db.execute(sql`
      SELECT
        COALESCE(SUM(CAST(amountUSD AS DECIMAL(15,2))), 0) AS allocated_usd,
        COALESCE(SUM(CAST(amountIQD AS DECIMAL(15,0))), 0) AS allocated_iqd
      FROM payment_matching
    `);

    const totalPayUsd = Number(paymentRows[0]?.total_payment_usd) || 0;
    const totalPayIqd = Number(paymentRows[0]?.total_payment_iqd) || 0;
    const allocUsd = Number(allocatedRows[0]?.allocated_usd) || 0;
    const allocIqd = Number(allocatedRows[0]?.allocated_iqd) || 0;

    // Sort top remaining accounts by remaining_usd desc
    const topRemaining = Object.values(accountMap)
      .sort((a, b) => b.remaining_usd - a.remaining_usd || b.remaining_iqd - a.remaining_iqd)
      .slice(0, 20);

    return res.json({
      shipmentStats: [
        { payment_status: 'paid', count: paidCount, total_usd: paidTotalUsd, total_iqd: paidTotalIqd },
        { payment_status: 'partial', count: partialCount, remaining_usd: partialRemUsd, remaining_iqd: partialRemIqd },
        { payment_status: 'unpaid', count: unpaidCount, remaining_usd: unpaidRemUsd, remaining_iqd: unpaidRemIqd },
      ],
      paymentStats: {
        total_usd: totalPayUsd,
        total_iqd: totalPayIqd,
        allocated_usd: allocUsd,
        allocated_iqd: allocIqd,
        unallocated_usd: Math.max(0, totalPayUsd - allocUsd),
        unallocated_iqd: Math.max(0, totalPayIqd - allocIqd),
      },
      topRemaining,
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Shipments for a specific account â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/payment-matching/shipments", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const accountId = parseInt(req.query.account as string);
    const limit = parseInt(req.query.limit as string) || 200;
    if (!accountId) return res.status(400).json({ error: "account parameter required" });

    const rows: any[] = await db.execute(sql`
      SELECT
        t.id AS shipment_id,
        t.ref_no,
        t.trans_date,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
        COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
        COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
      FROM transactions t
      LEFT JOIN (
        SELECT invoiceId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
        FROM payment_matching
        GROUP BY invoiceId
      ) pm_agg ON pm_agg.invoiceId = t.id
      WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${accountId}
      ORDER BY t.trans_date DESC
      LIMIT ${limit}
    `);

    const enriched = rows.map(r => {
      const amtUsd = Number(r.amount_usd) || 0;
      const amtIqd = Number(r.amount_iqd) || 0;
      const paidUsd = Number(r.paid_usd) || 0;
      const paidIqd = Number(r.paid_iqd) || 0;
      const remUsd = Math.max(0, amtUsd - paidUsd);
      const remIqd = Math.max(0, amtIqd - paidIqd);
      let status = 'unpaid';
      if (remUsd <= 0 && remIqd <= 0) status = 'paid';
      else if (paidUsd > 0 || paidIqd > 0) status = 'partial';
      return { ...r, remaining_usd: remUsd, remaining_iqd: remIqd, payment_status: status };
    });

    return res.json({ rows: enriched, total: enriched.length });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Account payment summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/payment-matching/summary/:accountId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const accountId = parseInt(req.params.accountId);

    const rows: any[] = await db.execute(sql`
      SELECT
        t.id,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
        COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
        COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
      FROM transactions t
      LEFT JOIN (
        SELECT invoiceId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
        FROM payment_matching
        GROUP BY invoiceId
      ) pm_agg ON pm_agg.invoiceId = t.id
      WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${accountId}
    `);

    const shipments: Array<{ payment_status: string; count: number; remaining_usd: number; remaining_iqd: number }> = [];
    let paid = { count: 0, remaining_usd: 0, remaining_iqd: 0 };
    let partial = { count: 0, remaining_usd: 0, remaining_iqd: 0 };
    let unpaid = { count: 0, remaining_usd: 0, remaining_iqd: 0 };

    for (const r of rows) {
      const remUsd = Math.max(0, (Number(r.amount_usd) || 0) - (Number(r.paid_usd) || 0));
      const remIqd = Math.max(0, (Number(r.amount_iqd) || 0) - (Number(r.paid_iqd) || 0));
      if (remUsd <= 0 && remIqd <= 0) { paid.count++; }
      else if ((Number(r.paid_usd) || 0) > 0 || (Number(r.paid_iqd) || 0) > 0) {
        partial.count++; partial.remaining_usd += remUsd; partial.remaining_iqd += remIqd;
      } else {
        unpaid.count++; unpaid.remaining_usd += remUsd; unpaid.remaining_iqd += remIqd;
      }
    }

    shipments.push(
      { payment_status: 'paid', ...paid },
      { payment_status: 'partial', ...partial },
      { payment_status: 'unpaid', ...unpaid },
    );

    return res.json({ shipments });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Single shipment detail with allocations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/payment-matching/shipments/:shipmentId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const shipmentId = parseInt(req.params.shipmentId);

    // Get shipment info
    const shipmentRows: any[] = await db.execute(sql`
      SELECT
        t.id AS shipment_id,
        t.ref_no,
        t.trans_date,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
        COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
        COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
      FROM transactions t
      LEFT JOIN (
        SELECT invoiceId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
        FROM payment_matching
        GROUP BY invoiceId
      ) pm_agg ON pm_agg.invoiceId = t.id
      WHERE t.id = ${shipmentId}
    `);

    if (!shipmentRows.length) return res.status(404).json({ error: "Shipment not found" });

    const s = shipmentRows[0];
    const remUsd = Math.max(0, (Number(s.amount_usd) || 0) - (Number(s.paid_usd) || 0));
    const remIqd = Math.max(0, (Number(s.amount_iqd) || 0) - (Number(s.paid_iqd) || 0));
    let status = 'unpaid';
    if (remUsd <= 0 && remIqd <= 0) status = 'paid';
    else if ((Number(s.paid_usd) || 0) > 0 || (Number(s.paid_iqd) || 0) > 0) status = 'partial';

    // Get allocations for this shipment
    const allocations: any[] = await db.execute(sql`
      SELECT
        pm.id,
        pm.paymentId,
        CAST(pm.amountUSD AS DECIMAL(15,2)) AS allocated_usd,
        CAST(pm.amountIQD AS DECIMAL(15,0)) AS allocated_iqd,
        pm.notes,
        pm.createdAt,
        t.ref_no AS payment_ref,
        t.trans_date AS payment_date
      FROM payment_matching pm
      LEFT JOIN transactions t ON t.id = pm.paymentId
      WHERE pm.invoiceId = ${shipmentId}
      ORDER BY pm.createdAt DESC
    `);

    return res.json({
      shipment: { ...s, remaining_usd: remUsd, remaining_iqd: remIqd, payment_status: status },
      allocations,
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Auto-match all unmatched payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post("/payment-matching/auto-match-all", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Get all unallocated payments (CR) grouped by account
    const payments: any[] = await db.execute(sql`
      SELECT
        t.id AS payment_id,
        t.account_id,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS total_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS total_iqd,
        COALESCE(pm_agg.used_usd, 0) AS used_usd,
        COALESCE(pm_agg.used_iqd, 0) AS used_iqd
      FROM transactions t
      LEFT JOIN (
        SELECT paymentId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS used_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS used_iqd
        FROM payment_matching
        GROUP BY paymentId
      ) pm_agg ON pm_agg.paymentId = t.id
      WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
      HAVING (total_usd - used_usd > 0) OR (total_iqd - used_iqd > 0)
      ORDER BY t.trans_date ASC
    `);

    let matchCount = 0;

    for (const payment of payments) {
      let availUsd = (Number(payment.total_usd) || 0) - (Number(payment.used_usd) || 0);
      let availIqd = (Number(payment.total_iqd) || 0) - (Number(payment.used_iqd) || 0);
      if (availUsd <= 0 && availIqd <= 0) continue;

      // Get unpaid invoices for the same account, oldest first
      const invoices: any[] = await db.execute(sql`
        SELECT
          t.id AS invoice_id,
          COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
          COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
          COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
          COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
        FROM transactions t
        LEFT JOIN (
          SELECT invoiceId,
            SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
            SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
          FROM payment_matching
          GROUP BY invoiceId
        ) pm_agg ON pm_agg.invoiceId = t.id
        WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${payment.account_id}
        HAVING (amount_usd - COALESCE(paid_usd, 0) > 0) OR (amount_iqd - COALESCE(paid_iqd, 0) > 0)
        ORDER BY t.trans_date ASC
      `);

      for (const inv of invoices) {
        if (availUsd <= 0 && availIqd <= 0) break;

        const needUsd = Math.max(0, (Number(inv.amount_usd) || 0) - (Number(inv.paid_usd) || 0));
        const needIqd = Math.max(0, (Number(inv.amount_iqd) || 0) - (Number(inv.paid_iqd) || 0));

        const allocUsd = Math.min(availUsd, needUsd);
        const allocIqd = Math.min(availIqd, needIqd);

        if (allocUsd > 0 || allocIqd > 0) {
          await db.insert(paymentMatching).values({
            invoiceId: inv.invoice_id,
            paymentId: payment.payment_id,
            amountUSD: String(allocUsd),
            amountIQD: String(allocIqd),
            notes: 'ط±ط¨ط· طھظ„ظ‚ط§ط¦ظٹ',
          });
          availUsd -= allocUsd;
          availIqd -= allocIqd;
          matchCount++;
        }
      }
    }

    return res.json({ message: `طھظ… ط±ط¨ط· ${matchCount} ط´ط­ظ†ط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹`, matched: matchCount });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// â”€â”€â”€ Delete allocation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.delete("/payment-matching/allocate/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(paymentMatching).where(eq(paymentMatching.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ط±ط¨ط·" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/payment-matching", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.insert(paymentMatching).values(req.body);
    return res.json({ id: Number(result[0].insertId), message: "طھظ… ط§ظ„ظ…ط·ط§ط¨ظ‚ط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/payment-matching/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(paymentMatching).where(eq(paymentMatching.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ظ…ط·ط§ط¨ظ‚ط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== SPECIAL ACCOUNTS ====================
router.get("/special/haider", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(specialAccounts).where(eq(specialAccounts.type, "haider"));
    const rows = result.map(r => {
      const amountUSD = Number(r.amountUSD || 0);
      const amountIQD = Number(r.amountIQD || 0);
      // Use costUSD from description if stored, otherwise derive from amount
      const costUSD = (r as any).costUSD ? Number((r as any).costUSD) : 0;
      const profitUSD = amountUSD - costUSD;
      return {
        TransDate: r.date || '',
        DriverName: '',
        PlateNumber: '',
        GoodType: '',
        Weight: 0,
        CostUSD: costUSD,
        AmountUSD: amountUSD,
        ProfitUSD: profitUSD,
        AmountIQD: amountIQD,
        AmountIQD2: 0,
        TraderNote: r.description || '',
        ...r,
      };
    });
    const totalProfitUSD = rows.reduce((s, r) => s + Number(r.ProfitUSD || 0), 0);
    const totals = {
      count: rows.length,
      totalCostUSD: rows.reduce((s, r) => s + Number(r.CostUSD || 0), 0),
      totalAmountUSD: rows.reduce((s, r) => s + Number(r.AmountUSD || 0), 0),
      totalProfitUSD,
      totalAmountIQD: rows.reduce((s, r) => s + Number(r.AmountIQD || 0), 0),
      totalAmountIQD2: rows.reduce((s, r) => s + Number(r.AmountIQD2 || 0), 0),
    };
    return res.json({ statement: rows, totals });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.get("/special/partnership", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.select().from(specialAccounts).where(eq(specialAccounts.type, "partnership"));
    const rows = result.map(r => ({
      TransDate: r.date || '',
      PortName: '',
      TraderName: r.name || '',
      DriverName: '',
      GoodType: '',
      GovName: '',
      Qty: 0,
      AmountUSD: Number(r.amountUSD || 0),
      AmountUSD_Partner: 0,
      CLR: 0,
      TX: 0,
      Notes: r.description || '',
      ...r,
    }));
    const totals = {
      count: rows.length,
      totalAmountUSD: rows.reduce((s, r) => s + Number(r.AmountUSD || 0), 0),
      totalPartnerUSD: rows.reduce((s, r) => s + Number(r.AmountUSD_Partner || 0), 0),
      totalCLR: rows.reduce((s, r) => s + Number(r.CLR || 0), 0),
      totalTX: rows.reduce((s, r) => s + Number(r.TX || 0), 0),
    };
    return res.json({ rows, totals });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.post("/special", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const result = await db.insert(specialAccounts).values(req.body);
    return res.json({ id: Number(result[0].insertId), message: "طھظ… ط§ظ„ط¥ط¶ط§ظپط©" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.put("/special/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.update(specialAccounts).set(req.body).where(eq(specialAccounts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط§ظ„طھط­ط¯ظٹط«" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

router.delete("/special/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    await db.delete(specialAccounts).where(eq(specialAccounts.id, parseInt(req.params.id)));
    return res.json({ message: "طھظ… ط§ظ„ط­ط°ظپ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== FIELD CONFIGURATION ====================

// Get field config for a section
router.get("/field-config/:sectionKey", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const configs = await db.select().from(fieldConfig)
      .where(eq(fieldConfig.sectionKey, req.params.sectionKey))
      .orderBy(asc(fieldConfig.sortOrder));
    return res.json(configs);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Get all field configs (for admin)
router.get("/field-config", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const configs = await db.select().from(fieldConfig).orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));
    return res.json(configs);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Update field visibility/order for a section
router.put("/field-config/:sectionKey", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { fields } = req.body; // Array of { fieldKey, visible, sortOrder, displayLabel }
    if (!Array.isArray(fields)) return res.status(400).json({ error: "fields array required" });
    for (const f of fields) {
      const displayLabel = typeof f.displayLabel === "string" && f.displayLabel.trim() ? f.displayLabel.trim() : null;
      const existing = await db.select().from(fieldConfig)
        .where(and(eq(fieldConfig.sectionKey, req.params.sectionKey), eq(fieldConfig.fieldKey, f.fieldKey)));
      if (existing.length > 0) {
        await db.update(fieldConfig)
          .set({ visible: f.visible ? 1 : 0, sortOrder: f.sortOrder || 0, displayLabel })
          .where(and(eq(fieldConfig.sectionKey, req.params.sectionKey), eq(fieldConfig.fieldKey, f.fieldKey)));
      } else {
        await db.insert(fieldConfig).values({
          sectionKey: req.params.sectionKey,
          fieldKey: f.fieldKey,
          visible: f.visible ? 1 : 0,
          sortOrder: f.sortOrder || 0,
          displayLabel,
        });
      }
    }
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ظ‚ظˆظ„" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== CUSTOM FIELDS ====================

// Get all custom fields
router.get("/custom-fields", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const sectionKey = typeof req.query.sectionKey === "string" ? req.query.sectionKey : undefined;
    const fields = await getCustomFieldsWithSections(db, sectionKey);
    return res.json(fields);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Create a custom field
router.post("/custom-fields", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { label, fieldType, options, defaultValue, placement, sections, formula } = req.body;
    // Generate unique key using max id
    const maxIdResult = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(customFields);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;
    const fieldKey = `custom_${nextId}`;
    const result = await db.insert(customFields).values({
      fieldKey,
      label,
      fieldType: fieldType || 'text',
      options: options || null,
      defaultValue: defaultValue || null,
      formula: fieldType === 'formula' ? (formula || null) : null,
      placement: placement || 'transaction',
    });
    const newId = Number(result[0].insertId);
    // Add field config entries for selected sections
    if (Array.isArray(sections)) {
      for (const sectionKey of sections) {
        // Get max sort order for this section
        const maxOrder = await db.select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 0)` })
          .from(fieldConfig).where(eq(fieldConfig.sectionKey, sectionKey));
        const nextOrder = (maxOrder[0]?.maxOrder || 0) + 1;
        await db.insert(fieldConfig).values({
          sectionKey,
          fieldKey,
          visible: 1,
          sortOrder: nextOrder,
          displayLabel: null,
        });
      }
    }
    return res.json({ id: newId, fieldKey, message: "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ط­ظ‚ظ„ ط§ظ„ظ…ط®طµطµ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Update a custom field
router.put("/custom-fields/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const id = parseInt(req.params.id);
    const { label, fieldType, options, defaultValue, placement, formula, sections } = req.body;
    const [existingField] = await db.select().from(customFields).where(eq(customFields.id, id)).limit(1);
    if (!existingField) return res.status(404).json({ error: "ط§ظ„ط­ظ‚ظ„ ط؛ظٹط± ظ…ظˆط¬ظˆط¯" });
    await db.update(customFields).set({
      label, fieldType, options, defaultValue, placement,
      formula: fieldType === 'formula' ? (formula || null) : null,
    }).where(eq(customFields.id, id));
    if (Array.isArray(sections)) {
      await syncCustomFieldSections(db, existingField.fieldKey, sections);
    }
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ط­ظ‚ظ„ ط§ظ„ظ…ط®طµطµ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Delete a custom field
router.delete("/custom-fields/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const id = parseInt(req.params.id);
    // Get the field key first
    const field = await db.select().from(customFields).where(eq(customFields.id, id));
    if (field.length === 0) return res.status(404).json({ error: "ط§ظ„ط­ظ‚ظ„ ط؛ظٹط± ظ…ظˆط¬ظˆط¯" });
    const fk = field[0].fieldKey;
    // Delete values, configs, and the field itself
    await db.delete(customFieldValues).where(eq(customFieldValues.customFieldId, id));
    await db.delete(fieldConfig).where(eq(fieldConfig.fieldKey, fk));
    await db.delete(customFields).where(eq(customFields.id, id));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ط­ظ‚ظ„ ط§ظ„ظ…ط®طµطµ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Get custom field values for an entity
router.get("/custom-field-values/:entityType/:entityId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const values = await db.select().from(customFieldValues)
      .where(and(
        eq(customFieldValues.entityType, req.params.entityType),
        eq(customFieldValues.entityId, parseInt(req.params.entityId))
      ));
    return res.json(values);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// Save custom field values for an entity
router.post("/custom-field-values/:entityType/:entityId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { values } = req.body; // Array of { customFieldId, value }
    const entityType = req.params.entityType;
    const entityId = parseInt(req.params.entityId);
    if (!Array.isArray(values)) return res.status(400).json({ error: "values array required" });
    // Delete existing values for this entity
    await db.delete(customFieldValues)
      .where(and(
        eq(customFieldValues.entityType, entityType),
        eq(customFieldValues.entityId, entityId)
      ));
    // Insert new values
    for (const v of values) {
      if (v.value !== null && v.value !== undefined && v.value !== '') {
        await db.insert(customFieldValues).values({
          customFieldId: v.customFieldId,
          entityType,
          entityId,
          value: String(v.value),
        });
      }
    }
    return res.json({ message: "طھظ… ط­ظپط¸ ط§ظ„ظ‚ظٹظ…" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// ==================== EXPENSES CRUD ====================
// GET all expenses (with optional portId filter)
router.get("/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { portId } = req.query;
    const conditions: any[] = [];
    if (portId) conditions.push(eq(expenses.portId, portId as string));
    let query = db.select().from(expenses);
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    const rows = await (query as any).orderBy(desc(expenses.expenseDate));
    return res.json(rows);
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// POST new expense
router.post("/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { expenseDate, amountUSD, amountIQD, description, portId } = req.body;
    const result = await db.insert(expenses).values({
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      amountUSD: amountUSD ? String(amountUSD) : "0",
      amountIQD: amountIQD ? String(amountIQD) : "0",
      description: description || null,
      portId: portId || 'general',
      createdBy: (req as any).user?.id || null,
    });
    return res.json({ id: result[0].insertId, message: "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ…طµط±ظˆظپ ط¨ظ†ط¬ط§ط­" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// PUT update expense
router.put("/expenses/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const id = parseInt(req.params.id);
    const { expenseDate, amountUSD, amountIQD, description, portId } = req.body;
    await db.update(expenses).set({
      expenseDate: expenseDate,
      amountUSD: amountUSD ? String(amountUSD) : "0",
      amountIQD: amountIQD ? String(amountIQD) : "0",
      description: description || null,
      portId: portId || 'general',
    }).where(eq(expenses.id, id));
    return res.json({ message: "طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…طµط±ظˆظپ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// DELETE expense
router.delete("/expenses/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const id = parseInt(req.params.id);
    await db.delete(expenses).where(eq(expenses.id, id));
    return res.json({ message: "طھظ… ط­ط°ظپ ط§ظ„ظ…طµط±ظˆظپ" });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

// GET expenses summary
router.get("/reports/expenses-summary", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
    const portMap: Record<string, { portId: string, label: string, totalUSD: number, totalIQD: number, count: number }> = {};
    const portLabels: Record<string, string> = {
      'general': 'ظ…طµط±ظˆظپط§طھ ط¹ط§ظ…ط©',
      'port-2': 'ظ…طµط±ظˆظپط§طھ ط§ظ„ظ…ظ†ط°ط±ظٹط©',
      'port-3': 'ظ…طµط±ظˆظپط§طھ ط§ظ„ظ‚ط§ط¦ظ…',
    };
    allExpenses.forEach(e => {
      const pid = e.portId || 'general';
      if (!portMap[pid]) portMap[pid] = { portId: pid, label: portLabels[pid] || pid, totalUSD: 0, totalIQD: 0, count: 0 };
      portMap[pid].totalUSD += parseFloat(e.amountUSD || "0");
      portMap[pid].totalIQD += parseFloat(e.amountIQD || "0");
      portMap[pid].count++;
    });
    return res.json({
      expenses: allExpenses,
      summary: Object.values(portMap),
      totals: {
        totalUSD: allExpenses.reduce((s, e) => s + parseFloat(e.amountUSD || "0"), 0),
        totalIQD: allExpenses.reduce((s, e) => s + parseFloat(e.amountIQD || "0"), 0),
        count: allExpenses.length,
      }
    });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

export default router;

