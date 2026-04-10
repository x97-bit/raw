import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, date, uniqueIndex } from "drizzle-orm/mysql-core";

// ==================== AUTH USERS (Template/Manus OAuth - NOT used by the app) ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== APP USERS (username/password login for the business app) ====================
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  profileImage: text("profile_image"),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  permissions: json("permissions").$type<string[]>().default([]),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== ACCOUNTS (traders/customers/carriers/FX) ====================
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  accountType: varchar("accountType", { length: 50 }).notNull(),
  portId: varchar("portId", { length: 50 }),
  currency: varchar("currency", { length: 10 }),                        // العملة الافتراضية
  merchantReport: varchar("merchantReport", { length: 255 }),           // تقرير التاجر (خاص بالقائم)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== DRIVERS ====================
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== VEHICLES ====================
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plateNumber: varchar("plateNumber", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== TRANSACTIONS (unified) ====================
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  refNo: varchar("ref_no", { length: 50 }),
  direction: varchar("direction", { length: 5 }).notNull(),
  transDate: date("trans_date", { mode: "string" }).notNull(),
  accountId: int("account_id").notNull(),
  currency: varchar("currency", { length: 10 }).default("BOTH"),
  driverId: int("driver_id"),
  vehicleId: int("vehicle_id"),
  goodTypeId: int("good_type_id"),
  weight: decimal("weight", { precision: 15, scale: 2 }),
  meters: decimal("meters", { precision: 15, scale: 2 }),
  qty: int("qty"),                                                    // الكمية
  costUsd: decimal("cost_usd", { precision: 15, scale: 2 }).default("0"),
  amountUsd: decimal("amount_usd", { precision: 15, scale: 2 }).default("0"),
  costIqd: decimal("cost_iqd", { precision: 15, scale: 0 }).default("0"),
  amountIqd: decimal("amount_iqd", { precision: 15, scale: 0 }).default("0"),
  feeUsd: decimal("fee_usd", { precision: 15, scale: 2 }).default("0"),
  syrCus: decimal("syr_cus", { precision: 15, scale: 2 }).default("0"),  // الجمارك السورية
  carQty: int("car_qty"),                                             // عدد السيارات
  transPrice: decimal("trans_price", { precision: 15, scale: 0 }),    // سعر النقل
  carrierId: int("carrier_id"),                                       // الناقل (FK لجدول accounts)
  companyName: varchar("company_name", { length: 255 }),              // اسم الشركة
  companyId: int("company_id"),
  govId: int("gov_id"),
  notes: text("notes"),
  traderNote: text("trader_note"),
  recordType: varchar("record_type", { length: 20 }).default("shipment"),
  portId: varchar("port_id", { length: 50 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  refNoUnique: uniqueIndex("uk_transactions_ref_no").on(table.refNo),
}));

