import { cache } from "react";

import { getStoreAdminRepository } from "@/lib/data/store-admin/repository";
import type { CommerceSource } from "@/lib/commerce/types";
import type { StoreCategory, StoreDashboardProduct } from "@/lib/data/store";
import {
  hasMedusaAdminEnv,
  hasSupabaseServiceRole,
} from "@/lib/env";

interface StoreAdminSnapshot {
  categories: StoreCategory[];
  products: StoreDashboardProduct[];
  source: CommerceSource;
  warning: string | null;
}

function getStoreAdminReadinessWarning(): string | null {
  if (!hasMedusaAdminEnv()) {
    return (
      "El dashboard de tienda requiere MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL " +
      "(o NEXT_PUBLIC_MEDUSA_BACKEND_URL). " +
      "Configuralos para gestionar categorias y productos del dashboard."
    );
  }

  return null;
}

export function getStoreAdminWriteDisabledReason() {
  if (!hasMedusaAdminEnv()) {
    return "Configura MEDUSA_ADMIN_API_KEY y MEDUSA_BACKEND_URL (o NEXT_PUBLIC_MEDUSA_BACKEND_URL) para guardar cambios reales en Medusa.";
  }

  if (!hasSupabaseServiceRole()) {
    return "Configura SUPABASE_SERVICE_ROLE_KEY para persistir los enlaces Medusa-Supabase del dashboard.";
  }

  return undefined;
}

export const getStoreAdminSnapshot = cache(async (): Promise<StoreAdminSnapshot> => {
  const readinessWarning = getStoreAdminReadinessWarning();
  const repository = getStoreAdminRepository();

  if (readinessWarning) {
    return {
      categories: [],
      products: [],
      source: repository.source,
      warning: readinessWarning,
    };
  }

  try {
    const snapshot = await repository.getSnapshot();

    return {
      ...snapshot,
      source: repository.source,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar el catalogo desde la fuente configurada del dashboard.";

    return {
      categories: [],
      products: [],
      source: repository.source,
      warning: message,
    };
  }
});

export async function getStoreAdminCategory(id: string) {
  const readinessWarning = getStoreAdminReadinessWarning();
  if (readinessWarning) {
    return null;
  }

  const repository = getStoreAdminRepository();
  return repository.getCategory(id);
}

export async function getStoreAdminProduct(id: string) {
  const readinessWarning = getStoreAdminReadinessWarning();
  if (readinessWarning) {
    return null;
  }

  const repository = getStoreAdminRepository();
  return repository.getProduct(id);
}
