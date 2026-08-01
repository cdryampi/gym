import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  checkSupabaseConnection, 
  checkFirebaseAdmin, 
  checkMedusaStorefront, 
  getServicesStatus
} from "../actions";
import type { AuthUser } from "@/lib/auth-user";

// Mock de auth
vi.mock("@/lib/auth", async (importOriginal) => { 
  const actual = await importOriginal<typeof import("@/lib/auth")>(); 
  return { ...actual, 
    requireSuperadminUser: vi.fn().mockResolvedValue({ id: "test-user", email: "admin@test.com" }),
  };
});

// Mock de env
vi.mock("@/lib/env", () => ({
  hasSupabasePublicEnv: vi.fn().mockReturnValue(true),
  hasSupabaseSecretKey: vi.fn().mockReturnValue(true),
  hasFirebasePublicEnv: vi.fn().mockReturnValue(true),
  hasFirebaseAdminEnv: vi.fn().mockReturnValue(true),
  hasMedusaEnv: vi.fn().mockReturnValue(true),
  hasMedusaAdminEnv: vi.fn().mockReturnValue(true),
  hasSmtpEnv: vi.fn().mockReturnValue(true),
  hasPayPalEnv: vi.fn().mockReturnValue(true),
  getPayPalEnv: vi.fn().mockReturnValue({ environment: "sandbox" }),
  getServerSupabaseEnv: vi.fn().mockReturnValue({ url: "https://test.supabase.co", secretKey: "test-key" }),
}));

// Mock de Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue({ error: null, count: 10 }),
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(() => mockSupabaseClient),
}));

// Mock de Medusa
vi.mock("@/lib/medusa/sdk", () => ({
  getMedusaSdk: vi.fn(() => ({
    store: {
      product: {
        list: vi.fn().mockResolvedValue({ products: [{ id: "1" }] }),
      },
    },
  })),
}));

vi.mock("@/lib/medusa/admin-sdk", () => ({
  getMedusaAdminSdk: vi.fn(() => ({
    admin: {
      product: {
        list: vi.fn().mockResolvedValue({ products: [{ id: "1" }] }),
      },
    },
  })),
}));

// Mock de Firebase
vi.mock("@/lib/firebase/server", () => ({
  getFirebaseAdminAuth: vi.fn().mockReturnValue({}),
}));

describe("Diagnostics Actions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { 
      hasSupabasePublicEnv,
      hasSupabaseSecretKey,
      hasFirebasePublicEnv,
      hasFirebaseAdminEnv,
      hasMedusaEnv,
      hasMedusaAdminEnv,
      hasSmtpEnv,
      hasPayPalEnv 
    } = await import("@/lib/env");
    
    vi.mocked(hasSupabasePublicEnv).mockReturnValue(true);
    vi.mocked(hasSupabaseSecretKey).mockReturnValue(true);
    vi.mocked(hasFirebasePublicEnv).mockReturnValue(true);
    vi.mocked(hasFirebaseAdminEnv).mockReturnValue(true);
    vi.mocked(hasMedusaEnv).mockReturnValue(true);
    vi.mocked(hasMedusaAdminEnv).mockReturnValue(true);
    vi.mocked(hasSmtpEnv).mockReturnValue(true);
    vi.mocked(hasPayPalEnv).mockReturnValue(true);

    const { requireSuperadminUser } = await import("@/lib/auth");
    vi.mocked(requireSuperadminUser).mockResolvedValue({ id: "test-user", email: "admin@test.com" } as unknown as AuthUser);
  });

  describe("Security", () => {
    it("debe fallar si requireSuperadminUser lanza error", async () => {
      const { requireSuperadminUser } = await import("@/lib/auth");
      vi.mocked(requireSuperadminUser).mockRejectedValue(new Error("Unauthorized"));

      await expect(checkSupabaseConnection()).rejects.toThrow("Unauthorized");
      await expect(checkFirebaseAdmin()).rejects.toThrow("Unauthorized");
      await expect(checkMedusaStorefront()).rejects.toThrow("Unauthorized");
    });
  });

  describe("checkSupabaseConnection", () => {
    it("debe retornar éxito cuando la conexión es correcta", async () => {
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Conexión con Supabase establecida");
    });

    it("debe retornar error cuando falta service role", async () => {
      const { hasSupabaseSecretKey } = await import("@/lib/env");
      vi.mocked(hasSupabaseSecretKey).mockReturnValue(false);
      
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Falta SUPABASE_SECRET_KEY");
    });

    it("debe retornar error cuando falla la consulta", async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({ error: { message: "DB Error" } });
      
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(false);
      expect(result.message).toContain("Error al conectar con Supabase");
    });

    it("debe retornar error cuando el schema de Supabase es inválido", async () => {
      mockSupabaseClient.select.mockResolvedValueOnce({ error: null, count: "not-a-number" as unknown as number });
      
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(false);
      expect(result.message).toContain("schema inválido");
    });
  });

  describe("checkFirebaseAdmin", () => {
    it("debe retornar éxito cuando está configurado", async () => {
      const result = await checkFirebaseAdmin();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Firebase Admin inicializado");
    });
  });

  describe("checkMedusaStorefront", () => {
    it("debe retornar éxito cuando responde el SDK", async () => {
      const result = await checkMedusaStorefront();
      expect(result.success).toBe(true);
      expect(result.message).toContain("Conexión con Medusa Storefront OK");
    });

    it("debe retornar error cuando el schema de Medusa es inválido", async () => {
      const { getMedusaSdk } = await import("@/lib/medusa/sdk");
      vi.mocked(getMedusaSdk).mockReturnValueOnce({
        store: {
          product: {
            list: vi.fn().mockResolvedValue({ products: [{ id: 123 as unknown as string }] }),
          },
        },
      } as unknown as ReturnType<typeof getMedusaSdk>);

      const result = await checkMedusaStorefront();
      expect(result.success).toBe(false);
      expect(result.message).toContain("schema inválido");
    });
  });

  describe("getServicesStatus", () => {
    it("debe retornar el estado de todos los servicios", async () => {
      const status = await getServicesStatus();
      expect(status).toHaveProperty("supabase");
      expect(status).toHaveProperty("firebase");
      expect(status).toHaveProperty("medusa");
      expect(status).toHaveProperty("smtp");
      expect(status).toHaveProperty("paypal");
    });
  });
});

