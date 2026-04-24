import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers";

test.describe("Auth - Registration", () => {
  test("should register a new user and redirect to login", async ({
    page,
  }) => {
    const uniqueEmail = `e2euser-${Date.now()}@test.com`;
    await page.goto("/register");

    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("testpass123");
    await page.getByLabel("Confirm Password").fill("testpass123");

    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to login with success message
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Account created successfully")).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should show client-side validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("should show error for mismatched passwords", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Name").fill("Test");
    await page.getByLabel("Email").fill("mismatch@test.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("different123");

    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});

test.describe("Auth - Login", () => {
  test("should login with valid credentials", async ({ page }) => {
    // Use seeded customer account
    await page.goto("/login");

    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("Password").fill("customer123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should redirect to home and show user name in navbar
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("user-name")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible();
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show validation error for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/email is required/i)).toBeVisible();
  });
});

test.describe("Auth - Logout", () => {
  test("should logout and clear session", async ({ page }) => {
    await loginAsCustomer(page);

    // Logout
    await page.getByTestId("logout-btn").click();

    // Should redirect to home, show Login link instead of user name
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByTestId("user-name")).not.toBeVisible();
  });

  test("should redirect to login when accessing protected route after logout", async ({
    page,
  }) => {
    await loginAsCustomer(page);

    // Logout
    await page.getByTestId("logout-btn").click();

    // Try accessing protected route
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/);
  });
});
