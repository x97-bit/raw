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

```sql
CREATE DATABASE alrawi_import CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Load the schema only. Do not run seed data before the import.

```bash
mysql -u root alrawi_import < database/sql/01_schema.sql
mysql -u root alrawi_import < database/sql/03_indexes.sql
```

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
