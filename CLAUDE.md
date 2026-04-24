# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShopEasy — a full-stack e-commerce monorepo. React + Vite frontend, Express + Prisma backend, SQLite database. See `backend/CLAUDE.md` and `frontend/CLAUDE.md` for layer-specific details.

## Commands

```bash
# Start both servers (backend:3001 + frontend:5173)
npm run dev

# Install all dependencies (root + backend + frontend)
npm run install:all

# Run all tests (backend Jest + frontend Playwright E2E)
npm test

# Backend tests only
cd backend && npx jest
cd backend && npx jest tests/auth.test.ts        # single file
cd backend && npx jest -t "should register"       # by test name
cd backend && npx jest --coverage                 # with coverage

# E2E tests only (auto-starts both servers)
cd frontend && npx playwright test
cd frontend && npx playwright test tests/auth.spec.ts           # single file
cd frontend && npx playwright test -g "should login"            # by test name
cd frontend && npx playwright test --headed --workers=1         # headed mode

# Database
cd backend && npx prisma db push       # apply schema changes
cd backend && npx prisma migrate dev   # create migration
cd backend && npx prisma db seed       # seed demo data (destructive — deletes all existing data)
cd backend && npx prisma studio        # GUI browser
```

## Architecture

### Monorepo Layout

- `backend/` — Express REST API (port 3001), Prisma ORM, SQLite, JWT auth
- `frontend/` — React 18 SPA (port 5173), Vite dev server proxies `/api` → backend
- `TestCases/` — External test case documentation

### Request Flow

```
Browser → Vite proxy (/api/*) → Express → Route → Validation → Auth Middleware → Controller → Prisma → SQLite
```

### Frontend State Architecture

```
main.tsx: AuthProvider → CartProvider → ToastProvider → App (BrowserRouter)
```

- `AuthContext` manages JWT (persisted in localStorage) and user profile
- `CartContext` depends on AuthContext — nulls cart on logout, auto-refreshes on login
- Services layer (`src/services/`) wraps Axios; pages never call `api.ts` directly

### Key Business Rules

- **Order placement** is an atomic Prisma transaction: validate stock → create order + items → decrement stock → clear cart
- **Order status** is forward-only: pending → confirmed → shipped → delivered
- **Cart uniqueness**: compound unique on (userId, productId) — adding an existing product increments quantity
- **Tax rate**: hardcoded 8% in both `CartPage.tsx` and `CheckoutPage.tsx`
- **Register does NOT auto-login** — user must log in separately after registration

### Auth

- JWT in `Authorization: Bearer <token>` header
- Frontend Axios interceptor auto-logouts on 401 (except login/register)
- Roles: `customer` (default), `admin`

## Test Infrastructure

- **Backend (Jest + Supertest)**: Uses separate `prisma/test.db` via `tests/env.ts` setupFiles. Tests import `app.ts` (not `index.ts`) to avoid starting the server. Coverage thresholds: 75% branches, 80% functions/lines/statements.
- **E2E (Playwright)**: Runs sequentially (`fullyParallel: false`). Auto-starts both servers. Tests share database state — **must use `--workers=1` in headed mode**. Use `data-testid` attributes for selectors.

## Default Credentials

| Role     | Email              | Password     |
|----------|--------------------|-------------|
| Admin    | admin@shopapp.com  | admin123    |
| Customer | jane@example.com   | customer123 |

## Environment

Backend `.env` (see `.env.example`):
```
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

Frontend has no `.env` — Vite proxies `/api` to `http://localhost:3001` (configured in `vite.config.ts`). Backend CORS allows `localhost:5173`, `localhost:4173`, `127.0.0.1:5173`.
