# Hostinger Environment Variables

All values below are safe placeholders — none are real secrets. Set the real
values directly in Hostinger's environment variable configuration for the
app, never committed to the repository.

## Application

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `NODE_ENV` | Yes | No | `production` | Enables production behavior (secure cookies, strict secret checks, disables demo seed). |
| `PORT` | No | No | `5000` | Hostinger sets this automatically for Node apps; only needed for local dev. |
| `CLIENT_URL` | Yes | No | `https://greenkart.example.com` | The site's own public HTTPS origin — drives CORS, canonical/OG links, sitemap, robots.txt. |
| `TRUST_PROXY_HOPS` | No | No | `1` | Number of reverse-proxy hops in front of Node (Express `trust proxy`). Default `1` matches Hostinger's setup. |

## Database

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | Yes | `mysql://USER:PASSWORD@HOST:3306/greenkart` | Hostinger MySQL connection string, consumed by Prisma. |

## Auth

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `JWT_ACCESS_SECRET` | Yes | Yes | `<random 32+ char string>` | Signs short-lived access tokens. Must not be the local-dev default in production — the server refuses to start otherwise. |
| `JWT_REFRESH_SECRET` | Yes | Yes | `<random 32+ char string>` | Signs longer-lived refresh tokens. Same requirement as above. |
| `JWT_ACCESS_EXPIRES` | No | No | `15m` | Access token lifetime. |
| `JWT_REFRESH_EXPIRES` | No | No | `7d` | Refresh token lifetime. |

## Uploads (product images)

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `STORAGE_PROVIDER` | No | No | `local` | Only `local` is implemented; the interface supports adding S3/R2 later. |
| `UPLOAD_DIR` | Recommended in production | No | `/home/persistent-data/greenkart_uploads` | Absolute path outside the app's deployment folder, so uploads survive redeploys. Defaults to `./uploads` inside the app if unset — fine for local dev only. |
| `UPLOAD_BASE_URL` | No | No | `/uploads` | Public URL prefix the browser uses to load images. |

## Razorpay (optional — leave all three unset for COD-only)

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `RAZORPAY_KEY_ID` | No (all-or-nothing with the two below) | No | `rzp_live_xxxxxxxxxxxx` | Razorpay API key ID. |
| `RAZORPAY_KEY_SECRET` | No (all-or-nothing) | Yes | `<razorpay secret>` | Razorpay API key secret. |
| `RAZORPAY_WEBHOOK_SECRET` | No (all-or-nothing) | Yes | `<razorpay webhook secret>` | Verifies the Razorpay webhook's HMAC signature. |

Setting only 1 or 2 of the three Razorpay variables is treated as a
configuration error and the server refuses to start — set all three together
to enable Pay Online, or leave all three unset to run COD-only.

## Migration tool only (never used by the running application)

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `MONGODB_URI` | Only when running `npm run migrate:mongo-to-mysql` / `npm run migrate:validate` | Yes | `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/greenkart` | Source database for the one-time Mongo → MySQL migration. Not read by the production server. |

## Test-only (never set in production)

| Variable | Required | Secret | Example | Purpose |
|---|---|---|---|---|
| `TEST_DATABASE_URL` | No | No | `mysql://root:root@localhost:3306/greenkart_test` | Overrides the test database used by `npm test`. Defaults to a local `greenkart_test` database if unset. |
