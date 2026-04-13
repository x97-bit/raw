# VPS Deployment Guide

This guide assumes:
- Ubuntu or Debian VPS
- Domain already pointing to the VPS public IP
- Clean app upload target is `/var/www/alrawi/source-code`
- HTTPS handled by Caddy

## 1. Install system packages

```bash
sudo apt update
sudo apt install -y curl git unzip mariadb-client
```

## 2. Install Node.js and pnpm

Install a current Node.js LTS version, then install pnpm:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.30.3 --activate
```

## 3. Create app user and folders

```bash
sudo useradd --system --create-home --shell /bin/bash alrawi
sudo mkdir -p /var/www/alrawi
sudo mkdir -p /etc/alrawi
sudo chown -R alrawi:alrawi /var/www/alrawi
sudo chown -R alrawi:alrawi /etc/alrawi
```

## 4. Upload the code

For a clean upload from Windows CMD, use:

```text
C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\deploy\vps\package-upload.cmd 195.35.29.31
```

That uploads:
- `/root/alrawi-source-code.zip`
- `/root/deploy-on-vps.sh`

Then on the VPS run:

```bash
chmod +x /root/deploy-on-vps.sh
bash /root/deploy-on-vps.sh
```

If you prefer a manual upload, extract the app so the root becomes:

```text
/var/www/alrawi/source-code
```

## 5. Create the production env file

Copy the example from [.env.production.example](C:/Users/lenovo/OneDrive/Desktop/v0.05/v0.5/source-code/.env.production.example) into:

```text
/etc/alrawi/alrawi.env
```

Recommended contents:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
TRUST_PROXY=1
API_BODY_LIMIT=10mb
APP_ACCESS_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters-long
APP_REFRESH_TOKEN_SECRET=replace-with-a-different-random-secret-at-least-32-characters-long
DATABASE_URL=mysql://username:password@db-host:3306/database_name
```

Optional only if you use them:
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

## 6. Install the systemd service

Copy [alrawi.service](C:/Users/lenovo/OneDrive/Desktop/v0.05/v0.5/source-code/deploy/vps/alrawi.service) to:

```text
/etc/systemd/system/alrawi.service
```

Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable alrawi
sudo systemctl start alrawi
sudo systemctl status alrawi
```

Useful logs:

```bash
journalctl -u alrawi -f
```

## 7. Install Caddy

Use the official package repository from Caddy docs, then place [Caddyfile.example](C:/Users/lenovo/OneDrive/Desktop/v0.05/v0.5/source-code/deploy/vps/Caddyfile.example) into:

```text
/etc/caddy/Caddyfile
```

Replace `your-domain.com` with your real domain.

Then reload Caddy:

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

## 8. Smoke test

After the service is live:
- open `https://your-domain.com`
- open `https://your-domain.com/healthz`
- log in as admin
- create a test invoice
- create a test payment
- export PDF and Excel

## 9. Post-go-live hardening

After the first successful login, run the bundled security helper on the VPS:

```bash
chmod +x /var/www/alrawi/source-code/deploy/vps/setup-security.sh
bash /var/www/alrawi/source-code/deploy/vps/setup-security.sh
```

If your SSH server uses a custom port, pass it explicitly:

```bash
SSH_PORT=2222 bash /var/www/alrawi/source-code/deploy/vps/setup-security.sh
```

## 10. Automatic database backups

Run a manual backup any time with:

```bash
chmod +x /var/www/alrawi/source-code/deploy/vps/backup-db.sh
/var/www/alrawi/source-code/deploy/vps/backup-db.sh
```

That script reads `DATABASE_URL` from `/etc/alrawi/alrawi.env` and writes compressed dumps to:

```text
/var/backups/alrawi/mysql
```

To keep a daily 3:00 AM backup schedule:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/alrawi/source-code/deploy/vps/backup-db.sh >> /var/log/alrawi-db-backup.log 2>&1") | crontab -
```

## 11. Updating the app later

```bash
cd /var/www/alrawi/source-code
git pull
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart alrawi
```

Or keep using the clean Windows upload flow:

```powershell
cd "C:\Users\lenovo\OneDrive\Desktop\v0.05\v0.5\source-code\deploy\vps"
.\package-upload.cmd 195.35.29.31 root
```

Then on the VPS:

```bash
bash /root/deploy-on-vps.sh
```

## Notes
- Keep one app instance only for now because rate limiting is in-memory
- Turn on automatic database backups before real usage
- Keep the `.env` file only on the server, never in git
