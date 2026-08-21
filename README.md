

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
| `npm run build` | Production build of both workspaces |"# GREEN-_-LEAF" 
