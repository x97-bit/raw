import { Router } from "express";
import { registerAccountLookupRoutes } from "./routes/account-lookups";
import { registerAuthUserRoutes } from "./routes/auth-users";
import { registerDebtRoutes } from "./routes/debts";
import { registerDefaultRoutes } from "./routes/defaults";
import { registerExpenseRoutes } from "./routes/expenses";
import { registerFieldCustomizationRoutes } from "./routes/field-customization";
import { registerPaymentMatchingRoutes } from "./routes/payment-matching";
import { registerReportRoutes } from "./routes/reports";
import { registerSpecialAccountRoutes } from "./routes/special-accounts";
import { registerTransactionRoutes } from "./routes/transactions";

const router = Router();

registerAuthUserRoutes(router);
registerAccountLookupRoutes(router);
registerDefaultRoutes(router);
registerDebtRoutes(router);
registerExpenseRoutes(router);
registerFieldCustomizationRoutes(router);
registerPaymentMatchingRoutes(router);
registerReportRoutes(router);
registerSpecialAccountRoutes(router);
registerTransactionRoutes(router);

export default router;
