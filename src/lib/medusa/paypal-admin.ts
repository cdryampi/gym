import { getMedusaAdminSdk } from "@/lib/medusa/admin-sdk";
import {
  mergeRegionPaymentProviderIds,
  pickOperationalPayPalProviderId,
} from "@/lib/medusa/paypal-provider";

type AdminPaymentProvider = {
  id?: string | null;
  is_enabled?: boolean | null;
};

type AdminRegionPaymentProvider = {
  id?: string | null;
};

type AdminRegion = {
  id: string;
  name?: string | null;
  payment_providers?: AdminRegionPaymentProvider[] | null;
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectProviderIds(providers: Array<{ id?: string | null } | null | undefined>) {
  return providers
    .map((provider) => asString(provider?.id))
    .filter((providerId): providerId is string => Boolean(providerId));
}

export async function resolveOperationalPayPalProviderId() {
  const sdk = getMedusaAdminSdk();
  const response = (await sdk.admin.payment.listPaymentProviders({
    fields: "id,is_enabled",
    limit: 100,
  } as never)) as {
    payment_providers?: AdminPaymentProvider[];
  };

  const providerId = pickOperationalPayPalProviderId(
    (response.payment_providers ?? [])
      .filter((provider) => provider.is_enabled !== false)
      .map((provider) => provider.id ?? null),
  );

  if (!providerId) {
    throw new Error(
      "Medusa no tiene ningun payment provider PayPal habilitado. Reinicia Medusa con la configuracion PayPal actual.",
    );
  }

  return providerId;
}

export async function ensurePayPalProviderEnabledForRegion(regionId: string) {
  const sdk = getMedusaAdminSdk();
  const providerId = await resolveOperationalPayPalProviderId();
  const response = (await sdk.admin.region.retrieve(regionId, {
    fields: "id,name,*payment_providers",
  } as never)) as {
    region?: AdminRegion;
  };

  const region = response.region;

  if (!region?.id) {
    throw new Error("No se pudo localizar la region commerce para preparar PayPal.");
  }

  const currentProviderIds = collectProviderIds(region.payment_providers ?? []);

  if (currentProviderIds.includes(providerId)) {
    return providerId;
  }

  await sdk.admin.region.update(
    region.id,
    {
      payment_providers: mergeRegionPaymentProviderIds(currentProviderIds, providerId),
    } as never,
    {
      fields: "id,*payment_providers",
    } as never,
  );

  return providerId;
}
