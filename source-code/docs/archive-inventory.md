# Archive Inventory

This file records what was intentionally moved out of the active workflow and why.

## Database Scripts

- `scripts/archive/database/export-db.mjs`
  - Old export utility kept for reference, not part of the active package workflow.
- `scripts/archive/database/migrate-fields.mjs`
  - Legacy schema migration kept for rollback/reference only.
- `scripts/archive/database/migrate-v2.mjs`
  - Older transaction schema migration retained for historical comparison.
- `scripts/archive/database/migrate.mjs`
  - Early bootstrap migration no longer part of the current flow.
- `scripts/archive/database/run-migration.mjs`
  - Legacy ad hoc migration runner.
- `scripts/archive/database/run-migration2.mjs`
  - Legacy follow-up migration runner.
- `scripts/archive/database/seed.mjs`
  - Old seed script preserved after current data bootstrapping evolved.
- `scripts/archive/database/setup-db.mjs`
  - Legacy schema setup helper preserved for reference.

## Import Scripts

- `scripts/archive/imports/import-data.mjs`
  - Older import path retained for comparison and safe cleanup.
- `scripts/archive/imports/import-excel.mjs`
  - Older Excel import path retained for comparison and safe cleanup.

## Policy

- Archived files are intentionally kept.
- They are not the canonical active workflow.
- Any future permanent deletion should be done only after a dedicated proof pass.
