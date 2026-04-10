# Hardening Phase 2 Report

Date: 2026-04-08

## Goal

Convert operational date columns from `VARCHAR(20)` to real `DATE` columns without breaking the application.

## Columns converted

- `transactions.trans_date`
- `debts.date`
- `expenses.expense_date`
- `special_accounts.date`

## Safety strategy

Before conversion, all target columns were checked for invalid values using:

- `STR_TO_DATE(value, '%Y-%m-%d')`

Result: all checked rows were valid and safe to convert.

## Application compatibility

The application was updated so `DATE` columns are still returned as strings:

- format remains `YYYY-MM-DD`
- frontend filters and `<input type="date">` keep working
- no timezone-based `Date` object surprises are introduced for these fields

## Files added/updated

- `source-code/server/_core/mysqlConfig.ts`
- `source-code/server/_core/mysqlConfig.test.ts`
- `source-code/server/db.ts`
- `source-code/drizzle/schema.ts`
- `database/sql/01_schema.sql`
- `database/sql/03_date_columns.sql`

## Verification

### Build and tests

- `pnpm test` passed
- `pnpm build` passed

### Live database verification

Confirmed in `information_schema.COLUMNS`:

- `transactions.trans_date -> DATE`
- `debts.date -> DATE`
- `expenses.expense_date -> DATE`
- `special_accounts.date -> DATE`

### Runtime sample verification

Confirmed sample values are still returned as strings:

- `transactions.trans_date`: string
- `debts.date`: string
- `special_accounts.date`: string

## Operational result

The system now has:

1. Safer referential integrity from Phase 1
2. Real date columns for the main operational date fields
3. Preserved UI compatibility for date filtering and display

## Recommended Phase 3

1. Add unique constraints for reference numbers where duplication is not valid
2. Review remaining text-like operational enums that could be normalized
3. Add API-level input validation for core financial mutations
