import Medusa from "@medusajs/js-sdk";

import { getMedusaStorefrontConfig } from "@/lib/medusa/config";

let medusaSdk: Medusa | null = null;

export function getMedusaSdk() {
  if (!medusaSdk) {
    const config = getMedusaStorefrontConfig();

    medusaSdk = new Medusa({
      baseUrl: config.backendUrl,
      publishableKey: config.publishableKey,
      debug: false,
    });
  }

  return medusaSdk;
}
