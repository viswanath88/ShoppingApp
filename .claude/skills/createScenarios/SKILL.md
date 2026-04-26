---
name: CreateScenarios
description: Senior Functional Test Designer agent that generates comprehensive test scenarios across Happy Path, Business Rules, Security, Negative/Error, Edge Cases, and UI State lenses for the ShopEasy e-commerce application.
disable-model-invocation: true
---

# CreateScenarios — Agent Skill

## Role

You are a **Senior Functional Test Designer** with deep e-commerce domain expertise. You think like a real end-user, a malicious actor, and an edge-case hunter simultaneously. Your goal is to produce comprehensive, actionable test scenarios that leave no gap in coverage.

## Knowledge Sources

Before generating scenarios, pull context from:

1. **Frontend** (`frontend/CLAUDE.md`, `frontend/src/`) — Routes, components, contexts, form validations, UI states, toast messages, data-testid attributes
2. **Backend** (`backend/CLAUDE.md`, `backend/src/`) — API endpoints, controllers, middleware, validators, Prisma schema, business logic, error responses
3. **Domain Skills** (`.claude/skills/Domainskills/SKILL.md`) — Data models, business rules, user flows, test data, API contracts

## Test Lenses

Every feature MUST be tested through all 6 lenses:

| Lens | Focus | Think Like... |
|------|-------|---------------|
| **Happy Path** | Core user journeys work end-to-end | A satisfied customer completing their goal |
| **Business Rules** | Domain logic is correctly enforced | A product owner verifying requirements |
| **Security** | Auth, authorization, injection, data leakage | A penetration tester probing for weaknesses |
| **Negative/Error** | Invalid inputs, API failures, missing data | A confused user making mistakes |
| **Edge Cases** | Boundaries, race conditions, extremes | A developer thinking about what could break |
| **UI State** | Loading, empty, error, disabled, responsive states | A UX designer reviewing every screen state |

## Output Format

For each feature area, generate scenarios in this structured format:

```
## [Feature Area Name]

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | [Short name] | [Precondition] | [Action] | [Expected result] | P0/P1/P2 |
```

**Priority Definitions:**
- **P0** — Blocks release. Core flow broken = users cannot complete primary tasks.
- **P1** — High impact. Important functionality degraded but workaround exists.
- **P2** — Low impact. Cosmetic, minor UX, or unlikely edge case.

## File Output

After generating scenarios, **always save them to the `TestCases/` folder** in the project root:

- Create the `TestCases/` directory if it does not already exist.
- Save each feature area as a separate Markdown file named after the feature: `TestCases/<FeatureArea>.md` (e.g., `TestCases/UserRegistration.md`, `TestCases/ShoppingCart.md`).
- If generating all scenarios at once, also create a `TestCases/AllScenarios.md` file containing the full combined output with the summary table.
- File names should use **PascalCase** with no spaces (e.g., `ProductBrowsing.md`, `AdminDashboard.md`, `OrderHistory.md`).

---

## Feature Areas & Scenarios

---

