export const RESEND_ALLOWED_FROM_DOMAIN = "novaforza.pe";

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function isAllowedTransactionalMailbox(value: string) {
  const normalized = normalizeEmailAddress(value);
  return normalized.endsWith(`@${RESEND_ALLOWED_FROM_DOMAIN}`);
}

export function formatTransactionalFromEmail(siteName: string, mailbox: string) {
  return `${siteName.trim() || "Nova Forza"} <${normalizeEmailAddress(mailbox)}>`;
}
