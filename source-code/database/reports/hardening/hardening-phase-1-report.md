# Hardening Phase 1 Report

Date: 2026-04-08

## Summary

Phase 1 focused on safe, non-breaking database hardening for the current Al-Rawi system.

This phase did **not** change application behavior or convert date columns yet.
It added referential integrity and missing indexes where the live data was already clean.

## Live data checks before applying constraints

The following checks were completed against the live `alrawi_db` database:

- `transactions.account_id` orphan rows: `0`
- `transactions.driver_id` orphan rows: `0`
- `transactions.vehicle_id` orphan rows: `0`
- `transactions.good_type_id` orphan rows: `0`
- `transactions.gov_id` orphan rows: `0`
- `transactions.company_id` orphan rows: `0`
- `transactions.carrier_id` orphan rows: `0`
- `payment_matching.invoiceId` orphan rows: `0`
- `payment_matching.paymentId` orphan rows: `0`
- `custom_field_values.custom_field_id` orphan rows: `0`
- `account_defaults.*` orphan rows: `0`
- `route_defaults.gov_id` orphan rows: `0`

## Date quality checks

The following string date fields were checked against `%Y-%m-%d`:

- `transactions.trans_date`
- `debts.date`
- `expenses.expense_date`
- `special_accounts.date`

Result: all checked rows were valid and convertible.

## Applied runtime hardening

The runtime schema hardening added:

### Foreign keys

- `transactions.account_id -> accounts.id`
- `transactions.driver_id -> drivers.id`
- `transactions.vehicle_id -> vehicles.id`
- `transactions.good_type_id -> goods_types.id`
- `transactions.gov_id -> governorates.id`
- `transactions.company_id -> companies.id`
- `transactions.carrier_id -> accounts.id`
- `payment_matching.invoiceId -> transactions.id`
- `payment_matching.paymentId -> transactions.id`
- `custom_field_values.custom_field_id -> custom_fields.id`
- `account_defaults.account_id -> accounts.id`
- `account_defaults.default_driver_id -> drivers.id`
- `account_defaults.default_vehicle_id -> vehicles.id`
- `account_defaults.default_good_type_id -> goods_types.id`
- `account_defaults.default_gov_id -> governorates.id`
- `account_defaults.default_company_id -> companies.id`
- `account_defaults.default_carrier_id -> accounts.id`
- `route_defaults.gov_id -> governorates.id`

### Indexes

- `transactions.idx_account_id`
- `transactions.idx_driver_id`
- `transactions.idx_vehicle_id`
- `transactions.idx_good_type_id`
- `transactions.idx_gov_id`
- `transactions.idx_company_id`
- `transactions.idx_carrier_id`
- `payment_matching.idx_invoiceId`
- `payment_matching.idx_paymentId`
- `custom_field_values.idx_custom_field_id`
- `account_defaults.idx_account_id`
- `account_defaults.idx_default_driver_id`
- `account_defaults.idx_default_vehicle_id`
- `account_defaults.idx_default_good_type_id`
- `account_defaults.idx_default_gov_id`
- `account_defaults.idx_default_company_id`
- `account_defaults.idx_default_carrier_id`
- `route_defaults.idx_gov_id`

## Files added/updated

- `source-code/server/db.ts`
- `database/sql/02_hardening_constraints.sql`

## Current state after apply

- Foreign keys in live DB: `18`
- Hardening batch applied successfully
- Build passed
- Tests passed
- App server restarted successfully

## Recommended Phase 2

1. Convert date strings to real `DATE` columns
2. Add safe unique constraints for reference numbers where duplicates are not valid
3. Align `database/sql/01_schema.sql` more fully with the runtime-created support tables
