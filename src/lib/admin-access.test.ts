import { isAllowedAdminEmail, normalizeAdminAllowedEmails } from "@/lib/admin-access";

describe("admin access helpers", () => {
  it("normalizes allowlisted emails", () => {
    expect(
      normalizeAdminAllowedEmails([" Owner@Gym.com ", "", "manager@gym.com "]),
    ).toEqual(["owner@gym.com", "manager@gym.com"]);
  });

  it("checks allowed admin emails case insensitively", () => {
    expect(
      isAllowedAdminEmail("OWNER@GYM.COM", ["owner@gym.com", "manager@gym.com"]),
    ).toBe(true);
    expect(isAllowedAdminEmail("staff@gym.com", ["owner@gym.com"])).toBe(false);
  });
});
