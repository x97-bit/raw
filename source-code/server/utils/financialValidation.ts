import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_STRING_REGEX = /^-?\d+(?:\.\d+)?$/;

const dateStringSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_REGEX, "صيغة التاريخ يجب أن تكون YYYY-MM-DD");
const nonEmptyString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .max(max, `${label} أطول من المسموح`);
const nullableString = (max: number, label: string) =>
  z.string().trim().max(max, `${label} أطول من المسموح`).nullable();

const positiveIntSchema = z
  .number()
  .int()
  .positive("يجب أن تكون القيمة أكبر من صفر");
const nullablePositiveIntSchema = z
  .number()
  .int()
  .positive("يجب أن تكون القيمة أكبر من صفر")
  .nullable();
const nullableWholeNumberSchema = z
  .number()
  .int()
  .min(0, "يجب أن تكون القيمة صفر أو أكثر")
  .nullable();
const decimalStringSchema = z
  .string()
  .trim()
  .regex(DECIMAL_STRING_REGEX, "القيمة الرقمية غير صالحة");
const nullableDecimalStringSchema = z
  .string()
  .trim()
  .regex(DECIMAL_STRING_REGEX, "القيمة الرقمية غير صالحة")
  .nullable();
const nullableTextSchema = z.string().nullable();

const currencySchema = z
  .string()
  .trim()
  .transform(value => value.toUpperCase())
  .pipe(z.enum(["USD", "IQD", "BOTH"]));
const debtStatusSchema = z.enum(["pending", "partial", "paid"]);
const specialTypeSchema = z.enum(["haider", "partnership", "yaser", "other"]);
const expenseChargeTargetSchema = z.enum(["port", "trader"]);

export const transactionCreateSchema = z.object({
  refNo: nonEmptyString(50, "رقم المرجع"),
  direction: z.enum(["IN", "OUT"]),
  transDate: dateStringSchema,
  accountId: positiveIntSchema,
  currency: currencySchema,
  driverId: nullablePositiveIntSchema,
  vehicleId: nullablePositiveIntSchema,
  goodTypeId: nullablePositiveIntSchema,
  weight: nullableDecimalStringSchema,
  meters: nullableDecimalStringSchema,
  costUsd: decimalStringSchema,
  amountUsd: decimalStringSchema,
  costIqd: decimalStringSchema,
  amountIqd: decimalStringSchema,
  feeUsd: decimalStringSchema,
  syrCus: decimalStringSchema,
  carQty: nullableWholeNumberSchema,
  transPrice: nullableDecimalStringSchema,
  carrierId: nullablePositiveIntSchema,
  qty: nullableWholeNumberSchema,
  companyId: nullablePositiveIntSchema,
  companyName: nullableString(255, "اسم الشركة"),
  govId: nullablePositiveIntSchema,
  notes: nullableTextSchema,
  traderNote: nullableTextSchema,
  invoiceNotes: nullableTextSchema,
  invoiceDetails: nullableTextSchema,
  recordType: nonEmptyString(20, "نوع السجل"),
  portId: nonEmptyString(50, "المنفذ"),
  accountType: nonEmptyString(50, "نوع الحساب"),
  createdBy: positiveIntSchema,
});

export const transactionUpdateSchema = z
  .object({
    transDate: dateStringSchema.optional(),
    amountUsd: decimalStringSchema.optional(),
    amountIqd: decimalStringSchema.optional(),
    costUsd: decimalStringSchema.optional(),
    costIqd: decimalStringSchema.optional(),
    feeUsd: decimalStringSchema.optional(),
    weight: nullableDecimalStringSchema.optional(),
    meters: nullableDecimalStringSchema.optional(),
    notes: nullableTextSchema.optional(),
    traderNote: nullableTextSchema.optional(),
    invoiceNotes: nullableTextSchema.optional(),
    invoiceDetails: nullableTextSchema.optional(),
    driverId: nullablePositiveIntSchema.optional(),
    vehicleId: nullablePositiveIntSchema.optional(),
    goodTypeId: nullablePositiveIntSchema.optional(),
    govId: nullablePositiveIntSchema.optional(),
    syrCus: decimalStringSchema.optional(),
    carQty: nullableWholeNumberSchema.optional(),
    transPrice: nullableDecimalStringSchema.optional(),
    carrierId: nullablePositiveIntSchema.optional(),
    qty: nullableWholeNumberSchema.optional(),
    companyId: nullablePositiveIntSchema.optional(),
    companyName: nullableString(255, "اسم الشركة").optional(),
    accountId: positiveIntSchema.optional(),
  })
  .refine(payload => Object.keys(payload).length > 0, {
    message: "لا توجد حقول صالحة للتحديث",
  });

