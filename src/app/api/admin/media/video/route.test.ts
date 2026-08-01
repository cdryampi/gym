import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  from: vi.fn(),
  requireAdminUser: vi.fn(),
  getDashboardAccessState: vi.fn(),
  getServerSupabaseEnv: vi.fn().mockReturnValue({ secretKey: "test-key" }),
  hasFirebaseAdminEnv: vi.fn().mockReturnValue(true),
  hasSupabaseSecretKey: vi.fn().mockReturnValue(true),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({ get: vi.fn() }),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAdminUser: mocks.requireAdminUser,
    getDashboardAccessState: mocks.getDashboardAccessState,
  };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    getServerSupabaseEnv: mocks.getServerSupabaseEnv,
    hasFirebaseAdminEnv: mocks.hasFirebaseAdminEnv,
    hasSupabaseSecretKey: mocks.hasSupabaseSecretKey,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: mocks.from.mockReturnValue({
        upload: mocks.upload,
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://test.com/video.mp4" } }),
      }),
    },
  }),
}));

import { POST } from "./route";

function buildRequest(formData?: FormData) {
  return new Request("http://localhost/api/admin/media/video", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/admin/media/video", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    mocks.getDashboardAccessState.mockResolvedValue({
      user: { id: "admin-1", email: "admin@test.com" },
      accessMode: "admin",
      accessWarning: null
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uploads valid videos to the media bucket", async () => {
    mocks.requireAdminUser.mockResolvedValue({ 
      id: "admin-1",
      app_metadata: { roles: ["admin"] }
    } as unknown as { id: string; app_metadata: { roles: string[] } });
    mocks.upload.mockResolvedValue({ data: { path: "path/to/video" }, error: null });

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "video/mp4" }), "test.mp4");

    const response = await POST(buildRequest(formData));
    expect(response.status).toBe(200);
  });

  it("rejects unauthenticated uploads", async () => {
    mocks.getDashboardAccessState.mockResolvedValue({
      user: null,
      accessMode: null,
      accessWarning: null
    });

    const response = await POST(buildRequest());
    expect(response.status).toBe(401);
  });
});
