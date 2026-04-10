# Legacy JSON Import

This workflow inspects the old `AlrawiApp` JSON export without touching the live database.

## Default source file

```text
source-code/old db/AlrawiApp_all_data (1).json
```

## Dry run

```bash
pnpm db:import-old-trade-json:dry-run
```

## Apply

Only run this against an empty staging or import database:

```bash
pnpm db:import-old-trade-json:apply
```

Apply mode will refuse to run if the target database is not empty.
It also creates a JSON backup snapshot before inserting rows and writes
the final report under `database/import-reports/`.

## Recommended staging flow

1. Create an empty import database.

```bash
pnpm db:bootstrap-old-trade-import-db
```

2. If you want to rebuild the staging database from scratch, run it with reset:

```bash
pnpm db:bootstrap-old-trade-import-db -- --reset
```

This creates `alrawi_import` with:
- full schema
- performance indexes
- minimal base records only: `admin`, `ports`, `account_types`, `users`

It intentionally does not seed `goods_types` or `governorates`, so the legacy import can still run.

3. Run the importer against that database without changing your main `.env`.

```bash
node scripts/imports/import-old-trade-json.mjs --apply --database-url "mysql://USER:PASSWORD@127.0.0.1:3306/alrawi_import"
```

4. Review the generated report under `database/import-reports/` before copying any of the imported data into production.

You can also point to another export:

```bash
node scripts/imports/import-old-trade-json.mjs --source-json "./old db/another-export.json"
```

The dry-run report is written to:

```text
database/import-reports/
```
