import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  ADMIN_ALLOWED_EMAILS: z.string().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  ADMIN_USER: z.string().min(1).optional(),
  COMMERCE_PROVIDER: z.enum(["auto", "medusa", "supabase", "mock"]).optional(),
  MEDUSA_BACKEND_URL: z.string().url().optional(),
  MEDUSA_COUNTRY_CODE: z.string().min(2).max(2).optional(),
  MEDUSA_DEFAULT_CURRENCY_CODE: z.string().min(3).max(3).optional(),
  MEDUSA_PUBLISHABLE_KEY: z.string().min(1).optional(),
  MEDUSA_REGION_ID: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ADMIN_ALLOWED_EMAILS: process.env.ADMIN_ALLOWED_EMAILS,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_USER: process.env.ADMIN_USER,
  COMMERCE_PROVIDER: process.env.COMMERCE_PROVIDER,
  MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL,
  MEDUSA_COUNTRY_CODE: process.env.MEDUSA_COUNTRY_CODE,
  MEDUSA_DEFAULT_CURRENCY_CODE: process.env.MEDUSA_DEFAULT_CURRENCY_CODE,
  MEDUSA_PUBLISHABLE_KEY: process.env.MEDUSA_PUBLISHABLE_KEY,
  MEDUSA_REGION_ID: process.env.MEDUSA_REGION_ID,
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
  return serverEnv.COMMERCE_PROVIDER ?? "auto";
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
    regionId: serverEnv.MEDUSA_REGION_ID,
    countryCode: (serverEnv.MEDUSA_COUNTRY_CODE ?? "es").toLowerCase(),
    currencyCode: (serverEnv.MEDUSA_DEFAULT_CURRENCY_CODE ?? "eur").toLowerCase(),
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
