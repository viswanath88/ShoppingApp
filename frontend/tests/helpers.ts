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
  const clearBtn = page.getByRole("button", { name: /clear cart/i });
  if (await clearBtn.isVisible().catch(() => false)) {
    await clearBtn.click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  }
}

export async function addProductToCart(page: Page) {
  await page.goto("/products");
  await page
    .getByTestId("product-card")
    .first()
    .getByRole("button", { name: "Add to Cart" })
    .click();
  await expect(page.getByText(/added to cart/i)).toBeVisible();
}

export async function navigateToFirstProductDetail(page: Page) {
  await page.goto("/products");
  await page.getByTestId("product-card").first().getByRole("heading").click();
  await expect(page).toHaveURL(/\/products\/\d+/);
}
