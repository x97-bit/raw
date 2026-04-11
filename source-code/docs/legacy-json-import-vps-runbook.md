# Legacy JSON Live Import Runbook

This is the saved, proven workflow for importing the old `AlrawiApp` JSON export into the live VPS environment.

## When to use this

Use this runbook when:
- the old export file is `AlrawiApp_all_data (1).json`
- the app is deployed on the VPS
- you want to import into the live MySQL database behind `alrawiapp.com`

## Important rules

- Do not run `pnpm db:reset-safe-production:apply` more than once during the same live import attempt.
- If production is already empty, the VPS helper imports directly into production.
- If production already has the core imported rows, the VPS helper switches to staging + add-only sync automatically.
- The importer now handles missing legacy dates by using the fallback date `2000-01-01` and records each fallback in the import report.

## 1. Upload the latest app code

Run on your local Windows machine:

```powershell
cd "C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\deploy\vps"
.\package-upload.cmd 195.35.29.31 root
```

Then on the VPS:

```bash
chmod +x /root/deploy-on-vps.sh
bash /root/deploy-on-vps.sh
```

## 2. Upload the legacy JSON export

Preferred helper:

```powershell
cd "C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\deploy\vps"
.\upload-legacy-import-assets.cmd 195.35.29.31 root
```

Direct fallback if needed:

```powershell
scp "C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\old db\AlrawiApp_all_data (1).json" root@195.35.29.31:/root/alrawi-legacy-import.json
scp "C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\deploy\vps\run-legacy-import-on-vps.sh" root@195.35.29.31:/root/run-legacy-import-on-vps.sh
```

## 3. Run the live import on the VPS

```bash
chmod +x /root/run-legacy-import-on-vps.sh
bash /root/run-legacy-import-on-vps.sh
```

What this helper does:
- loads `/etc/alrawi/alrawi.env`
- checks whether production is empty or non-empty
- imports directly into production if it is empty
- otherwise uses `alrawi_import` then runs add-only production sync

## 4. Verify application health

```bash
systemctl status alrawi --no-pager
curl -s http://127.0.0.1:3000/healthz
```

Expected `healthz` shape:

```json
{"ok":true,"environment":"production"}
```

## 5. Verify imported row counts

```bash
mysql -u root -D alrawi_db -e "SELECT COUNT(*) AS accounts FROM accounts; SELECT COUNT(*) AS transactions FROM transactions; SELECT COUNT(*) AS debts FROM debts; SELECT COUNT(*) AS special_accounts FROM special_accounts; SELECT COUNT(*) AS companies FROM companies;"
```

Expected values from the current legacy export:
- `accounts = 94`
- `transactions = 1199`
- `debts = 208`
- `special_accounts = 165`
- `companies = 25`

## 6. Review generated reports

```bash
ls -lh /var/www/alrawi/source-code/database/import-reports
ls -lh /var/www/alrawi/source-code/database/backups
```

## Recovery notes

- If you see `ENOENT: no such file or directory, open '/root/alrawi-legacy-import.json'`, the JSON file was not uploaded yet.
- If you see `Incorrect date value: '' for column transactions.trans_date`, deploy the latest code first, because the date fallback fix is required.
- If the app starts but counts stay zero, the import did not actually run; check the helper output and the import report path.