## 1. User Registration

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Successful registration | User is on `/register` page | Fill valid name, email, password (6+ chars), confirm password and click "Create Account" | Redirect to `/login` with "Account created successfully" message | P0 |
| HP-02 | Navigate to login from register | User is on `/register` | Click "Login here" link | Navigate to `/login` page | P2 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Name minimum length | User is on `/register` | Enter name with 1 character | Validation error "Name must be at least 2 characters" | P1 |
| BR-02 | Password minimum length | User is on `/register` | Enter password with 5 characters | Validation error "Password must be at least 6 characters" | P1 |
| BR-03 | Password strength indicator | User is on `/register` | Type password of varying lengths | Weak (<6), Good (6-9), Strong (10+) indicator shown | P2 |
| BR-04 | Passwords match confirmation | User is on `/register` | Enter matching password and confirm password | Green "Passwords match" indicator shown | P2 |
| BR-05 | Registration does not auto-login | User completes registration | Form submitted successfully | User is redirected to `/login` (NOT auto-logged in), must login manually | P1 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Duplicate email rejection | User "jane@example.com" already exists | Register with same email | Error "Email already registered" (409) | P0 |
| SEC-02 | Password not returned in response | User registers successfully | Check API response body | Response contains user object WITHOUT password field | P1 |
| SEC-03 | SQL injection in email field | User is on `/register` | Enter `'; DROP TABLE User;--` as email | Validation error for invalid email format, no DB damage | P1 |
| SEC-04 | XSS in name field | User is on `/register` | Enter `<script>alert('xss')</script>` as name | Name stored/displayed as plain text, no script execution | P1 |
| SEC-05 | Guest-only route guard | User is already logged in | Navigate to `/register` | Redirect to `/` (home page) | P1 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Empty form submission | User is on `/register` | Click "Create Account" without filling any fields | Validation error "Name is required" shown | P0 |
| NEG-02 | Invalid email format | User is on `/register` | Enter "not-an-email" in email field | Validation error "Please enter a valid email address" | P1 |
| NEG-03 | Passwords don't match | User is on `/register` | Enter different password and confirm password | Validation error "Passwords do not match" | P0 |
| NEG-04 | Missing confirm password | User fills name, email, password | Leave confirm password empty and submit | Validation error "Please confirm your password" | P1 |
| NEG-05 | Server error during registration | Backend is down | Submit valid registration form | Error toast displayed, user stays on register page | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Very long name (100 chars) | User is on `/register` | Enter name at max length boundary | Registration succeeds | P2 |
| EC-02 | Email with special characters | User is on `/register` | Enter `user+tag@example.com` | Registration succeeds | P2 |
| EC-03 | Double submit prevention | User is on `/register` | Click "Create Account" rapidly twice | Only one request sent (button shows loading/disabled state) | P1 |
| EC-04 | Password exactly 6 characters | User is on `/register` | Enter password with exactly 6 characters | Registration succeeds (boundary met) | P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Loading state during submission | User submits valid registration | Form is processing | Button shows spinner + "Creating account..." text, inputs remain | P1 |
| UI-02 | Validation errors clear on edit | Validation errors are displayed | User starts editing the errored field | Error message for that field disappears | P2 |
| UI-03 | Server error banner | Backend returns an error | Registration fails | Red error banner shown at top of form | P1 |
| UI-04 | Mobile responsive layout | User is on mobile viewport | View register page | Form fills full width, all fields stacked vertically | P2 |

---

## 2. User Login

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Successful login as customer | User is on `/login` | Enter "jane@example.com" / "customer123" and click "Sign In" | Redirect to `/`, username visible in navbar, cart badge loads | P0 |
| HP-02 | Successful login as admin | User is on `/login` | Enter "admin@shopapp.com" / "admin123" and click "Sign In" | Redirect to `/`, "Admin" badge visible in navbar | P0 |
| HP-03 | Success message from registration | User just registered | Redirected to `/login` | Green "Account created successfully" message visible | P1 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | JWT stored in localStorage | User logs in successfully | Check browser storage | Token stored under "token" key in localStorage | P0 |
| BR-02 | Profile auto-fetched after login | User logs in | AuthContext initializes | `GET /api/auth/profile` called, user state populated | P1 |
| BR-03 | Cart auto-fetched after login | User logs in | CartContext reacts to auth change | `GET /api/cart` called, cart state populated with badge count | P1 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Invalid password | User is on `/login` | Enter correct email but wrong password | Error "Invalid credentials" shown, stays on `/login` | P0 |
| SEC-02 | Non-existent email | User is on `/login` | Enter email that doesn't exist | Error "Invalid credentials" (no distinction from wrong password) | P0 |
| SEC-03 | Guest-only route guard | User is already logged in | Navigate to `/login` | Redirect to `/` | P1 |
| SEC-04 | Brute force (no rate limit) | Attacker sends many login requests | Repeatedly submit wrong passwords | Requests processed (note: no rate limiting currently implemented) | P2 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Empty email submission | User is on `/login` | Click "Sign In" without entering email | Validation error "Email is required" | P0 |
| NEG-02 | Empty password submission | User enters email only | Click "Sign In" without password | Validation error "Password is required" | P0 |
| NEG-03 | Invalid email format | User is on `/login` | Enter "not-an-email" | Validation error for email format | P1 |
| NEG-04 | Backend unreachable | Network is down | Submit login form | Error message displayed, user stays on login page | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Email with leading/trailing spaces | User is on `/login` | Enter " jane@example.com " with spaces | Login succeeds (email trimmed) | P2 |
| EC-02 | Double click on Sign In | User fills valid credentials | Click "Sign In" rapidly | Only one request sent, button disabled during processing | P1 |
| EC-03 | Token expiry (7 days) | User logged in 7+ days ago | Make any API request | 401 response → auto-logout → redirect to `/login` | P1 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Loading state | User submits login form | Form is processing | Button shows spinner + "Logging in..." text | P1 |
| UI-02 | Demo credentials visible | User is on `/login` | View page | Demo accounts section shows admin and customer credentials | P2 |
| UI-03 | Input error styling | Field has validation error | View input | Red border on input, red error text below | P2 |

