import { test } from "@playwright/test";

import { loginViaUi } from "./helpers/auth";

test.describe("dashboard login smoke", () => {
  test("allows access through the admin login UI", async ({ page }) => {
    await loginViaUi(page);
  });
});
