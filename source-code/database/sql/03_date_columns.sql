-- Phase 2: convert operational date columns from VARCHAR to DATE
-- Assumes existing values are already normalized to YYYY-MM-DD.

ALTER TABLE `transactions`
  MODIFY COLUMN `trans_date` DATE NOT NULL;

ALTER TABLE `debts`
  MODIFY COLUMN `date` DATE NULL;

ALTER TABLE `expenses`
  MODIFY COLUMN `expense_date` DATE NOT NULL;

ALTER TABLE `special_accounts`
  MODIFY COLUMN `date` DATE NULL;
