import { z } from "zod";

import { defaultPeruPaymentTestProfile } from "@/lib/paypal/test-profile";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function looksLikeTemplatePlaceholder(value: string) {
  const normalized = value.trim().toUpperCase();

  return /^(TU|GENERA)_[A-Z0-9_]+$/.test(normalized);
}

function optionalString(schema: z.ZodString) {
  return z.preprocess((value) => {
    const normalized = emptyStringToUndefined(value);

    if (typeof normalized === "string" && looksLikeTemplatePlaceholder(normalized)) {
      return undefined;
    }

    return normalized;
  }, schema.optional());
}

function optionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyStringToUndefined, z.enum(values).optional());
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_COMMERCE_CURRENCY_CODE: optionalString(z.string().length(3)),
  NEXT_PUBLIC_COMMERCE_LOCALE: optionalString(z.string().min(2)),
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: optionalString(z.string().url()),
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: optionalString(z.string().min(1)),
  NEXT_PUBLIC_MEDUSA_REGION_ID: optionalString(z.string().min(1)),
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: optionalString(z.string().min(1)),
  NEXT_PUBLIC_SUPABASE_URL: optionalString(z.string().url()),
  SUPABASE_URL: optionalString(z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString(z.string().min(1)),
});

const serverEnvSchema = publicEnvSchema.extend({
  ADMIN_ALLOWED_EMAILS: optionalString(z.string()),
  ADMIN_PASSWORD: optionalString(z.string().min(1)),
  ADMIN_USER: optionalString(z.string().min(1)),
  COMMERCE_CURRENCY_CODE: optionalString(z.string().length(3)),
  COMMERCE_LOCALE: optionalString(z.string().min(2)),
  COMMERCE_PROVIDER: z.literal("medusa").optional(),
  STORE_ADMIN_PROVIDER: z.literal("medusa").optional(),
  MEDUSA_BACKEND_URL: optionalString(z.string().url()),
  MEDUSA_ADMIN_API_KEY: optionalString(z.string().min(1)),
  MEDUSA_PUBLISHABLE_KEY: optionalString(z.string().min(1)),
  MEDUSA_REGION_ID: optionalString(z.string().min(1)),
  PAYPAL_AUTO_CAPTURE: optionalEnum(["true", "false"]),
  PAYPAL_CLIENT_ID: optionalString(z.string().min(1)),
  PAYPAL_CLIENT_SECRET: optionalString(z.string().min(1)),
  PAYPAL_ENVIRONMENT: optionalEnum(["sandbox", "production"]),
  PAYPAL_WEBHOOK_ID: optionalString(z.string().min(1)),
  PAYMENT_TEST_ADDRESS_1: optionalString(z.string().min(1)),
  PAYMENT_TEST_ADDRESS_2: optionalString(z.string().min(1)),
  PAYMENT_TEST_CARD_BRAND: optionalString(z.string().min(1)),
  PAYMENT_TEST_CARD_CVV: optionalString(z.string().min(1)),
  PAYMENT_TEST_CARD_EXPIRY: optionalString(z.string().min(1)),
  PAYMENT_TEST_CARD_NUMBER: optionalString(z.string().min(1)),
  PAYMENT_TEST_CITY: optionalString(z.string().min(1)),
  PAYMENT_TEST_COUNTRY_CODE: optionalString(z.string().length(2)),
  PAYMENT_TEST_DOCUMENT_NUMBER: optionalString(z.string().min(1)),
  PAYMENT_TEST_DOCUMENT_TYPE: optionalString(z.string().min(1)),
  PAYMENT_TEST_EMAIL: optionalString(z.string().email()),
  PAYMENT_TEST_FIRST_NAME: optionalString(z.string().min(1)),
  PAYMENT_TEST_LAST_NAME: optionalString(z.string().min(1)),
  PAYMENT_TEST_PHONE: optionalString(z.string().min(1)),
  PAYMENT_TEST_POSTAL_CODE: optionalString(z.string().min(1)),
  PAYMENT_TEST_STATE: optionalString(z.string().min(1)),
  MAILJET_API_KEY: optionalString(z.string().min(1)),
  MAILJET_SECRET_KEY: optionalString(z.string().min(1)),
  MAILJET_FROM_EMAIL: optionalString(z.string().min(1)),
  MAILJET_EVENT_TOKEN: optionalString(z.string().min(1)),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(z.string().min(1)),
});

