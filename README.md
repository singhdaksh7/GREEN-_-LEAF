

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
