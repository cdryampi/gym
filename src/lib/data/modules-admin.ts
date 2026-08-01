import "server-only";

import { revalidatePath } from "next/cache";

import { PUBLIC_CACHE_TAGS, revalidatePublicCacheTags } from "@/lib/cache/public-cache";
import { hasSupabaseSecretKey } from "@/lib/env";
import {
  SYSTEM_MODULE_DEFINITION_MAP,
  type ModuleActionResponse,
  type SystemModuleName,
} from "@/lib/module-flags";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function revalidateModulePaths(name: SystemModuleName) {
  revalidatePath("/dashboard", "layout");
  const sharedDashboardPaths = ["/dashboard", "/dashboard/developer"];

  switch (name) {
    case "tienda":
      revalidatePath("/", "layout");
      for (const path of [
        ...sharedDashboardPaths,
        "/",
        "/dashboard/tienda",
        "/dashboard/tienda/categorias",
        "/dashboard/tienda/productos",
        "/dashboard/tienda/pedidos",
        "/tienda",
        "/carrito",
        "/horarios",
      ]) {
        revalidatePath(path);
      }
      revalidatePublicCacheTags([PUBLIC_CACHE_TAGS.storeCatalog]);
      break;
    case "rutinas":
      for (const path of [...sharedDashboardPaths, "/dashboard/rutinas", "/dashboard/miembros"]) {
        revalidatePath(path);
      }
      break;
    case "mobile":
      for (const path of [...sharedDashboardPaths, "/dashboard/mobile"]) {
        revalidatePath(path);
      }
      break;
    case "leads":
      for (const path of [...sharedDashboardPaths, "/dashboard/leads"]) {
        revalidatePath(path);
      }
      break;
    case "marketing":
      for (const path of [...sharedDashboardPaths, "/dashboard/marketing"]) {
        revalidatePath(path);
      }
      break;
    case "cms":
      for (const path of [...sharedDashboardPaths, "/dashboard/cms"]) {
        revalidatePath(path);
      }
      break;
  }
}

export async function setSystemModuleState(
  name: SystemModuleName,
  nextEnabled: boolean,
): Promise<ModuleActionResponse> {
  if (!hasSupabaseSecretKey()) {
    throw new Error("Configura SUPABASE_SECRET_KEY para gestionar modulos reales.");
  }

  const definition = SYSTEM_MODULE_DEFINITION_MAP[name];
  const client = createSupabaseAdminClient();
  const { error } = await client.from("system_modules").upsert(
    {
      name,
      is_enabled: nextEnabled,
      description: definition.description,
    },
    {
      onConflict: "name",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidateModulePaths(name);

  return { success: true };
}
