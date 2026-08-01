import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./helpers/auth";

test.describe("dashboard store smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("opens the Medusa product CRUD surfaces", async ({ page }) => {
    await page.goto("/dashboard/tienda/productos");
    await expect(page.getByRole("heading", { name: "CATALOGO PRO" })).toBeVisible();

    await page.goto("/dashboard/tienda/productos/nuevo");
    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByRole("button", { name: /Publicar/i })).toBeVisible();
  });
});
