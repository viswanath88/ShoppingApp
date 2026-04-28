import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers";

const PROTECTED_ROUTES = [
  "/cart",
  "/checkout",
  "/orders",
  "/order-confirmation/1",
];

test.describe("Route Guards - Unauthenticated", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`should redirect ${route} to /login when not authenticated`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("should redirect /admin to /login when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Route Guards - Guest-Only Pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("should redirect authenticated user from /login to /", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("should redirect authenticated user from /register to /", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Route Guards - Public Pages", () => {
  test("should allow unauthenticated access to /products", async ({ page }) => {
    await page.goto("/products");
    await expect(
      page.getByRole("heading", { name: "Products" })
    ).toBeVisible();
  });

  test("should allow unauthenticated access to product detail", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("product-card").first().getByRole("heading").click();
    await expect(page).toHaveURL(/\/products\/\d+/);

    // Detail page shows login prompt instead of add-to-cart
    await expect(
      page.getByRole("link", { name: /Login to Add to Cart/i })
    ).toBeVisible();
  });
});
