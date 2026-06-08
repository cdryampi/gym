"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/auth";
import {
  assignRoutineToMember,
  createMemberProfile,
  updateMemberProfile,
  archiveMemberProfile,
  deleteMemberProfile,
} from "@/lib/data/gym-management";
import { addMemberNote, listMemberNotes } from "@/lib/data/member-notes";
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
    await updateMemberProfile(memberId, memberValues);
  } else {
    await createMemberProfile(memberValues);
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
