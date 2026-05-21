import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateCsvData, executeMemberImport } from "../service";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: mocks.from,
  }),
}));

vi.mock("@/lib/firebase/server", () => ({
  getFirebaseAdminAuth: () => ({
    getUserByEmail: mocks.getUserByEmail,
    createUser: mocks.createUser,
    setCustomUserClaims: mocks.setCustomUserClaims,
  }),
}));

describe("Member Import Service Tests", () => {
  const mockPlans = [
    {
      id: "plan-mensual-id",
      slug: "mensual",
      title: "Plan Mensual",
      duration_days: 30,
      price_amount: 100,
      currency_code: "PEN",
      billing_label: "Mensual",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior for supabase client
    mocks.from.mockImplementation((table: string) => {
      if (table === "membership_plans") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockPlans, error: null }),
          }),
        };
      }
      if (table === "member_import_batches") {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: "mock-batch-id" }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: {}, error: null }),
          }),
        };
      }
      if (table === "member_import_rows") {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
        };
      }
      if (table === "member_profiles") {
        return {
          select: () => ({
            or: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: "new-profile-id" }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: {}, error: null }),
          }),
        };
      }
      if (table === "membership_requests") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: "new-request-id" }, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
      };
    });

    // Default mock behavior for Firebase Admin Auth
    mocks.getUserByEmail.mockRejectedValue({ code: "auth/user-not-found" });
    mocks.createUser.mockResolvedValue({ uid: "new-firebase-uid" });
    mocks.setCustomUserClaims.mockResolvedValue({});
  });

  describe("validateCsvData (Dry Run)", () => {
    it("returns empty result if CSV has no records", async () => {
      const csv = "";
      const result = await validateCsvData(csv, "vacio.csv");
      expect(result.totalRows).toBe(0);
      expect(result.rows).toEqual([]);
    });

    it("identifies valid CSV rows", async () => {
      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "test@example.com,Jose,Perez,999888777,mensual,2026-05-01,active\n";

      const result = await validateCsvData(csv, "valid.csv");
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(0);
      expect(result.rows![0].errors).toEqual([]);
    });

    it("flags validation errors on bad email or missing plan", async () => {
      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "correo-invalido,Jose,Perez,999888777,mensual,2026-05-01,active\n" + // bad email
        "test2@example.com,Ana,Gomez,999888777,no-existe,2026-05-01,active\n"; // bad plan

      const result = await validateCsvData(csv, "invalid.csv");
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(0);
      expect(result.invalidRows).toBe(2);

      expect(result.rows![0].errors[0]).toContain("email");
      expect(result.rows![1].errors[0]).toContain("membership_plan");
    });

    it("flags internal duplicate emails in the same CSV", async () => {
      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "test@example.com,Jose,Perez,999888777,mensual,2026-05-01,active\n" +
        "test@example.com,Ana,Gomez,999888777,mensual,2026-05-01,active\n";

      const result = await validateCsvData(csv, "duplicates.csv");
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);

      expect(result.rows![1].errors[0]).toContain("repetido");
    });
  });

  describe("executeMemberImport", () => {
    it("processes valid rows creating new Firebase user and profile", async () => {
      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "new@example.com,Carlos,Ruiz,999888777,mensual,2026-05-01,active\n";

      const result = await executeMemberImport(csv, "exec.csv", "actor-1", "actor@gym.com");

      expect(result.totalRows).toBe(1);
      expect(result.createdCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.skippedCount).toBe(0);

      expect(mocks.createUser).toHaveBeenCalled();
      expect(mocks.setCustomUserClaims).toHaveBeenCalledWith("new-firebase-uid", {
        role: "authenticated",
      });
    });

    it("idempotently links existing Firebase Auth user without duplicate creation", async () => {
      mocks.getUserByEmail.mockResolvedValue({ uid: "existing-uid", email: "existing@example.com" });

      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "existing@example.com,Carlos,Ruiz,999888777,mensual,2026-05-01,active\n";

      const result = await executeMemberImport(csv, "exec.csv", "actor-1", "actor@gym.com");

      expect(result.totalRows).toBe(1);
      expect(result.createdCount).toBe(1); // since profile was created new
      expect(result.failedCount).toBe(0);

      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("safely skips membership request if an equivalent active plan request exists", async () => {
      mocks.getUserByEmail.mockResolvedValue({ uid: "existing-uid", email: "existing@example.com" });

      // Profile exists
      mocks.from.mockImplementation((table: string) => {
        if (table === "membership_plans") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: mockPlans, error: null }),
            }),
          };
        }
        if (table === "member_import_batches") {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: "mock-batch-id" }, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ data: {}, error: null }),
            }),
          };
        }
        if (table === "member_import_rows") {
          return {
            insert: () => Promise.resolve({ data: {}, error: null }),
          };
        }
        if (table === "member_profiles") {
          return {
            select: () => ({
              or: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: "existing-profile-id", status: "active" }, error: null }),
              }),
            }),
            update: () => ({
              eq: () => Promise.resolve({ data: {}, error: null }),
            }),
          };
        }
        if (table === "membership_requests") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: { id: "existing-request-id" }, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: [], error: null }),
        };
      });

      const csv =
        "email,first_name,last_name,phone,membership_plan,membership_start_date,status\n" +
        "existing@example.com,Carlos,Ruiz,999888777,mensual,2026-05-01,active\n";

      const result = await executeMemberImport(csv, "exec.csv", "actor-1", "actor@gym.com");

      expect(result.totalRows).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.updatedCount).toBe(1); // profile updated
      expect(result.rows![0].warnings[0]).toContain("ya tiene una membresía activa equivalente");
    });
  });
});
