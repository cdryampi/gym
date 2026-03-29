import { expect, test } from "@playwright/test";

import { loginAsLocalAdmin } from "./helpers/auth";

test.describe("dashboard marketing smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalAdmin(page);
  });

  test("renders editable marketing sections and primary controls", async ({ page }) => {
    await page.goto("/dashboard/marketing");

    await expect(page.getByRole("heading", { level: 1, name: "Marketing" })).toBeVisible();
    await expect(page.getByText("Contenido comercial editable")).toBeVisible();
    await expect(page.getByText("Planes", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Horarios", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Anadir plan/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Anadir fila/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Guardar marketing/i })).toBeVisible();
  });
});
