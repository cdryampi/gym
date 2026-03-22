import { getMedusaAdminEnv } from "@/lib/env";

export interface MedusaAdminConfig {
  adminApiKey: string;
  backendUrl: string;
}

function normalizeBackendUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getMedusaAdminConfig(): MedusaAdminConfig {
  const env = getMedusaAdminEnv();

  return {
    adminApiKey: env.adminApiKey,
    backendUrl: normalizeBackendUrl(env.backendUrl),
  };
}