---

## 3. Logout

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Successful logout | User is logged in | Click "Logout" button in navbar | Redirect to `/`, "Login" link appears, username disappears | P0 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Token cleared from storage | User logs out | Check localStorage | "token" key removed | P0 |
| BR-02 | Cart state cleared | User logs out | Check CartContext | Cart is null, badge disappears | P1 |
| BR-03 | User state cleared | User logs out | Check AuthContext | user is null, isAuthenticated is false | P0 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Protected route after logout | User logs out | Navigate to `/cart` | Redirect to `/login` | P0 |
| SEC-02 | Admin route after logout | Admin user logs out | Navigate to `/admin` | Redirect to `/login` | P0 |
| SEC-03 | Back button after logout | User logs out | Press browser back button to cached protected page | Redirect to `/login` (not cached page with stale data) | P1 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Navbar updates after logout | User logs out | View navbar | Shows "Login" and "Register" links instead of user name | P0 |
| UI-02 | Mobile menu logout | User is on mobile, menu open | Click "Logout" | Menu closes, redirect to home, login links visible | P2 |

---

## 4. Product Browsing

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Home page featured products | User visits `/` | Page loads | Hero banner, "Shop by Category" cards, and 6 featured products visible | P0 |
| HP-02 | Products listing page | User visits `/products` | Page loads | Grid of product cards with image, name, price, category, stock, "Add to Cart" | P0 |
| HP-03 | Filter by category | User is on `/products` | Select "Electronics" from category dropdown | URL updates to `?category=Electronics`, only electronics shown | P0 |
| HP-04 | Search by name | User is on `/products` | Type "Headphones" in search and press Enter | URL updates to `?search=Headphones`, matching products shown | P0 |
| HP-05 | Sort by price ascending | User is on `/products` | Select "Price: Low to High" from sort dropdown | Products reordered, URL updates to `?sort=price_asc` | P1 |
| HP-06 | Navigate to product detail | User is on `/products` | Click on product name/image | Navigate to `/products/:id`, full product details shown | P0 |
| HP-07 | Pagination | More than 8 products exist | View products page | Pagination controls visible, clicking page 2 loads next batch | P1 |
| HP-08 | Clear filters | Filters are active | Click "Clear filters" | URL becomes `/products`, all products shown | P1 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Category cards link to filtered view | User is on home page | Click "Electronics" category card | Navigate to `/products?category=Electronics` | P1 |
| BR-02 | Product count displayed | Products loaded | View page header | Shows "X products found" with active filter context | P2 |
| BR-03 | In stock vs out of stock | Product has stock=0 | View product card | Shows "Out of stock" in red, no "Add to Cart" button | P1 |
| BR-04 | Low stock warning | Product has stock ≤ 5 | View cart with this item | Shows "Only X left in stock" warning | P2 |
| BR-05 | Pagination limit capped at 100 | API called with limit=200 | Backend processes request | Returns max 100 products per page | P2 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Unauthenticated user sees login prompt | User is NOT logged in | View product detail page | Shows "Login to Add to Cart" link instead of cart controls | P0 |
| SEC-02 | Products visible without auth | No token in request | `GET /api/products` | Products returned (public endpoint) | P0 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | No matching search results | User is on `/products` | Search for "xyznonexistent12345" | "No products found" empty state with "Clear all filters" link | P1 |
| NEG-02 | Product not found (invalid ID) | User navigates to `/products/99999` | Page loads | "Product not found." error with "Back to products" link | P1 |
| NEG-03 | API failure on products load | Backend is down | Visit `/products` | Error state with "Something went wrong" and "Try Again" button | P1 |
| NEG-04 | Non-numeric product ID | User navigates to `/products/abc` | Page loads | Error state shown gracefully | P2 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Combined filters | User applies search + category + sort | View results | All filters applied simultaneously, URL has all params | P1 |
| EC-02 | Empty category filter | No products in "Home & Kitchen" after filtering | View results | "No products found" state | P2 |
| EC-03 | Page beyond total pages | User navigates to `?page=999` | View results | Empty results or redirected to page 1 | P2 |
| EC-04 | Product name very long | Product name is 200+ characters | View product card | Name truncated with ellipsis (`line-clamp-1`) | P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Loading skeleton | Products API is fetching | View products page | Skeleton cards (animated pulse placeholders) visible | P1 |
| UI-02 | Product image loading | Image URL is slow | View product card | Skeleton placeholder shown, image fades in when loaded | P1 |
| UI-03 | Product image broken | Image URL returns 404 | View product card | Fallback "no image" icon placeholder shown | P1 |
| UI-04 | Hover effect on cards | User hovers over product card | Mouse enters card | Shadow increases, image scales up slightly | P2 |
| UI-05 | Add to cart spinner | User clicks "Add to Cart" on product card | Button is processing | Spinner icon replaces button text | P1 |
| UI-06 | Responsive grid | User views on mobile | Check layout | 1 column on mobile, 2 on tablet, 4 on desktop | P2 |
| UI-07 | Breadcrumb on detail page | User is on product detail | View breadcrumb | Shows "Home > Products > [Product Name]" | P2 |

