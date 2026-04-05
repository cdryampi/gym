import type { User } from "@supabase/supabase-js";

import { getCurrentMemberUser } from "@/lib/auth";
import type { MarketingTestimonial } from "@/lib/data/marketing-content";
import { ensureMemberProfileForUser } from "@/lib/data/gym-management";
import {
  getMemberAuthProviderLabel,
  getMemberDisplayName,
  isPasswordAuthProvider,
} from "@/lib/member-account";
import {
  getMemberMarketingTestimonialRecord,
  upsertMemberMarketingTestimonialRecord,
} from "@/lib/supabase/queries";
import {
  type MemberAccountDeleteValues,
  memberAccountDeleteSchema,
  type MemberAccountPasswordValues,
  memberAccountPasswordSchema,
  type MemberAccountProfileValues,
  memberAccountProfileSchema,
} from "@/lib/validators/member-account";
import {
  type MemberMarketingTestimonialValues,
  memberMarketingTestimonialSchema,
} from "@/lib/validators/marketing-testimonial";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type MemberAccountViewModel = {
  email: string;
  fullName: string;
  phone: string | null;
  providerLabel: string;
  canManagePassword: boolean;
};

export type MemberMarketingTestimonialViewModel = MarketingTestimonial;

type MemberProfileRow = {
  email: string;
  full_name: string;
  id: string;
  phone: string | null;
  supabase_user_id: string | null;
};

async function getLinkedMemberProfile(userId: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("member_profiles")
    .select("id, email, full_name, phone, supabase_user_id")
    .eq("supabase_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as MemberProfileRow | null;
}

function assertSelfUser(user: User | null): asserts user is User {
  if (!user?.id || !user.email) {
    throw new Error("Necesitas iniciar sesion para gestionar tu cuenta.");
  }
}

function buildAuthorInitials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "TG";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function buildAuthorDetail(joinDate: string | null | undefined) {
  const year = joinDate?.slice(0, 4);

  if (year && /^\d{4}$/.test(year)) {
    return `Socio desde ${year}`;
  }

  return "Miembro verificado";
}

async function reauthenticatePasswordUser(user: User, password: string) {
  if (!isPasswordAuthProvider(user)) {
    throw new Error("Esta cuenta no permite verificar contrasena desde este flujo.");
  }

  const publicClient = createSupabasePublicClient();
  const { error } = await publicClient.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (error) {
    throw new Error("La contrasena actual no es valida.");
  }
}

export async function getMemberAccountViewModel(user: User): Promise<MemberAccountViewModel> {
  const profile = await getLinkedMemberProfile(user.id);

  return {
    canManagePassword: isPasswordAuthProvider(user),
    email: user.email ?? profile?.email ?? "",
    fullName: profile?.full_name ?? getMemberDisplayName(user),
    phone: profile?.phone ?? null,
    providerLabel: getMemberAuthProviderLabel(user),
  };
}

export async function getAuthenticatedMemberTestimonial() {
  const user = await getCurrentMemberUser();
  assertSelfUser(user);
  const serverClient = await createSupabaseServerClient();

  return getMemberMarketingTestimonialRecord(serverClient, user.id);
}

export async function upsertAuthenticatedMemberTestimonial(values: unknown) {
  const user = await getCurrentMemberUser();
  assertSelfUser(user);
  const parsed = memberMarketingTestimonialSchema.parse(values) as MemberMarketingTestimonialValues;
  const serverClient = await createSupabaseServerClient();
  const memberProfile = await ensureMemberProfileForUser(user);
  const existing = await getMemberMarketingTestimonialRecord(serverClient, user.id);
  const authorName = memberProfile.full_name?.trim() || getMemberDisplayName(user);

  const testimonial = await upsertMemberMarketingTestimonialRecord(serverClient, {
    author_detail: buildAuthorDetail(memberProfile.join_date),
    author_initials: buildAuthorInitials(authorName),
    author_name: authorName,
    member_profile_id: memberProfile.id,
    quote: parsed.quote.trim(),
    rating: parsed.rating,
    site_settings_id: 1,
    supabase_user_id: user.id,
  });

  return {
    mode: existing ? ("updated" as const) : ("created" as const),
    testimonial,
  };
}

export async function updateAuthenticatedMemberAccount(values: unknown) {
  const user = await getCurrentMemberUser();
  assertSelfUser(user);
  const parsed = memberAccountProfileSchema.parse(values) as MemberAccountProfileValues;
  const serverClient = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const profile = await getLinkedMemberProfile(user.id);

  const { error: authError } = await serverClient.auth.updateUser({
    data: { full_name: parsed.fullName },
    email: parsed.email,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (profile) {
    const { error: profileError } = await adminClient
      .from("member_profiles")
      .update({
        email: parsed.email,
        full_name: parsed.fullName,
        phone: parsed.phone?.trim() ? parsed.phone.trim() : null,
      })
      .eq("id", profile.id)
      .eq("supabase_user_id", user.id);

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  return getMemberAccountViewModel({
    ...user,
    email: parsed.email,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: parsed.fullName,
    },
  } as User);
}

export async function changeAuthenticatedMemberPassword(values: unknown) {
  const user = await getCurrentMemberUser();
  assertSelfUser(user);
  const parsed = memberAccountPasswordSchema.parse(values) as MemberAccountPasswordValues;

  if (!isPasswordAuthProvider(user)) {
    throw new Error("Tu metodo de acceso no permite cambiar contrasena desde esta pantalla.");
  }

  await reauthenticatePasswordUser(user, parsed.currentPassword);
  const serverClient = await createSupabaseServerClient();
  const { error } = await serverClient.auth.updateUser({
    password: parsed.newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteAuthenticatedMemberAccount(values: unknown) {
  const user = await getCurrentMemberUser();
  assertSelfUser(user);
  const parsed = memberAccountDeleteSchema.parse(values) as MemberAccountDeleteValues;

  if (!isPasswordAuthProvider(user)) {
    throw new Error("Tu metodo de acceso no permite eliminar la cuenta desde esta pantalla.");
  }

  await reauthenticatePasswordUser(user, parsed.currentPassword);

  const adminClient = createSupabaseAdminClient();

  const { error: memberProfileError } = await adminClient
    .from("member_profiles")
    .update({ supabase_user_id: null })
    .eq("supabase_user_id", user.id);

  if (memberProfileError) {
    throw new Error(memberProfileError.message);
  }

  const { error: pickupRequestError } = await adminClient
    .from("pickup_request")
    .update({ supabase_user_id: null })
    .eq("supabase_user_id", user.id);

  if (pickupRequestError) {
    throw new Error(pickupRequestError.message);
  }

  const { error: bridgeError } = await adminClient
    .from("member_commerce_customers")
    .delete()
    .eq("supabase_user_id", user.id);

  if (bridgeError) {
    throw new Error(bridgeError.message);
  }

  const { error: userRolesError } = await adminClient.from("user_roles").delete().eq("user_id", user.id);

  if (userRolesError) {
    throw new Error(userRolesError.message);
  }

  const { error: trainerProfileError } = await adminClient
    .from("trainer_profiles")
    .delete()
    .eq("user_id", user.id);

  if (trainerProfileError) {
    throw new Error(trainerProfileError.message);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
