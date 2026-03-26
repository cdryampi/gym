import { beforeEach, describe, expect, it, vi } from "vitest";

const resendEnvMocks = vi.hoisted(() => ({
  getResendEnv: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getResendEnv: resendEnvMocks.getResendEnv,
}));

import { sendResendEmail } from "@/lib/email/resend";

describe("sendResendEmail", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    resendEnvMocks.getResendEnv.mockReset();
    resendEnvMocks.getResendEnv.mockReturnValue({
      apiKey: "re_test",
      fromEmail: "Nova Forza <onboarding@resend.dev>",
    });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("retries transient provider failures and succeeds on a later attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "temporary outage" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "email_01" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(
      sendResendEmail({
        to: "socio@gym.com",
        subject: "Test",
        html: "<p>Hola</p>",
        text: "Hola",
      }),
    ).resolves.toEqual({ id: "email_01" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces the provider message for non-retriable errors", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid from address" } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      sendResendEmail({
        to: "socio@gym.com",
        subject: "Test",
        html: "<p>Hola</p>",
        text: "Hola",
      }),
    ).rejects.toThrow("Resend (422) no pudo enviar el email: Invalid from address");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes reply-to when provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "email_02" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await sendResendEmail({
      to: "socio@gym.com",
      from: "Nova Forza <onboarding@resend.dev>",
      replyTo: "pedidos@gmail.com",
      subject: "Test",
      html: "<p>Hola</p>",
      text: "Hola",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        body: expect.stringContaining("\"reply_to\":[\"pedidos@gmail.com\"]"),
      }),
    );
  });
});