const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_COMMERCE_CURRENCY_CODE: process.env.NEXT_PUBLIC_COMMERCE_CURRENCY_CODE,
  NEXT_PUBLIC_COMMERCE_LOCALE: process.env.NEXT_PUBLIC_COMMERCE_LOCALE,
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  NEXT_PUBLIC_MEDUSA_REGION_ID: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MEDUSA_REGION_ID: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
  ADMIN_ALLOWED_EMAILS: process.env.ADMIN_ALLOWED_EMAILS,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_USER: process.env.ADMIN_USER,
  COMMERCE_CURRENCY_CODE: process.env.COMMERCE_CURRENCY_CODE,
  COMMERCE_LOCALE: process.env.COMMERCE_LOCALE,
  COMMERCE_PROVIDER: process.env.COMMERCE_PROVIDER,
  STORE_ADMIN_PROVIDER: process.env.STORE_ADMIN_PROVIDER,
  MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL,
  MEDUSA_ADMIN_API_KEY: process.env.MEDUSA_ADMIN_API_KEY,
  MEDUSA_PUBLISHABLE_KEY: process.env.MEDUSA_PUBLISHABLE_KEY,
  MEDUSA_REGION_ID: process.env.MEDUSA_REGION_ID,
  PAYPAL_AUTO_CAPTURE: process.env.PAYPAL_AUTO_CAPTURE,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT,
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
  PAYMENT_TEST_ADDRESS_1: process.env.PAYMENT_TEST_ADDRESS_1,
  PAYMENT_TEST_ADDRESS_2: process.env.PAYMENT_TEST_ADDRESS_2,
  PAYMENT_TEST_CARD_BRAND: process.env.PAYMENT_TEST_CARD_BRAND,
  PAYMENT_TEST_CARD_CVV: process.env.PAYMENT_TEST_CARD_CVV,
  PAYMENT_TEST_CARD_EXPIRY: process.env.PAYMENT_TEST_CARD_EXPIRY,
  PAYMENT_TEST_CARD_NUMBER: process.env.PAYMENT_TEST_CARD_NUMBER,
  PAYMENT_TEST_CITY: process.env.PAYMENT_TEST_CITY,
  PAYMENT_TEST_COUNTRY_CODE: process.env.PAYMENT_TEST_COUNTRY_CODE,
  PAYMENT_TEST_DOCUMENT_NUMBER: process.env.PAYMENT_TEST_DOCUMENT_NUMBER,
  PAYMENT_TEST_DOCUMENT_TYPE: process.env.PAYMENT_TEST_DOCUMENT_TYPE,
  PAYMENT_TEST_EMAIL: process.env.PAYMENT_TEST_EMAIL,
  PAYMENT_TEST_FIRST_NAME: process.env.PAYMENT_TEST_FIRST_NAME,
  PAYMENT_TEST_LAST_NAME: process.env.PAYMENT_TEST_LAST_NAME,
  PAYMENT_TEST_PHONE: process.env.PAYMENT_TEST_PHONE,
  PAYMENT_TEST_POSTAL_CODE: process.env.PAYMENT_TEST_POSTAL_CODE,
  PAYMENT_TEST_STATE: process.env.PAYMENT_TEST_STATE,
  MAILJET_API_KEY: process.env.MAILJET_API_KEY,
  MAILJET_SECRET_KEY: process.env.MAILJET_SECRET_KEY,
  MAILJET_FROM_EMAIL: process.env.MAILJET_FROM_EMAIL,
  MAILJET_EVENT_TOKEN: process.env.MAILJET_EVENT_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

function resolvePublicSupabaseUrl() {
  return publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? publicEnv.SUPABASE_URL;
}

