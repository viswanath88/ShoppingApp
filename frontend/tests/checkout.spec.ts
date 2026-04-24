import { test, expect } from "@playwright/test";
import { loginAsCustomer, clearCartViaUI, addProductToCart } from "./helpers";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
    await clearCartViaUI(page);
    await addProductToCart(page);
  });

  test("should navigate from cart to checkout", async ({ page }) => {
    await page.getByTestId("cart-link").click();
    await page.getByTestId("checkout-btn").click();

    await expect(page).toHaveURL("/checkout");
    await expect(
      page.getByRole("heading", { name: "Checkout" })
    ).toBeVisible();
  });

  test("should show shipping form on checkout page", async ({ page }) => {
    await page.goto("/checkout");

    await expect(page.getByText("Shipping Information")).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Street Address")).toBeVisible();
    await expect(page.getByLabel("City")).toBeVisible();
    await expect(page.getByLabel("ZIP Code")).toBeVisible();
  });

  test("should validate shipping form", async ({ page }) => {
    await page.goto("/checkout");

    // Try to continue without filling
    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Should show validation errors
    await expect(page.getByText("Full name is required")).toBeVisible();
    await expect(page.getByText("Address is required")).toBeVisible();
  });

  test("should show order summary on checkout", async ({ page }) => {
    await page.goto("/checkout");

    // Order summary sidebar should be visible
    await expect(page.getByRole("heading", { name: "Order Summary" })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });

  test("should proceed from shipping to payment", async ({ page }) => {
    await page.goto("/checkout");

    // Fill shipping form
    await page.getByLabel("Full Name").fill("E2E Test User");
    await page.getByLabel("Street Address").fill("123 Test St");
    await page.getByLabel("City").fill("Testville");
    await page.getByLabel("ZIP Code").fill("12345");

    // Continue to payment
    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Should show payment step
    await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
    await expect(page.getByText("Simulated Payment")).toBeVisible();
    await expect(page.getByText("**** **** **** 4242")).toBeVisible();

    // Shipping summary should be shown
    await expect(page.getByText("E2E Test User")).toBeVisible();
    await expect(page.getByText("123 Test St")).toBeVisible();
  });

  test("should complete full checkout and reach confirmation", async ({
    page,
  }) => {
    await page.goto("/checkout");

    // Fill shipping
    await page.getByLabel("Full Name").fill("E2E Test User");
    await page.getByLabel("Street Address").fill("123 Test St");
    await page.getByLabel("City").fill("Testville");
    await page.getByLabel("ZIP Code").fill("12345");

    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Click Pay Now
    await page.getByRole("button", { name: /Pay Now/i }).click();

    // Should navigate to order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\/\d+/, {
      timeout: 15000,
    });

    // Confirmation page content
    await expect(page.getByText("Order Confirmed!")).toBeVisible();
    await expect(page.getByText(/Order Number/i)).toBeVisible();
    await expect(page.getByText("Items Ordered")).toBeVisible();

    // Action buttons
    await expect(
      page.getByRole("link", { name: "View All Orders" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue Shopping" })
    ).toBeVisible();
  });

  test("should show loading state during order placement", async ({
    page,
  }) => {
    // Intercept and delay the orders API to capture loading state
    await page.route("**/api/orders", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/checkout");

    await page.getByLabel("Full Name").fill("E2E Test User");
    await page.getByLabel("Street Address").fill("456 Speed St");
    await page.getByLabel("City").fill("FastCity");
    await page.getByLabel("ZIP Code").fill("67890");

    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Click Pay Now and check for loading state
    const payBtn = page.getByRole("button", { name: /Pay Now/i });
    await payBtn.click();

    // Should see disabled/loading state on the button
    await expect(payBtn).toBeDisabled();

    // Then should navigate to confirmation
    await expect(page).toHaveURL(/\/order-confirmation\/\d+/, {
      timeout: 15000,
    });
  });

  test("should validate ZIP code format", async ({ page }) => {
    await page.goto("/checkout");

    // Fill all fields but use an invalid ZIP code
    await page.getByLabel("Full Name").fill("ZIP Test User");
    await page.getByLabel("Street Address").fill("100 Zip Ave");
    await page.getByLabel("City").fill("ZipTown");
    await page.getByLabel("ZIP Code").fill("abc");

    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Should show ZIP-specific validation error
    await expect(page.getByText("Enter a valid ZIP code")).toBeVisible();
  });

  test("should go back to shipping from payment step", async ({ page }) => {
    await page.goto("/checkout");

    // Fill shipping form and proceed to payment
    await page.getByLabel("Full Name").fill("Back Nav User");
    await page.getByLabel("Street Address").fill("200 Back St");
    await page.getByLabel("City").fill("BackCity");
    await page.getByLabel("ZIP Code").fill("54321");

    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();

    // Verify we are on the payment step
    await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();

    // Click the Edit button to go back to shipping
    await page.getByRole("button", { name: /Edit/i }).click();

    // Should be back on the shipping step with form values preserved
    await expect(page.getByText("Shipping Information")).toBeVisible();
    await expect(page.getByLabel("Full Name")).toHaveValue("Back Nav User");
    await expect(page.getByLabel("Street Address")).toHaveValue("200 Back St");
    await expect(page.getByLabel("City")).toHaveValue("BackCity");
    await expect(page.getByLabel("ZIP Code")).toHaveValue("54321");
  });

  test("should show empty cart message on checkout when cart is empty", async ({
    page,
  }) => {
    // Cart is already cleared and a product added in beforeEach.
    // Clear cart again so it is empty.
    await clearCartViaUI(page);

    // Navigate directly to checkout with an empty cart
    await page.goto("/checkout");

    // Should show empty cart message
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Products" })
    ).toBeVisible();
  });
});

