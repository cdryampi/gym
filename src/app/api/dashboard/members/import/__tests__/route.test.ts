import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  getFirebaseAdminAuth: vi.fn(),
  hasFirebaseAdminEnv: vi.fn(),
  hasSupabaseServiceRole: vi.fn(),
  requireRoles: vi.fn(),
  runMemberImport: vi.fn(),
}));

vi.mock("@/lib/api-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-utils")>();
  return {
    ...actual,
    requireRoles: routeMocks.requireRoles,
  };
});

vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    hasFirebaseAdminEnv: routeMocks.hasFirebaseAdminEnv,
    hasSupabaseServiceRole: routeMocks.hasSupabaseServiceRole,
  };
});

vi.mock("@/lib/firebase/server", () => ({
  getFirebaseAdminAuth: routeMocks.getFirebaseAdminAuth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: routeMocks.createSupabaseAdminClient,
}));

vi.mock("@/lib/data/member-import", () => ({
  runMemberImport: routeMocks.runMemberImport,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function buildRequest(mode = "preview") {
  const formData = new FormData();
  formData.set("mode", mode);
  formData.set("file", new File(["CODIGO,NOMBRES Y APELLIDOS\n001,Ana"], "socios.csv", { type: "text/csv" }));
  return new NextRequest("http://localhost/api/dashboard/members/import", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/dashboard/members/import", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD;
    routeMocks.hasFirebaseAdminEnv.mockReturnValue(true);
    routeMocks.hasSupabaseServiceRole.mockReturnValue(true);
    routeMocks.requireRoles.mockResolvedValue({
      success: true,
      user: { id: "admin-1" },
      accessMode: "admin",
    });
    routeMocks.createSupabaseAdminClient.mockReturnValue({ from: vi.fn() });
    routeMocks.getFirebaseAdminAuth.mockReturnValue({ createUser: vi.fn() });
    routeMocks.runMemberImport.mockResolvedValue({
      sheetName: "socios.csv",
      summary: { totalRows: 1, processed: 1, skipped: 0, errors: 0 },
      results: [{ rowNumber: 2, status: "processed", action: "ready" }],
    });
  });

  it("returns 401 when dashboard auth fails", async () => {
    routeMocks.requireRoles.mockResolvedValue({
      success: false,
      errorResponse: Response.json({ error: "No autenticado." }, { status: 401 }),
    });

    const { POST } = await import("../route");
    const response = await POST(buildRequest());

    expect(response.status).toBe(401);
  });

  it("returns 503 for commit when Firebase Admin is missing", async () => {
    routeMocks.hasFirebaseAdminEnv.mockReturnValue(false);
    process.env.FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD = "Temporal123!";

    const { POST } = await import("../route");
    const response = await POST(buildRequest("commit"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Configura Firebase Admin para importar socios con acceso digital.",
    });
  });

  it("returns 503 for commit when default password is missing", async () => {
    const { POST } = await import("../route");
    const response = await POST(buildRequest("commit"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Configura FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD para crear usuarios importados.",
    });
  });

  it("passes file and mode to importer and returns semaforo payload", async () => {
    process.env.FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD = "Temporal123!";

    const { POST } = await import("../route");
    const response = await POST(buildRequest("commit"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sheetName: "socios.csv",
      summary: { totalRows: 1, processed: 1, skipped: 0, errors: 0 },
      results: [{ rowNumber: 2, status: "processed", action: "ready" }],
    });
    expect(routeMocks.runMemberImport).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPassword: "Temporal123!",
        filename: "socios.csv",
        mode: "commit",
      }),
    );
  });
});
