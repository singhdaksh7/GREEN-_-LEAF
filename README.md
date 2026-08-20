# Green Leaf — Gardening E-commerce (MERN)

A full-stack, TrustBasket-inspired gardening e-commerce platform built with MongoDB, Express, React, and Node.js. Original branding ("Green Leaf") and placeholder imagery — no TrustBasket source, copy, or assets were used.

## Features

- Mega-menu category navigation, live search with autocomplete, filterable/sortable collection pages
- Product detail pages with variants (size/colour/pack), image gallery, mock pincode delivery checker, reviews
- Cart drawer + cart page with free-shipping progress, guest cart (localStorage) that merges into the account cart on login
- Coupon codes, server-authoritative pricing (client-submitted totals are never trusted)
- JWT auth (access + refresh, httpOnly cookies + refresh-token rotation), customer account area (orders, addresses, wishlist, profile)
- Checkout → order creation with atomic stock decrement, order status timeline, public order tracking
- Bulk order enquiries, newsletter signup, blog
- Full admin dashboard: products, categories, orders, customers, coupons, review moderation, bulk enquiries, blog, site settings

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, React Router, Tailwind CSS, Axios, React Hook Form + Zod, Zustand, TanStack Query, Lucide Icons, React Helmet Async

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT (jsonwebtoken), bcryptjs, Zod, Helmet, express-rate-limit, express-mongo-sanitize

## Folder Structure

```
├── client/            React + Vite frontend
│   └── src/{api,components,features,hooks,layouts,pages,routes,store,types,utils}
├── server/             Express + TypeScript backend
│   └── src/{config,controllers,middleware,models,routes,services,validators,utils}
├── docker-compose.yml  Local MongoDB
└── .env.example
```

## Requirements

- Node.js 20+
- MongoDB 7+ (local install, Atlas, or `docker compose up -d` using the provided `docker-compose.yml`)

## Setup

```bash
npm install                     # installs both workspaces
cp .env.example server/.env     # fill in JWT secrets, Mongo URI
cp client/.env.example client/.env
docker compose up -d            # starts local MongoDB (or point MONGODB_URI at Atlas)
npm run seed                    # seeds categories, products, coupons, reviews, blog posts
npm run dev                     # runs API (port 5000) + client (port 5173) together
```

Frontend: http://localhost:5173
API: http://localhost:5000/api

## Demo Credentials (seeded)

- Admin: `admin@greenleaf.example` / `Admin@12345` → `/admin`
- Customer: `customer@greenleaf.example` / `Customer@12345`
- Coupons: `WELCOME10`, `GARDEN15`, `FREEDELIVERY`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run backend + frontend concurrently |
| `npm run seed` | Seed the database with demo data |
| `npm run lint` | Lint both workspaces |
| `npm run typecheck` | Type-check both workspaces |
| `npm run test` | Run backend unit tests (Vitest) |
| `npm run build` | Production build of both workspaces |

## Authentication Flow

Access tokens (15m) are returned in the response body and attached as `Authorization: Bearer` headers by the Axios client; refresh tokens (7d) are set as httpOnly cookies and never touch client-side JS. A 401 triggers a silent `/auth/refresh` call and retries the original request once.

## Cart & Checkout Security

The cart, coupon discount, shipping, and order totals are always recomputed server-side from the database (`pricing.service.ts`, `cart.service.ts`, `order.service.ts`). The frontend cart/checkout totals shown to the user are a preview only — nothing computed in the browser is trusted when the order is created. Stock is decremented atomically with `findOneAndUpdate` guards to avoid overselling.

## What's Fully Functional

Auth (register/login/refresh/logout/password reset), product catalogue + search + filters/sort/pagination, cart, wishlist, coupons, checkout (COD), order creation/tracking/status history, reviews, newsletter, bulk order enquiries, blog, full admin CRUD for products/categories/coupons/blog + order status + review moderation + customer enable/disable + site settings.

## What's Mocked / Simplified

- **Delivery pincode check** — deterministic mock in `delivery.service.ts`, designed to be swapped for a real logistics API without touching callers.
- **Online payment** — UI option present; `PaymentService` abstraction point is `order.service.ts` (`paymentMethod: 'ONLINE'`); no real gateway (e.g. Razorpay) is wired up.
- **Password reset email** — the reset link is logged to the server console instead of being emailed (no SMTP/email provider configured).
- **Product image uploads** — admin forms accept image URLs (comma-separated) rather than a file upload widget; seed data uses placeholder images. Swappable for Cloudinary/S3 later.
- **Product variant editing in admin UI** — variants can be seeded/edited via the API but the admin product form only covers base fields; extend `AdminProductsPage` for full variant editing.

## Deployment Notes

- Set `NODE_ENV=production`, real JWT secrets, and a production `MONGODB_URI` (e.g. Atlas) before deploying.
- Serve the client build (`client/dist`) via a static host/CDN and the API from any Node host; set `CLIENT_URL` (server) and `VITE_API_URL` (client) accordingly, and ensure cookies are `secure`/`sameSite=none` across origins in production (already handled in `auth.controller.ts`).
