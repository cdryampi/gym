import { describe, expect, it } from "vitest";

import {
  LEGACY_PAYPAL_PAYMENT_PROVIDER_ID,
  mergeRegionPaymentProviderIds,
  PAYPAL_PAYMENT_PROVIDER_ID,
  pickOperationalPayPalProviderId,
} from "@/lib/medusa/paypal-provider";

describe("paypal provider helpers", () => {
  it("prefers the canonical PayPal provider id when both variants exist", () => {
    expect(
      pickOperationalPayPalProviderId([
        "pp_system_default",
        LEGACY_PAYPAL_PAYMENT_PROVIDER_ID,
        PAYPAL_PAYMENT_PROVIDER_ID,
      ]),
    ).toBe(PAYPAL_PAYMENT_PROVIDER_ID);
  });

  it("falls back to the legacy PayPal provider id for old Medusa registrations", () => {
    expect(
      pickOperationalPayPalProviderId([
        "pp_system_default",
        LEGACY_PAYPAL_PAYMENT_PROVIDER_ID,
      ]),
    ).toBe(LEGACY_PAYPAL_PAYMENT_PROVIDER_ID);
  });

  it("merges region payment providers without duplicating ids", () => {
    expect(
      mergeRegionPaymentProviderIds(
        ["pp_system_default", PAYPAL_PAYMENT_PROVIDER_ID, "pp_system_default"],
        PAYPAL_PAYMENT_PROVIDER_ID,
      ),
    ).toEqual(["pp_system_default", PAYPAL_PAYMENT_PROVIDER_ID]);
  });
});
