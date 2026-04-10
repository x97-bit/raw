#!/usr/bin/env bash
set -euo pipefail

APP_USER="alrawi"
APP_GROUP="alrawi"
APP_ROOT="/var/www/alrawi"
APP_DIR="${APP_ROOT}/source-code"
BACKUP_ROOT="${APP_ROOT}/backups"
ENV_DIR="/etc/alrawi"
RELEASE_ARCHIVE="/root/alrawi-source-code.zip"
SERVICE_NAME="alrawi"
SERVICE_SOURCE="${APP_DIR}/deploy/vps/alrawi.service"
SERVICE_TARGET="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ ! -f "${RELEASE_ARCHIVE}" ]]; then
  echo "Release archive not found at ${RELEASE_ARCHIVE}"
  exit 1
fi

apt update
apt install -y unzip rsync curl

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --shell /bin/bash "${APP_USER}"
fi

mkdir -p "${APP_ROOT}" "${BACKUP_ROOT}" "${ENV_DIR}"

STAGING_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

unzip -q "${RELEASE_ARCHIVE}" -d "${STAGING_DIR}"

if [[ -d "${APP_DIR}" ]]; then
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  mv "${APP_DIR}" "${BACKUP_ROOT}/source-code-${TIMESTAMP}"
fi

mkdir -p "${APP_DIR}"
rsync -a --delete "${STAGING_DIR}/" "${APP_DIR}/"
chown -R "${APP_USER}:${APP_GROUP}" "${APP_ROOT}" "${ENV_DIR}"

cd "${APP_DIR}"
corepack enable || true
pnpm install --frozen-lockfile
pnpm build

if [[ -f "${SERVICE_SOURCE}" ]]; then
  cp "${SERVICE_SOURCE}" "${SERVICE_TARGET}"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
fi

if [[ -f "${ENV_DIR}/alrawi.env" ]]; then
  systemctl restart "${SERVICE_NAME}" || systemctl start "${SERVICE_NAME}"
  systemctl status "${SERVICE_NAME}" --no-pager
  for attempt in {1..15}; do
    if curl -fsS "http://127.0.0.1:3000/healthz" >/dev/null 2>&1; then
      echo "Health check passed:"
      curl -fsS "http://127.0.0.1:3000/healthz"
      echo
      exit 0
    fi
    sleep 2
  done
  echo "Health check did not pass after deploy."
  exit 1
else
  echo "Create ${ENV_DIR}/alrawi.env first, then run:"
  echo "systemctl start ${SERVICE_NAME}"
fi
