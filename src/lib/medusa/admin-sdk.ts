import Medusa from "@medusajs/js-sdk";

import { getMedusaAdminConfig } from "@/lib/medusa/admin-config";

let medusaAdminSdk: Medusa | null = null;

export function getMedusaAdminSdk() {
  if (!medusaAdminSdk) {
    const config = getMedusaAdminConfig();

    medusaAdminSdk = new Medusa({
      apiKey: config.adminApiKey,
      baseUrl: config.backendUrl,
      auth: {
        type: "jwt",
        jwtTokenStorageMethod: "memory",
      },
      debug: false,
    });
  }

  return medusaAdminSdk;
}
