export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function extractMailbox(value: string) {
  const match = value.match(/<([^>]+)>/);
  return normalizeEmailAddress(match ? match[1] : value);
}

function extractDomain(mailbox: string) {
  const [, domain] = normalizeEmailAddress(mailbox).split("@");
  return domain ?? null;
}

export function isAllowedTransactionalMailbox(
  configuredMailbox: string,
  fallbackFromEmail: string,
) {
  const normalizedConfigured = normalizeEmailAddress(configuredMailbox);
  const fallbackMailbox = extractMailbox(fallbackFromEmail);

  return extractDomain(normalizedConfigured) === extractDomain(fallbackMailbox);
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

  if (isAllowedTransactionalMailbox(normalizedConfigured, fallbackFromEmail)) {
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
