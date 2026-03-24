import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };
const envKeysUnderTest = [
  "NEXT_PUBLIC_COMMERCE_CURRENCY_CODE",
  "NEXT_PUBLIC_COMMERCE_LOCALE",
  "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_MEDUSA_REGION_ID",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_ALLOWED_EMAILS",
  "ADMIN_PASSWORD",
  "ADMIN_USER",
  "COMMERCE_CURRENCY_CODE",
  "COMMERCE_LOCALE",
  "COMMERCE_PROVIDER",
  "STORE_ADMIN_PROVIDER",
  "MEDUSA_BACKEND_URL",
  "MEDUSA_ADMIN_API_KEY",
  "MEDUSA_PUBLISHABLE_KEY",
  "MEDUSA_REGION_ID",
  "PAYPAL_AUTO_CAPTURE",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_WEBHOOK_ID",
  "PAYMENT_TEST_ADDRESS_1",
  "PAYMENT_TEST_ADDRESS_2",
  "PAYMENT_TEST_CARD_BRAND",
  "PAYMENT_TEST_CARD_CVV",
  "PAYMENT_TEST_CARD_EXPIRY",
  "PAYMENT_TEST_CARD_NUMBER",
  "PAYMENT_TEST_CITY",
  "PAYMENT_TEST_COUNTRY_CODE",
  "PAYMENT_TEST_DOCUMENT_NUMBER",
  "PAYMENT_TEST_DOCUMENT_TYPE",
  "PAYMENT_TEST_EMAIL",
  "PAYMENT_TEST_FIRST_NAME",
  "PAYMENT_TEST_LAST_NAME",
  "PAYMENT_TEST_PHONE",
  "PAYMENT_TEST_POSTAL_CODE",
  "PAYMENT_TEST_STATE",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function buildCleanEnv() {
  const nextEnv = { ...originalEnv } as NodeJS.ProcessEnv;

  for (const key of envKeysUnderTest) {
    delete nextEnv[key];
  }

  return nextEnv;
}

async function importEnvModule(env: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...buildCleanEnv(), ...env } as NodeJS.ProcessEnv;
  return import("@/lib/env");
}

