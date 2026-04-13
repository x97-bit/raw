# Go-Live Checklist

## What You Need
- A GitHub repository for this project
- A Railway account
- A custom domain name
- One MySQL production database
- One admin username and password ready for first login
- Real values for any optional integrations you actually use

## Recommended Shape
- 1 Node.js app instance
- 1 MySQL database
- 1 custom domain with HTTPS

This project currently uses in-memory rate limiting, so a single app instance is the safest production shape for now.

## Railway Steps
1. Push this folder as the repository root
2. Create a new Railway project from the GitHub repo
3. Add a MySQL service
4. Open the app service variables and set the required environment values
5. Set the app service health check to `/healthz`
6. Wait for the first successful deployment
7. Open the generated Railway domain and test login
8. Add your custom domain after the smoke test passes

## Required Environment Variables
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=3000`
- `TRUST_PROXY=1`
- `APP_ACCESS_TOKEN_SECRET=<32+ chars>`
- `APP_REFRESH_TOKEN_SECRET=<32+ chars>`
- `DATABASE_URL=mysql://username:password@host:3306/database_name`

## Optional Environment Variables
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

Leave the optional OAuth values empty if you are only using the local username/password flow.

## Pre-Deploy Checks
Run these before the first deployment:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

## Start Command

```powershell
pnpm start
```

Railway is configured to use a direct production start command from [railway.json](C:/Users/lenovo/OneDrive/Desktop/v0.05/v0.5/source-code/railway.json) so signals reach Node correctly during deploys and restarts.

## Health Check
Use this path for the hosting provider health check:

```text
/healthz
```

Expected response:

```json
{"ok":true}
```

## First Production Smoke Test
After deployment:
- Open the main app URL
- Open `/healthz`
- Log in with an admin account
- Create a test invoice
- Create a test payment
- Open a statement export
- Confirm the MySQL database receives the new records

## Operations Notes
- Turn on automatic database backups before real use
- Keep `APP_ACCESS_TOKEN_SECRET` and `APP_REFRESH_TOKEN_SECRET` only in provider secrets, never in git
- Do not scale the app to multiple instances until rate limiting moves to a shared store such as Redis
- Keep a staging database or backup before running data migration scripts
