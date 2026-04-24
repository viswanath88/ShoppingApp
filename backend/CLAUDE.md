# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **backend** of ShopEasy, a full-stack e-commerce monorepo. Express.js + TypeScript + Prisma + SQLite. The frontend lives at `../frontend`.

## Commands

```bash
# Development (auto-restarts on changes)
npm run dev

# Development (both backend + frontend from monorepo root)
cd .. && npm run dev

# Build & run
npm run build          # tsc → dist/
npm start              # node dist/index.js

# Tests
npx jest                           # all tests (uses separate test.db)
npx jest --coverage                # with coverage report
npx jest tests/auth.test.ts        # single file
npx jest -t "should register"      # by test name

# Database
npx prisma db push                 # apply schema to dev.db
npx prisma migrate dev             # create migration
npx prisma db seed                 # seed demo data (admin + customer + 15 products)
npx prisma studio                  # GUI browser
npx prisma generate                # regenerate client after schema changes
```

## Architecture

### Request Flow
`Route → Validation (express-validator) → handleValidationErrors → authenticate/authorizeAdmin → Controller → Prisma → Response`

### API Routes (all prefixed `/api`)

| Route | Auth | Description |
|-------|------|-------------|
| `POST /auth/register` | No | Register user (validates name, email, password) |
| `POST /auth/login` | No | Login, returns JWT |
| `GET /auth/profile` | Yes | Current user profile with order/cart counts |
| `GET /products` | No | List with pagination, search, category filter, sort |
| `GET /products/:id` | No | Single product |
| `POST /products` | Admin | Create product |
| `PUT /products/:id` | Admin | Update product |
| `DELETE /products/:id` | Admin | Delete product |
| `GET /cart` | Yes | Get cart with formatted items and totals |
| `POST /cart` | Yes | Add item (validates stock, increments if exists) |
| `PUT /cart/:id` | Yes | Update quantity (validates stock) |
| `DELETE /cart/:id` | Yes | Remove item |
| `DELETE /cart` | Yes | Clear entire cart |
| `POST /orders` | Yes | Place order (transaction: validate stock → create order → decrement stock → clear cart) |
| `GET /orders` | Yes | User's order history |
| `GET /orders/:id` | Yes | Single order (owner or admin) |
| `PUT /orders/:id/status` | Admin | Update status (forward-only progression) |
| `GET /admin/stats` | Admin | Dashboard stats (products, orders, revenue, customers) |
| `GET /admin/orders` | Admin | All orders with customer info (paginated) |

### Middleware
- `authenticate()` — Validates JWT from `Authorization: Bearer <token>` header. Attaches `req.user` with `{ userId, email, role }`.
- `authorizeAdmin()` — Checks `req.user.role === 'admin'`. Must be chained after `authenticate`.
- `handleValidationErrors()` — Formats express-validator errors into `{ errors: [...] }` response.

### Database Schema (Prisma)
- **User** — name, email (unique), password (bcrypt hashed), role (customer/admin)
- **Product** — name, description, price, imageUrl, category, stock
- **CartItem** — userId + productId (unique compound), quantity
- **Order** — userId, totalAmount, status (pending→confirmed→shipped→delivered)
- **OrderItem** — orderId, productId, quantity, price (captured at purchase time)

### Key Business Logic
- Order placement uses a Prisma `$transaction` to atomically: validate stock → create order + items → decrement stock → clear cart
- Order status is forward-only: pending → confirmed → shipped → delivered. Backend rejects backward transitions.
- Cart add: if product already in cart, increments quantity (up to stock limit)
- Product listing supports: `?page=&limit=&search=&category=&sort=price_asc|price_desc|name_asc|name_desc`
- Pagination limit is capped at 100

## Test Infrastructure

- Tests use a **separate database**: `prisma/test.db` (set via `tests/env.ts` which runs as Jest `setupFiles` before any imports)
- `tests/setup.ts` — `resetDatabase()` truncates all tables; `seedTestData()` creates admin, customer, and 3 products
- `tests/helpers.ts` — `getCustomerToken()`, `getAdminToken()` for authenticated requests
- Coverage thresholds: 75% branches, 80% functions/lines/statements
- Tests import `app` from `src/app.ts` (not `index.ts`) to avoid starting the server

## Seeded Demo Data

- Admin: `admin@shopapp.com` / `admin123`
- Customer: `jane@example.com` / `customer123`
- 15 products across: Electronics, Clothing, Home & Kitchen, Books
- Product images use Unsplash URLs
- **Warning:** Seed script deletes ALL data before recreating — do not re-run if you want to preserve user-created orders/accounts

## Environment Variables (.env)

```
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

## TypeScript Notes

- `req.params.id` requires `as string` cast due to Express type overloading
- `jwt.sign` options need `as jwt.SignOptions` cast to resolve overload ambiguity
- Strict mode enabled; output to `dist/` as CommonJS