test.describe("Order History", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("should show orders page with past orders", async ({ page }) => {
    // First create an order if needed
    await clearCartViaUI(page);
    await addProductToCart(page);
    await page.goto("/checkout");

    await page.getByLabel("Full Name").fill("Order History User");
    await page.getByLabel("Street Address").fill("789 Order St");
    await page.getByLabel("City").fill("OrderCity");
    await page.getByLabel("ZIP Code").fill("11111");
    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();
    await page.getByRole("button", { name: /Pay Now/i }).click();
    await expect(page).toHaveURL(/\/order-confirmation\/\d+/, {
      timeout: 15000,
    });

    // Navigate to orders
    await page.goto("/orders");

    await expect(
      page.getByRole("heading", { name: "Order History" })
    ).toBeVisible();
    await expect(page.getByTestId("order-card").first()).toBeVisible();
  });

  test("should expand order to see item details", async ({ page }) => {
    await page.goto("/orders");

    // Click first order to expand
    const firstOrder = page.getByTestId("order-card").first();
    await firstOrder.getByTestId("order-toggle").click();

    // Should show item details (product name, price, quantity)
    await expect(firstOrder.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });

  test("should show order status badges", async ({ page }) => {
    await page.goto("/orders");

    // At least one status badge should be visible
    const firstOrder = page.getByTestId("order-card").first();
    await expect(
      firstOrder.getByText(/pending|confirmed|shipped|delivered/i).first()
    ).toBeVisible();
  });

  test("should collapse order when clicked again", async ({ page }) => {
    await page.goto("/orders");

    const firstOrder = page.getByTestId("order-card").first();

    // Expand
    await firstOrder.getByTestId("order-toggle").click();
    // Should show subtotal area
    await expect(firstOrder.getByText("Subtotal")).toBeVisible();

    // Collapse
    await firstOrder.getByTestId("order-toggle").click();

    // Subtotal should not be visible anymore
    await expect(firstOrder.getByText("Subtotal")).not.toBeVisible();
  });

  test("should navigate from confirmation to orders", async ({ page }) => {
    await clearCartViaUI(page);
    await addProductToCart(page);
    await page.goto("/checkout");

    await page.getByLabel("Full Name").fill("Nav Test");
    await page.getByLabel("Street Address").fill("123 Nav St");
    await page.getByLabel("City").fill("NavCity");
    await page.getByLabel("ZIP Code").fill("22222");
    await page
      .getByRole("button", { name: "Continue to Payment" })
      .click();
    await page.getByRole("button", { name: /Pay Now/i }).click();
    await expect(page).toHaveURL(/\/order-confirmation\/\d+/, {
      timeout: 15000,
    });

    // Click "View All Orders"
    await page.getByRole("link", { name: "View All Orders" }).click();
    await expect(page).toHaveURL("/orders");
    await expect(page.getByTestId("order-card").first()).toBeVisible();
  });
});
