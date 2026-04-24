# Code Review — Playwright E2E Tests

**Reviewer:** Senior QA Code Reviewer Specialist (AI)
**Date:** 2026-03-20
**Scope:** `frontend/tests/` (all 4 spec files)
**Review Against:** DomainSkills, PlaywrightBestPractises, TestStrategy, Generate-tests, CreateScenarios

---

## Executive Summary

The test suite demonstrates solid foundational practices — semantic selectors (`getByRole`, `getByLabel`, `getByTestId`), web-first assertions, and proper test isolation with `beforeEach` hooks. However, there are **critical anti-patterns** including use of fragile CSS locators (`page.locator("select")`, `.animate-spin`), arbitrary `waitForTimeout()` calls, and missing TypeScript types on helper functions. Coverage gaps exist across security, edge case, and UI state testing lenses, and there is significant helper code duplication across files.

---

## Review Statistics

| Metric | Value |
|--------|-------|
| Files Reviewed | 4 |
| Total Tests | 41 |
| Critical Issues | 6 |
| Warnings | 11 |
| Info Suggestions | 8 |
| Positive Highlights | 7 |

---

## File-by-File Review

### 📄 auth.spec.ts

**Overall:** Good structure with clear separation of Registration, Login, and Logout flows. Follows naming conventions well. A few typing and coverage issues.

| # | Line(s) | Severity | Category | Finding | Recommendation |
|---|---------|----------|----------|---------|----------------|
| 1 | L3-9 | 🟢 Positive | Test Data | Uses `Date.now()` for unique email generation — prevents 409 conflicts across test runs | Keep this pattern |
| 2 | L4 | 🟡 Warning | Test Data | `timestamp` is generated at module load time, meaning all tests in the file share the same timestamp. If the file is re-imported or tests run quickly, this is fine, but it's fragile | Move `Date.now()` inside the test that uses it for maximum isolation |
| 3 | L17 | 🟡 Warning | Selector | Uses `getByLabel("Name")` — could match multiple labels. Domain Skills shows the label is "Full Name" per the registration form | Use `page.getByLabel("Full Name")` for exact match per Playwright Best Practices skill |
| 4 | L57 | 🟡 Warning | Selector | Uses `getByLabel("Email")` without `{ exact: true }` — could match "Email Address" partially | Use `page.getByLabel("Email Address")` or add `{ exact: true }` to match the actual label text |
| 5 | L12-27 | 🟢 Positive | Structure | Registration test follows clean Arrange-Act-Assert pattern with clear comments | Keep this pattern |
| 6 | L52-63 | 🟢 Positive | Assertions | Login test asserts both URL redirect (`toHaveURL("/")`) and UI state (`getByTestId("user-name")`) | Excellent — validates both navigation and rendered state |
| 7 | L87-121 | 🟡 Warning | Structure | Logout tests duplicate the full login flow (L89-93, L109-112) instead of using a shared helper | Extract a `loginAsCustomer()` helper like other spec files do. This reduces duplication and maintenance |
| 8 | — | 🔵 Info | Coverage | No test for duplicate email registration (409 conflict response) | Add: register with `jane@example.com` (seeded), expect error message about email already registered |
| 9 | — | 🔵 Info | Coverage | No test for password minimum length validation (6+ chars per business rules) | Add: fill password with "abc", expect validation error |
| 10 | — | 🔵 Info | Coverage | No security test for accessing protected routes without authentication | Partially covered in Logout section (L118), but should be a dedicated test in its own describe block |

---

### 📄 cart.spec.ts

**Overall:** Well-structured with proper helper functions and `beforeEach` setup. Has a critical anti-pattern with `waitForTimeout()` and a fragile CSS locator.

