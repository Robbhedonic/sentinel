import { test, expect } from "@playwright/test";

test("loads dashboard and renders core sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Risk monitoring")).toBeVisible();
  await expect(page.getByText("Recent transactions").first()).toBeVisible();
  await expect(page.getByText("Fraud alerts").first()).toBeVisible();
});

test("navigates sidebar sections", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Transactions/ }).click();
  await expect(page.getByRole("heading", { name: "Transactions", exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Fraud Alerts/ }).click();
  await expect(page.getByRole("heading", { name: "Fraud Alerts", exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Investigations/ }).click();
  await expect(page.getByRole("heading", { name: "Investigations", exact: true }).first()).toBeVisible();
});

test("applies filters and login", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Account ID").fill("ACC-VELOCITY");
  await page.getByText("Apply filters").click();

  await page.getByPlaceholder("Username").fill("analyst");
  await page.getByPlaceholder("Password").fill("sentinel");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Authenticated as analyst").or(page.getByText("Logout"))).toBeVisible();
});
