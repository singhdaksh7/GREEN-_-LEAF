# Hostinger Deployment Guide

This is a standard Node.js/Express application (Express serves both the API
and the built React frontend) backed by MySQL via Prisma. It does not require
cPanel, Passenger, PM2, Nginx, or root/sudo access — any Hostinger plan that
runs a Node.js application directly and provides a MySQL database is
sufficient.

## 1. Prerequisites

- A Hostinger plan with Node.js application hosting (Hostinger's control
  panel lets you pick the Node version per app — see §3 for which version).
- A Hostinger MySQL database (host, port, database name, username, password).
- The GitHub repository connected to Hostinger's Git/deploy integration, or
  access to push/pull the repo directly on the server.
- A domain (or subdomain) pointed at the Hostinger application, with HTTPS
  enabled (Hostinger's free SSL / Let's Encrypt is sufficient — Express reads
  `X-Forwarded-Proto` from Hostinger's own reverse proxy, see §9).

## 2. GitHub deployment

- **Repository**: this repository.
- **Branch**: deploy from `main` once this branch has been reviewed and
  merged. Do not deploy `feature/hostinger-production-readiness` directly to
  production.
- **Install**: `npm ci`
- **Build**: `npm run build`
- **Start**: `npm start`

These are root-level scripts (see root `package.json`) that delegate into the
`server` and `client` npm workspaces — Hostinger only ever needs to run
commands from the repository root, never `cd` into `server/` or `client/`
manually.

## 3. Node version

- **Minimum: Node 20.x**. Also verified working on Node 22.x.
- `engines.node` in the root and `server/package.json` both declare `>=20`.
- Set the Node version explicitly in Hostinger's Node app settings (or via
  its version selector) to 20 LTS or newer.

## 4. Environment variables

Set these in Hostinger's environment variable configuration for the app (see
[`HOSTINGER_ENVIRONMENT.md`](./HOSTINGER_ENVIRONMENT.md) for the full table
with examples). At minimum:

- `NODE_ENV=production`
- `PORT` — Hostinger provides this automatically for Node apps; only
  hardcode it for local dev.
- `DATABASE_URL` — the Hostinger MySQL connection string.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — strong, unique secrets (the app
  refuses to start in production with the insecure local-dev defaults).
- `CLIENT_URL` — the site's own public HTTPS URL (used for CORS, canonical
  links, sitemap, and the Razorpay webhook doc above).
- `STORAGE_PROVIDER=local`, `UPLOAD_DIR`, `UPLOAD_BASE_URL` — see §7.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` —
  leave all three unset until the client supplies real credentials (see §8).

## 5. MySQL setup

1. Create a MySQL database in Hostinger's hPanel and note the connection
   details it gives you.
2. Set `DATABASE_URL` in the app's environment variables to:
   ```
   mysql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
3. Generate the Prisma client and apply the committed migrations:
   ```bash
   npx prisma generate --schema server/prisma/schema.prisma
   npm run db:migrate:deploy
   ```
   `npm run db:migrate:deploy` runs `prisma migrate deploy` inside the
   `server` workspace — it only ever applies already-committed migrations
   from `server/prisma/migrations/`. **Never run `prisma migrate dev` against
   the Hostinger database** — that command is for local development only and
   can prompt for destructive schema resets.
4. `npm ci` already triggers `prisma generate` automatically via the
   `server` workspace's `postinstall` script, so step 3's `generate` call is
   typically a no-op safety net, not a required manual step.

## 6. Data migration from the old MongoDB database

If there is existing GreenKart data in MongoDB (Render/Atlas) that needs to
carry over:

1. Set `MONGODB_URI` to the **source** MongoDB connection string (this is
   only ever read by the migration tool below — the running application
   never reads it) and `DATABASE_URL` to the **target** Hostinger MySQL
   database.
2. Take a MongoDB backup first (see §12) — this step is read-only against
   Mongo, but always have a fallback.
3. Run the migration:
   ```bash
   npm run migrate:mongo-to-mysql
   ```
   This is idempotent (safe to re-run after a partial failure — it upserts
   every row keyed on a `legacyMongoId`/`razorpayOrderId` so nothing is
   duplicated) and never writes back to MongoDB.
4. Validate the result:
   ```bash
   npm run migrate:validate
   ```
   This compares record counts and financial/stock totals between the two
   databases and exits non-zero on any mismatch — do not proceed to §9
   (decommissioning demo data) until this passes cleanly.
5. Run this migration from a machine/shell that has network access to both
   databases (not necessarily Hostinger itself — a local machine or CI
   runner with both connection strings works fine, since the target is just
   `DATABASE_URL`).

## 7. Upload storage (product images)

- `STORAGE_PROVIDER=local` (the only implemented provider today).
- `UPLOAD_DIR` — an **absolute path outside the app's own deployment
  folder**, so uploads survive redeploys. Ask Hostinger support / hPanel
  what persistent directory is available for the Node app outside its
  deployment root, and set `UPLOAD_DIR` to that path.
- `UPLOAD_BASE_URL=/uploads` (default) — Express serves this itself
  (`express.static(UPLOAD_DIR)`, see `server/src/app.ts`), so no extra
  web-server configuration is required.