---

## 5. Shopping Cart

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Add product from listing | User is logged in, on `/products` | Click "Add to Cart" on a product | Toast "Product added to cart!", cart badge updates | P0 |
| HP-02 | Add product from detail page | User is on product detail | Select quantity=2, click "Add to Cart" | Toast "2 x [Product] added to cart!", badge updates | P0 |
| HP-03 | View cart | User has items in cart | Navigate to `/cart` | Cart items displayed with image, name, price, quantity controls, subtotal | P0 |
| HP-04 | Increase quantity | Cart has item with qty=1 | Click "+" button | Quantity becomes 2, subtotal and grand total update | P0 |
| HP-05 | Decrease quantity | Cart has item with qty=2 | Click "-" button | Quantity becomes 1, totals update | P0 |
| HP-06 | Remove single item | Cart has 1+ items | Click "Remove" on an item | Item removed, toast "Product removed from cart", totals update | P0 |
| HP-07 | Clear entire cart | Cart has multiple items | Click "Clear Cart" | All items removed, "Your cart is empty" state shown | P1 |
| HP-08 | Continue shopping link | User is on cart page | Click "Continue Shopping" | Navigate to `/products` | P2 |
| HP-09 | Proceed to checkout | Cart has items | Click "Proceed to Checkout" | Navigate to `/checkout` | P0 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Order summary calculations | Cart has items totaling $100 | View summary | Subtotal=$100, Shipping=Free, Tax=$8.00 (8%), Grand Total=$108.00 | P0 |
| BR-02 | Cart badge count | Cart has 3 items | View navbar | Badge shows "3" | P0 |
| BR-03 | Adding same product increments quantity | Product already in cart with qty=1 | Add same product again | Quantity increments to 2 (no duplicate entry) | P1 |
| BR-04 | Quantity cannot exceed stock | Product has stock=5, cart qty=5 | Click "+" button | "+" button is disabled | P0 |
| BR-05 | Quantity cannot go below 1 | Cart item has qty=1 | Click "-" button | "-" button is disabled | P1 |
| BR-06 | Cart badge disappears when empty | Last item removed from cart | Check navbar | Cart badge (count) disappears | P1 |
| BR-07 | Cart persists across pages | User adds item to cart | Navigate to other pages and back to `/cart` | Cart items still present | P1 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Cart requires authentication | User is not logged in | Navigate to `/cart` | Redirect to `/login` | P0 |
| SEC-02 | Cannot access other user's cart | User A is logged in | Call `GET /api/cart` with User A's token | Only User A's cart items returned | P0 |
| SEC-03 | Cannot modify other user's cart item | User A logged in, knows User B's cartItemId | `PUT /api/cart/:id` with User B's item ID | 404 error (item not found for this user) | P1 |
| SEC-04 | Cart cleared on logout | User has items in cart, logs out | Check cart state | Cart is null, no data leakage to next user | P0 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Add out-of-stock product | Product has stock=0 | Attempt to add to cart via API | Error "Insufficient stock" | P0 |
| NEG-02 | Update quantity exceeding stock | Cart item exists, product stock=5 | `PUT /api/cart/:id` with quantity=10 | Error about stock limit | P1 |
| NEG-03 | Add non-existent product | User sends `POST /api/cart` with productId=99999 | API processes request | 404 "Product not found" error | P1 |
| NEG-04 | Remove already-removed item | Item was just removed | Click "Remove" again (race condition) | Graceful handling, no crash | P2 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Add all 15 products | User is logged in | Add all 15 products to cart | Cart shows all 15 items, totals correct | P2 |
| EC-02 | Rapid quantity changes | User clicks "+/-" very quickly | Multiple requests sent | Final quantity is correct, no race condition corruption | P1 |
| EC-03 | Product stock changes while in cart | Product had stock=10 when added, now stock=2, user has qty=5 | User views cart | Behavior depends on backend validation at checkout time | P2 |
| EC-04 | Cart badge overflow | Cart has 100+ items | View navbar badge | Shows "99+" | P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Empty cart state | User has no items in cart | Visit `/cart` | Illustration, "Your cart is empty" heading, "Start Shopping" button | P0 |
| UI-02 | Loading skeleton | Cart API is fetching | Visit `/cart` | Animated skeleton cards for items and summary | P1 |
| UI-03 | Quantity update spinner | User clicks +/- | Request is processing | Spinner replaces quantity number in the display | P1 |
| UI-04 | Remove item opacity | User clicks "Remove" | Item is being deleted | Item fades to 50% opacity during removal | P2 |
| UI-05 | Mobile cart layout | User on mobile viewport | View `/cart` | Items stacked, summary below (not sidebar) | P2 |
| UI-06 | Low stock warning in cart | Product stock ≤ 5 | View cart item | "Only X left in stock" amber text shown | P2 |

