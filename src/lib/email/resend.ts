import { getResendEnv } from "@/lib/env";

interface SendResendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to];
}

export async function sendResendEmail(input: SendResendEmailInput) {
  const resend = getResendEnv();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resend.fromEmail,
      to: normalizeRecipients(input.to),
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    throw new Error(payload?.error?.message ?? "Resend no pudo enviar el email.");
  }

  return (await response.json()) as { id: string };
}