describe("env provider constraints", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("defaults commerce and dashboard providers to Medusa", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      COMMERCE_PROVIDER: undefined,
      STORE_ADMIN_PROVIDER: undefined,
    });

    expect(env.getCommerceProvider()).toBe("medusa");
    expect(env.getStoreAdminProvider()).toBe("medusa");
  });

  it("rejects legacy commerce providers at import time", async () => {
    await expect(
      importEnvModule({
        NODE_ENV: "test",
        COMMERCE_PROVIDER: "auto",
      }),
    ).rejects.toThrow();

    await expect(
      importEnvModule({
        NODE_ENV: "test",
        STORE_ADMIN_PROVIDER: "supabase",
      }),
    ).rejects.toThrow();
  });

  it("exposes PEN and es-PE defaults for commerce display", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      COMMERCE_CURRENCY_CODE: undefined,
      COMMERCE_LOCALE: undefined,
      NEXT_PUBLIC_COMMERCE_CURRENCY_CODE: undefined,
      NEXT_PUBLIC_COMMERCE_LOCALE: undefined,
    });

    expect(env.getCommerceDisplayEnv()).toEqual({
      currencyCode: "PEN",
      locale: "es-PE",
    });
  });

  it("allows overriding commerce display currency and locale via env", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      COMMERCE_CURRENCY_CODE: "usd",
      COMMERCE_LOCALE: "en-US",
    });

    expect(env.getCommerceDisplayEnv()).toEqual({
      currencyCode: "USD",
      locale: "en-US",
    });
  });

  it("treats empty docker build args as undefined instead of invalid env", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: "",
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_COMMERCE_CURRENCY_CODE: "",
      NEXT_PUBLIC_COMMERCE_LOCALE: "",
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "",
    });

    expect(env.hasSupabasePublicEnv()).toBe(false);
    expect(env.hasMedusaEnv()).toBe(false);
    expect(env.hasPayPalClientEnv()).toBe(false);
    expect(env.getCommerceDisplayEnv()).toEqual({
      currencyCode: "PEN",
      locale: "es-PE",
    });
  });

  it("accepts a valid PayPal sandbox configuration", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYPAL_CLIENT_ID: "paypal-client-id",
      PAYPAL_CLIENT_SECRET: "paypal-client-secret",
      PAYPAL_ENVIRONMENT: "sandbox",
      PAYPAL_AUTO_CAPTURE: "true",
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "paypal-client-id",
    });

    expect(env.hasPayPalEnv()).toBe(true);
    expect(env.hasPayPalClientEnv()).toBe(true);
    expect(env.getPayPalEnv()).toEqual({
      clientId: "paypal-client-id",
      clientSecret: "paypal-client-secret",
      environment: "sandbox",
      autoCapture: true,
      webhookId: null,
      publicClientId: "paypal-client-id",
    });
    expect(env.getPayPalClientEnv()).toEqual({
      clientId: "paypal-client-id",
    });
  });

  it("rejects invalid PayPal environments at import time", async () => {
    await expect(
      importEnvModule({
        NODE_ENV: "test",
        PAYPAL_ENVIRONMENT: "staging",
      }),
    ).rejects.toThrow();
  });

  it("accepts production as a valid PayPal environment", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYPAL_CLIENT_ID: "paypal-client-id",
      PAYPAL_CLIENT_SECRET: "paypal-client-secret",
      PAYPAL_ENVIRONMENT: "production",
    });

    expect(env.getPayPalEnv().environment).toBe("production");
  });

  it("defaults PayPal auto capture to true when omitted", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYPAL_CLIENT_ID: "paypal-client-id",
      PAYPAL_CLIENT_SECRET: "paypal-client-secret",
    });

    expect(env.getPayPalEnv().autoCapture).toBe(true);
  });

  it("throws when PayPal secret is missing", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYPAL_CLIENT_ID: "paypal-client-id",
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: "paypal-client-id",
    });

    expect(env.hasPayPalEnv()).toBe(false);
    expect(() => env.getPayPalEnv()).toThrow("PAYPAL_CLIENT_SECRET");
  });

  it("provides a default Peru sandbox payment profile", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYMENT_TEST_EMAIL: undefined,
      PAYMENT_TEST_COUNTRY_CODE: undefined,
      PAYMENT_TEST_DOCUMENT_TYPE: undefined,
    });

    expect(env.getPaymentTestProfileEnv()).toEqual({
      email: "sandbox-buyer.pe@novaforza.test",
      firstName: "Carlos",
      lastName: "Prueba",
      phone: "+51987654321",
      countryCode: "PE",
      state: "Lima",
      city: "Lima",
      address1: "Av. Javier Prado Este 560",
      address2: "San Isidro",
      postalCode: "15036",
      documentType: "DNI",
      documentNumber: "12345678",
      cardBrand: "visa",
      cardNumber: "4111111111111111",
      cardExpiry: "12/2030",
      cardCvv: "123",
    });
  });

  it("allows overriding the sandbox payment profile through env vars", async () => {
    const env = await importEnvModule({
      NODE_ENV: "test",
      PAYMENT_TEST_EMAIL: "comprador.pe@test.dev",
      PAYMENT_TEST_FIRST_NAME: "Lucia",
      PAYMENT_TEST_LAST_NAME: "Sandbox",
      PAYMENT_TEST_PHONE: "+51999111222",
      PAYMENT_TEST_COUNTRY_CODE: "pe",
      PAYMENT_TEST_STATE: "Cusco",
      PAYMENT_TEST_CITY: "Cusco",
      PAYMENT_TEST_ADDRESS_1: "Av. El Sol 123",
      PAYMENT_TEST_ADDRESS_2: "Wanchaq",
      PAYMENT_TEST_POSTAL_CODE: "08002",
      PAYMENT_TEST_DOCUMENT_TYPE: "CE",
      PAYMENT_TEST_DOCUMENT_NUMBER: "ABC12345",
      PAYMENT_TEST_CARD_BRAND: "mastercard",
      PAYMENT_TEST_CARD_NUMBER: "5555555555554444",
      PAYMENT_TEST_CARD_EXPIRY: "11/2031",
      PAYMENT_TEST_CARD_CVV: "456",
    });

    expect(env.getPaymentTestProfileEnv()).toEqual({
      email: "comprador.pe@test.dev",
      firstName: "Lucia",
      lastName: "Sandbox",
      phone: "+51999111222",
      countryCode: "PE",
      state: "Cusco",
      city: "Cusco",
      address1: "Av. El Sol 123",
      address2: "Wanchaq",
      postalCode: "08002",
      documentType: "CE",
      documentNumber: "ABC12345",
      cardBrand: "mastercard",
      cardNumber: "5555555555554444",
      cardExpiry: "11/2031",
      cardCvv: "456",
    });
  });
});
