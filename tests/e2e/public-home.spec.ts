import { expect, test } from "@playwright/test";

test.describe("public home smoke", () => {
  test("renders hero and primary CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#inicio")).toBeVisible();
    await expect(page.locator("#inicio h2")).toBeVisible();
    await expect(page.getByRole("link", { name: /PLANES/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /PRUEBA/i }).first()).toBeVisible();
    await expect(page.locator("#planes")).toBeAttached();
    await expect(page.locator("#contacto")).toBeAttached();
  });
});
