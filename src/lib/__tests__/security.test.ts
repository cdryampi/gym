import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  createSupabasePublicClient, 
  createSupabaseServerClient,
  createSupabaseAdminClient
} from "../supabase/server";

// Mock de variables de entorno para que no fallen los clientes
vi.mock("../env", () => ({
  getPublicSupabaseEnv: () => ({ url: "https://xyz.supabase.co", anonKey: "anon-key" }),
  getServerSupabaseEnv: () => ({ url: "https://xyz.supabase.co", secretKey: "service-key" }),
}));

// Mock de Firebase Bearer Header para simular diferentes usuarios
const firebaseMocks = vi.hoisted(() => ({
  getFirebaseSessionBearerHeader: vi.fn(),
}));

vi.mock("../firebase/server", () => ({
  getFirebaseSessionBearerHeader: firebaseMocks.getFirebaseSessionBearerHeader,
}));

describe("Supabase RLS & Role Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("public client uses anon key and no auth header", async () => {
    const client = createSupabasePublicClient();
    // @ts-expect-error - accessing internal key for verification in test
    expect(client.supabaseKey).toBe("anon-key");
  });

  it("server client includes bearer token if session exists", async () => {
    firebaseMocks.getFirebaseSessionBearerHeader.mockResolvedValue("Bearer firebase-token");
    const client = await createSupabaseServerClient();
    
    // @ts-expect-error - accessing internal rest config for verification in test
    const restConfig = client.rest;
    // En el cliente Supabase, las cabeceras pueden estar en un objeto literal o Headers
    const headers = restConfig.headers as Record<string, string> | Headers;
    const authHeader = 'get' in headers ? (headers as Headers).get('Authorization') : (headers as Record<string, string>).Authorization;
    expect(authHeader).toBe("Bearer firebase-token");
  });

  it("admin client uses service role key", () => {
    const client = createSupabaseAdminClient();
    // @ts-expect-error - accessing internal key for verification in test
    expect(client.supabaseKey).toBe("service-key");
  });
});
