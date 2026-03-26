import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const welcomeRouteMocks = vi.hoisted(() => ({
  hasResendEnv: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  sendMemberWelcomeEmail: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasResendEnv: welcomeRouteMocks.hasResendEnv,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: welcomeRouteMocks.createSupabaseAdminClient,
}));

vi.mock("@/lib/email/welcome-member", () => ({
  sendMemberWelcomeEmail: welcomeRouteMocks.sendMemberWelcomeEmail,
}));

import { POST } from "@/app/api/auth/welcome/route";

describe("POST /api/auth/welcome", () => {
  beforeEach(() => {
    welcomeRouteMocks.hasResendEnv.mockReturnValue(true);
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
    expect(welcomeRouteMocks.sendMemberWelcomeEmail).toHaveBeenCalledWith("member@gym.com");
    expect(payload).toEqual({ queued: true });
  });

  it("returns a non-blocking response when resend is not configured", async () => {
    welcomeRouteMocks.hasResendEnv.mockReturnValue(false);

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
