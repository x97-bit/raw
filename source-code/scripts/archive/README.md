# Archive Scripts

This folder is the safe holding area for scripts that are no longer part of the canonical workflow but are being kept deliberately until final deletion is proven safe.

## Rules

- Do not wire package scripts to files in `archive/`.
- Prefer the active scripts under `runtime/`, `database/`, `imports/`, and `repairs/`.
- Keep archived files readable and restorable.
- If one archived file becomes necessary again, move it back into an active folder instead of running ad hoc copies.

## Current Archive Layout

- `archive/database/`: legacy setup, migration, seeding, and export scripts.
- `archive/imports/`: older import flows preserved for reference and safe comparison.