---

## 6. Checkout Flow

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Complete checkout end-to-end | Cart has items | Fill shipping → Continue to Payment → Pay Now | Order created, redirect to `/order-confirmation/:id`, success page shown | P0 |
| HP-02 | Fill shipping form | User is on `/checkout` | Enter full name, street address, city, ZIP code | All fields populated, "Continue to Payment" enabled | P0 |
| HP-03 | Continue to payment step | Shipping form is valid | Click "Continue to Payment" | Payment step shown with simulated card UI and shipping summary | P0 |
| HP-04 | Edit shipping from payment step | User is on payment step | Click "Edit" link on shipping summary | Returns to shipping step with fields pre-filled | P1 |
| HP-05 | Order confirmation page | Order placed successfully | View confirmation | Order number, items ordered, totals, "View All Orders" and "Continue Shopping" links | P0 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Order summary on checkout | Cart has items | View checkout sidebar | Shows product images with quantity badges, subtotal, shipping (free), tax (8%), total | P0 |
| BR-02 | Simulated payment card | User reaches payment step | View payment section | Shows demo card with "**** **** **** 4242", "DEMO CARD", "12/28" | P1 |
| BR-03 | Pay button shows total | User on payment step | View "Pay Now" button | Button text shows "Pay Now — $XX.XX" with grand total | P1 |
| BR-04 | Cart cleared after order | Order placed | Navigate to `/cart` | Cart is empty | P0 |
| BR-05 | Stock decremented | Order placed for 2 units | Check product stock via API | Stock reduced by 2 | P0 |
| BR-06 | Order status starts as pending | Order just placed | Check order via API | Status is "pending" | P1 |
| BR-07 | Order price frozen at purchase time | Order placed, then product price changes | View order details | Shows original price, not updated price | P1 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Checkout requires auth | User is not logged in | Navigate to `/checkout` | Redirect to `/login` | P0 |
| SEC-02 | Cannot place order for another user | User A logged in | `POST /api/orders` with User A's token | Order created for User A only | P0 |
| SEC-03 | No real payment processed | User clicks "Pay Now" | Check network requests | No calls to any payment gateway, only `POST /api/orders` | P1 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Empty shipping form submission | User is on checkout | Click "Continue to Payment" without filling form | Validation errors: "Full name is required", "Address is required" | P0 |
| NEG-02 | Invalid ZIP code | User enters "abc" as ZIP | Submit shipping form | Error "Enter a valid ZIP code" (must be 5-6 digits) | P1 |
| NEG-03 | Empty cart checkout | User navigates to `/checkout` with empty cart | Page loads | "Your cart is empty" state with "Browse Products" link | P1 |
| NEG-04 | Stock depleted during checkout | Product goes out of stock between adding to cart and clicking Pay | Click "Pay Now" | Error toast from backend "Insufficient stock", order not placed | P0 |
| NEG-05 | Order placement API failure | Backend error during transaction | Click "Pay Now" | Error toast shown, user stays on payment step, can retry | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | ZIP code at boundary (5 digits) | User enters "12345" | Submit shipping | Passes validation | P2 |
| EC-02 | ZIP code at boundary (6 digits) | User enters "123456" | Submit shipping | Passes validation | P2 |
| EC-03 | Very long address | User enters 500-character address | Submit shipping | Form accepts, no truncation issues | P2 |
| EC-04 | Double click Pay Now | User clicks "Pay Now" twice rapidly | Requests sent | Only one order created (button disabled after first click) | P0 |
| EC-05 | Navigate away during payment | User clicks Pay Now, then navigates away | Check order state | Order may or may not have been created, no partial state | P1 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Step indicator | User is on shipping step | View breadcrumb | "Cart > **Shipping** > Payment" with Shipping bolded | P2 |
| UI-02 | Payment loading state | User clicks "Pay Now" | Button processing | Spinner + "Processing Payment..." text, button disabled | P0 |
| UI-03 | Shipping form error styling | Field has validation error | View input | Red border, error text below | P1 |
| UI-04 | Order confirmation animation | Order placed, confirmation loads | View page | Green checkmark icon, "Order Confirmed!" heading | P2 |
| UI-05 | Checkout page loading skeleton | Cart data is loading | Visit `/checkout` | Skeleton placeholder for form and sidebar | P1 |

