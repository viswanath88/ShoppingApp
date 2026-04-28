import { expect, Page } from "@playwright/test";

export async function loginAsCustomer(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Password").fill("customer123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByTestId("user-name")).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@shopapp.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByTestId("user-name")).toBeVisible();
}

export async function clearCartViaUI(page: Page) {
  await page.goto("/cart");
  // Wait for the cart page to finish loading (either items or empty state appears)
  await expect(
    page.getByText("Your cart is empty").or(page.getByTestId("cart-item").first())
  ).toBeVisible({ timeout: 10000 });

  const clearBtn = page.getByRole("button", { name: /clear cart/i });
  if (await clearBtn.isVisible().catch(() => false)) {
    await clearBtn.click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  }
}

export async function addProductToCart(page: Page) {
  await page.goto("/products");
  // The per-product testid only renders for in-stock + authenticated users,
  // and survives the button's loading-state text swap.
  await page.getByTestId(/^add-to-cart-\d+$/).first().click();
  await expect(page.getByText(/added to cart/i)).toBeVisible();
}

export async function navigateToFirstProductDetail(page: Page) {
  await page.goto("/products");
  await page.getByTestId("product-card").first().getByRole("heading").click();
  await expect(page).toHaveURL(/\/products\/\d+/);
}

export async function placeOrder(
  page: Page,
  shipping: { name?: string; address?: string; city?: string; zip?: string } = {}
) {
  await clearCartViaUI(page);
  await addProductToCart(page);
  await page.goto("/checkout");

  await page.getByLabel("Full Name").fill(shipping.name ?? "Helper Order User");
  await page.getByLabel("Street Address").fill(shipping.address ?? "1 Helper Way");
  await page.getByLabel("City").fill(shipping.city ?? "HelperCity");
  await page.getByLabel("ZIP Code").fill(shipping.zip ?? "10001");

  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await page.getByRole("button", { name: /Pay Now/i }).click();

  await expect(page).toHaveURL(/\/order-confirmation\/\d+/, { timeout: 15000 });
}
