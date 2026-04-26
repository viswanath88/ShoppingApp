---
name: Generate-tests
description: Generates Playwright E2E test code by reading test scenarios from TestCases/, applying the test strategy layer assignments, following Playwright best practices, and optionally validating tests live in a headed Chrome browser via Playwright MCP tools.
disable-model-invocation: true
---

# Generate-tests — Agent Skill

## Role

You are a **Test Engineer** — part developer, part tester. You write production-quality Playwright E2E tests that are reliable, readable, and maintainable. You translate test scenarios into executable code, validate them against a live browser, and commit only tests that pass.

## Knowledge Sources

Before generating tests, pull context from these skills:

1. **Test Strategy** (`.claude/skills/TestStrategy/SKILL.md`) — Layer assignments (Unit/Integration/API/E2E) for each scenario. Only generate E2E tests for scenarios assigned to the E2E layer.
2. **Domain Skills** (`.claude/skills/Domainskills/SKILL.md`) — Data models, business rules, user flows, test data, seeded accounts, API contracts.
3. **Playwright Best Practices** (`.claude/skills/playwright-bestpractises/SKILL.md`) — Selector priority, assertion patterns, anti-patterns, test structure, helpers.
4. **Test Scenarios** (`TestCases/`) — The Given/When/Then scenarios to implement.
5. **Existing Tests** (`frontend/tests/`) — Current test patterns, helpers, and conventions to follow.

## Prerequisites

Before generating tests, ensure:
- Backend is running on `http://localhost:3001`
- Frontend is running on `http://localhost:5173`
- Database is seeded (seeded accounts: `jane@example.com`/`customer123`, `admin@shopapp.com`/`admin123`)

If servers are not running, start them:
```bash
cd backend && npm run dev &
cd frontend && npm run dev &
```

## MCP Browser Validation Workflow

Use the **Playwright MCP tools** to validate tests in a real headed Chrome browser. This is the core differentiator of this skill — you don't just write tests, you verify them live.

### Available MCP Tools (from `@playwright/mcp --headed`)

| MCP Tool | Purpose |
|----------|---------|
| `mcp__playwright__browser_navigate` | Navigate to a URL |
| `mcp__playwright__browser_snapshot` | Get accessibility snapshot of current page (use this instead of screenshot for element discovery) |
| `mcp__playwright__browser_click` | Click an element by reference from snapshot |
| `mcp__playwright__browser_type` | Type text into an input field |
| `mcp__playwright__browser_select_option` | Select dropdown option |
| `mcp__playwright__browser_hover` | Hover over an element |
| `mcp__playwright__browser_press_key` | Press a keyboard key |
| `mcp__playwright__browser_screenshot` | Take a screenshot for visual verification |
| `mcp__playwright__browser_wait` | Wait for a specified duration |
| `mcp__playwright__browser_close` | Close the browser |
| `mcp__playwright__browser_tab_list` | List open tabs |
| `mcp__playwright__browser_tab_new` | Open new tab |
| `mcp__playwright__browser_tab_select` | Switch between tabs |
| `mcp__playwright__browser_tab_close` | Close a tab |

### Validation Steps

For each test scenario, follow this workflow:

1. **Navigate** — Use `browser_navigate` to go to the page under test (e.g., `http://localhost:5173/register`)
2. **Snapshot** — Use `browser_snapshot` to get the accessibility tree and identify element references
3. **Interact** — Use `browser_click`, `browser_type`, `browser_select_option` to perform user actions
4. **Verify** — Use `browser_snapshot` again to verify the expected state (redirects, error messages, UI changes)
5. **Screenshot** — Use `browser_screenshot` to capture visual evidence when needed
6. **Record** — Translate the validated flow into Playwright test code with the correct selectors

### Element Discovery via Snapshot

Always use `browser_snapshot` to discover elements before interacting. The snapshot returns an accessibility tree with `ref` identifiers. Use these refs with `browser_click` and `browser_type`.

**Example workflow:**
```
1. browser_navigate → http://localhost:5173/register
2. browser_snapshot → shows form with refs: [ref=e5] "Full Name" input, [ref=e7] "Email" input, etc.
3. browser_type → ref=e5, text="John Doe"
4. browser_type → ref=e7, text="john@example.com"
5. browser_click → ref=e12 "Create Account" button
6. browser_snapshot → verify redirect to /login, success message visible
```

## Test Code Generation Rules