- Directory permissions: the directory just needs to be writable by
  whichever OS user runs the Node process — no root/sudo needed:
  ```bash
  mkdir -p /path/to/persistent/greenkart_uploads
  chmod 755 /path/to/persistent/greenkart_uploads
  ```
- **If Hostinger's managed Node hosting does not provide a suitable
  persistent filesystem** for uploads (i.e. the app's disk is wiped or
  ephemeral across redeploys), the storage layer is already designed to
  swap to S3/R2/Spaces later by implementing `StorageProvider`
  (`server/src/storage/StorageProvider.ts`) and changing `STORAGE_PROVIDER`
  — no product/admin code changes required. This has not been implemented
  yet since it isn't needed unless Hostinger's disk turns out to be
  ephemeral.

## 8. Razorpay (optional)

Before the client supplies credentials:

- Leave `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
  all unset.
- The server starts normally, COD checkout works, and `GET
  /api/payments/razorpay/config` reports `{ enabled: false }` — the frontend
  shows Pay Online as disabled/coming soon automatically.

Once the client provides Test Mode (or Live Mode) credentials:

1. Set all three `RAZORPAY_*` variables in Hostinger's environment config.
2. Redeploy (or restart the app so it picks up the new environment).
3. In the Razorpay Dashboard, enable **Automatic Capture** and configure the
   webhook endpoint:
   ```
   https://<production-domain>/api/payments/razorpay/webhook
   ```
   subscribed to `payment.captured`, `order.paid`, and `payment.failed`, with
   the webhook secret set to the same value as `RAZORPAY_WEBHOOK_SECRET`.
4. No application code changes are required — Pay Online becomes available
   automatically. Setting only 1 or 2 of the 3 variables is treated as a
   configuration error and the server refuses to start (see
   `server/src/config/env.ts`) — this is intentional, to catch an
   incomplete/typo'd deploy rather than silently running in an ambiguous
   state.

## 9. HTTPS, reverse proxy, and cookies

- Hostinger terminates HTTPS in front of Node; Express is configured with
  `trust proxy` (see `TRUST_PROXY_HOPS`, default `1`) so `req.secure` and
  `req.protocol` are correct behind that proxy.
- Auth cookies are `httpOnly`, `sameSite=lax`, and `secure` in production
  (`server/src/controllers/auth.controller.ts`) — this is not weakened for
  Hostinger and should not be.
- `CLIENT_URL` must be the site's real HTTPS origin — it drives CORS,
  canonical/OpenGraph links, and the sitemap.

## 10. Health check

`GET /api/health` returns:
```json
{ "success": true, "status": "ok", "database": "connected" }
```
It checks MySQL connectivity via Prisma (`SELECT 1`) — no credentials or
internal details are ever included in the response. Point any Hostinger
uptime/health monitoring at this endpoint.

## 11. Production admin bootstrap

The server never seeds a public demo admin account in production. Create the
first real admin account with:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run create-admin
```

This is safe to re-run — it promotes an existing account to `ADMIN` if the
email already exists, or creates a new one — and never prints the password.
Do not run `npm run seed` in production; it refuses to run at all when
`NODE_ENV=production` (see `server/src/utils/seed.ts`).

## 12. Production readiness check

Run once after the first deploy, and again after any redeploy:

```bash
npm run verify:production
```

This checks (without ever printing secret values): required environment
variables are present, MySQL connectivity, Prisma migration status, the
production build artifacts exist, upload storage is writable, the demo seed
was never run against this database, and reports whether Razorpay is
enabled or COD-only. It exits non-zero if anything fails.

## 13. Smoke test checklist

After deploying:

- [ ] `GET /api/health` returns `database: "connected"`.
- [ ] The storefront loads at the production domain over HTTPS.
- [ ] Browse a category, apply a filter, and view a product page.
- [ ] Register a new customer account, log in, and log out.
- [ ] Add an item to cart and place a COD order.
- [ ] Log in as the bootstrapped admin and confirm the order appears in
      `/admin/orders`.
- [ ] Confirm Pay Online is disabled/hidden until Razorpay credentials are
      configured (§8), then re-test after configuring them.

## 14. Rollback

- **Application**: redeploy the previous known-good commit/tag via
  Hostinger's Git deployment (or `git revert` + push, depending on how
  Hostinger's deploy is wired). The app has no in-place state beyond the
  database and `UPLOAD_DIR` — rolling back code is safe.
- **Database**: Prisma migrations are additive and forward-only by design in
  this project; if a migration needs to be undone, restore from the MySQL
  backup taken before that deploy (see §15) rather than attempting to write
  a down-migration by hand.

## 15. Backups

See the commands and restore procedure in the project root's backup
reference — MySQL export/restore and uploaded-image archive/restore. Adapt
the exact backup destination/schedule to whatever Hostinger's plan supports
(scheduled backups, cron + `mysqldump`, etc).

```bash
# MySQL export
mysqldump --single-transaction -h HOST -P PORT -u USER -p DATABASE > backup.sql

# MySQL restore
mysql -h HOST -P PORT -u USER -p DATABASE < backup.sql

# Uploaded-image archive
tar -czf uploads-backup.tar.gz -C /path/to UPLOAD_DIR

# Uploaded-image restore
tar -xzf uploads-backup.tar.gz -C /path/to
```
