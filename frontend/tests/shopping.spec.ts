import { test, expect } from "@playwright/test";
import { loginAsCustomer, navigateToFirstProductDetail } from "./helpers";

test.describe("Product Browsing", () => {
  test("should display featured products on home page", async ({ page }) => {
    await page.goto("/");

    // Hero section visibles
    await expect(page.getByText("Discover Products")).toBeVisible();

    // Category cards visible
    await expect(page.getByText("Shop by Category")).toBeVisible();

    // Featured products visible
    await expect(page.getByText("Featured Products")).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Products" }).first().click();

    await expect(page).toHaveURL("/products");
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });

  test("should filter products by category", async ({ page }) => {
    await page.goto("/products");

    // Select Electronics category using aria-label
    await page.getByRole("combobox", { name: "Category" }).selectOption("Electronics");

    // URL should update
    await expect(page).toHaveURL(/category=Electronics/);

    // Products should show
    const cards = page.getByTestId("product-card");
    await expect(cards.first()).toBeVisible();

    // At least one visible card should show Electronics
    await expect(cards.first().getByText("Electronics")).toBeVisible();
  });

  test("should search for a product by name", async ({ page }) => {
    await page.goto("/products");

    // Type in search and submit
    const searchInput = page.getByPlaceholder("Search products...");
    await searchInput.fill("Headphones");
    await searchInput.press("Enter");

    // URL should update
    await expect(page).toHaveURL(/search=Headphones/);

    // Should show matching products
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    await expect(page.getByText(/Headphones/i).first()).toBeVisible();
  });

  test("should show empty state for no results", async ({ page }) => {
    await page.goto("/products?search=xyznonexistent12345");

    await expect(page.getByText("No products found")).toBeVisible();
  });

  test("should sort products by price", async ({ page }) => {
    await page.goto("/products");

    // Select sort option using aria-label
    await page.getByRole("combobox", { name: "Sort" }).selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);

    // Products should be reloaded
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });

  test("should clear filters", async ({ page }) => {
    await page.goto("/products?search=test&category=Electronics&sort=price_asc");

    // Click clear filters
    await page.getByText("Clear filters").click();

    // URL should be clean
    await expect(page).toHaveURL("/products");
  });

  test("should navigate to product detail page", async ({ page }) => {
    await page.goto("/products");

    // Click on the first product heading
    const firstCard = page.getByTestId("product-card").first();
    const productName = await firstCard.getByRole("heading").textContent();
    await firstCard.getByRole("heading").click();

    // Should be on detail page
    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.getByRole("heading", { name: productName! })).toBeVisible();
  });
});

test.describe("Product Detail Page", () => {
  test("should show product details", async ({ page }) => {
    await navigateToFirstProductDetail(page);

    // Breadcrumb
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();

    // Price
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();

    // Stock indicator
    await expect(
      page.getByText(/In Stock|Out of Stock/).first()
    ).toBeVisible();

    // Description section
    await expect(page.getByText("Description")).toBeVisible();
  });

  test("should show login prompt for unauthenticated user", async ({
    page,
  }) => {
    await navigateToFirstProductDetail(page);

    await expect(
      page.getByRole("link", { name: "Login to Add to Cart" })
    ).toBeVisible();
  });

  test("should show add to cart controls for authenticated user", async ({
    page,
  }) => {
    await loginAsCustomer(page);
    await navigateToFirstProductDetail(page);

    // Quantity controls and add to cart button should be visible
    await expect(
      page.getByRole("button", { name: /Add to Cart/i })
    ).toBeVisible();
  });

  test("should add product to cart from detail page", async ({ page }) => {
    await loginAsCustomer(page);
    await navigateToFirstProductDetail(page);

    // Click add to cart
    await page.getByRole("button", { name: /Add to Cart/i }).click();

    // Toast should appear
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Cart badge should show
    await expect(page.getByTestId("cart-badge")).toBeVisible();
  });
});

test.describe("Add to Cart from Listing", () => {
  test("should add product from products page", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/products");

    // Find first in-stock product's Add to Cart button
    const addBtn = page
      .getByTestId("product-card")
      .first()
      .getByRole("button", { name: "Add to Cart" });

    await addBtn.click();

    // Toast notification
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Cart badge should update
    await expect(page.getByTestId("cart-badge")).toBeVisible();
  });

  test("should add product from home page", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/");

    // Find first Add to Cart button on featured products
    const addBtn = page.getByRole("button", { name: "Add to Cart" }).first();
    await addBtn.click();

    // Toast
    await expect(page.getByText(/added to cart/i)).toBeVisible();
  });
});