---

## 7. Order History

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | View order history | User has placed orders | Navigate to `/orders` | List of orders with order number, date, item count, total, status badge | P0 |
| HP-02 | Expand order details | User is on `/orders` | Click on an order card | Accordion expands showing items, prices, quantities, subtotals | P0 |
| HP-03 | Collapse order details | Order is expanded | Click the order card header again | Accordion collapses, item details hidden | P1 |
| HP-04 | Navigate from confirmation to orders | User just placed an order | Click "View All Orders" on confirmation page | Navigate to `/orders`, new order visible at top | P1 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Status badge colors | Orders with different statuses | View order cards | Pending=amber, Confirmed=blue, Shipped=purple, Delivered=green | P2 |
| BR-02 | Orders sorted by date | User has multiple orders | View `/orders` | Most recent order appears first | P1 |
| BR-03 | Order number formatting | Order has id=1 | View order card | Shows "Order #00001" (zero-padded to 5 digits) | P2 |
| BR-04 | User sees only own orders | User A and User B have orders | User A visits `/orders` | Only User A's orders shown | P0 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Orders require auth | User is not logged in | Navigate to `/orders` | Redirect to `/login` | P0 |
| SEC-02 | Cannot view other user's order by ID | User A logged in, User B has order #5 | `GET /api/orders/5` | 404 error (not owner) | P0 |
| SEC-03 | Admin can view any order | Admin is logged in | `GET /api/orders/:id` for any user's order | Order returned successfully | P1 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Orders API failure | Backend is down | Visit `/orders` | "Failed to load orders" error with "Try again" button | P1 |
| NEG-02 | Invalid order ID on confirmation | User navigates to `/order-confirmation/99999` | Page loads | "Failed to load order details" error with "View all orders" link | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Order with many items | Order has 10+ items | Expand order details | All items listed, scrollable if needed | P2 |
| EC-02 | Product deleted after order | Product referenced in order was deleted | View order details | Product name still shown (captured in OrderItem) | P1 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Empty orders state | User has never ordered | Visit `/orders` | Illustration, "No orders yet" message, "Start Shopping" button | P0 |
| UI-02 | Loading skeleton | Orders API fetching | Visit `/orders` | Skeleton placeholders for order cards | P1 |
| UI-03 | Accordion animation | User clicks order to expand | View transition | Chevron rotates 180°, details appear below | P2 |
| UI-04 | Item link to product | Order expanded | Click product name | Navigate to `/products/:id` | P2 |

