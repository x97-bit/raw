import { createRateLimitMiddleware } from "./rateLimit";

export const financialWriteRateLimit = createRateLimitMiddleware({
  keyPrefix: "financial-write",
  windowMs: 60 * 1000,
  max: 60,
  message: "تم تجاوز الحد المسموح لعمليات الإدخال المالية. حاول بعد قليل.",
});
