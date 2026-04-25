import { createRateLimitMiddleware } from "../../_core/rateLimit";

export const AUTO_MATCH_NOTE = "ربط تلقائي";
export const DELETE_ALLOCATION_MESSAGE = "تم حذف الربط";
export const MATCHING_VALIDATION_MESSAGE = "بيانات المطابقة غير صالحة";
export const INVOICE_OR_PAYMENT_NOT_FOUND_MESSAGE =
  "الفاتورة أو سند القبض المطلوب غير موجود";
export const FIRST_RECORD_MUST_BE_INVOICE_MESSAGE =
  "السجل الأول يجب أن يكون فاتورة";
export const SECOND_RECORD_MUST_BE_PAYMENT_MESSAGE =
  "السجل الثاني يجب أن يكون سند قبض";
export const ACCOUNT_MISMATCH_MESSAGE =
  "لا يمكن مطابقة فاتورة وسند قبض لحسابين مختلفين";
export const DUPLICATE_MATCH_MESSAGE = "هذه المطابقة موجودة مسبقًا";
export const USD_OVERMATCH_MESSAGE =
  "مبلغ الدولار المطلوب أكبر من الرصيد المتبقي للمطابقة";
export const IQD_OVERMATCH_MESSAGE =
  "مبلغ الدينار المطلوب أكبر من الرصيد المتبقي للمطابقة";
export const MATCH_CREATED_MESSAGE = "تمت المطابقة";
export const MATCH_DELETED_MESSAGE = "تم حذف المطابقة";
export const ALLOCATION_ID_LABEL = "معرف الربط";
export const MATCH_ID_LABEL = "معرف المطابقة";

export function buildAutoMatchSuccessMessage(matchCount: number) {
  const label = matchCount === 1 ? "مطابقة" : "مطابقات";
  return `تم ربط ${matchCount} ${label} تلقائيًا`;
}

export const matchingRateLimit = createRateLimitMiddleware({
  keyPrefix: "payment-matching",
  windowMs: 60 * 1000,
  max: 30,
  message: "تم تجاوز الحد المسموح لعمليات المطابقة. حاول بعد قليل.",
});

export const heavyJobRateLimit = createRateLimitMiddleware({
  keyPrefix: "heavy-financial-job",
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "هذه العملية كثيفة وقد تم استدعاؤها عدة مرات. حاول لاحقًا.",
});