export const debtCreateSchema = z.object({
  debtorName: nonEmptyString(255, "اسم المدين"),
  amountUSD: decimalStringSchema,
  amountIQD: decimalStringSchema,
  feeUSD: decimalStringSchema,
  feeIQD: decimalStringSchema,
  paidAmountUSD: decimalStringSchema,
  paidAmountIQD: decimalStringSchema,
  transType: nullableString(100, "نوع المعاملة"),
  fxRate: nullableDecimalStringSchema,
  driverName: nullableString(255, "اسم السائق"),
  carNumber: nullableString(100, "رقم السيارة"),
  goodType: nullableString(255, "نوع البضاعة"),
  weight: nullableDecimalStringSchema,
  meters: nullableDecimalStringSchema,
  description: z.string(),
  date: dateStringSchema,
  status: debtStatusSchema,
  state: nullableString(100, "الحالة"),
  fxNote: nullableString(255, "ملاحظة الصرف"),
});

export const debtUpdateSchema = debtCreateSchema
  .partial()
  .refine(payload => Object.keys(payload).length > 0, {
    message: "لا توجد حقول صالحة للتحديث",
  });

export const expenseMutationSchema = z
  .object({
    expenseDate: dateStringSchema,
    amountUSD: decimalStringSchema,
    amountIQD: decimalStringSchema,
    description: nullableTextSchema,
    portId: nonEmptyString(50, "قسم المصروف"),
    chargeTarget: expenseChargeTargetSchema,
    accountId: nullablePositiveIntSchema,
    accountName: nullableString(255, "اسم التاجر"),
    createdBy: positiveIntSchema.nullable().optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.chargeTarget === "trader" && !payload.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب تحديد التاجر عند تحميل المصروف عليه",
        path: ["accountId"],
      });
    }
  });

export const expenseUpdateSchema = z
  .object({
    expenseDate: dateStringSchema.optional(),
    amountUSD: decimalStringSchema.optional(),
    amountIQD: decimalStringSchema.optional(),
    description: nullableTextSchema.optional(),
    portId: nonEmptyString(50, "قسم المصروف").optional(),
    chargeTarget: expenseChargeTargetSchema.optional(),
    accountId: nullablePositiveIntSchema.optional(),
    accountName: nullableString(255, "اسم التاجر").optional(),
  })
  .refine(payload => Object.keys(payload).length > 0, {
    message: "لا توجد حقول صالحة لتحديث المصروف",
  })
  .superRefine((payload, ctx) => {
    if (payload.chargeTarget === "trader" && payload.accountId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "عند تحويل المصروف إلى التاجر يجب تحديد التاجر",
        path: ["accountId"],
      });
    }
  });

export const specialAccountCreateSchema = z.object({
  type: specialTypeSchema,
  name: nonEmptyString(255, "الاسم"),
  traderName: nullableString(255, "اسم التاجر"),
  driverName: nullableString(255, "اسم السائق"),
  vehiclePlate: nullableString(100, "رقم السيارة"),
  goodType: nullableString(255, "نوع البضاعة"),
  govName: nullableString(255, "المحافظة"),
  portName: nullableString(255, "المنفذ"),
  companyName: nullableString(255, "الشركة"),
  batchName: nullableString(255, "الوجبة"),
  destination: nullableString(255, "الوجهة"),
  amountUSD: decimalStringSchema,
  amountIQD: decimalStringSchema,
  costUSD: decimalStringSchema,
  costIQD: decimalStringSchema,
  amountUSDPartner: decimalStringSchema,
  differenceIQD: decimalStringSchema,
  clr: decimalStringSchema,
  tx: decimalStringSchema,
  taxiWater: decimalStringSchema,
  weight: nullableDecimalStringSchema,
  meters: nullableDecimalStringSchema,
  qty: nullableWholeNumberSchema,
  date: z.string(),
  notes: z.string(),
  description: z.string(),
});

export const specialAccountUpdateSchema = specialAccountCreateSchema
  .partial()
  .refine(payload => Object.keys(payload).length > 0, {
    message: "لا توجد حقول صالحة للتحديث",
  });

export const paymentMatchingCreateSchema = z
  .object({
    invoiceId: positiveIntSchema,
    paymentId: positiveIntSchema,
    amountUSD: decimalStringSchema,
    amountIQD: decimalStringSchema,
    notes: nullableTextSchema,
  })
  .superRefine((payload, ctx) => {
    if (payload.invoiceId === payload.paymentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "لا يمكن ربط السجل بنفسه",
        path: ["paymentId"],
      });
    }

    const amountUsd = Math.abs(Number(payload.amountUSD || 0));
    const amountIqd = Math.abs(Number(payload.amountIQD || 0));
    if (amountUsd <= 0 && amountIqd <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب إدخال مبلغ مطابق واحد على الأقل",
        path: ["amountUSD"],
      });
    }
  });
