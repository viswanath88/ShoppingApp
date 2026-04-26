---
name: DomainSkills
description: Domain knowledge reference for the ShopEasy e-commerce application covering Tech Stack, Architecture, Data Models, Business Rules, User Flows, Test Data, and API Endpoints.
user-invocation: false
---

# ShopEasy — Domain Skills

## Tech Stack

| Layer      | Technology                          | Purpose                          |
|------------|-------------------------------------|----------------------------------|
| Frontend   | React 18 + TypeScript               | UI components & pages            |
| Bundler    | Vite 6                              | Dev server + production build    |
| Styling    | Tailwind CSS 4                      | Utility-first CSS framework      |
| Routing    | React Router DOM 6                  | Client-side navigation           |
| HTTP       | Axios                               | API calls with interceptors      |
| Backend    | Node.js + Express                   | REST API server                  |
| ORM        | Prisma                              | Database access + migrations     |
| Database   | SQLite                              | File-based relational DB         |
| Auth       | JWT + bcryptjs                      | Token-based authentication       |
| Validation | express-validator                   | Request input validation         |
| Testing    | Jest + Supertest                    | Backend integration tests        |
| E2E        | Playwright                          | End-to-end browser tests         |

**Ports:** Backend runs on `3001`, Frontend on `5173`. Vite proxies `/api` → backend.

---

## Architecture

### Backend (Express MVC)

```
Request → Route → express-validator → handleValidationErrors → authenticate/authorizeAdmin → Controller → Prisma ORM → SQLite → JSON Response
```

- **Routes** (`src/routes/`) — Define endpoints, attach validators and middleware
- **Controllers** (`src/controllers/`) — Business logic, interact with Prisma
- **Middleware** (`src/middleware/`) — Auth (JWT verification), validation error formatting
- **Prisma** (`src/prisma.ts`) — Singleton database client

### Frontend (React Context + Services)

```
User Action → Page Component → Service Layer (Axios) → Backend API
                    ↕
              Context (Auth/Cart) → Re-render UI
```

- **Contexts** (`src/context/`) — Global state: `AuthContext` (user/token), `CartContext` (cart items)
- **Services** (`src/services/`) — API call wrappers: `authService`, `productService`, `cartService`, `orderService`, `adminService`
- **Pages** (`src/pages/`) — Route-level components consuming contexts and services
- **Components** (`src/components/`) — Shared UI: Navbar, Footer, Toast, ProductImage, ProductSkeleton

### Provider Hierarchy (main.tsx)

```
BrowserRouter > AuthProvider > CartProvider > ToastProvider > App
```

CartContext depends on AuthContext (auto-clears cart on logout, auto-fetches on login).

---

## Data Models

### User
| Field     | Type     | Notes                        |
|-----------|----------|------------------------------|
| id        | Int (PK) | Auto-increment               |
| name      | String   |                              |
| email     | String   | Unique                       |
| password  | String   | bcrypt hashed (10 rounds)    |
| role      | String   | `customer` (default) or `admin` |
| createdAt | DateTime | Auto-set                     |

### Product
| Field       | Type     | Notes                  |
|-------------|----------|------------------------|
| id          | Int (PK) | Auto-increment         |
| name        | String   |                        |
| description | String   |                        |
| price       | Float    |                        |
| imageUrl    | String   | Unsplash URLs          |
| category    | String   | Electronics, Clothing, Books, Home & Kitchen |
| stock       | Int      | Decremented on order   |
| createdAt   | DateTime |                        |

### CartItem
| Field     | Type     | Notes                              |
|-----------|----------|------------------------------------|
| id        | Int (PK) |                                    |
| userId    | Int (FK) | → User                             |
| productId | Int (FK) | → Product                          |
| quantity  | Int      | Default 1                          |

**Constraint:** Unique on `(userId, productId)` — one cart entry per product per user.

### Order
| Field       | Type     | Notes                                     |
|-------------|----------|-------------------------------------------|
| id          | Int (PK) |                                           |
| userId      | Int (FK) | → User                                    |
| totalAmount | Float    | Sum of item prices at purchase time       |
| status      | String   | `pending` → `confirmed` → `shipped` → `delivered` |
| createdAt   | DateTime |                                           |

### OrderItem
| Field     | Type     | Notes                              |
|-----------|----------|------------------------------------|
| id        | Int (PK) |                                    |
| orderId   | Int (FK) | → Order (cascade delete)           |
| productId | Int (FK) | → Product                          |
| quantity  | Int      |                                    |
| price     | Float    | Captured at purchase time (frozen) |

---

## Business Rules

