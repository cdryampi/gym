import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function optionalString(schema: z.ZodString) {
  return z.preprocess(emptyStringToUndefined, schema.optional());
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
  PAYPAL_ENVIRONMENT: optionalEnum(["sandbox", "live"]),
  PAYPAL_WEBHOOK_ID: optionalString(z.string().min(1)),
  RESEND_API_KEY: optionalString(z.string().min(1)),
  RESEND_FROM_EMAIL: optionalString(z.string().min(1)),
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
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
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

export function hasResendEnv() {
  return Boolean(serverEnv.RESEND_API_KEY);
}

export function getResendEnv() {
  if (!serverEnv.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY. Configuralo para enviar los emails pickup.");
  }

  return {
    apiKey: serverEnv.RESEND_API_KEY,
    fromEmail: serverEnv.RESEND_FROM_EMAIL ?? "Nova Forza <onboarding@resend.dev>",
  };
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
      "Missing PayPal sandbox credentials. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
    );
  }

  return {
    clientId: serverEnv.PAYPAL_CLIENT_ID,
    clientSecret: serverEnv.PAYPAL_CLIENT_SECRET,
    environment: serverEnv.PAYPAL_ENVIRONMENT ?? "sandbox",
    autoCapture: serverEnv.PAYPAL_AUTO_CAPTURE === "true",
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
