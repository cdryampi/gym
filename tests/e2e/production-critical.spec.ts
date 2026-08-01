import { expect, test } from "@playwright/test";

test.describe("production critical public flows", () => {
  test("blocks unauthenticated dashboard access", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?.*error=admin-only/);
    await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  });

  test("submits contact without persisting QA data", async ({ page }) => {
    await page.route("**/api/leads", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/#contacto");
    await page.getByLabel("Nombre completo").fill("QA Produccion");
    await page.getByLabel("Email", { exact: true }).fill("qa-production@example.com");
    await page.getByLabel("Mensaje").fill("Validacion automatizada del formulario de contacto.");
    await page.getByRole("button", { name: "Enviar solicitud de prueba" }).click();

    await expect(page.getByText(/mensaje|solicitud/i).last()).toBeVisible();
  });

  test("requests account recovery without sending a real email", async ({ page }) => {
    await page.route("**/api/auth/password-reset", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/recuperar-contrasena");
    await page.getByLabel("Email").fill("qa-production@example.com");
    await page.getByRole("button", { name: "Enviar enlace de recuperacion" }).click();

    await expect(page.getByText(/revisa|enlace|correo/i).last()).toBeVisible();
  });

  test("opens a Medusa product from the cacheable catalog", async ({ page }) => {
    await page.goto("/tienda");

    const productLink = page.getByRole("link", { name: "Ver mas" }).first();
    await expect(productLink).toBeVisible();
    await Promise.all([page.waitForURL(/\/tienda\/[^/?#]+$/), productLink.click()]);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText(/recogida|stock|producto/i).first()).toBeVisible();
  });

  test("keeps an empty cart actionable", async ({ page }) => {
    await page.goto("/carrito");

    await expect(page.getByText(/Carrito vacio/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Ir a la tienda/i })).toBeVisible();
  });

  test("adds an available Medusa product to the pickup reservation", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/tienda");

    const productLinks = page.getByRole("link", { name: "Ver mas" });
    await expect(productLinks.first()).toBeVisible();
    const productHrefs = await productLinks
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href"))
          .filter((href): href is string => Boolean(href)),
      );

    expect(productHrefs.length).toBeGreaterThan(0);

    let addedProduct = false;

    for (const productHref of productHrefs.slice(0, 6)) {
      await page.goto(productHref);
      const addButton = page.getByRole("button", { name: /A.adir a la reserva/i });

      if (!(await addButton.isVisible()) || (await addButton.isDisabled())) {
        const optionButton = page
          .locator('[data-component="product-detail"] button:not([aria-label])')
          .filter({ hasNotText: /A.adir a la reserva|AGOTADO|PROCESANDO/i })
          .first();

        if (await optionButton.isVisible()) {
          await optionButton.click();
        }
      }

      if (await addButton.isEnabled()) {
        await addButton.click();
        await expect(page.getByText(/Producto a.adido/i)).toBeVisible({ timeout: 45_000 });
        addedProduct = true;
        break;
      }
    }

    expect(addedProduct).toBeTruthy();
    await page.goto("/carrito");
    await expect(page.getByText(/Carrito vacio/i)).toHaveCount(0);
    await expect(page.getByText(/recogida|reserva/i).first()).toBeVisible();
  });
});
