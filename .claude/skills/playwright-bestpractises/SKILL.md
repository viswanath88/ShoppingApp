---
name: PlaywrightBestPractises
description: Playwright E2E test best practices, patterns, and conventions for the ShopEasy application. Reference this skill when writing, reviewing, or debugging Playwright tests.
user-invocation: false
---

# Playwright Best Practices — ShopEasy

Base URL: `http://localhost:5173/`

---

## 1. Project Setup

### Config Reference
- **Config file:** `frontend/playwright.config.ts`
- **Test directory:** `frontend/tests/`
- **Run command:** `npm run test:e2e` (from root or `cd frontend && npx playwright test`)
- **Base URL:** `http://localhost:5173/`
- **Backend URL:** `http://localhost:3001/api`
- **Servers auto-start** via Playwright config — no manual setup needed

### Execution Model
```
fullyParallel: false   ← Tests run sequentially (shared SQLite DB)
workers: 1             ← Single worker to avoid state conflicts
retries: 1 (local), 2 (CI)
timeout: 30_000ms      ← Per test
actionTimeout: 10_000ms ← Per action (click, fill, etc.)
```

> **Why sequential?** ShopEasy uses a single SQLite database. Parallel tests cause race conditions on shared state (cart, orders, stock). Always run with 1 worker.

---

## 2. Selector Priority (Most → Least Preferred)

Use selectors in this order. Never use CSS selectors or XPath.

### 1st — `getByRole()` (semantic, accessible)
```typescript
// Buttons
page.getByRole("button", { name: "Create Account" })
page.getByRole("button", { name: /sign in/i })

// Links
page.getByRole("link", { name: "Login here" })
page.getByRole("heading", { name: "Create Account" })
```

### 2nd — `getByLabel()` (form inputs)
```typescript
// Inputs tied to <label htmlFor="...">
page.getByLabel("Full Name")
page.getByLabel("Email Address")
page.getByLabel("Password")
page.getByLabel("Confirm Password")
```

### 3rd — `getByTestId()` (stable, non-semantic elements)
```typescript
// Custom data-testid attributes in the codebase
page.getByTestId("user-name")       // Navbar username display
page.getByTestId("logout-btn")      // Logout button
page.getByTestId("cart-link")       // Cart icon in navbar
page.getByTestId("cart-badge")      // Cart item count badge
page.getByTestId("cart-item")       // Individual cart item row
page.getByTestId("product-card")    // Product card in grid
```

### 4th — `getByText()` (dynamic content, last resort)
```typescript
// Use regex for flexible matching
page.getByText(/account created successfully/i)
page.getByText(/no products found/i)
```

### Never Use
```typescript
// BAD — fragile, breaks on refactors
page.locator(".btn-primary")           // CSS class
page.locator("#submit-btn")            // ID selector
page.locator("div > form > button")    // CSS path
page.locator("//button[@type='submit']") // XPath
```

---

## 3. Test Structure & Organization

### File Naming
```
frontend/tests/
├── auth.spec.ts        ← Registration, login, logout
├── cart.spec.ts         ← Cart CRUD, badge, totals
├── checkout.spec.ts     ← Shipping, payment, confirmation
├── shopping.spec.ts     ← Product browsing, search, filters
├── admin.spec.ts        ← Dashboard, order management
└── navigation.spec.ts   ← Navbar, routing, guards
```

### Test Block Structure
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  // Shared setup — runs before EACH test in this block
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("should do the expected thing", async ({ page }) => {
    // Arrange — navigate to starting point
    await page.goto("/products");

    // Act — perform user action
    await page.getByRole("button", { name: "Add to Cart" }).first().click();

    // Assert — verify outcome
    await expect(page.getByTestId("cart-badge")).toHaveText("1");
  });
});
```

### Describe Blocks — Group by Feature, Not by Page
```typescript
// GOOD — grouped by user goal
test.describe("User Registration", () => { ... });
test.describe("Cart Management", () => { ... });

