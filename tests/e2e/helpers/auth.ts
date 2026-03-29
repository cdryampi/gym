import { expect, type Page } from "@playwright/test";

import { getAdminCredentials, getBaseUrl } from "./env";

export async function loginAsLocalAdmin(page: Page) {
  const { identity, password } = getAdminCredentials();

  const response = await page.context().request.post(`${getBaseUrl()}/api/dev-login`, {
    data: {
      identity,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function loginViaUi(page: Page) {
  const { identity, password } = getAdminCredentials();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Acceso al backoffice" })).toBeVisible();

  await page.getByLabel("Email o usuario").fill(identity);
  await page.getByPlaceholder("********").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
}
