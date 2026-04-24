# ShopEasy

A full-stack e-commerce application built with React, Node.js, Express, and Prisma. Features product browsing, shopping cart, checkout, order management, and an admin dashboard.

<!-- Screenshots -->
<!-- ![Home Page](screenshots/home.png) -->
<!-- ![Products](screenshots/products.png) -->
<!-- ![Cart](screenshots/cart.png) -->
<!-- ![Admin Dashboard](screenshots/admin.png) -->

## Tech Stack

| Layer     | Technology                                      |
|-----------|------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS        |
| Backend   | Node.js, Express, TypeScript                    |
| Database  | SQLite with Prisma ORM                          |
| Auth      | JWT (JSON Web Tokens) + bcrypt                  |
| Testing   | Jest + Supertest (backend), Playwright (E2E)    |

## Installation

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone <repository-url>
cd ShoppingApp
```

### 2. Install all dependencies

```bash
npm run install:all
```

Or install individually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set up environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:

```env
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET="change-this-to-a-secure-random-string"
JWT_EXPIRES_IN="7d"
```

### 4. Set up the database

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 5. Start both servers

From the project root:

```bash
npm run dev
```

This starts:
- **Backend** at http://localhost:3001
- **Frontend** at http://localhost:5173

## Default Login Credentials

| Role     | Email               | Password     |
|----------|---------------------|-------------|
| Admin    | admin@shopapp.com   | admin123    |
| Customer | jane@example.com    | customer123 |

## Running Tests

### Backend tests (Jest + Supertest)

```bash
cd backend
npx jest               # run all tests
npx jest --coverage    # with coverage report
npx jest tests/auth.test.ts   # single file
```

### E2E tests (Playwright)

```bash
cd frontend
npx playwright test                     # headless
npx playwright test --headed --workers=1  # headed (must use 1 worker)
npx playwright test tests/auth.spec.ts  # single file
```

> **Note:** E2E tests auto-start both backend and frontend servers. Use `--workers=1` in headed mode because tests share user state.

## API Documentation

Base URL: `http://localhost:3001/api`

### Authentication

| Method | Endpoint         | Auth | Description          | Body                                         |
|--------|-----------------|------|----------------------|----------------------------------------------|
| POST   | `/auth/register` | No   | Register new user    | `{ name, email, password }`                  |
| POST   | `/auth/login`    | No   | Login                | `{ email, password }`                        |
| GET    | `/auth/profile`  | Yes  | Get current profile  | —                                            |

**Login Response:**
```json
{
  "message": "Login successful",
  "user": { "id": 1, "name": "Jane Smith", "email": "jane@example.com", "role": "customer" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Products

| Method | Endpoint        | Auth  | Description                        |
|--------|----------------|-------|------------------------------------|
| GET    | `/products`     | No    | List products (paginated)          |
| GET    | `/products/:id` | No    | Get single product                 |
| POST   | `/products`     | Admin | Create product                     |
| PUT    | `/products/:id` | Admin | Update product                     |
| DELETE | `/products/:id` | Admin | Delete product                     |

**Query Parameters for `GET /products`:**

| Param    | Type   | Description                                              |
|----------|--------|----------------------------------------------------------|
| page     | number | Page number (default: 1)                                 |
| limit    | number | Items per page (default: 10, max: 100)                   |
| search   | string | Search by product name                                   |
| category | string | Filter by category (Electronics, Clothing, Books, Home & Kitchen) |
| sort     | string | `price_asc`, `price_desc`, `name_asc`, `name_desc`      |

### Cart

All cart endpoints require authentication via `Authorization: Bearer <token>` header.

| Method | Endpoint     | Description                  | Body                      |
|--------|-------------|------------------------------|---------------------------|
| GET    | `/cart`      | Get current user's cart      | —                         |
| POST   | `/cart`      | Add item to cart             | `{ productId, quantity }` |
| PUT    | `/cart/:id`  | Update cart item quantity    | `{ quantity }`            |
| DELETE | `/cart/:id`  | Remove item from cart        | —                         |
| DELETE | `/cart`      | Clear entire cart            | —                         |

### Orders

All order endpoints require authentication.

| Method | Endpoint              | Auth  | Description              | Body          |
|--------|-----------------------|-------|--------------------------|---------------|
| POST   | `/orders`             | Yes   | Place order from cart    | —             |
| GET    | `/orders`             | Yes   | Get user's order history | —             |
| GET    | `/orders/:id`         | Yes   | Get specific order       | —             |
| PUT    | `/orders/:id/status`  | Admin | Update order status      | `{ status }`  |

**Status values:** `pending` → `confirmed` → `shipped` → `delivered` (forward-only)

### Admin

All admin endpoints require admin authentication.

| Method | Endpoint         | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/admin/stats`   | Dashboard stats (products, orders, revenue, customers) |
| GET    | `/admin/orders`  | All orders with customer info (paginated) |