### Authentication
- Passwords hashed with bcrypt (10 salt rounds)
- JWT token issued on login with configurable expiry (default 7 days)
- 401 response auto-triggers frontend logout + redirect to `/login` (except on login/register endpoints)
- Registration does NOT auto-login — user must log in after registering

### Cart
- Adding a product that's already in cart **increments** existing quantity (doesn't create duplicate)
- Quantity cannot exceed product stock
- Cart is user-specific — each user has their own cart
- Cart is cleared atomically when an order is placed

### Orders
- Order placement is a **Prisma transaction** that atomically: validates stock → creates order + items → decrements product stock → clears cart
- If any product is out of stock or has insufficient quantity, the entire order fails
- Order price is **frozen at purchase time** — stored in OrderItem.price, not re-read from Product
- Status progression is **forward-only**: `pending` → `confirmed` → `shipped` → `delivered`
- Backend rejects backward status transitions (e.g., `delivered` → `shipped`)
- Only admin can update order status; only order owner (or admin) can view an order

### Products
- Pagination: default page=1, limit=10, max limit=100
- Search: case-insensitive `contains` on product name
- Categories: `Electronics`, `Clothing`, `Books`, `Home & Kitchen`
- Sort options: `price_asc`, `price_desc`, `name_asc`, `name_desc`
- Only admin can create, update, or delete products

### Tax & Pricing
- Tax rate: **8%** (`TAX_RATE = 0.08`), hardcoded in `CartPage.tsx` and `CheckoutPage.tsx`
- Shipping: always free
- Grand Total = Subtotal + (Subtotal × 0.08)

### Admin
- Admin users see an "Admin" badge/link in the navbar leading to `/admin`
- Admin dashboard shows: total products, total orders, total revenue, total customers
- Admin can view all orders (not just their own) and change order status via dropdown

---

## User Flows

### Registration → Login
1. User fills registration form (name, email, password, confirm password)
2. Client-side validation: required fields, email format, password 6+ chars, passwords match
3. `POST /api/auth/register` → success → redirect to `/login` with success message
4. User logs in → `POST /api/auth/login` → JWT stored in localStorage → redirect to `/`
5. AuthContext auto-fetches profile, CartContext auto-fetches cart

### Product Browsing
1. Home page loads featured products (top 6 by price descending)
2. Products page: search bar, category dropdown, sort dropdown, paginated grid
3. Click product → detail page with image, description, stock, quantity picker
4. "Add to Cart" button (authenticated) → calls CartContext.addToCart → toast confirmation

### Cart → Checkout → Order
1. Cart page shows items with quantity +/- controls, remove button, clear cart
2. Order summary sidebar: subtotal, shipping (free), tax (8%), grand total
3. "Proceed to Checkout" → `/checkout`
4. Step 1 — Shipping form: full name, street address, city, ZIP code (validated)
5. Step 2 — Payment: simulated card UI (demo, no real payment)
6. "Pay Now" → `POST /api/orders` → backend transaction → redirect to `/order-confirmation/:id`
7. Confirmation page: order number, items, totals, links to orders and continue shopping

### Order History
1. `/orders` page lists all user orders with status badges
2. Click order → expand accordion showing items, prices, subtotals
3. Click again → collapse

### Admin Dashboard
1. Login as admin (`admin@shopapp.com` / `admin123`)
2. Click "Admin" badge in navbar → `/admin`
3. View stat cards: total products, orders, revenue, customers
4. Orders table with customer name, email, item thumbnails, date, total
5. Status dropdown per order row → `PUT /api/orders/:id/status` → instant update

---

## Test Data

### Seeded Users

| Role     | Name        | Email               | Password     |
|----------|-------------|---------------------|-------------|
| Admin    | Admin User  | admin@shopapp.com   | admin123    |
| Customer | Jane Smith  | jane@example.com    | customer123 |

### Seeded Products (15 total)

| Category       | Products                                                                    |
|----------------|-----------------------------------------------------------------------------|
| Electronics    | Wireless Noise-Cancelling Headphones ($249.99), 4K Ultra HD Smart TV ($599.99), Bluetooth Portable Speaker ($79.99), Mechanical Gaming Keyboard ($149.99) |
| Clothing       | Classic Fit Cotton Polo Shirt ($34.99), Slim Fit Stretch Denim Jeans ($59.99), Lightweight Running Shoes ($89.99), Wool Blend Winter Coat ($199.99) |
| Books          | The Pragmatic Programmer ($44.99), Atomic Habits ($16.99), Dune: Deluxe Edition ($29.99), Designing Data-Intensive Applications ($39.99) |
| Home & Kitchen | Stainless Steel French Press ($29.99), Non-Stick Cookware Set ($119.99), Memory Foam Throw Pillow Set ($39.99) |

