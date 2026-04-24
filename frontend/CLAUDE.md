# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **frontend** of ShopEasy, a full-stack e-commerce monorepo. The backend lives at `../backend`. React + Vite + TypeScript + Tailwind CSS.

## Commands

```bash
# Development (frontend only, proxies /api to backend)
npm run dev

# Development (both frontend + backend from monorepo root)
cd .. && npm run dev

# Build
npm run build          # tsc -b && vite build

# E2E tests (auto-starts both servers)
npx playwright test
npx playwright test tests/auth.spec.ts              # single file
npx playwright test -g "should login"               # by test name
npx playwright test --headed --workers=1             # headed mode (must use 1 worker — tests share user state)
npx playwright test --project=chromium               # specific browser

# Backend tests (from backend dir)
cd ../backend && npx jest
cd ../backend && npx jest --coverage
cd ../backend && npx jest tests/auth.test.ts         # single file

# Database
cd ../backend && npx prisma db push                  # apply schema
cd ../backend && npx prisma db seed                  # seed demo data
cd ../backend && npx prisma studio                   # GUI browser
```

## Architecture

### API Layer
- `src/api.ts` — Shared Axios instance (`/api` base URL). Request interceptor attaches JWT from localStorage. Response interceptor auto-logouts on 401 (except login/register endpoints). Exports `getErrorMessage()` for consistent error extraction from Axios errors.
- `src/services/` — Thin wrappers over the Axios instance: `authService`, `productService`, `cartService`, `orderService`, `adminService`. Pages/contexts import services, never use `api.ts` directly.

### State Management
- `AuthContext` — Manages user/token/isAuthenticated. Persists JWT in localStorage. Auto-fetches profile on mount if token exists. Register does NOT auto-login.
- `CartContext` — Manages cart state. Depends on AuthContext (nulls cart when logged out, auto-refreshes on auth change). Provides refreshCart, addToCart, updateItem, removeItem, clearCart.
- Both contexts wrap the app in `main.tsx`: `AuthProvider > CartProvider > ToastProvider > App`.

### Routing (App.tsx)
- Public: `/`, `/products`, `/products/:id`
- Guest-only (redirects to `/` if authenticated): `/login`, `/register`
- Protected (redirects to `/login` if unauthenticated): `/cart`, `/checkout`, `/order-confirmation/:id`, `/orders`
- Admin-only (redirects non-admins to `/`): `/admin`

### Frontend ↔ Backend Connection
- Vite dev server proxies `/api` → `http://localhost:3001` (configured in `vite.config.ts`)
- Backend CORS allows origins: `localhost:5173`, `localhost:4173`, `127.0.0.1:5173`
- Backend runs on port 3001, frontend on port 5173

## E2E Test Conventions

- Tests use seeded customer account: `jane@example.com` / `customer123`
- Tests share database state — **must run with 1 worker** in headed mode to avoid cart/order conflicts
- Playwright config auto-starts both backend (port 3001) and frontend (port 5173)
- `fullyParallel: false` — tests within a file run sequentially, but files can run in parallel (which causes flakes with >1 worker)
- Use `data-testid` attributes for stable selectors: `cart-link`, `cart-badge`, `cart-item`, `user-name`, `logout-btn`, `product-card`, `checkout-btn`, `order-card`

## Key Patterns

- Tax rate is hardcoded at 8% (`TAX_RATE = 0.08`) in both `CartPage.tsx` and `CheckoutPage.tsx`
- Order placement is a backend transaction: validates stock → creates order items → decrements stock → clears cart
- Order status progression is forward-only: pending → confirmed → shipped → delivered
- Form labels use `htmlFor`/`id` pairs for accessibility and Playwright `getByLabel()` compatibility
- Styling: emerald for primary actions, slate for neutrals, Tailwind utility classes throughout
- `ProductImage` component handles lazy loading, skeleton placeholder during load, and error fallback for broken image URLs
- Seed script (`prisma/seed.ts`) deletes ALL data before recreating — avoid re-running in production or when preserving user-created data
