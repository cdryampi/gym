"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  assignRoutineToMember,
  createMemberProfile,
  getDashboardMemberDetail,
  updateMemberProfile,
  archiveMemberProfile,
  deleteMemberProfile,
} from "@/lib/data/gym-management";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { sendFirebasePasswordResetEmail } from "@/lib/firebase/email-actions";
import { SITE_URL } from "@/lib/seo";
import { addMemberNote, listMemberNotes } from "@/lib/data/member-notes";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AssignRoutineInput } from "@mobile-contracts";
import { memberFormSchema, type MemberFormValues } from "@/lib/validators/gym-members";
import { assignRoutineFormSchema } from "@/lib/validators/gym-routines";

function revalidateMembers() {
  revalidatePath("/dashboard/miembros");
  revalidatePath("/dashboard/mobile");
}

function resolveActorUserId(user: Awaited<ReturnType<typeof requireAdminUser>>) {
  if ("isLocalAdmin" in user && user.isLocalAdmin) {
    return null;
  }

  return user.id;
}

function isFirebaseUserNotFound(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  return code === "auth/user-not-found" || message.includes("user-not-found");
}

async function ensureMemberAccessClaim(uid: string) {
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUser(uid);
  const claims = user.customClaims ?? {};

  if (claims.role === "authenticated") {
    return;
  }

  await auth.setCustomUserClaims(uid, {
    ...claims,
    role: "authenticated",
  });
}

export async function archiveMemberAction(memberId: string) {
  try {
    await requireAdminUser();
    await archiveMemberProfile(memberId);
    revalidateMembers();
    return { success: true };
  } catch (error) {
    console.error("Error archiving member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al archivar socio",
    };
  }
}

export async function deleteMemberAction(memberId: string) {
  try {
    await requireAdminUser();
    await deleteMemberProfile(memberId);
    revalidateMembers();
    return { success: true };
  } catch (error) {
    console.error("Error deleting member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al eliminar socio",
    };
  }
}

export async function saveMemberProfileAction(values: MemberFormValues, memberId?: string) {
  await requireAdminUser();
  const memberValues = memberFormSchema.parse(values);

  if (memberId) {
    const detail = await getDashboardMemberDetail(memberId);

    if (!detail) {
      throw new Error("Socio no encontrado.");
    }

    await updateMemberProfile(memberId, {
      ...memberValues,
      linkedUserId: detail.member.linkedUserId,
    });
  } else {
    await createMemberProfile({
      ...memberValues,
      linkedUserId: null,
    });
  }

  revalidateMembers();
}

export async function assignRoutineFromDashboardAction(values: AssignRoutineInput) {
  const user = await requireAdminUser();
  const validatedValues = assignRoutineFormSchema.parse(values);
  await assignRoutineToMember(validatedValues, resolveActorUserId(user));
  revalidateMembers();
  revalidatePath(`/dashboard/miembros/${values.memberId}`);
  revalidatePath("/dashboard/rutinas");
}

export async function getMemberNotesAction(memberId: string) {
  await requireAdminUser();
  return listMemberNotes(memberId);
}

export async function addMemberNoteAction(memberId: string, content: string) {
  const user = await requireAdminUser();
  const email = "email" in user ? user.email : null;
  const note = await addMemberNote(memberId, content, resolveActorUserId(user), email);
  revalidatePath(`/dashboard/miembros/${memberId}`);
  return note;
}

export async function sendMemberPasswordResetAction(memberId: string) {
  await requireAdminUser();
  const detail = await getDashboardMemberDetail(memberId);

  if (!detail) {
    return { success: false, error: "Socio no encontrado." };
  }

  if (!detail.member.linkedUserId) {
    return { success: false, error: "El socio no tiene cuenta Firebase vinculada." };
  }

  await sendFirebasePasswordResetEmail({
    absoluteOrigin: SITE_URL,
    email: detail.member.email.toLowerCase(),
    nextPath: "/acceso?reset=1",
  });

  return { success: true };
}

export async function grantMemberWebAccessAction(memberId: string) {
  await requireAdminUser();
  const detail = await getDashboardMemberDetail(memberId);

  if (!detail) {
    return { success: false, error: "Socio no encontrado." };
  }

  if (detail.member.linkedUserId) {
    return { success: false, error: "El socio ya tiene acceso web vinculado." };
  }

  const email = detail.member.email?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "El socio no tiene email para crear acceso web." };
  }

  const auth = getFirebaseAdminAuth();
  let firebaseAction: "created" | "existing" = "existing";
  let uid: string;

  try {
    const existingUser = await auth.getUserByEmail(email);
    uid = existingUser.uid;
    await auth.updateUser(uid, { displayName: detail.member.fullName });
  } catch (error) {
    if (!isFirebaseUserNotFound(error)) {
      throw error;
    }

    const defaultPassword = process.env.FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD?.trim();

    if (!defaultPassword) {
      return {
        success: false,
        error: "Configura FIREBASE_MEMBER_IMPORT_DEFAULT_PASSWORD para crear acceso web.",
      };
    }

    const createdUser = await auth.createUser({
      displayName: detail.member.fullName,
      email,
      password: defaultPassword,
    });
    firebaseAction = "created";
    uid = createdUser.uid;
  }

  await ensureMemberAccessClaim(uid);

  const client = createSupabaseAdminClient();
  const { error } = await client
    .from("member_profiles")
    .update({
      supabase_user_id: uid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateMembers();
  revalidatePath(`/dashboard/miembros/${memberId}`);

  await sendFirebasePasswordResetEmail({
    absoluteOrigin: SITE_URL,
    email,
    nextPath: "/acceso?reset=1",
  });

  return { success: true, firebaseAction, resetEmailSent: true };
}
