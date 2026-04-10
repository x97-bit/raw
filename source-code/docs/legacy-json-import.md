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

## Production completion sync

If your main production database already contains the imported core records and you only want to complete missing lookup rows safely, run:

```bash
pnpm db:sync-old-trade-import-to-production:dry-run
pnpm db:sync-old-trade-import-to-production:apply
```

This sync is add-only. It refuses to run when the core table counts between staging and production do not match.

## VPS live workflow

1. Deploy the latest code to the VPS:

```bat
cd source-code\deploy\vps
package-upload.cmd 195.35.29.31 root
```

Then on the VPS:

```bash
chmod +x /root/deploy-on-vps.sh
bash /root/deploy-on-vps.sh
```

2. Upload the legacy JSON export and the live import helper:

```bat
cd source-code\deploy\vps
upload-legacy-import-assets.cmd 195.35.29.31 root
```

3. On the VPS run the full staging-import-production workflow:

```bash
chmod +x /root/run-legacy-import-on-vps.sh
bash /root/run-legacy-import-on-vps.sh
```

You can also point to another export:

```bash
node scripts/imports/import-old-trade-json.mjs --source-json "./old db/another-export.json"
```

The dry-run report is written to:

```text
database/import-reports/
```
