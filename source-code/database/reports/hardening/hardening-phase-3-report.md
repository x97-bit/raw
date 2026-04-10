# Hardening Phase 3 Report

Date: 2026-04-08

## Goal
Add safe unique constraints that match the current business rules without breaking live data.

## Pre-check Results
- `transactions.ref_no`: `0` null/empty values, `0` duplicate references
- `payment_matching (invoiceId, paymentId)`: `0` duplicate pairs
- `account_defaults (account_id, section_key)`: `0` duplicate pairs
- `route_defaults (section_key, gov_id, currency)`: `0` duplicate pairs

## Constraints Applied
- `transactions.uk_transactions_ref_no`
- `payment_matching.uk_payment_matching_invoice_payment`
- `account_defaults.uk_account_defaults`
- `route_defaults.uk_route_defaults`

## Live Apply Result
- Added:
  - `uk_transactions_ref_no`
  - `uk_payment_matching_invoice_payment`
- Already present:
  - `uk_account_defaults`
  - `uk_route_defaults`

## Source Files Updated
- `database/sql/04_unique_constraints.sql`
- `database/sql/01_schema.sql`
- `source-code/server/db.ts`
- `source-code/drizzle/schema.ts`

## Validation
- `pnpm test`: passed (`170/170`)
- `pnpm build`: passed
- `http://127.0.0.1:3000`: returned `200`

## Notes
- `transactions.ref_no` remains nullable at the schema level, but is now unique when present.
- The next hardening phase can focus on input validation for financial write APIs.
