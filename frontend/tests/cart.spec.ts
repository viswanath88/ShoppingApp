import { test, expect } from "@playwright/test";
import { loginAsCustomer, clearCartViaUI, addProductToCart } from "./helpers";

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("should show empty cart state", async ({ page }) => {
    await clearCartViaUI(page);
    await page.goto("/cart");

    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start Shopping" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display cart items after adding product", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    // Navigate to cart
    await page.getByTestId("cart-link").click();
    await expect(page).toHaveURL("/cart");

    // Cart should have items
    await expect(page.getByTestId("cart-item").first()).toBeVisible();

    // Summary sidebar should show totals
    await expect(page.getByText("Order Summary")).toBeVisible();
    await expect(page.getByText("Grand Total")).toBeVisible();
  });

  test("should update item quantity", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    await page.getByTestId("cart-link").click();

    const cartItem = page.getByTestId("cart-item").first();

    // Click + button to increase quantity
    const plusBtn = cartItem.getByRole("button", { name: "+" });
    await plusBtn.click();

    // Verify the quantity updated to 2 (use the quantity display span)
    const qtyDisplay = cartItem.locator("span.text-center");
    await expect(qtyDisplay).toHaveText("2", { timeout: 5000 });

    // The total should update
    await expect(page.getByText("Grand Total")).toBeVisible();
  });

  test("should remove item from cart", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    await page.getByTestId("cart-link").click();
    await expect(page.getByTestId("cart-item").first()).toBeVisible();

    // Click remove button
    await page.getByRole("button", { name: "Remove" }).first().click();

    // Toast should confirm
    await expect(page.getByText(/removed from cart/i)).toBeVisible();

    // Cart should be empty
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("should clear entire cart", async ({ page }) => {
    // Add two products
    await clearCartViaUI(page);

    await page.goto("/products");
    const addBtns = page
      .getByTestId("product-card")
      .getByRole("button", { name: "Add to Cart" });

    await addBtns.first().click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();
    // Wait for first toast to dismiss instead of arbitrary sleep
    await expect(page.getByText(/added to cart/i)).not.toBeVisible();

    await addBtns.nth(1).click();
    await expect(page.getByText(/added to cart/i).last()).toBeVisible();

    // Go to cart
    await page.getByTestId("cart-link").click();

    // Should have multiple items
    const items = page.getByTestId("cart-item");
    await expect(items.first()).toBeVisible();

    // Clear all
    await page.getByRole("button", { name: /clear cart/i }).click();

    // Toast and empty state
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("should update cart badge when items change", async ({ page }) => {
    await clearCartViaUI(page);

    // Badge should not exist initially
    await expect(page.getByTestId("cart-badge")).not.toBeVisible();

    // Add a product
    await addProductToCart(page);

    // Badge should appear
    await expect(page.getByTestId("cart-badge")).toBeVisible();
    await expect(page.getByTestId("cart-badge")).toHaveText(/\d+/);

    // Remove via cart page
    await page.getByTestId("cart-link").click();
    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();

    // Badge should disappear
    await expect(page.getByTestId("cart-badge")).not.toBeVisible();
  });

  test("should have Continue Shopping link", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);
    await page.getByTestId("cart-link").click();

    const link = page.getByRole("link", { name: "Continue Shopping" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/products");
  });

  test("should decrease item quantity using minus button", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    await page.getByTestId("cart-link").click();

    const cartItem = page.getByTestId("cart-item").first();
    // The quantity display is a span between the - and + buttons
    const qtyDisplay = cartItem.locator("span.text-center");

    // Increase quantity to 2 first
    const plusBtn = cartItem.getByRole("button", { name: "+" });
    await plusBtn.click();
    await expect(qtyDisplay).toHaveText("2", { timeout: 5000 });

    // Now click "-" to decrease quantity back to 1
    const minusBtn = cartItem.getByRole("button", { name: "-" });
    await minusBtn.click();
    await expect(qtyDisplay).toHaveText("1", { timeout: 5000 });
  });

  test("should display correct tax calculation (8%)", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    await page.getByTestId("cart-link").click();
    await expect(page.getByText("Order Summary")).toBeVisible();

    // The cart summary has rows like: <div class="flex justify-between"><span>Subtotal (...)</span><span>$XX.XX</span></div>
    // Use the row container to extract the dollar amount next to each label
    const summarySection = page.locator(".space-y-3.text-sm");

    const subtotalRow = summarySection.locator("div.flex").filter({ hasText: "Subtotal" });
    const taxRow = summarySection.locator("div.flex").filter({ hasText: "Tax (8%)" });
    const grandTotalRow = summarySection.locator("div.flex").filter({ hasText: "Grand Total" });

    // Wait for values to be rendered
    await expect(subtotalRow).toBeVisible();

    // Extract dollar amounts from each row
    const subtotalText = await subtotalRow.locator("span").last().textContent();
    const taxText = await taxRow.locator("span").last().textContent();
    const grandTotalText = await grandTotalRow.locator("span").last().textContent();

    // Parse dollar amounts
    const subtotal = parseFloat(subtotalText!.replace("$", ""));
    const tax = parseFloat(taxText!.replace("$", ""));
    const grandTotal = parseFloat(grandTotalText!.replace("$", ""));

    // Verify tax is 8% of subtotal
    const expectedTax = Math.round(subtotal * 0.08 * 100) / 100;
    expect(tax).toBeCloseTo(expectedTax, 2);

    // Verify grand total = subtotal + tax
    const expectedGrandTotal = Math.round((subtotal + tax) * 100) / 100;
    expect(grandTotal).toBeCloseTo(expectedGrandTotal, 2);
  });

  test("should navigate to product detail from cart item", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);

    await page.getByTestId("cart-link").click();

    const cartItem = page.getByTestId("cart-item").first();
    await expect(cartItem).toBeVisible();

    // Click the product name link within the cart item
    const productLink = cartItem.getByRole("link").first();
    await productLink.click();

    // Should navigate to the product detail page
    await expect(page).toHaveURL(/\/products\/\d+/);
  });
});
