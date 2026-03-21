# Stonepedia

A B2B platform for stone and marble. Buyers post RFQs, suppliers quote, buyer picks the best one — becomes an order.

Built as a take-home assignment. Tried to keep it close to production quality.

---

## Stack

- **Next.js 16** (App Router) — did not want to maintain two separate repos for frontend and backend for a project this size
- **PostgreSQL on Neon** — data is relational, MongoDB would've been the wrong call here
- **Prisma 7** — typed queries, no raw SQL, migration history
- **Zustand** — tried Context first, switched because of the SSR hydration issues and the fact that you can't read context outside components plus no context wrapper needed in the app
- **JWT + bcrypt** — Vercel is serverless, sessions would need Redis, JWT just made more sense
- **Tailwind + shadcn** — fastest way to get something that doesn't look terrible

---

## Running locally

You'll need Node 22+ and a Neon account (free).
```bash
git clone https://github.com/mohit2404/stonepedia
cd stonepedia
pnpm install

# copy env file and fill in your Neon URLs + a JWT secret
cp .env.example .env.local

# run migrations
npx prisma migrate dev --name init

# seed some demo products and users
pnpm run db:seed

pnpm dev
```

Open http://localhost:3000

Demo accounts if you don't want to register:
- buyer@test.com / password123
- supplier@test.com / password123

---

## API

All endpoints under `/api/v1/`. Protected routes need `Authorization: Bearer <token>`.
```
POST   /auth/register
POST   /auth/login

POST   /rfq                    # buyers only
GET    /rfq                    # anyone logged in, ?status=OPEN|CLOSED|ALL
POST   /rfq/:id/quote          # suppliers only
GET    /rfq/:id/quotes         # anyone logged in
POST   /rfq/:id/accept         # buyer only, must be their own RFQ
GET    /products
POST   /products
```

---

## things worth mentioning

**The accept flow runs as a transaction** — when a buyer accepts a quote it simultaneously creates the order, marks that quote ACCEPTED, rejects all other quotes, and closes the RFQ. If anything fails it all rolls back. Didn't want to end up with an order created but the RFQ still showing open.

**One quote per supplier per RFQ** — if a supplier submits again it updates their existing quote, not a duplicate. Handled with a Prisma upsert on the unique constraint `(rfq_id, supplier_id)`.

**RBAC is middleware** — `requireRole(req, "BUYER")` or `requireRole(req, "SUPPLIER")` on each route. A supplier calling the accept endpoint gets a 403 before any business logic runs.

**Rate limiting on auth routes** — 20 requests per IP per minute. Basic in-memory implementation.

---

## Caching Strategy

The architecture includes a Redis caching layer for the most
read-heavy endpoint — GET /rfq/:id/quotes.

Cache keys:

- rfq:{id}:quotes → 60s TTL, invalidated on new quote or accept
- rfq:list → 30s TTL, invalidated on new RFQ

For local development the app falls through gracefully to the
database if Redis is unavailable.

For production deployment on Vercel, swap ioredis for
@upstash/redis (HTTP-based, serverless compatible).

---

## Assumptions I made

- Products are seeded manually — no admin UI to add them
- All buyers can see all open RFQs — no visibility controls
- Currency is INR, hardcoded
- One supplier can only quote once per RFQ (can update, not add new)

---

## Deploying

Hosted on Vercel. Neon for the DB.

If you want to run it yourself on Vercel:
1. Add `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `JWT_SECRET` in the Vercel environment variables
2. Make sure `.npmrc` has `enable-pre-post-scripts=true` — pnpm blocks Prisma's generate script otherwise
3. Run `npx prisma migrate deploy` from your local machine pointing at the Neon URL
