import { getResendEnv } from "@/lib/env";

interface SendResendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string | string[] | null;
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

function normalizeReplyTo(replyTo: string | string[] | null | undefined) {
  if (!replyTo) {
    return undefined;
  }

  return Array.isArray(replyTo) ? replyTo : [replyTo];
}

function parseResendErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if (
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return null;
}

function isRetriableResendStatus(status: number) {
  return status === 429 || status >= 500;
}

export async function sendResendEmail(input: SendResendEmailInput) {
  const resend = getResendEnv();
  const attempts = [0, 250, 800];
  let lastError: Error | null = null;

  for (const [index, delayMs] of attempts.entries()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from ?? resend.fromEmail,
        to: normalizeRecipients(input.to),
        reply_to: normalizeReplyTo(input.replyTo),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (response.ok) {
      return (await response.json()) as { id: string };
    }

    const rawText = await response.text().catch(() => "");
    let parsedPayload: unknown = null;

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText) as unknown;
      } catch {
        parsedPayload = rawText;
      }
    }

    const providerMessage =
      parseResendErrorPayload(parsedPayload) ||
      (typeof parsedPayload === "string" ? parsedPayload : null) ||
      response.statusText ||
      "Respuesta sin detalle";

    lastError = new Error(
      `Resend (${response.status}) no pudo enviar el email: ${providerMessage}`,
    );

    if (!isRetriableResendStatus(response.status) || index === attempts.length - 1) {
      break;
    }
  }

  throw lastError ?? new Error("Resend no pudo enviar el email.");
}