---

## 8. Admin Dashboard

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | View dashboard stats | Admin is logged in | Navigate to `/admin` | 4 stat cards: Total Products, Total Orders, Total Revenue, Total Customers | P0 |
| HP-02 | View all orders | Admin is on `/admin` | Scroll to orders table | All orders across all customers shown with customer name, email, items, date, total, status | P0 |
| HP-03 | Update order status | Admin views orders table | Change status dropdown from "pending" to "confirmed" | Status updates, toast "Order #X updated to confirmed" | P0 |
| HP-04 | View product thumbnails in orders | Admin views orders table | Look at Items column | Product thumbnail images shown (up to 3 + overflow count) | P1 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Revenue calculation | Multiple orders exist | View "Total Revenue" card | Sum of all order totalAmount values | P0 |
| BR-02 | Forward-only status update | Order is "shipped" | Try changing to "pending" or "confirmed" | Backend rejects backward transition | P0 |
| BR-03 | Delivered orders locked | Order is "delivered" | View status dropdown | Dropdown is disabled for this order | P1 |
| BR-04 | Customer count excludes admin | 1 admin + 1 customer exist | View "Total Customers" card | Shows "1" (not 2) | P2 |
| BR-05 | Status options available | Order is "pending" | View dropdown | Shows all 4 statuses: Pending, Confirmed, Shipped, Delivered | P1 |

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Admin route requires admin role | Customer user is logged in | Navigate to `/admin` | Redirect to `/` (home) | P0 |
| SEC-02 | Admin route requires auth | User is not logged in | Navigate to `/admin` | Redirect to `/login` | P0 |
| SEC-03 | Admin API requires admin token | Customer token used | `GET /api/admin/stats` | 403 "Admin access required" | P0 |
| SEC-04 | Status update requires admin | Customer sends | `PUT /api/orders/:id/status` | 403 Forbidden | P0 |

### Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Dashboard API failure | Backend error | Visit `/admin` | Toast "Failed to load dashboard data" | P1 |
| NEG-02 | Status update failure | Network error during update | Change status dropdown | Error toast shown, status reverts in UI | P1 |
| NEG-03 | Invalid status value | Attacker sends invalid status via API | `PUT /api/orders/:id/status` with status="cancelled" | 400 validation error | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | No orders exist | Fresh database, no orders placed | Visit `/admin` | Stats show 0 orders, $0.00 revenue, "No orders yet" in table | P2 |
| EC-02 | Many orders (50+) | 50+ orders in database | Visit `/admin` | All orders loaded (paginated), table scrollable | P2 |
| EC-03 | Rapid status changes | Admin changes status on multiple orders quickly | Multiple PUT requests | Each update processed correctly, no race condition | P1 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Dashboard loading skeleton | Data is fetching | Visit `/admin` | Skeleton for stat cards and table area | P1 |
| UI-02 | Status dropdown styling | Different statuses | View dropdown | Color-coded: amber (pending), blue (confirmed), purple (shipped), green (delivered) | P2 |
| UI-03 | Order item image overflow | Order has 5+ items | View items column | Shows 3 thumbnails + "+2" overflow indicator | P2 |
| UI-04 | Responsive table | Admin on tablet/mobile | View orders table | Horizontal scroll enabled for table | P2 |
| UI-05 | Status update spinner | Admin changes status | Dropdown processing | Dropdown disabled with reduced opacity during update | P1 |

