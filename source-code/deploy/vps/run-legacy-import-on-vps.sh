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

echo "1/3 Bootstrapping staging import database: ${SOURCE_DB_NAME}"
pnpm db:bootstrap-old-trade-import-db -- --reset --database-name "${SOURCE_DB_NAME}"

echo "2/3 Importing legacy JSON into staging database"
node scripts/imports/import-old-trade-json.mjs \
  --apply \
  --source-json "${SOURCE_JSON}" \
  --database-url "${IMPORT_DATABASE_URL}"

echo "3/3 Syncing staging data into production database"
pnpm db:sync-old-trade-import-to-production:apply

echo
echo "Legacy import workflow finished."
echo "Staging database: ${SOURCE_DB_NAME}"
echo "Source JSON: ${SOURCE_JSON}"
