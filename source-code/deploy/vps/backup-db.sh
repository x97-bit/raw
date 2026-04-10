#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/alrawi/alrawi.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/alrawi/mysql}"
KEEP_DAYS="${KEEP_DAYS:-14}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd node
require_cmd mysqldump
require_cmd gzip

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is missing in ${ENV_FILE}"
  exit 1
fi

mapfile -t DB_PARTS < <(
  node -e "const u = new URL(process.argv[1]); console.log(u.protocol); console.log(u.hostname); console.log(u.port || '3306'); console.log(decodeURIComponent(u.username)); console.log(decodeURIComponent(u.password)); console.log(u.pathname.replace(/^\\//, ''));" "${DATABASE_URL}"
)

DB_PROTOCOL="${DB_PARTS[0]:-}"
DB_HOST="${DB_PARTS[1]:-}"
DB_PORT="${DB_PARTS[2]:-3306}"
DB_USER="${DB_PARTS[3]:-}"
DB_PASS="${DB_PARTS[4]:-}"
DB_NAME="${DB_PARTS[5]:-}"

if [[ "${DB_PROTOCOL}" != "mysql:" ]]; then
  echo "Only mysql:// DATABASE_URL values are supported"
  exit 1
fi

if [[ -z "${DB_HOST}" || -z "${DB_USER}" || -z "${DB_NAME}" ]]; then
  echo "DATABASE_URL is incomplete"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/alrawi-db-${TIMESTAMP}.sql.gz"

export MYSQL_PWD="${DB_PASS}"
mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" | gzip -9 > "${OUT_FILE}"
unset MYSQL_PWD

find "${BACKUP_DIR}" -type f -name 'alrawi-db-*.sql.gz' -mtime "+${KEEP_DAYS}" -delete

echo "Backup created: ${OUT_FILE}"
ls -lh "${OUT_FILE}"
