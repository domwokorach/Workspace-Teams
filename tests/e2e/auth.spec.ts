import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("registers a new account, reaches the dashboard, and logs out", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByLabel("First name").fill("Ada");
    await page.getByLabel("Last name").fill("Lovelace");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("CorrectHorse123!");
    await page.getByLabel("Confirm password").fill("CorrectHorse123!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText(/Welcome back, Ada/i)).toBeVisible();

    await page.getByRole("button", { name: /Ada Lovelace/i }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("rejects an incorrect password on sign in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });
});
