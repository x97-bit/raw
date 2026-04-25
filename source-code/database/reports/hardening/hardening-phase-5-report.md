# Hardening Phase 5 Report

Date: 2026-04-08

## Goal

Add practical rate limiting to authentication and high-risk financial write operations.

## What Was Added

- Shared in-memory rate limiting helper:
  - `source-code/server/_core/rateLimit.ts`
- Unit tests for the helper:
  - `source-code/server/_core/rateLimit.test.ts`

## Applied Coverage

### Authentication

- `POST /auth/login`
- `POST /auth/change-password`
- `POST /auth/users/:id/reset-password`

### Financial Writes

- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `POST /debts`
- `PUT /debts/:id`
- `DELETE /debts/:id`
- `POST /expenses`
- `PUT /expenses/:id`
- `DELETE /expenses/:id`
- `POST /special`
- `PUT /special/:id`
- `DELETE /special/:id`

### Payment Matching

- `POST /payment-matching`
- `DELETE /payment-matching/:id`
- `DELETE /payment-matching/allocate/:id`
- `POST /payment-matching/auto-match-all`

## Profiles Used

- Login: stricter window per `IP + username`
- Password operations: moderate protection
- Financial writes: moderate protection
- Payment matching: moderate protection
- Heavy jobs (`auto-match-all`): stricter low-frequency protection

## Notes

- The limiter is intentionally in-memory for the current single-instance deployment model.
- If the app moves to multi-instance deployment later, this should migrate to a shared store such as Redis.

## Validation

- `pnpm test`: passed (`179/179`)
- `pnpm build`: passed
- `http://127.0.0.1:3000`: returned `200`

## Residual Technical Debt

- `pnpm check` still fails due pre-existing TypeScript strictness issues, mainly legacy `implicit any` usage in `source-code/server/apiRoutes.ts`
- Rate limiting itself introduced no build/test regressions
