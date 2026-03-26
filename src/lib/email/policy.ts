export const RESEND_ALLOWED_FROM_DOMAIN = "novaforza.pe";

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

function extractMailbox(value: string) {
  const match = value.match(/<([^>]+)>/);
  return normalizeEmailAddress(match ? match[1] : value);
}

export function isAllowedTransactionalMailbox(value: string) {
  const normalized = normalizeEmailAddress(value);
  return normalized.endsWith(`@${RESEND_ALLOWED_FROM_DOMAIN}`);
}

export function formatTransactionalFromEmail(siteName: string, mailbox: string) {
  return `${siteName.trim() || "Nova Forza"} <${normalizeEmailAddress(mailbox)}>`;
}

export function resolveTransactionalSender(
  siteName: string,
  configuredMailbox: string | null | undefined,
  fallbackFromEmail: string,
) {
  const normalizedConfigured = configuredMailbox?.trim()
    ? normalizeEmailAddress(configuredMailbox)
    : null;
  const fallbackMailbox = extractMailbox(fallbackFromEmail);

  if (!normalizedConfigured) {
    return {
      fromEmail: fallbackFromEmail,
      replyTo: null,
    };
  }

  if (isAllowedTransactionalMailbox(normalizedConfigured)) {
    return {
      fromEmail: formatTransactionalFromEmail(siteName, normalizedConfigured),
      replyTo: null,
    };
  }

  return {
    fromEmail: fallbackFromEmail,
    replyTo:
      normalizedConfigured === fallbackMailbox ? null : normalizedConfigured,
  };
}
