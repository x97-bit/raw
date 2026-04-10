# Project Structure

## Top Level
- `client/`: the live React application, including entry HTML, source code, and static assets.
- `server/`: the Express API, route registration, runtime middleware, and server utilities.
- `shared/`: cross-runtime shared code such as common error types and portable helpers.
- `database/`: operational database artifacts grouped by purpose.
  - `database/sql/`: bootstrap and hardening SQL files used by setup flows and reference docs.
  - `database/exports/`: source JSON exports used by rebuild/import tooling.
  - `database/docs/`: database-specific design and usage documentation.
  - `database/reports/`: comparison and hardening writeups.
  - `database/import-templates/`, `database/import-reports/`, `database/backups/`, and `database/tmp/`: generated and working data artifacts.
- `drizzle/`: database schema and migration metadata used by the app and maintenance scripts.
- `scripts/`: operational, import, migration, repair, and runtime helper scripts kept out of the source root.
- `docs/`: project-facing documentation such as structure notes and todo tracking.
- `dist/`: generated production build output. Safe to regenerate.
- `node_modules/`: installed packages. Not hand-maintained.

## Client
- `client/src/main.jsx`: the only live browser entrypoint used by `client/index.html`.
- `client/src/App.jsx`: the live app shell, auth gate, and stack-navigation coordinator.
- `client/src/pages/`: thin page coordinators that wire navigation, auth, and feature state together.
- `client/src/features/`: domain-focused feature modules. Current domains:
  - `audit-logs`
  - `debts`
  - `defaults-management`
  - `expenses`
  - `field-management`
  - `main-page`
  - `navigation`
  - `payment-matching`
  - `port`
  - `reports`
  - `special-accounts`
  - `transactions`
  - `trial-balance`
  - `users-management`
- `client/src/components/`: shared application components plus `components/ui/` for reusable UI primitives that are still in active use.
- `client/src/contexts/AuthContext.tsx`: the live auth provider and auth hook consumed across the app.
- `client/src/hooks/`: shared client hooks that are not owned by one feature.
- `client/src/lib/utils.ts`: low-level shared utility helpers such as class name merging.
- `client/src/utils/`: reusable formatting, export, config, and presentation helpers shared across multiple screens.

## Server
- `server/apiRoutes.ts`: a thin central route registrar only.
- `server/routes/`: domain route modules. Current route layout:
  - `auth-users/`
  - `account-lookups/`
  - `defaults/`
  - `debts/`
  - `expenses/`
  - `field-customization/`
  - `special-accounts/`
  - `transactions/`
  - `payment-matching/`
  - `reports/`
- `server/routes/payment-matching/`: split by query, mutation, and index registration.
- `server/routes/reports/`: split by overview, summary, and index registration.
- `server/_core/`: auth, cookies, security headers, rate limits, request/response helpers, MySQL config, and Vite integration.
- `server/utils/`: reusable business logic and route helpers extracted from larger route files.
- `server/tests/regression/`: higher-level regression tests that exercise server behavior without belonging to one utility module.
- `server/db.ts`: database bootstrap and connection helpers.

## Scripts
- `scripts/runtime/`: canonical runtime entrypoints used by package scripts.
  - `scripts/runtime/dev-server.mjs`
  - `scripts/runtime/start-server.mjs`
- `scripts/database/`: active database maintenance scripts that still belong to the working system.
- `scripts/imports/`: active import and sync scripts for current operational workflows.
- `scripts/repairs/`: active repair scripts for production-safe data correction tasks.
- `scripts/shared/scriptMysqlConfig.mjs`: shared MySQL connection options for active and archived maintenance scripts.
- `scripts/archive/`: legacy or uncertain scripts kept intentionally for safe review and deferred deletion, not for day-to-day workflow.

## Structure Rules
- Keep page files thin and move feature-specific state and derived logic into `features/<domain>/`.
- Keep route registration in `server/routes/` and move reusable business logic into `server/utils/` or `server/_core/`.
- Prefer subfolders when one domain grows into multiple route or view files, as with `reports/` and `payment-matching/`.
- Keep active maintenance scripts in `scripts/database`, `scripts/imports`, `scripts/repairs`, and `scripts/runtime`.
- Move legacy, superseded, or uncertain scripts into `scripts/archive` instead of deleting them until safe removal is proven.
- Delete files only after checking imports, lazy imports, route registration, configs, scripts, tests, and runtime references.
