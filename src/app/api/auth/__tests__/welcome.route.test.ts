import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const welcomeRouteMocks = vi.hoisted(() => ({
  hasMailjetEnv: vi.fn(),
  getMailjetEnv: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getMarketingData: vi.fn(),
  sendMemberWelcomeEmail: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasMailjetEnv: welcomeRouteMocks.hasMailjetEnv,
  getMailjetEnv: welcomeRouteMocks.getMailjetEnv,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: welcomeRouteMocks.createSupabaseAdminClient,
}));

vi.mock("@/lib/data/site", () => ({
  getMarketingData: welcomeRouteMocks.getMarketingData,
}));

vi.mock("@/lib/email/welcome-member", () => ({
  sendMemberWelcomeEmail: welcomeRouteMocks.sendMemberWelcomeEmail,
}));

import { POST } from "@/app/api/auth/welcome/route";

describe("POST /api/auth/welcome", () => {
  beforeEach(() => {
    welcomeRouteMocks.hasMailjetEnv.mockReturnValue(true);
    welcomeRouteMocks.getMailjetEnv.mockReturnValue({
      fromEmail: "Nova Forza <mailer@yampi.eu>",
    });
    welcomeRouteMocks.createSupabaseAdminClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [
                {
                  email: "member@gym.com",
                },
              ],
            },
            error: null,
          }),
        },
      },
    });
    welcomeRouteMocks.getMarketingData.mockResolvedValue({
      settings: {
        site_name: "Nova Forza",
        transactional_from_email: "pedidos@gmail.com",
      },
    });
    welcomeRouteMocks.sendMemberWelcomeEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends the welcome email when the auth user exists", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/welcome", {
        method: "POST",
        body: JSON.stringify({
          email: "member@gym.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(welcomeRouteMocks.sendMemberWelcomeEmail).toHaveBeenCalledWith(
      "member@gym.com",
      "Nova Forza",
      "Nova Forza <mailer@yampi.eu>",
      "pedidos@gmail.com",
    );
    expect(payload).toEqual({ queued: true });
  });

  it("returns a non-blocking response when Mailjet is not configured", async () => {
    welcomeRouteMocks.hasMailjetEnv.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/auth/welcome", {
        method: "POST",
        body: JSON.stringify({
          email: "member@gym.com",
        }),
      }),
    );

    expect(response.status).toBe(202);
    expect(welcomeRouteMocks.sendMemberWelcomeEmail).not.toHaveBeenCalled();
  });
});