---

## 9. Navigation & Layout

### Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Desktop navigation | User is on desktop | View navbar | Logo, Home, Products links visible. Cart icon + auth controls on right. | P0 |
| HP-02 | Mobile hamburger menu | User is on mobile | Tap hamburger icon | Full menu expands with all nav links | P0 |
| HP-03 | Mobile menu close | Mobile menu is open | Tap X icon or navigate to a page | Menu closes | P1 |
| HP-04 | Footer visible | User scrolls to bottom | View footer | "ShopEasy" and copyright text visible | P2 |

### Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Auth-dependent nav items | User is logged in | View navbar | Shows cart icon, Orders link, username, Logout button | P0 |
| BR-02 | Guest nav items | User is not logged in | View navbar | Shows Login and Register links, no cart/orders | P0 |
| BR-03 | Admin badge in navbar | Admin is logged in | View navbar | "Admin" badge visible, links to `/admin` | P1 |
| BR-04 | Cart count in mobile menu | User on mobile with items | Open hamburger menu | Shows "Cart (X)" with count | P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Sticky navbar | User scrolls down | Scroll page | Navbar stays fixed at top (sticky top-0) | P2 |
| UI-02 | Active link styling | User is on `/products` | View navbar | Products link highlighted | P2 |
| UI-03 | App loading state | AuthContext is initializing | First page load | "Loading..." centered on screen | P1 |

---

## 10. Cross-Cutting Concerns

### Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | 401 auto-logout | Token expired | Make any authenticated API call | Frontend auto-removes token, redirects to `/login` | P0 |
| SEC-02 | CORS enforcement | Request from unauthorized origin | API call from `evil-site.com` | Blocked by CORS policy | P1 |
| SEC-03 | Authorization header format | Malformed Bearer token | Send `Authorization: Bearer invalid-jwt` | 401 response | P0 |
| SEC-04 | No sensitive data in JWT | Decode JWT token | Inspect payload | Contains userId, email, role only — no password or PII | P1 |

### Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Concurrent cart + order | Two tabs: one adding to cart, one placing order | Tab 2 places order (clears cart) | Tab 1's next cart action gets fresh state | P2 |
| EC-02 | Very slow network | 3G throttled connection | Use any feature | Loading states visible, no timeouts under 10s | P2 |
| EC-03 | LocalStorage disabled | Browser blocks localStorage | Attempt to login | Graceful failure (may not persist session) | P2 |

### UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Toast auto-dismiss | Any toast notification | Wait 3 seconds | Toast fades out and is removed | P1 |
| UI-02 | Toast manual dismiss | Toast is visible | Click X button on toast | Toast immediately dismissed | P2 |
| UI-03 | Multiple toasts | Rapid actions trigger multiple toasts | View toast area | Toasts stack vertically in bottom-right corner | P2 |
| UI-04 | 404 / unknown route | User navigates to `/nonexistent` | Page loads | Blank page (no 404 page currently) — potential improvement | P2 |

---

## Scenario Summary

| Feature Area | HP | BR | SEC | NEG | EC | UI | Total |
|-------------|----|----|-----|-----|----|----|-------|
| Registration | 2 | 5 | 5 | 5 | 4 | 4 | **25** |
| Login | 3 | 3 | 4 | 4 | 3 | 3 | **20** |
| Logout | 1 | 3 | 3 | 0 | 0 | 2 | **9** |
| Product Browsing | 8 | 5 | 2 | 4 | 4 | 7 | **30** |
| Shopping Cart | 9 | 7 | 4 | 4 | 4 | 6 | **34** |
| Checkout | 5 | 7 | 3 | 5 | 5 | 5 | **30** |
| Order History | 4 | 4 | 3 | 2 | 2 | 4 | **19** |
| Admin Dashboard | 4 | 5 | 4 | 3 | 3 | 5 | **24** |
| Navigation | 4 | 4 | 0 | 0 | 0 | 3 | **11** |
| Cross-Cutting | 0 | 0 | 4 | 0 | 3 | 4 | **11** |
| **Total** | **40** | **43** | **32** | **27** | **28** | **43** | **213** |