// ==================== DEBTS (unified) ====================
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  debtorName: varchar("debtorName", { length: 255 }).notNull(),
  amountUSD: decimal("amountUSD", { precision: 15, scale: 2 }).default("0"),
  amountIQD: decimal("amountIQD", { precision: 15, scale: 0 }).default("0"),
  feeUSD: decimal("feeUSD", { precision: 15, scale: 2 }).default("0"),
  feeIQD: decimal("feeIQD", { precision: 15, scale: 0 }).default("0"),
  transType: varchar("transType", { length: 100 }),
  fxRate: decimal("fxRate", { precision: 15, scale: 2 }),
  driverName: varchar("driverName", { length: 255 }),
  carNumber: varchar("carNumber", { length: 100 }),
  goodType: varchar("goodType", { length: 255 }),
  weight: decimal("weight", { precision: 15, scale: 2 }),
  meters: decimal("meters", { precision: 15, scale: 2 }),
  description: text("description"),
  date: date("date", { mode: "string" }),
  status: mysqlEnum("status", ["pending", "partial", "paid"]).default("pending").notNull(),
  paidAmountUSD: decimal("paidAmountUSD", { precision: 15, scale: 2 }).default("0"),
  paidAmountIQD: decimal("paidAmountIQD", { precision: 15, scale: 0 }).default("0"),
  state: varchar("state", { length: 100 }),
  fxNote: varchar("fxNote", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== EXPENSES (unified) ====================
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  expenseDate: date("expense_date", { mode: "string" }).notNull(),
  amountUSD: decimal("amount_usd", { precision: 15, scale: 2 }).default("0"),
  amountIQD: decimal("amount_iqd", { precision: 15, scale: 0 }).default("0"),
  description: text("description"),
  portId: varchar("port_id", { length: 50 }).notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ==================== CASH STATE ====================
export const cashState = mysqlTable("cash_state", {
  id: int("id").autoincrement().primaryKey(),
  state: varchar("state", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== LOOKUPS ====================
export const goodsTypes = mysqlTable("goods_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const governorates = mysqlTable("governorates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  trancePrice: decimal("trance_price", { precision: 15, scale: 0 }),
});

export const ports = mysqlTable("ports", {
  id: int("id").autoincrement().primaryKey(),
  portId: varchar("portId", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  section: varchar("section", { length: 50 }).notNull(),
});

export const accountTypes = mysqlTable("account_types", {
  id: int("id").autoincrement().primaryKey(),
  typeId: varchar("typeId", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  active: int("active").default(1).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const entityAliases = mysqlTable("entity_aliases", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id").notNull(),
  aliasName: varchar("alias_name", { length: 255 }).notNull(),
  sourceSystem: varchar("source_system", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountDefaults = mysqlTable("account_defaults", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("account_id").notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  defaultCurrency: varchar("default_currency", { length: 10 }),
  defaultDriverId: int("default_driver_id"),
  defaultVehicleId: int("default_vehicle_id"),
  defaultGoodTypeId: int("default_good_type_id"),
  defaultGovId: int("default_gov_id"),
  defaultCompanyId: int("default_company_id"),
  defaultCarrierId: int("default_carrier_id"),
  defaultFeeUsd: decimal("default_fee_usd", { precision: 15, scale: 2 }),
  defaultSyrCus: decimal("default_syr_cus", { precision: 15, scale: 2 }),
  defaultCarQty: int("default_car_qty"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountSectionUnique: uniqueIndex("uk_account_defaults").on(table.accountId, table.sectionKey),
}));

export const routeDefaults = mysqlTable("route_defaults", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  govId: int("gov_id").notNull(),
  currency: varchar("currency", { length: 10 }).default("IQD").notNull(),
  defaultTransPrice: decimal("default_trans_price", { precision: 15, scale: 2 }),
  defaultFeeUsd: decimal("default_fee_usd", { precision: 15, scale: 2 }),
  defaultCostUsd: decimal("default_cost_usd", { precision: 15, scale: 2 }),
  defaultAmountUsd: decimal("default_amount_usd", { precision: 15, scale: 2 }),
  defaultCostIqd: decimal("default_cost_iqd", { precision: 15, scale: 0 }),
  defaultAmountIqd: decimal("default_amount_iqd", { precision: 15, scale: 0 }),
  notes: text("notes"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  routeCurrencyUnique: uniqueIndex("uk_route_defaults").on(table.sectionKey, table.govId, table.currency),
}));

// ==================== PAYMENT MATCHING ====================
export const paymentMatching = mysqlTable("payment_matching", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  paymentId: int("paymentId").notNull(),
  amountUSD: decimal("amountUSD", { precision: 15, scale: 2 }).default("0"),
  amountIQD: decimal("amountIQD", { precision: 15, scale: 0 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  invoicePaymentUnique: uniqueIndex("uk_payment_matching_invoice_payment").on(table.invoiceId, table.paymentId),
}));

// ==================== FIELD CONFIGURATION ====================
export const fieldConfig = mysqlTable("field_config", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  visible: int("visible").default(1).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  displayLabel: varchar("display_label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== CUSTOM FIELDS ====================
export const customFields = mysqlTable("custom_fields", {
  id: int("id").autoincrement().primaryKey(),
  fieldKey: varchar("field_key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  options: json("options").$type<string[]>(),
  defaultValue: varchar("default_value", { length: 255 }),
  formula: json("formula").$type<{ parts: Array<{ type: 'field' | 'operator', value: string }> }>(),
  placement: varchar("placement", { length: 50 }).default("transaction"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== CUSTOM FIELD VALUES ====================
export const customFieldValues = mysqlTable("custom_field_values", {
  id: int("id").autoincrement().primaryKey(),
  customFieldId: int("custom_field_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id").notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== SPECIAL ACCOUNTS ====================
export const specialAccounts = mysqlTable("special_accounts", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  traderName: varchar("traderName", { length: 255 }),
  driverName: varchar("driverName", { length: 255 }),
  vehiclePlate: varchar("vehiclePlate", { length: 100 }),
  goodType: varchar("goodType", { length: 255 }),
  govName: varchar("govName", { length: 255 }),
  portName: varchar("portName", { length: 255 }),
  companyName: varchar("companyName", { length: 255 }),
  batchName: varchar("batchName", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  amountUSD: decimal("amountUSD", { precision: 15, scale: 2 }).default("0"),
  amountIQD: decimal("amountIQD", { precision: 15, scale: 0 }).default("0"),
  costUSD: decimal("costUSD", { precision: 15, scale: 2 }).default("0"),
  costIQD: decimal("costIQD", { precision: 15, scale: 0 }).default("0"),
  amountUSDPartner: decimal("amountUSDPartner", { precision: 15, scale: 2 }).default("0"),
  differenceIQD: decimal("differenceIQD", { precision: 15, scale: 0 }).default("0"),
  clr: decimal("clr", { precision: 15, scale: 2 }).default("0"),
  tx: decimal("tx", { precision: 15, scale: 2 }).default("0"),
  taxiWater: decimal("taxiWater", { precision: 15, scale: 2 }).default("0"),
  weight: decimal("weight", { precision: 15, scale: 2 }),
  meters: decimal("meters", { precision: 15, scale: 2 }),
  qty: int("qty"),
  description: text("description"),
  notes: text("notes"),
  date: date("date", { mode: "string" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: int("entity_id"),
  action: varchar("action", { length: 20 }).notNull(),
  summary: varchar("summary", { length: 255 }).notNull(),
  beforeData: json("before_data"),
  afterData: json("after_data"),
  changes: json("changes"),
  metadata: json("metadata"),
  userId: int("user_id"),
  username: varchar("username", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
