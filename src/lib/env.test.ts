import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function importEnvModule(env: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env } as NodeJS.ProcessEnv;
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
    });

    expect(env.hasSupabasePublicEnv()).toBe(false);
    expect(env.hasMedusaEnv()).toBe(false);
    expect(env.getCommerceDisplayEnv()).toEqual({
      currencyCode: "PEN",
      locale: "es-PE",
    });
  });
});
