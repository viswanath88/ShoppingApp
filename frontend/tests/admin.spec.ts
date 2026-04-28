import { test, expect, type Locator } from "@playwright/test";
import {
  loginAsAdmin,
  loginAsCustomer,
  placeOrder,
} from "./helpers";

// Ensure at least one order exists so dashboard/status tests have data.
// CI seeds the DB with zero orders, and admin.spec.ts runs first
// alphabetically with workers=1, so without this the dashboard table
// doesn't render.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await loginAsCustomer(page);
    await placeOrder(page);
  } finally {
    await context.close();
  }
});

test.describe("Admin - Access Control", () => {
  test("should redirect unauthenticated user from /admin to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect customer from /admin to home", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("should allow admin to access /admin", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
  });
});

test.describe("Admin - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard" })
    ).toBeVisible();
  });

  test("should display all four stat cards with values", async ({ page }) => {
    for (const title of ["Total Products", "Total Orders", "Total Revenue", "Total Customers"]) {
      await expect(page.getByText(title)).toBeVisible();
    }

    // Revenue card shows a dollar value
    await expect(page.getByText(/^\$\d+(\.\d{2})?$/).first()).toBeVisible();
  });

  test("should display Recent Orders table", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Recent Orders" })
    ).toBeVisible();

    // Table headers
    for (const header of ["Order ID", "Customer", "Items", "Date", "Total", "Status"]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });
});

test.describe("Admin - Order Status Updates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Recent Orders" })
    ).toBeVisible();
  });

  test("should advance an order's status and persist after reload", async ({ page }) => {
    // Find the first non-delivered order row (delivered selects are disabled)
    const rows = page.getByRole("row");
    const rowCount = await rows.count();

    let targetRow: Locator | null = null;
    let targetOrderId = "";

    // Skip the header row at index 0
    for (let i = 1; i < rowCount; i++) {
      const row = rows.nth(i);
      const select = row.getByRole("combobox");
      if (await select.isDisabled()) continue;
      targetRow = row;
      targetOrderId = (await row.locator("td").first().textContent()) ?? "";
      break;
    }

    test.skip(!targetRow, "No non-delivered orders to update");

    const select = targetRow!.getByRole("combobox");
    const currentStatus = await select.inputValue();
    const nextStatus = nextStatusFor(currentStatus);

    await select.selectOption(nextStatus);

    // Toast confirms
    await expect(page.getByText(new RegExp(`updated to ${nextStatus}`, "i"))).toBeVisible();

    // Reload and verify persistence — find the same row by order ID
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Recent Orders" })
    ).toBeVisible();

    const reloadedRow = page
      .getByRole("row")
      .filter({ has: page.getByText(targetOrderId, { exact: true }) });
    await expect(reloadedRow.getByRole("combobox")).toHaveValue(nextStatus);
  });

  test("should disable status select for delivered orders", async ({ page }) => {
    const rows = page.getByRole("row");
    const rowCount = await rows.count();

    let foundDelivered = false;
    for (let i = 1; i < rowCount; i++) {
      const select = rows.nth(i).getByRole("combobox");
      if ((await select.inputValue()) === "delivered") {
        await expect(select).toBeDisabled();
        foundDelivered = true;
        break;
      }
    }

    test.skip(!foundDelivered, "No delivered orders in seed data");
  });
});

function nextStatusFor(current: string): string {
  const flow = ["pending", "confirmed", "shipped", "delivered"];
  const i = flow.indexOf(current);
  return flow[Math.min(i + 1, flow.length - 1)];
}
