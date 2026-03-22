import type { SupabaseClient } from "@supabase/supabase-js";

import type { DBMemberCommerceCustomer, Database } from "@/lib/supabase/database.types";

type GymSupabaseClient = SupabaseClient<Database>;

function mapMemberCommerceError(message: string) {
  return `No se pudo sincronizar el cliente commerce: ${message}`;
}

export async function getMemberCommerceCustomerByUserId(
  supabase: GymSupabaseClient,
  supabaseUserId: string,
) {
  const { data, error } = await supabase
    .from("member_commerce_customers")
    .select("*")
    .eq("supabase_user_id", supabaseUserId)
    .maybeSingle();

  if (error) {
    throw new Error(mapMemberCommerceError(error.message));
  }

  return data;
}

export async function upsertMemberCommerceCustomer(
  supabase: GymSupabaseClient,
  payload: Pick<DBMemberCommerceCustomer, "supabase_user_id" | "email" | "medusa_customer_id">,
) {
  const { data, error } = await supabase
    .from("member_commerce_customers")
    .upsert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(mapMemberCommerceError(error.message));
  }

  return data;
}
