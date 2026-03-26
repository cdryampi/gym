import { Buffer } from "node:buffer";

import { getMailjetEnv } from "@/lib/env";
import { extractMailbox } from "@/lib/email/policy";

interface SendMailjetEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string | string[] | null;
  customId?: string | null;
  eventPayload?: string | null;
  headers?: Record<string, string> | null;
}

interface MailjetRecipient {
  Email: string;
  Name?: string;
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

function normalizeReplyTo(replyTo: string | string[] | null | undefined) {
  if (!replyTo) {
    return [];
  }

  return Array.isArray(replyTo) ? replyTo : [replyTo];
}

function parseRecipient(value: string): MailjetRecipient {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)<([^>]+)>$/);

  if (!match) {
    return {
      Email: extractMailbox(trimmed),
    };
  }

  const name = match[1]?.trim().replace(/^"|"$/g, "");
  const email = extractMailbox(match[2]);

  return {
    Email: email,
    ...(name ? { Name: name } : {}),
  };
}

function parseMailjetErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("ErrorMessage" in payload && typeof payload.ErrorMessage === "string") {
    return payload.ErrorMessage;
  }

  if ("Message" in payload && typeof payload.Message === "string") {
    return payload.Message;
  }

  if ("Messages" in payload && Array.isArray(payload.Messages)) {
    const messages = payload.Messages as Array<Record<string, unknown>>;

    for (const message of messages) {
      if ("Errors" in message && Array.isArray(message.Errors) && message.Errors.length > 0) {
        const firstError = message.Errors[0];

        if (
          firstError &&
          typeof firstError === "object" &&
          "ErrorMessage" in firstError &&
          typeof firstError.ErrorMessage === "string"
        ) {
          return firstError.ErrorMessage;
        }
      }
    }
  }

  return null;
}

function isRetriableMailjetStatus(status: number) {
  return status === 429 || status >= 500;
}

export async function sendMailjetEmail(input: SendMailjetEmailInput) {
  const mailjet = getMailjetEnv();
  const attempts = [0, 250, 800];
  let lastError: Error | null = null;
  const authToken = Buffer.from(`${mailjet.apiKey}:${mailjet.secretKey}`).toString("base64");

  const from = parseRecipient(input.from ?? mailjet.fromEmail);
  const to = normalizeRecipients(input.to).map(parseRecipient);
  const replyTo = normalizeReplyTo(input.replyTo).map(parseRecipient);

  for (const [index, delayMs] of attempts.entries()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Messages: [
          {
            From: from,
            To: to,
            ...(replyTo.length > 0 ? { ReplyTo: replyTo[0] } : {}),
            Subject: input.subject,
            HTMLPart: input.html,
            TextPart: input.text,
            ...(input.customId ? { CustomID: input.customId } : {}),
            ...(input.eventPayload ? { EventPayload: input.eventPayload } : {}),
            ...(input.headers ? { Headers: input.headers } : {}),
          },
        ],
      }),
    });

    const rawText = await response.text().catch(() => "");
    let parsedPayload: unknown = null;

    if (rawText) {
      try {
        parsedPayload = JSON.parse(rawText) as unknown;
      } catch {
        parsedPayload = rawText;
      }
    }

    if (response.ok) {
      const messageStatus =
        parsedPayload &&
        typeof parsedPayload === "object" &&
        "Messages" in parsedPayload &&
        Array.isArray(parsedPayload.Messages) &&
        parsedPayload.Messages[0] &&
        typeof parsedPayload.Messages[0] === "object" &&
        "Status" in parsedPayload.Messages[0]
          ? parsedPayload.Messages[0].Status
          : null;

      if (messageStatus === "success") {
        return parsedPayload as {
          Messages: Array<{
            Status: string;
            To?: Array<{
              MessageID?: number;
              MessageUUID?: string;
            }>;
          }>;
        };
      }
    }

    const providerMessage =
      parseMailjetErrorPayload(parsedPayload) ||
      (typeof parsedPayload === "string" ? parsedPayload : null) ||
      response.statusText ||
      "Respuesta sin detalle";

    lastError = new Error(
      `Mailjet (${response.status}) no pudo enviar el email: ${providerMessage}`,
    );

    if (!isRetriableMailjetStatus(response.status) || index === attempts.length - 1) {
      break;
    }
  }

  throw lastError ?? new Error("Mailjet no pudo enviar el email.");
}
