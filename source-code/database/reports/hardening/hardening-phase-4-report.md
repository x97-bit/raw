# Hardening Phase 4 Report

Date: 2026-04-08

## Goal

Add input validation and business guard rails to the highest-risk financial write APIs.

## Covered Routes

- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `POST /debts`
- `PUT /debts/:id`
- `DELETE /debts/:id`
- `POST /expenses`
- `PUT /expenses/:id`
- `DELETE /expenses/:id`
- `POST /payment-matching`
- `DELETE /payment-matching/:id`
- `DELETE /payment-matching/allocate/:id`
- `POST /special`
- `PUT /special/:id`
- `DELETE /special/:id`

## What Was Added

- Shared request validation helper:
  - `source-code/server/_core/requestValidation.ts`
- Shared financial schemas:
  - `source-code/server/utils/financialValidation.ts`
- Unit tests for validation:
  - `source-code/server/utils/financialValidation.test.ts`

## Business Rules Enforced

- Invalid IDs now fail with `400`
- Transaction create/update payloads are validated before DB writes
- Debt create/update payloads are validated before DB writes
- Expense writes are validated, and expense updates now behave as partial updates
- Special account writes are validated before DB writes
- Manual payment matching now validates:
  - invoice exists
  - payment exists
  - invoice is an invoice record
  - payment is a payment record
  - both belong to the same account
  - duplicate match pairs are blocked
  - requested allocation does not exceed remaining invoice/payment balances

## Validation Status

- `pnpm test`: passed (`176/176`)
- `pnpm build`: passed
- `http://127.0.0.1:3000`: returned `200`

## Residual Technical Debt

- `pnpm check` still reports legacy TypeScript strict-mode issues, mostly implicit `any` in `source-code/server/apiRoutes.ts`
- These are pre-existing typing issues, not regressions from Phase 4

## Next Recommended Phase

- Add rate limiting to login and sensitive write routes
- Then progressively type-harden `apiRoutes.ts`
