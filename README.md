

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
credentials, set these environment variables on the hosting platform and
redeploy:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

In the Razorpay Dashboard, enable **Automatic Capture** and configure this
webhook endpoint (replace with the site's real production domain):

```text
https://<your-production-domain>/api/payments/razorpay/webhook
```

Subscribe to `payment.captured`, `order.paid`, and `payment.failed`. Set the
webhook secret to the same value as `RAZORPAY_WEBHOOK_SECRET`, then redeploy.
Pay Online becomes available automatically; no application code changes are
required.

## Production deployment

See [`docs/HOSTINGER_DEPLOYMENT.md`](docs/HOSTINGER_DEPLOYMENT.md) for the
full Hostinger deployment guide (install/build/start commands, MySQL setup,
data migration, upload storage, admin bootstrap, and rollback) and
[`docs/HOSTINGER_ENVIRONMENT.md`](docs/HOSTINGER_ENVIRONMENT.md) for the
complete environment variable reference.

Admin-uploaded product images are stored on the server's own persistent disk
via a swappable `StorageProvider` (`server/src/storage/`) — no Cloudinary/S3
account is required to run this feature. `StorageProvider`
(`upload`/`delete`/`getPublicUrl`) is the only surface product/admin code
depends on, so adding S3, Cloudflare R2, or DigitalOcean Spaces later means
implementing that interface and switching `STORAGE_PROVIDER` — no changes to
the product model, admin controllers, or frontend.
"# GREENKART" 
