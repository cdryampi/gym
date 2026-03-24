export const PAYPAL_PAYMENT_PROVIDER_ID = "pp_paypal_paypal";
export const LEGACY_PAYPAL_PAYMENT_PROVIDER_ID = "pp_paypal_pp_paypal_paypal";

export function isPayPalPaymentProviderId(value: string | null | undefined) {
  return (
    value === PAYPAL_PAYMENT_PROVIDER_ID ||
    value === LEGACY_PAYPAL_PAYMENT_PROVIDER_ID
  );
}

function normalizeProviderIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

export function pickOperationalPayPalProviderId(ids: Array<string | null | undefined>) {
  const normalized = normalizeProviderIds(ids);

  if (normalized.includes(PAYPAL_PAYMENT_PROVIDER_ID)) {
    return PAYPAL_PAYMENT_PROVIDER_ID;
  }

  if (normalized.includes(LEGACY_PAYPAL_PAYMENT_PROVIDER_ID)) {
    return LEGACY_PAYPAL_PAYMENT_PROVIDER_ID;
  }

  return null;
}

export function mergeRegionPaymentProviderIds(
  currentIds: Array<string | null | undefined>,
  targetId: string,
) {
  return normalizeProviderIds([...currentIds, targetId]);
}
