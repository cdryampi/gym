export const GYM_COOKIE_CONSENT = "gym_cookie_consent";
export const GYM_COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

export type CookieConsentValue = "accepted" | "rejected";

function buildConsentCookie(value: CookieConsentValue, maxAge = GYM_COOKIE_CONSENT_MAX_AGE) {
  return `${GYM_COOKIE_CONSENT}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function getCookieConsentFromDocument() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of cookies) {
    if (!entry.startsWith(`${GYM_COOKIE_CONSENT}=`)) {
      continue;
    }

    const value = entry.slice(GYM_COOKIE_CONSENT.length + 1);
    return value === "accepted" || value === "rejected" ? value : null;
  }

  return null;
}

export function persistCookieConsent(value: CookieConsentValue) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = buildConsentCookie(value);
}
