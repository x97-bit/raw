-- ============================================================
-- Phase 3 Hardening: Unique Constraints
-- Generated on 2026-04-08
-- ============================================================

ALTER TABLE `transactions`
  ADD CONSTRAINT `uk_transactions_ref_no` UNIQUE (`ref_no`);

ALTER TABLE `payment_matching`
  ADD CONSTRAINT `uk_payment_matching_invoice_payment` UNIQUE (`invoiceId`, `paymentId`);

ALTER TABLE `account_defaults`
  ADD CONSTRAINT `uk_account_defaults` UNIQUE (`account_id`, `section_key`);

ALTER TABLE `route_defaults`
  ADD CONSTRAINT `uk_route_defaults` UNIQUE (`section_key`, `gov_id`, `currency`);
