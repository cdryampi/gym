import { expect, type Page } from "@playwright/test";

import { getAdminCredentials, getBaseUrl } from "./env";

export type TestDashboardRole = "superadmin" | "admin" | "trainer";

export async function loginAsLocalAdmin(page: Page) {
  const { identity, password } = getAdminCredentials();
  const baseUrl = new URL(getBaseUrl());

  const response = await page.context().request.post(`${getBaseUrl()}/api/dev-login`, {
    data: {
      identity,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const setCookie = response.headers()["set-cookie"];
  const cookiePair = setCookie?.split(";")[0] ?? "";
  const separatorIndex = cookiePair.indexOf("=");

  expect(separatorIndex).toBeGreaterThan(0);

  const name = cookiePair.slice(0, separatorIndex);
  const value = cookiePair.slice(separatorIndex + 1);

  await page.context().addCookies([
    {
      name,
      value,
      domain: baseUrl.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: baseUrl.protocol === "https:",
    },
  ]);
}

export async function loginAsAdmin(page: Page) {
  const baseUrl = new URL(getBaseUrl());
  const isLocal = baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";

  if (isLocal) {
    return loginAsLocalAdmin(page);
  }

  return loginViaUi(page);
}

export async function overrideDashboardRole(page: Page, role: TestDashboardRole) {
  const response = await page.context().request.post(`${getBaseUrl()}/api/dev-role`, {
    data: { role },
  });

  expect(response.ok()).toBeTruthy();
}

export async function clearDashboardRoleOverride(page: Page) {
  const response = await page.context().request.delete(`${getBaseUrl()}/api/dev-role`);

  expect(response.ok()).toBeTruthy();
}

export async function loginViaUi(page: Page) {
  const { identity, password } = getAdminCredentials();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();

  await page.getByLabel("Email o usuario").fill(identity);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: "COMMAND CENTER" })).toBeVisible();
}