| # | Line(s) | Severity | Category | Finding | Recommendation |
|---|---------|----------|----------|---------|----------------|
| 1 | L1-9 | 🟢 Positive | Structure | `loginAsCustomer()` helper is properly typed with `Page` parameter and reused across tests | Keep this pattern — matches Playwright Best Practices skill |
| 2 | L11-19 | 🟢 Positive | Helpers | `clearCartViaUI()` with `.catch(() => false)` gracefully handles the case where the cart is already empty | Good defensive pattern |
| 3 | L14 | 🟡 Warning | Selector | Uses `page.getByText("Clear Cart")` — should use `getByRole("button", { name: /clear cart/i })` for semantic targeting | Replace with: `page.getByRole("button", { name: /clear cart/i })` |
| 4 | L77-79 | 🔴 Critical | Selector | Uses `cartItem.locator(".animate-spin")` — fragile CSS class selector that breaks if the spinner class name changes | Use a `data-testid` attribute on the loading spinner (e.g., `data-testid="loading-spinner"`) or wait for the quantity text to update instead: `await expect(cartItem.getByText("2")).toBeVisible()` |
| 5 | L115 | 🔴 Critical | Timing | Uses `page.waitForTimeout(500)` — arbitrary sleep that makes tests slow and flaky | Replace with: `await expect(page.getByText(/added to cart/i)).not.toBeVisible()` to wait for the first toast to dismiss, or use a different locator strategy to target the second toast |
| 6 | L128 | 🟡 Warning | Selector | Uses `page.getByText("Clear Cart").click()` — same issue as L14, should use `getByRole` | Replace with: `page.getByRole("button", { name: /clear cart/i }).click()` |
| 7 | L70-83 | 🟡 Warning | Assertions | Quantity update test (L63) doesn't verify the actual quantity changed to 2. Only checks that "Grand Total" is visible | Add assertion: `await expect(cartItem).toContainText("2")` or verify the quantity input value changed |
| 8 | L37-45 | 🟡 Warning | Flakiness | This test was identified as **flaky** in the last run (passed on retry). The "Start Shopping" link assertion at L43-44 timed out | Increase the specific timeout: `await expect(page.getByRole("link", { name: "Start Shopping" })).toBeVisible({ timeout: 10000 })` or investigate if `clearCartViaUI` needs a navigation wait after clearing |
| 9 | — | 🔵 Info | Coverage | No test for quantity boundary — trying to add more than available stock | Add: attempt to increment quantity beyond stock limit, verify error or max cap |
| 10 | — | 🔵 Info | Coverage | No test for cart persistence — items should survive page refresh | Add: add item, refresh page, verify item still in cart |

---

### 📄 checkout.spec.ts

**Overall:** Comprehensive checkout flow coverage with good use of `beforeEach` for cart setup. Helper duplication is the main concern.

| # | Line(s) | Severity | Category | Finding | Recommendation |
|---|---------|----------|----------|---------|----------------|
| 1 | L1-28 | 🔴 Critical | Maintainability | `loginAsCustomer()`, `clearCartViaUI()`, and `addProductToCart()` are **duplicated verbatim** across `cart.spec.ts` and `checkout.spec.ts` | Extract shared helpers to a `frontend/tests/helpers.ts` file and import them. This is the #1 maintainability issue across the test suite |
| 2 | L30-35 | 🟢 Positive | Structure | `beforeEach` properly sets up a clean state (login → clear cart → add product) for every checkout test | Excellent — ensures test independence |
| 3 | L39 | 🟡 Warning | Selector | Uses `page.getByTestId("checkout-btn")` — verify this `data-testid` actually exists in the component. If it doesn't, the test would fail with a misleading error | Confirmed in `frontend/CLAUDE.md` that `checkout-btn` is a valid testid. Good usage |
| 4 | L121-122 | 🟡 Warning | Timing | Uses `timeout: 15000` for order confirmation URL — 15s is 50% of the 30s test timeout. This suggests the checkout API may be slow | Investigate if the backend order placement can be optimized. If 15s is necessary, consider increasing the test timeout for checkout tests specifically: `test.slow()` |
| 5 | L159-161 | 🟡 Warning | Assertions | Loading state test (L139) doesn't actually verify the loading state — it just clicks Pay Now and waits for redirect. The comment at L157-158 acknowledges the loading "might be brief" | Use `page.route()` to intercept and delay the `/api/orders` response, then assert the loading state: `await expect(payBtn).toContainText(/processing/i)` |
| 6 | L215 | 🔴 Critical | Selector | Uses `firstOrder.locator("text=/pending|confirmed|shipped|delivered/i")` — this is a CSS/text hybrid locator, not a semantic selector | Replace with: `page.getByText(/pending|confirmed|shipped|delivered/i).first()` scoped within the order card |
| 7 | L230 | 🔴 Critical | Selector | Uses `firstOrder.locator("button").first().click()` — fragile positional CSS selector for collapse button | Replace with a semantic selector: `firstOrder.getByRole("button", { name: /collapse|toggle|order #/i }).click()` or add a `data-testid="order-toggle"` to the component |
| 8 | — | 🔵 Info | Coverage | No test for checkout with empty cart — should redirect or show error | Add: navigate to `/checkout` with empty cart, verify redirect to `/cart` or error message |
| 9 | — | 🔵 Info | Coverage | No test for order total calculation — verifying subtotal + 8% tax = grand total | Add: verify displayed grand total matches (item price × quantity × 1.08) |

