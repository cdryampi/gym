import { beforeEach, describe, expect, it, vi } from "vitest";

const mailjetEventRouteMocks = vi.hoisted(() => ({
  getMailjetEventToken: vi.fn(),
  markPickupRequestEmailResult: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getMailjetEventToken: mailjetEventRouteMocks.getMailjetEventToken,
}));

vi.mock("@/lib/cart/member-bridge", () => ({
  markPickupRequestEmailResult: mailjetEventRouteMocks.markPickupRequestEmailResult,
}));

import { POST } from "@/app/api/mailjet/events/route";

describe("POST /api/mailjet/events", () => {
  beforeEach(() => {
    mailjetEventRouteMocks.getMailjetEventToken.mockReturnValue(null);
    mailjetEventRouteMocks.markPickupRequestEmailResult.mockReset();
    mailjetEventRouteMocks.markPickupRequestEmailResult.mockResolvedValue({});
  });

  it("marks customer pickup emails as failed when Mailjet reports a bounce", async () => {
    const response = await POST(
      new Request("http://localhost/api/mailjet/events", {
        method: "POST",
        body: JSON.stringify({
          event: "bounce",
          time: 1_774_604_800,
          CustomID: "pickup-request:pick_01:customer",
          comment: "user unknown",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mailjetEventRouteMocks.markPickupRequestEmailResult).toHaveBeenCalledWith(
      "pick_01",
      {
        emailStatus: "failed",
        emailError: "Mailjet bounce: user unknown",
      },
    );
    expect(payload).toEqual({ ok: true, processed: 1 });
  });

  it("ignores internal delivery events", async () => {
    const response = await POST(
      new Request("http://localhost/api/mailjet/events", {
        method: "POST",
        body: JSON.stringify({
          event: "delivered",
          time: 1_774_604_800,
          CustomID: "pickup-request:pick_01:internal",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mailjetEventRouteMocks.markPickupRequestEmailResult).not.toHaveBeenCalled();
    expect(payload).toEqual({ ok: true, processed: 0 });
  });

  it("rejects webhook calls with an invalid token when configured", async () => {
    mailjetEventRouteMocks.getMailjetEventToken.mockReturnValue("secret-token");

    const response = await POST(
      new Request("http://localhost/api/mailjet/events?token=wrong-token", {
        method: "POST",
        body: JSON.stringify({
          event: "delivered",
          CustomID: "pickup-request:pick_01:customer",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mailjetEventRouteMocks.markPickupRequestEmailResult).not.toHaveBeenCalled();
  });
});
