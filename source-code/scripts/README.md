# Scripts

This folder keeps operational scripts out of the source root.

## Active Structure
- `runtime/`: canonical runtime launchers used by `pnpm dev` and `pnpm start`.
- `database/`: active database maintenance and reset scripts.
- `imports/`: active workbook, PDF, and migration import scripts.
- `repairs/`: active targeted repair scripts for real data issues.
- `shared/`: shared helpers used by the active and archived maintenance scripts.
- `archive/`: legacy or uncertain scripts kept intentionally for safe review instead of blind deletion.

## Runtime Data Location
- Generated and maintained database artifacts now live under `source-code/database/`.
- This includes:
  - `database/sql/` for bootstrap and hardening SQL.
  - `database/exports/` for rebuild source dumps.
  - `database/docs/` and `database/reports/` for database-specific documentation.
  - `database/backups/`, `database/import-reports/`, `database/import-templates/`, and `database/tmp/` for generated working artifacts.

## Runtime
- `runtime/dev-server.mjs`: starts the development server used by `pnpm dev`.
- `runtime/start-server.mjs`: starts the built production server used by `pnpm start`.

## Active Database
- `database/rebuild-local-db.mjs`
- `database/reset-safe-production-data.mjs`
- `database/wipe-production-keep-schema.mjs`

## Active Imports
- `imports/bootstrap-old-trade-import-db.mjs`
- `imports/generate-system-import-templates.mjs`
- `imports/import-real-workbook.mjs`
- `imports/import-old-trade-json.mjs`
- `imports/sync-old-trade-import-to-production.mjs`
- `imports/import-yaser-pdf.mjs`
- `imports/migrate-old-trade-db.mjs`
- `imports/sync-real-workbook-operational.mjs`

## Active Repairs
- `repairs/repair-debts-encoding.mjs`
- `repairs/repair-port-trader-fallbacks.mjs`

## Shared
- `shared/scriptMysqlConfig.mjs`: shared MySQL connection options.

## Archive Policy
- `archive/database/`: old migrations, setup, seeding, and export utilities kept for safe rollback or reference.
- `archive/imports/`: older import paths preserved for comparison and staged deletion later.

Use the `package.json` scripts first when an equivalent command exists, because those paths are the canonical active workflow.
