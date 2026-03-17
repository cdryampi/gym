"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  deactivateStoreCategoryRecord,
  deactivateStoreProductRecord,
  deleteStoreCategoryRecord,
  deleteStoreProductRecord,
  saveStoreCategoryRecord,
  saveStoreProductRecord,
} from "@/lib/supabase/queries";
import {
  storeCategorySchema,
  storeProductSchema,
  type StoreCategoryInput,
  type StoreProductInput,
} from "@/lib/validators/store";

async function getAuthenticatedSupabase() {
  await requireAdminUser();

  if (!hasSupabaseServiceRole()) {
    throw new Error(
      "Configura SUPABASE_SERVICE_ROLE_KEY para gestionar datos reales del backoffice.",
    );
  }

  return createSupabaseAdminClient();
}

function revalidateStore() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tienda");
  revalidatePath("/dashboard/tienda/categorias");
  revalidatePath("/dashboard/tienda/productos");
  revalidatePath("/tienda");
}

export async function saveStoreCategory(values: StoreCategoryInput, categoryId?: string) {
  const parsed = storeCategorySchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  const id = await saveStoreCategoryRecord(supabase, parsed, categoryId);
  revalidateStore();
  return id;
}

export async function saveStoreProduct(values: StoreProductInput, productId?: string) {
  const parsed = storeProductSchema.parse(values);
  const supabase = await getAuthenticatedSupabase();
  const id = await saveStoreProductRecord(supabase, parsed, productId);
  revalidateStore();
  return id;
}

export async function deactivateStoreCategory(id: string) {
  const supabase = await getAuthenticatedSupabase();
  await deactivateStoreCategoryRecord(supabase, id);
  revalidateStore();
}

export async function deactivateStoreProduct(id: string) {
  const supabase = await getAuthenticatedSupabase();
  await deactivateStoreProductRecord(supabase, id);
  revalidateStore();
}

export async function deleteStoreCategory(id: string) {
  const supabase = await getAuthenticatedSupabase();
  await deleteStoreCategoryRecord(supabase, id);
  revalidateStore();
}

export async function deleteStoreProduct(id: string) {
  const supabase = await getAuthenticatedSupabase();
  await deleteStoreProductRecord(supabase, id);
  revalidateStore();
}
