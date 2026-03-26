import { beforeEach, describe, expect, it, vi } from "vitest";

const mailjetEnvMocks = vi.hoisted(() => ({
  getMailjetEnv: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getMailjetEnv: mailjetEnvMocks.getMailjetEnv,
}));

import { sendMailjetEmail } from "@/lib/email/mailjet";

describe("sendMailjetEmail", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    mailjetEnvMocks.getMailjetEnv.mockReset();
    mailjetEnvMocks.getMailjetEnv.mockReturnValue({
      apiKey: "mj_api",
      secretKey: "mj_secret",
      fromEmail: "Nova Forza <mailer@yampi.eu>",
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
        new Response(
          JSON.stringify({
            Messages: [
              {
                Status: "success",
              },
            ],
          }),
          {
          status: 200,
          headers: { "Content-Type": "application/json" },
          },
        ),
      );

    await expect(
      sendMailjetEmail({
        to: "socio@gym.com",
        subject: "Test",
        html: "<p>Hola</p>",
        text: "Hola",
      }),
    ).resolves.toEqual({
      Messages: [
        {
          Status: "success",
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces the provider message for non-retriable errors", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          Messages: [
            {
              Status: "error",
              Errors: [{ ErrorMessage: "Invalid sender address" }],
            },
          ],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(
      sendMailjetEmail({
        to: "socio@gym.com",
        subject: "Test",
        html: "<p>Hola</p>",
        text: "Hola",
      }),
    ).rejects.toThrow("Mailjet (400) no pudo enviar el email: Invalid sender address");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes reply-to when provided", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          Messages: [
            {
              Status: "success",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await sendMailjetEmail({
      to: "socio@gym.com",
      from: "Nova Forza <mailer@yampi.eu>",
      replyTo: "pedidos@gmail.com",
      subject: "Test",
      html: "<p>Hola</p>",
      text: "Hola",
      customId: "pickup-request:pick_01:customer",
      eventPayload: "{\"type\":\"pickup_request_email\"}",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mailjet.com/v3.1/send",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
        body: expect.stringContaining("\"ReplyTo\":{\"Email\":\"pedidos@gmail.com\"}"),
      }),
    );
  });
});
