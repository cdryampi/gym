import { expect, test } from "@playwright/test";

import { getBaseUrl } from "./helpers/env";
import { loginAsAdmin } from "./helpers/auth";

const CSV_HEADER =
  "id,member_number,full_name,email,phone,status,branch_name,join_date,birth_date,gender,address,district_or_urbanization,occupation,preferred_schedule,external_code,profile_completed,notes,legacy_notes,training_plan_label,membership_plan_id,membership_qr_token,supabase_user_id,trainer_user_id,created_at,updated_at";

test.describe("dashboard members smoke", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("keeps members filters in url and exports csv through authenticated request context", async ({
    page,
  }) => {
    await page.goto("/dashboard/miembros");

    await expect(page.getByRole("heading", { level: 1, name: "MEMBER SCOUTING" })).toBeVisible();
    await expect(page.getByText("Socios Registrados")).toBeVisible();

    await page.getByRole("searchbox").fill("Titan");
    await page.locator('select[name="status"]').selectOption("active");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/\/dashboard\/miembros\?q=Titan&status=active/);

    const exportLink = page.getByRole("link", { name: /Descargar CSV/i });
    await expect(exportLink).toHaveAttribute(
      "href",
      "/api/dashboard/members/export?q=Titan&status=active",
    );

    const href = await exportLink.getAttribute("href");
    expect(href).toBeTruthy();

    const response = await page.context().request.get(`${getBaseUrl()}${href!}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv; charset=utf-8");
    expect(response.headers()["content-disposition"]).toContain("attachment; filename=");
    expect(await response.text()).toContain(CSV_HEADER);
  });
});