## Database Schema

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    User      │     │   Product    │     │   Order     │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id       PK │     │ id        PK │     │ id       PK │
│ name        │     │ name         │     │ userId   FK │──┐
│ email    UQ │     │ description  │     │ totalAmount │  │
│ password    │     │ price        │     │ status      │  │
│ role        │     │ imageUrl     │     │ createdAt   │  │
│ createdAt   │     │ category     │     └──────┬──────┘  │
└──────┬──────┘     │ stock        │            │         │
       │            │ createdAt    │            │         │
       │            └──────┬───────┘     ┌──────┴──────┐  │
       │                   │             │  OrderItem  │  │
       │            ┌──────┴───────┐     ├─────────────┤  │
       │            │  CartItem    │     │ id       PK │  │
       │            ├──────────────┤     │ orderId  FK │──┘
       └───────────►│ id        PK │     │ productId FK│──►Product
                    │ userId    FK │     │ quantity    │
                    │ productId FK │──►  │ price       │
                    │ quantity     │     └─────────────┘
                    └──────────────┘
                    UQ(userId, productId)
```

**Relationships:**
- User → Orders (one-to-many)
- User → CartItems (one-to-many)
- Order → OrderItems (one-to-many)
- Product → CartItems (one-to-many)
- Product → OrderItems (one-to-many)
- CartItem has unique constraint on (userId, productId)

## Folder Structure

```
ShoppingApp/
├── package.json              # Monorepo scripts (dev, build, test)
├── README.md
│
├── backend/
│   ├── .env                  # Environment variables
│   ├── .env.example          # Template
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Seed data (users + 15 products)
│   │   └── dev.db            # SQLite database
│   ├── src/
│   │   ├── index.ts          # Server entry point (port 3001)
│   │   ├── app.ts            # Express app (CORS, routes)
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── controllers/      # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── productController.ts
│   │   │   ├── cartController.ts
│   │   │   ├── orderController.ts
│   │   │   └── adminController.ts
│   │   ├── routes/           # Express routers
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts       # JWT authentication + admin authorization
│   │   │   └── validate.ts   # Express-validator error handler
│   │   └── utils/
│   │       └── jwt.ts        # Token generation + verification
│   └── tests/                # Jest + Supertest integration tests
│       ├── auth.test.ts
│       ├── products.test.ts
│       ├── cart.test.ts
│       ├── orders.test.ts
│       ├── edge-cases.test.ts
│       ├── setup.ts          # Test DB reset + seed
│       ├── helpers.ts        # Auth token helpers
│       └── env.ts            # Test environment variables
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts        # Vite + API proxy config
    ├── playwright.config.ts  # E2E test config
    ├── index.html
    ├── src/
    │   ├── main.tsx          # React entry (providers)
    │   ├── App.tsx           # Router + route definitions
    │   ├── api.ts            # Axios instance + interceptors
    │   ├── types.ts          # TypeScript interfaces
    │   ├── index.css         # Tailwind CSS
    │   ├── components/
    │   │   ├── Navbar.tsx    # Navigation bar + mobile hamburger
    │   │   ├── Footer.tsx
    │   │   ├── Toast.tsx     # Toast notification system
    │   │   ├── ProductImage.tsx  # Image with loading/error states
    │   │   └── ProductSkeleton.tsx
    │   ├── context/
    │   │   ├── AuthContext.tsx    # User auth state
    │   │   └── CartContext.tsx    # Cart state
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── ProductList.tsx
    │   │   ├── ProductDetail.tsx
    │   │   ├── CartPage.tsx
    │   │   ├── CheckoutPage.tsx
    │   │   ├── OrderConfirmationPage.tsx
    │   │   ├── OrdersPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── AdminDashboard.tsx
    │   └── services/         # API service layer
    │       ├── authService.ts
    │       ├── productService.ts
    │       ├── cartService.ts
    │       ├── orderService.ts
    │       └── adminService.ts
    └── tests/                # Playwright E2E tests
        ├── auth.spec.ts
        ├── shopping.spec.ts
        ├── cart.spec.ts
        └── checkout.spec.ts
```

## License

MIT
