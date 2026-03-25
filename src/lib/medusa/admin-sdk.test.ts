import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  configs: [] as Array<Record<string, unknown>>,
}));

vi.mock("@medusajs/js-sdk", () => ({
  default: class MockMedusa {
    client = {};
    admin = {};
    store = {};
    auth = {};

    constructor(config: Record<string, unknown>) {
      state.configs.push(config);
    }
  },
}));

vi.mock("@/lib/medusa/admin-config", () => ({
  getMedusaAdminConfig: () => ({
    adminApiKey: "apk_test_123",
    backendUrl: "https://api.example.com",
  }),
}));

describe("getMedusaAdminSdk", () => {
  afterEach(() => {
    state.configs = [];
    vi.resetModules();
  });

  it("initializes the Medusa SDK with apiKey auth once", async () => {
    const { getMedusaAdminSdk } = await import("@/lib/medusa/admin-sdk");

    const firstSdk = getMedusaAdminSdk();
    const secondSdk = getMedusaAdminSdk();

    expect(firstSdk).toBe(secondSdk);
    expect(state.configs).toHaveLength(1);
    expect(state.configs[0]).toMatchObject({
      apiKey: "apk_test_123",
      baseUrl: "https://api.example.com",
      auth: {
        type: "jwt",
        jwtTokenStorageMethod: "memory",
      },
      debug: false,
    });
    expect(state.configs[0]).not.toHaveProperty("globalHeaders.Authorization");
  });
});