---

### 📄 shopping.spec.ts

**Overall:** Good breadth of coverage for product browsing. Has the most fragile selectors of all files — multiple uses of `page.locator("select")` and positional selectors.

| # | Line(s) | Severity | Category | Finding | Recommendation |
|---|---------|----------|----------|---------|----------------|
| 1 | L4-10 | 🟢 Positive | Helpers | `loginAsCustomer()` is typed with `Page` and follows the established pattern | Good — consistent with other files |
| 2 | L39 | 🔴 Critical | Selector | Uses `page.locator("select").first().selectOption("Electronics")` — fragile positional CSS selector. If another `<select>` is added to the page, this breaks | Replace with: `page.getByRole("combobox", { name: /category/i }).selectOption("Electronics")` per Playwright Best Practices skill |
| 3 | L49-50 | 🟡 Warning | Assertions | Uses `cards.locator("text=Electronics").count()` with manual `expect(count).toBeGreaterThan(0)` — not a web-first assertion, may have race conditions | Replace with: `await expect(cards.first().getByText("Electronics")).toBeVisible()` |
| 4 | L79 | 🔴 Critical | Selector | Uses `page.locator("select").nth(1).selectOption("price_asc")` — fragile positional index selector | Replace with: `page.getByRole("combobox", { name: /sort/i }).selectOption("price_asc")` |
| 5 | L101 | 🟡 Warning | Selector | Uses `firstCard.locator("h3").textContent()` — bypasses Playwright's auto-wait by extracting text content directly | Use `firstCard.getByRole("heading").textContent()` for semantic targeting, or better yet, use `firstCard.getByRole("link").first()` to click the product link |
| 6 | L102 | 🟡 Warning | Selector | Uses `firstCard.locator("h3").click()` — repeated across L102, L113, L134, L147, L159. Fragile HTML tag selector | Replace all instances with: `firstCard.getByRole("heading").click()` or add a `data-testid="product-link"` |
| 7 | L113, L134, L147, L159 | 🟡 Warning | Maintainability | Product detail navigation pattern is duplicated in 4+ tests | Extract helper: `async function navigateToFirstProductDetail(page: Page)` |
| 8 | L75-84 | 🔵 Info | Assertions | Sort test only verifies that products reload after sorting — doesn't verify actual sort order | Add assertion to compare first product price with second product price to verify ascending order |
| 9 | L192-202 | 🟢 Positive | Coverage | Tests "Add to Cart" from both the products page and the home page — good coverage of the same action from different entry points | Keep this pattern |
| 10 | — | 🔵 Info | Coverage | No test for pagination — navigating between product pages | Add: verify pagination controls, navigate to page 2, verify different products shown |
| 11 | — | 🔵 Info | Coverage | No test for product detail page when product is out of stock | Add: navigate to out-of-stock product, verify "Out of Stock" badge and disabled "Add to Cart" button |

---

## Coverage Analysis

### Covered Scenarios by Test Lens

| Feature | Happy Path | Business Rules | Security | Negative/Error | Edge Cases | UI State |
|---------|-----------|---------------|----------|---------------|------------|----------|
| Auth - Registration | ✅ | ⚠️ Partial (no password length) | ❌ No duplicate email | ✅ Validation, mismatch | ❌ | ❌ |
| Auth - Login | ✅ | ✅ | ❌ | ✅ Invalid creds, empty | ❌ | ❌ |
| Auth - Logout | ✅ | ✅ | ⚠️ Partial (protected route) | ❌ | ❌ | ❌ |
| Cart | ✅ | ⚠️ (no stock limit) | ❌ | ✅ Empty, remove | ❌ No boundary | ⚠️ Badge only |
| Checkout | ✅ | ⚠️ (no tax verify) | ❌ | ✅ Form validation | ❌ | ⚠️ Loading incomplete |
| Order History | ✅ | ⚠️ (no status filter) | ❌ | ❌ | ❌ | ✅ Expand/collapse |
| Product Browsing | ✅ | ⚠️ (no sort verify) | ❌ | ✅ Empty results | ❌ No pagination | ❌ |
| Product Detail | ✅ | ❌ | ❌ | ❌ | ❌ Out of stock | ⚠️ Auth prompt |