### Test Database (Backend Jest)
- Separate SQLite: `prisma/test.db`
- Seeded per test suite: 1 admin, 1 customer, 3 products
- Helper functions: `getCustomerToken()`, `getAdminToken()`

### E2E Test Accounts
- Tests use seeded customer: `jane@example.com` / `customer123`
- Registration tests create unique emails per run: `e2euser-${Date.now()}@test.com`

> **Warning:** Running `npx prisma db seed` deletes ALL existing data (users, orders, cart items) before recreating seed data. Do not re-run if you want to preserve data created through the UI.

---

## API Endpoints

Base URL: `http://localhost:3001/api`

### Auth

| Method | Endpoint         | Auth  | Request Body                         | Success Response                                |
|--------|-----------------|-------|--------------------------------------|-------------------------------------------------|
| POST   | `/auth/register` | No    | `{ name, email, password }`          | `201 { message, user: { id, name, email, role } }` |
| POST   | `/auth/login`    | No    | `{ email, password }`                | `200 { message, user, token }`                  |
| GET    | `/auth/profile`  | Token | —                                    | `200 { id, name, email, role, orderCount, cartCount }` |

### Products

| Method | Endpoint         | Auth  | Request Body / Params                                    | Success Response                                  |
|--------|-----------------|-------|----------------------------------------------------------|---------------------------------------------------|
| GET    | `/products`      | No    | Query: `page`, `limit`, `search`, `category`, `sort`    | `200 { products: [...], pagination: { page, limit, total, totalPages } }` |
| GET    | `/products/:id`  | No    | —                                                        | `200 { id, name, description, price, imageUrl, category, stock }` |
| POST   | `/products`      | Admin | `{ name, description, price, category, stock, imageUrl }` | `201 { message, product }` |
| PUT    | `/products/:id`  | Admin | `{ name?, description?, price?, category?, stock?, imageUrl? }` | `200 { message, product }` |
| DELETE | `/products/:id`  | Admin | —                                                        | `200 { message }` |

### Cart

| Method | Endpoint     | Auth  | Request Body            | Success Response                                  |
|--------|-------------|-------|-------------------------|---------------------------------------------------|
| GET    | `/cart`      | Token | —                       | `200 { items: [{ id, productId, quantity, product, subtotal }], itemCount, total }` |
| POST   | `/cart`      | Token | `{ productId, quantity }` | `201 { message, cartItem }` |
| PUT    | `/cart/:id`  | Token | `{ quantity }`          | `200 { message, cartItem }` |
| DELETE | `/cart/:id`  | Token | —                       | `200 { message }` |
| DELETE | `/cart`      | Token | —                       | `200 { message }` |

### Orders

| Method | Endpoint              | Auth  | Request Body    | Success Response                                  |
|--------|-----------------------|-------|-----------------|-------------------------------------------------|
| POST   | `/orders`             | Token | —               | `201 { message, order: { id, totalAmount, status, items } }` |
| GET    | `/orders`             | Token | —               | `200 { orders: [{ id, totalAmount, status, createdAt, items }] }` |
| GET    | `/orders/:id`         | Token | —               | `200 { id, totalAmount, status, createdAt, items }` |
| PUT    | `/orders/:id/status`  | Admin | `{ status }`    | `200 { message, order }` |

**Status values:** `pending`, `confirmed`, `shipped`, `delivered` (forward-only transitions)

### Admin

| Method | Endpoint         | Auth  | Query Params        | Success Response                                  |
|--------|-----------------|-------|---------------------|---------------------------------------------------|
| GET    | `/admin/stats`   | Admin | —                   | `200 { totalProducts, totalOrders, totalRevenue, totalCustomers }` |
| GET    | `/admin/orders`  | Admin | `page`, `limit`     | `200 { orders: [{ id, totalAmount, status, createdAt, user, items }], pagination }` |

### Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Common Error Responses

| Status | Meaning         | Response Body                              |
|--------|-----------------|--------------------------------------------|
| 400    | Validation      | `{ errors: [{ msg, param, location }] }`  |
| 401    | Unauthorized    | `{ error: "Access denied. No token." }`    |
| 403    | Forbidden       | `{ error: "Admin access required." }`      |
| 404    | Not Found       | `{ error: "Product not found." }`          |
| 409    | Conflict        | `{ error: "Email already registered." }`   |
| 500    | Server Error    | `{ error: "Internal server error." }`      |
