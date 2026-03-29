import { expect, test } from "@playwright/test";

import { loginAsLocalAdmin } from "./helpers/auth";
import { createSmokeLeadPayload, getBaseUrl } from "./helpers/env";

test.describe("dashboard leads smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalAdmin(page);
  });

  test("supports search, filters, sorting and lead detail", async ({ page }) => {
    const smokeLead = createSmokeLeadPayload();
    const intakeResponse = await page.context().request.post(`${getBaseUrl()}/api/contact`, {
      data: smokeLead,
    });

    expect(intakeResponse.ok()).toBeTruthy();

    await page.goto("/dashboard/leads");

    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible();
    await expect(page.getByText("Bandeja de leads")).toBeVisible();

    await page.getByLabel("Buscar").fill(smokeLead.name);
    await expect(page).toHaveURL(/q=/);
    await expect(page.locator("tbody").getByText(smokeLead.name)).toBeVisible();

    await page.locator("#status").selectOption("new");
    await expect(page).toHaveURL(/status=new/);

    await page.locator("#source").selectOption("website");
    await expect(page).toHaveURL(/source=website/);

    await page.locator("#sort").selectOption("name_asc");
    await expect(page).toHaveURL(/sort=name_asc/);

    await page.getByRole("button", { name: "Ver detalle" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(smokeLead.message)).toBeVisible();
    await expect(dialog.getByText("Mensaje completo")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: "Limpiar" }).click();
    await expect(page).not.toHaveURL(/q=|status=|source=|sort=/);
  });
});