// BAD — grouped by page
test.describe("RegisterPage", () => { ... });
test.describe("CartPage", () => { ... });
```

---

## 4. Common Helpers

### Authentication
```typescript
async function loginAsCustomer(page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("jane@example.com");
  await page.getByLabel("Password").fill("customer123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("user-name")).toBeVisible();
}

async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("admin@shopapp.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
}
```

### Unique Test Data
```typescript
// Always generate unique emails for registration tests
const timestamp = Date.now();
const uniqueEmail = `e2euser-${timestamp}@test.com`;
```

### Cart Cleanup
```typescript
async function clearCartViaUI(page) {
  await page.goto("/cart");
  const clearButton = page.getByRole("button", { name: /clear cart/i });
  if (await clearButton.isVisible()) {
    await clearButton.click();
  }
}
```

### Add Product to Cart
```typescript
async function addProductToCart(page) {
  await page.goto("/products");
  await page.getByTestId("product-card")
    .first()
    .getByRole("button", { name: /add to cart/i })
    .click();
  await expect(page.getByText(/added to cart/i)).toBeVisible();
}
```

---

## 5. Assertions — Best Practices

### Use Web-First Assertions (Auto-Waiting)
```typescript
// GOOD — auto-waits up to actionTimeout
await expect(page).toHaveURL("/login");
await expect(page.getByText("Success")).toBeVisible();
await expect(page.getByTestId("cart-badge")).toHaveText("3");
await expect(page.getByRole("button")).toBeDisabled();

// BAD — manual waits, flaky
await page.waitForTimeout(2000);  // NEVER use arbitrary sleeps
const text = await page.textContent(".badge");
expect(text).toBe("3");
```

### URL Assertions
```typescript
// Exact match
await expect(page).toHaveURL("http://localhost:5173/login");

// Regex match (preferred — base URL independent)
await expect(page).toHaveURL(/\/login/);
await expect(page).toHaveURL(/\/products\?category=Electronics/);
await expect(page).toHaveURL(/\/order-confirmation\/\d+/);
```

### Negative Assertions
```typescript
// Element should NOT be visible
await expect(page.getByTestId("cart-badge")).not.toBeVisible();

// Element should NOT exist in DOM
await expect(page.getByText("Error")).toHaveCount(0);
```

### Toast / Transient Notifications
```typescript
// Toasts auto-dismiss after ~3s — assert immediately after action
await page.getByRole("button", { name: "Add to Cart" }).click();
await expect(page.getByText(/added to cart/i)).toBeVisible();

// Do NOT add delays — web-first assertions handle timing
```

---

## 6. Navigation & Routing Patterns

### Page Navigation
```typescript
// Direct navigation
await page.goto("/products");
await page.goto("/cart");
await page.goto("/checkout");

// Click-based navigation (tests actual links)
await page.getByRole("link", { name: "Products" }).click();
await expect(page).toHaveURL(/\/products/);
```

### Route Guards — Testing Auth Redirects
```typescript
test("should redirect unauthenticated user to login", async ({ page }) => {
  // No login — go directly to protected route
  await page.goto("/cart");
  await expect(page).toHaveURL(/\/login/);
});

test("should redirect logged-in user away from register", async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto("/register");
  await expect(page).toHaveURL("/");  // Redirected to home
});
```

### Query Parameters
```typescript
// Navigate with filters
await page.goto("/products?category=Electronics&sort=price_asc");

// Or use UI controls
await page.getByRole("combobox", { name: /category/i }).selectOption("Electronics");
await expect(page).toHaveURL(/category=Electronics/);
```

---

## 7. Network Interception

### Simulate Server Errors
```typescript
test("should show error when backend fails", async ({ page }) => {
  // Intercept the API call and return a 500
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) })
  );

  await page.goto("/register");
  // ... fill form and submit ...
  await expect(page.getByText(/error/i)).toBeVisible();
});
```

### Assert Request Was Made
```typescript
test("should send only one request on double-click", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/auth/register", (route) => {
    requestCount++;
    route.continue();
  });

  // ... fill form and double-click submit ...
  expect(requestCount).toBe(1);
});
```

### Delay Response (Test Loading States)
```typescript
test("should show loading spinner during submission", async ({ page }) => {
  await page.route("**/api/auth/register", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay
    route.continue();
  });

  // ... fill form and submit ...
  await expect(page.getByRole("button", { name: /creating account/i })).toBeVisible();
});
```

---

## 8. Test Data Management

### Seeded Accounts (Available in All Tests)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shopapp.com` | `admin123` |
| Customer | `jane@example.com` | `customer123` |