function resolvePublicSupabaseKey() {
  return publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function resolveMedusaBackendUrl() {
  return publicEnv.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? serverEnv.MEDUSA_BACKEND_URL;
}

function resolveMedusaPublishableKey() {
  return publicEnv.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? serverEnv.MEDUSA_PUBLISHABLE_KEY;
}

function resolveMedusaAdminBackendUrl() {
  return serverEnv.MEDUSA_BACKEND_URL ?? publicEnv.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
}

function normalizeCurrencyCode(value: string | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized && normalized.length === 3 ? normalized : null;
}

function normalizeLocale(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function hasSupabasePublicEnv() {
  return Boolean(resolvePublicSupabaseUrl() && resolvePublicSupabaseKey());
}

export function hasMedusaEnv() {
  return Boolean(resolveMedusaBackendUrl() && resolveMedusaPublishableKey());
}

export function hasSupabaseServiceRole() {
  return Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}

export function getCommerceProvider() {
  return serverEnv.COMMERCE_PROVIDER ?? "medusa";
}

export type StoreAdminProvider = "medusa";

export function getStoreAdminProvider(): StoreAdminProvider {
  return serverEnv.STORE_ADMIN_PROVIDER ?? "medusa";
}

export function getMedusaEnv() {
  const backendUrl = resolveMedusaBackendUrl();
  const publishableKey = resolveMedusaPublishableKey();

  if (!backendUrl || !publishableKey) {
    throw new Error(
      "Missing Medusa environment variables. Set NEXT_PUBLIC_MEDUSA_BACKEND_URL and NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (or their server-side fallbacks MEDUSA_BACKEND_URL and MEDUSA_PUBLISHABLE_KEY).",
    );
  }

  return {
    backendUrl,
    publishableKey,
    regionId: publicEnv.NEXT_PUBLIC_MEDUSA_REGION_ID ?? serverEnv.MEDUSA_REGION_ID,
  };
}

export function getCommerceDisplayEnv() {
  return {
    currencyCode:
      normalizeCurrencyCode(publicEnv.NEXT_PUBLIC_COMMERCE_CURRENCY_CODE) ??
      normalizeCurrencyCode(serverEnv.COMMERCE_CURRENCY_CODE) ??
      "PEN",
    locale:
      normalizeLocale(publicEnv.NEXT_PUBLIC_COMMERCE_LOCALE) ??
      normalizeLocale(serverEnv.COMMERCE_LOCALE) ??
      "es-PE",
  };
}

export function getPublicSupabaseEnv() {
  const url = resolvePublicSupabaseUrl();
  const anonKey = resolvePublicSupabaseKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    url,
    anonKey,
  };
}

export function getServerSupabaseEnv() {
  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function hasMedusaAdminEnv() {
  return Boolean(resolveMedusaAdminBackendUrl() && serverEnv.MEDUSA_ADMIN_API_KEY);
}

export function getMedusaAdminEnv() {
  const backendUrl = resolveMedusaAdminBackendUrl();

  if (!backendUrl || !serverEnv.MEDUSA_ADMIN_API_KEY) {
    throw new Error(
      "Missing Medusa admin credentials. Set MEDUSA_ADMIN_API_KEY and MEDUSA_BACKEND_URL (or NEXT_PUBLIC_MEDUSA_BACKEND_URL).",
    );
  }

  return {
    backendUrl,
    adminApiKey: serverEnv.MEDUSA_ADMIN_API_KEY,
  };
}

export function hasMailjetEnv() {
  return Boolean(
    serverEnv.MAILJET_API_KEY &&
      serverEnv.MAILJET_SECRET_KEY &&
      serverEnv.MAILJET_FROM_EMAIL,
  );
}

export function getMailjetEnv() {
  if (
    !serverEnv.MAILJET_API_KEY ||
    !serverEnv.MAILJET_SECRET_KEY ||
    !serverEnv.MAILJET_FROM_EMAIL
  ) {
    throw new Error(
      "Missing Mailjet credentials. Configura MAILJET_API_KEY, MAILJET_SECRET_KEY y MAILJET_FROM_EMAIL para enviar emails.",
    );
  }

  return {
    apiKey: serverEnv.MAILJET_API_KEY,
    secretKey: serverEnv.MAILJET_SECRET_KEY,
    fromEmail: serverEnv.MAILJET_FROM_EMAIL,
    eventToken: serverEnv.MAILJET_EVENT_TOKEN ?? null,
  };
}

export function getMailjetEventToken() {
  return serverEnv.MAILJET_EVENT_TOKEN ?? null;
}

export function hasPayPalEnv() {
  return Boolean(serverEnv.PAYPAL_CLIENT_ID && serverEnv.PAYPAL_CLIENT_SECRET);
}

export function hasPayPalClientEnv() {
  return Boolean(publicEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID);
}

export function getPayPalEnv() {
  if (!serverEnv.PAYPAL_CLIENT_ID || !serverEnv.PAYPAL_CLIENT_SECRET) {
    throw new Error(
      "Missing PayPal credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
    );
  }

  return {
    clientId: serverEnv.PAYPAL_CLIENT_ID,
    clientSecret: serverEnv.PAYPAL_CLIENT_SECRET,
    environment: serverEnv.PAYPAL_ENVIRONMENT ?? "sandbox",
    autoCapture:
      serverEnv.PAYPAL_AUTO_CAPTURE === undefined
        ? true
        : serverEnv.PAYPAL_AUTO_CAPTURE === "true",
    webhookId: serverEnv.PAYPAL_WEBHOOK_ID ?? null,
    publicClientId: publicEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? null,
  };
}

export function getPayPalClientEnv() {
  if (!publicEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    throw new Error(
      "Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID. Configuralo para preparar el SDK cliente de PayPal.",
    );
  }

  return {
    clientId: publicEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  };
}

export function getPaymentTestProfileEnv() {
  return {
    email: serverEnv.PAYMENT_TEST_EMAIL ?? defaultPeruPaymentTestProfile.email,
    firstName:
      serverEnv.PAYMENT_TEST_FIRST_NAME ?? defaultPeruPaymentTestProfile.firstName,
    lastName:
      serverEnv.PAYMENT_TEST_LAST_NAME ?? defaultPeruPaymentTestProfile.lastName,
    phone: serverEnv.PAYMENT_TEST_PHONE ?? defaultPeruPaymentTestProfile.phone,
    countryCode:
      serverEnv.PAYMENT_TEST_COUNTRY_CODE?.toUpperCase() ??
      defaultPeruPaymentTestProfile.countryCode,
    state: serverEnv.PAYMENT_TEST_STATE ?? defaultPeruPaymentTestProfile.state,
    city: serverEnv.PAYMENT_TEST_CITY ?? defaultPeruPaymentTestProfile.city,
    address1:
      serverEnv.PAYMENT_TEST_ADDRESS_1 ?? defaultPeruPaymentTestProfile.address1,
    address2:
      serverEnv.PAYMENT_TEST_ADDRESS_2 ?? defaultPeruPaymentTestProfile.address2,
    postalCode:
      serverEnv.PAYMENT_TEST_POSTAL_CODE ?? defaultPeruPaymentTestProfile.postalCode,
    documentType:
      serverEnv.PAYMENT_TEST_DOCUMENT_TYPE ??
      defaultPeruPaymentTestProfile.documentType,
    documentNumber:
      serverEnv.PAYMENT_TEST_DOCUMENT_NUMBER ??
      defaultPeruPaymentTestProfile.documentNumber,
    cardBrand:
      serverEnv.PAYMENT_TEST_CARD_BRAND ?? defaultPeruPaymentTestProfile.cardBrand,
    cardNumber:
      serverEnv.PAYMENT_TEST_CARD_NUMBER ?? defaultPeruPaymentTestProfile.cardNumber,
    cardExpiry:
      serverEnv.PAYMENT_TEST_CARD_EXPIRY ?? defaultPeruPaymentTestProfile.cardExpiry,
    cardCvv: serverEnv.PAYMENT_TEST_CARD_CVV ?? defaultPeruPaymentTestProfile.cardCvv,
  };
}

export function getAdminAllowedEmails() {
  return (serverEnv.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasLocalAdminEnv() {
  return (
    process.env.NODE_ENV !== "production" &&
    Boolean(serverEnv.ADMIN_USER && serverEnv.ADMIN_PASSWORD)
  );
}

export function getLocalAdminEnv() {
  if (!hasLocalAdminEnv()) {
    return null;
  }

  return {
    user: serverEnv.ADMIN_USER!,
    password: serverEnv.ADMIN_PASSWORD!,
  };
}
