export function normalizeAdminAllowedEmails(value: string[] | null | undefined) {
  return (value ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(
  email: string | null | undefined,
  allowedEmails: string[] | null | undefined,
) {
  if (!email) {
    return false;
  }

  return normalizeAdminAllowedEmails(allowedEmails).includes(email.trim().toLowerCase());
}
