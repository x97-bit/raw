#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/alrawi/source-code"
ENV_FILE="/etc/alrawi/alrawi.env"
SOURCE_JSON="${1:-/root/alrawi-legacy-import.json}"
SOURCE_DB_NAME="${SOURCE_DB_NAME:-alrawi_import}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "App directory not found: ${APP_DIR}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  exit 1
fi

if [[ ! -f "${SOURCE_JSON}" ]]; then
  echo "Legacy JSON file not found: ${SOURCE_JSON}"
  exit 1
fi

cd "${APP_DIR}"

set -a
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is missing in ${ENV_FILE}"
  exit 1
fi

IMPORT_DATABASE_URL="$(
  node -e "const u = new URL(process.env.DATABASE_URL); u.pathname='/${SOURCE_DB_NAME}'; console.log(u.toString());"
)"

PRODUCTION_STATE="$(
  node <<'NODE'
const mysql = require('mysql2/promise');

(async () => {
  const u = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    database: u.pathname.replace(/^\//, ''),
    charset: 'utf8mb4',
  });

  const [rows] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM accounts) AS accounts_count,
      (SELECT COUNT(*) FROM transactions) AS transactions_count,
      (SELECT COUNT(*) FROM debts) AS debts_count,
      (SELECT COUNT(*) FROM special_accounts) AS special_accounts_count,
      (SELECT COUNT(*) FROM companies) AS companies_count
  `);

  await conn.end();

  const counts = rows[0] || {};
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  console.log(total === 0 ? 'empty' : 'nonempty');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
)"

if [[ "${PRODUCTION_STATE}" == "empty" ]]; then
  echo "Production database is empty. Importing directly into production."

  node scripts/imports/import-old-trade-json.mjs \
    --apply \
    --source-json "${SOURCE_JSON}" \
    --database-url "${DATABASE_URL}"
else
  echo "1/3 Bootstrapping staging import database: ${SOURCE_DB_NAME}"
  pnpm db:bootstrap-old-trade-import-db -- --reset --database-name "${SOURCE_DB_NAME}"

  echo "2/3 Importing legacy JSON into staging database"
  node scripts/imports/import-old-trade-json.mjs \
    --apply \
    --source-json "${SOURCE_JSON}" \
    --database-url "${IMPORT_DATABASE_URL}"

  echo "3/3 Syncing staging data into production database"
  pnpm db:sync-old-trade-import-to-production:apply
fi

echo
echo "Legacy import workflow finished."
echo "Import mode: ${PRODUCTION_STATE}"
echo "Source JSON: ${SOURCE_JSON}"