### Missing Critical Scenarios

1. **Security — Route Protection:** No dedicated tests for unauthenticated access to `/checkout`, `/orders`, `/admin`
2. **Security — Admin Access:** No tests for admin dashboard (`admin.spec.ts` is missing entirely)
3. **Business Rules — Stock Validation:** No test for adding items beyond available stock
4. **Business Rules — Tax Calculation:** No test verifying the 8% tax rate is applied correctly
5. **Business Rules — Order Status:** No E2E test for order status progression (admin updating order status)
6. **Edge Cases — Cart Persistence:** No test for cart surviving page refresh or browser back/forward
7. **Edge Cases — Pagination:** No test for product pagination (default 10 per page, navigation between pages)
8. **Edge Cases — Concurrent Actions:** No test for rapid add-to-cart clicks (double-click protection)
9. **UI State — Loading Skeletons:** No test for product loading skeleton states
10. **UI State — Responsive Layout:** No test for mobile/tablet viewport behavior
11. **Negative — Server Errors:** No test using `page.route()` to simulate 500 errors and verify error UI
12. **Negative — Network Offline:** No test for behavior when backend is unreachable

---

## Top Recommendations (Priority Order)

1. **🔴 Extract Shared Helpers:** Create `frontend/tests/helpers.ts` with `loginAsCustomer()`, `loginAsAdmin()`, `clearCartViaUI()`, `addProductToCart()`, and `navigateToFirstProductDetail()`. Import in all spec files. Currently 3 files duplicate these functions verbatim.

2. **🔴 Replace CSS/Positional Selectors:** Fix all `page.locator("select")`, `locator("h3")`, `locator(".animate-spin")`, and `locator("button").first()` calls with semantic selectors (`getByRole`, `getByLabel`, `getByTestId`). There are **6 critical selector violations** across the suite.

3. **🔴 Remove `waitForTimeout()`:** Replace `page.waitForTimeout(500)` in `cart.spec.ts:115` with a proper web-first assertion. This is the only explicit sleep in the codebase but sets a bad precedent.

4. **🟡 Add Admin Tests:** Create `frontend/tests/admin.spec.ts` covering dashboard stats, order management, and status updates. This is the largest feature with zero E2E coverage.

5. **🟡 Strengthen Assertions:** Several tests assert only that elements are "visible" without checking actual values (e.g., quantity update test doesn't verify the quantity changed, sort test doesn't verify sort order, checkout doesn't verify tax calculation).

6. **🟡 Fix Flaky Cart Test:** Investigate why `cart.spec.ts:37` ("should show empty cart state") is flaky. The "Start Shopping" link may need a longer wait or `clearCartViaUI` may need a `page.waitForLoadState("networkidle")` after clearing.

7. **🔵 Add Coverage for Security & Edge Cases:** The test suite heavily favors happy path and negative/error testing but has zero coverage for security scenarios (XSS in search, auth bypass) and minimal edge case testing (boundaries, pagination, concurrent actions).

---

## Positive Patterns to Maintain

1. **Semantic Selectors (majority):** Most tests correctly use `getByRole()`, `getByLabel()`, and `getByTestId()` — the few exceptions are noted above
2. **Web-First Assertions:** Consistent use of `await expect(locator).toBeVisible()`, `toHaveURL()`, `toHaveText()` — no `page.$eval()` or raw DOM queries
3. **Test Independence:** Proper use of `beforeEach` with login + cart cleanup ensures tests don't depend on each other's state
4. **Unique Test Data:** Registration tests use `Date.now()` for unique emails, preventing cross-run conflicts
5. **Descriptive Test Names:** All tests follow the `"should [expected behavior]"` naming convention
6. **URL Assertions with Regex:** Consistent use of `toHaveURL(/\/path/)` for flexible URL matching
7. **Toast Assertions:** Toasts are asserted immediately after triggering actions, following the Playwright Best Practices skill recommendation

---

## Quality Rating: ⭐⭐⭐ (3/5)

**Good foundation, needs polish.** The core patterns are correct and the happy path coverage is solid. The main gaps are fragile selectors (6 critical), helper duplication, missing admin/security/edge-case coverage, and one anti-pattern (`waitForTimeout`). Addressing the top 3 recommendations would bring this to a 4/5 rating.