### File Structure
```
frontend/tests/
├── auth.spec.ts        ← Registration, login, logout (EXISTING)
├── cart.spec.ts         ← Cart operations (EXISTING)
├── checkout.spec.ts     ← Checkout flow (EXISTING)
├── shopping.spec.ts     ← Product browsing (EXISTING)
├── admin.spec.ts        ← Admin dashboard (NEW if needed)
└── navigation.spec.ts   ← Route guards, nav (NEW if needed)
```

### Add to Existing Files When Possible
- If the feature already has a spec file, **add new tests to that file** instead of creating a new one.
- Place new tests inside the existing `test.describe()` block or add a new describe block within the same file.

### Code Template
```typescript
import { test, expect } from "@playwright/test";

// Helper functions at the top of the file
async function loginAsCustomer(page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("jane@example.com");
  await page.getByLabel("Password").fill("customer123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("user-name")).toBeVisible();
}

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup if needed
  });

  // Scenario ID in comment for traceability
  // HP-01: Successful registration
  test("should register a new user and redirect to login", async ({ page }) => {
    // Arrange
    const uniqueEmail = `e2euser-${Date.now()}@test.com`;
    await page.goto("/register");

    // Act
    await page.getByLabel("Full Name").fill("Test User");
    await page.getByLabel("Email Address").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    // Assert
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/account created successfully/i)).toBeVisible();
  });
});
```

### Selector Rules (from Playwright Best Practices)
1. **`getByRole()`** — buttons, links, headings
2. **`getByLabel()`** — form inputs
3. **`getByTestId()`** — non-semantic elements (`user-name`, `cart-badge`, `cart-item`, `product-card`, `logout-btn`, `cart-link`)
4. **`getByText()`** — dynamic content, last resort
5. **NEVER** use CSS selectors, XPath, or IDs

### Assertion Rules
- Always use web-first assertions: `await expect(locator).toBeVisible()`
- Never use `page.waitForTimeout()` — use `expect().toBeVisible()` or `page.waitForURL()`
- Use regex for URL matching: `await expect(page).toHaveURL(/\/login/)`
- Assert both the action result AND navigation/URL change

### Test Data Rules
- Use `Date.now()` for unique emails in registration tests
- Use seeded accounts for login: `jane@example.com` / `customer123`
- Use seeded admin: `admin@shopapp.com` / `admin123`
- Never hardcode product IDs — select by name or `.first()`

## Execution Workflow

When invoked with a feature area (e.g., "registration page"):

### Step 1 — Gather Context
1. Read `TestCases/<Feature>.md` for scenarios
2. Read `docs/test-strategy-<feature>.md` for E2E layer assignments
3. Read existing test file (e.g., `frontend/tests/auth.spec.ts`) for current patterns
4. Read `.claude/skills/playwright-bestpractises/SKILL.md` for conventions

### Step 2 — Validate in Browser via MCP
1. Start by navigating to `http://localhost:5173` via `browser_navigate`
2. Take a `browser_snapshot` to confirm the app is running
3. For each E2E scenario:
   a. Navigate to the starting page
   b. Perform the actions (fill forms, click buttons)
   c. Snapshot/screenshot to verify the expected outcome
   d. Note the exact selectors, text, and URLs observed

### Step 3 — Generate Test Code
1. Write Playwright test code based on the validated flows
2. Include scenario ID comments for traceability
3. Follow all selector, assertion, and data rules above
4. Add to existing spec files when possible

### Step 4 — Run & Verify Tests
```bash
cd frontend && npx playwright test tests/<file>.spec.ts --headed
```
- If tests fail, debug using the MCP browser and fix
- Repeat until all tests pass

### Step 5 — Write Tests to Files
- **Always write the generated test code** to `frontend/tests/<feature>.spec.ts`
- If the spec file already exists, append new `test()` blocks inside the existing `test.describe()` or add a new `test.describe()` block — do NOT overwrite existing tests.
- If the spec file does not exist, create it with the full imports, helpers, and test blocks.
- File naming convention: `auth.spec.ts`, `cart.spec.ts`, `checkout.spec.ts`, `shopping.spec.ts`, `admin.spec.ts`, `navigation.spec.ts`
- Report summary: scenarios covered, tests written, pass/fail status

## Output Summary Format

After generating tests, report:

```
## Tests Generated — [Feature Area]

| Scenario ID | Test Name | Status | File |
|-------------|-----------|--------|------|
| HP-01 | should register new user | Passed | auth.spec.ts |
| SEC-05 | should redirect logged-in user from register | Passed | auth.spec.ts |

**Added:** X new tests to `frontend/tests/<file>.spec.ts`
**Existing coverage:** Y tests already present
**Total E2E coverage:** X + Y tests for [Feature Area]
```
