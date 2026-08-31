

## Setup

```bash
npm install                     
cp .env.example server/.env     
cp client/.env.example client/.env
docker compose up -d            
npm run seed                    
npm run dev                     
```

Frontend: http://localhost:5173
API: http://localhost:5000/api

## Demo Credentials 

- Admin: `admin@greenleaf.example` / `Admin@12345` 
- Customer: `customer@greenleaf.example` / `Customer@12345`
- Coupons: `WELCOME10`, `GARDEN15`, `FREEDELIVERY`

## Scripts


| `npm run dev` | Run backend + frontend concurrently |
| `npm run seed` | Seed the database with demo data |
| `npm run lint` | Lint both workspaces |
| `npm run typecheck` | Type-check both workspaces |
| `npm run test` | Run backend unit tests (Vitest) |
| `npm run build` | Production build of both workspaces |

## Enable Razorpay Later

The application intentionally runs with Cash on Delivery only until Razorpay
is configured. When the client provides Test Mode (or subsequently Live Mode)
credentials, add these Render environment variables and redeploy:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

In the Razorpay Dashboard, enable **Automatic Capture** and configure this
webhook endpoint:

```text
https://green-leaf-gardening.onrender.com/api/payments/razorpay/webhook
```

Subscribe to `payment.captured`, `order.paid`, and `payment.failed`. Set the
webhook secret to the same value as `RAZORPAY_WEBHOOK_SECRET`, then restart or
redeploy Render. Pay Online becomes available automatically; no application
code changes are required.

# BigRock Linux Image Storage Setup

Admin-uploaded product images (`Products → Add Product → Images`) are stored
on the server's own local, persistent disk via a swappable `StorageProvider`
(`server/src/storage/`) — no Cloudinary/S3 account is required to run this
feature. This is designed for a normal Linux hosting account like **BigRock**
(cPanel-style, no root access, persistent filesystem), not Render's
ephemeral-disk free plan — keep Render only as a temporary demo target.

## Required environment variables

```env
# "local" is the only implemented provider today; the interface is written
# so S3/R2/Spaces can be added later without touching product/admin code.
STORAGE_PROVIDER=local

# Absolute path to a directory OUTSIDE the app's own deployment folder, so
# uploads survive a redeploy. Must be owned by, and writable by, the hosting
# account's own user — no root/sudo needed.
UPLOAD_DIR=/home/CPANEL_USER/greenkart_uploads

# Public URL prefix the browser will use to load images. Can be a bare path
# (the Node app serves it itself, see below) or a full domain if a CDN/Apache
# alias fronts the directory instead.
UPLOAD_BASE_URL=https://example.com/uploads
```

(Do not commit real BigRock usernames, paths, or secrets — the values above
are illustrative only.)

## Directory permissions

```bash
mkdir -p /home/CPANEL_USER/greenkart_uploads
chmod 755 /home/CPANEL_USER/greenkart_uploads
```

No elevated privileges are required — the directory just needs to be
writable by whichever user account runs the Node process.

## Serving `/uploads`

By default the Node app serves `UPLOAD_BASE_URL`'s path itself
(`express.static(UPLOAD_DIR)`, wired up in `server/src/app.ts`), which works
out of the box on any host, including BigRock, with zero extra web-server
configuration. If BigRock's Apache/cPanel setup is later configured to serve
`UPLOAD_DIR` directly as a static alias (e.g. for CDN caching), that's a drop-in
optimization — no application code changes needed either way.

## Future cloud storage

`StorageProvider` (`upload`/`delete`/`getPublicUrl`) is the only surface
product/admin code depends on. Adding S3, Cloudflare R2, or DigitalOcean
Spaces later means implementing that interface and switching
`STORAGE_PROVIDER` — no changes to the product model, admin controllers, or
frontend.