### Rules
- **Never hardcode product IDs** — products may shift between seeds. Select by name or use `.first()`.
- **Generate unique emails** for registration tests to avoid 409 conflicts.
- **Clean up state** in `beforeEach` when tests modify shared data (cart, orders).
- **Do not re-run `npx prisma db seed`** during test runs — it deletes all data.

### Accessing Test Products
```typescript
// GOOD — select by visible text or position
await page.getByText("Wireless Noise-Cancelling Headphones").click();
await page.getByTestId("product-card").first().click();

// BAD — hardcoded ID that may change
await page.goto("/products/1");
```

---

## 9. Waiting & Timing

### Never Use `waitForTimeout()`
```typescript
// BAD — arbitrary sleep, slows tests, still flaky
await page.waitForTimeout(3000);

// GOOD — wait for specific condition
await expect(page.getByText("Order Confirmed")).toBeVisible();
await page.waitForURL(/\/order-confirmation/);
await page.waitForResponse("**/api/orders");
```

### Wait for Navigation After Action
```typescript
// GOOD — action + URL assertion (auto-waits)
await page.getByRole("button", { name: "Pay Now" }).click();
await expect(page).toHaveURL(/\/order-confirmation\/\d+/);

// GOOD — explicit wait when needed for complex flows
await Promise.all([
  page.waitForResponse("**/api/orders"),
  page.getByRole("button", { name: "Pay Now" }).click(),
]);
```

### Wait for Network Idle (Page Load)
```typescript
// After navigation, wait for API calls to settle
await page.goto("/products");
await page.waitForLoadState("networkidle");
```

---

## 10. Debugging Failed Tests

### Screenshots (Auto-Captured on Failure)
```typescript
// Manual screenshot for debugging
await page.screenshot({ path: "debug-screenshot.png", fullPage: true });
```

### Trace Viewer (Auto-Captured on First Retry)
```bash
# Open trace for failed test
npx playwright show-trace test-results/test-name/trace.zip
```

### Headed Mode (Watch Test Run)
```bash
# Run tests in browser window
npx playwright test --headed

# Run a single test file
npx playwright test tests/auth.spec.ts --headed

# Debug mode (step through with Playwright Inspector)
npx playwright test --debug
```

### UI Mode (Interactive)
```bash
npx playwright test --ui
```

---

## 11. Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|---|---|---|
| `page.waitForTimeout(ms)` | Slow, flaky | Use web-first assertions or `waitForURL` |
| `page.locator(".class")` | Fragile, breaks on style changes | Use `getByRole`, `getByLabel`, `getByTestId` |
| `page.$eval()` / `page.evaluate()` | Bypasses Playwright's auto-wait | Use locator-based assertions |
| Shared mutable state between tests | Order-dependent, flaky | Reset state in `beforeEach` |
| `test.only()` left in code | Skips other tests in CI | Remove before committing |
| Hardcoded product/order IDs | Break when seed data changes | Select by name, text, or position |
| `expect(await el.textContent()).toBe(x)` | No auto-wait, race condition | `await expect(el).toHaveText(x)` |
| Testing API contracts via E2E | Slow, use API tests instead | Only E2E for real user journeys |
| Running tests in parallel | SQLite conflicts | Keep `fullyParallel: false`, workers: 1 |

---

## 12. Test Checklist

Before submitting a new E2E test, verify:

- [ ] Uses `getByRole` / `getByLabel` / `getByTestId` — no CSS/XPath selectors
- [ ] Uses web-first assertions (`await expect(...).toBeVisible()`)
- [ ] No `waitForTimeout()` calls
- [ ] No hardcoded IDs or URLs (use regex URL matching)
- [ ] Unique test data where needed (timestamps in emails)
- [ ] State cleanup in `beforeEach` if modifying shared data
- [ ] Test is independent — can run alone or in any order
- [ ] Assertions check both positive outcome AND navigation/URL
- [ ] `test.only()` is not left in the file
- [ ] Runs successfully with `npx playwright test --headed`
