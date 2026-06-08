import { z } from "zod";

import { CreateMemberInputSchema, MemberStatusSchema } from "@mobile-contracts";

function nullableTrimmedString(max: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }, z.string().max(max).nullable());
}

export const memberPlanStatusSchema = z.enum(["active", "paused", "cancelled", "expired"]);

export const dashboardMemberStatusSchema = z.enum([
  "prospect",
  "active",
  "paused",
  "cancelled",
  "former",
  "expired",
  "frozen",
]);

const nullableDateString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

const nullableGender = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.enum(["M", "F"]).nullable());

export const memberFormSchema = CreateMemberInputSchema.extend({
  externalCode: z.string().trim().min(1).max(50).optional(),
  linkedUserId: z.string().uuid().nullable(),
  trainerUserId: z.string().uuid().nullable(),
  status: dashboardMemberStatusSchema.default("prospect"),
  phone: nullableTrimmedString(40),
  birthDate: nullableDateString,
  gender: nullableGender,
  address: nullableTrimmedString(200),
  districtOrUrbanization: nullableTrimmedString(100),
  occupation: nullableTrimmedString(100),
  preferredSchedule: nullableTrimmedString(100),
  branchName: nullableTrimmedString(120),
  notes: nullableTrimmedString(1000),
  legacyNotes: nullableTrimmedString(2000),
  planNotes: nullableTrimmedString(1000),
  planStartedAt: z.string().nullable(),
  planEndsAt: z.string().nullable(),
  profileCompleted: z.boolean().default(false),
});

export type MemberFormValues = z.input<typeof memberFormSchema>;

const csvStatusMap = {
  active: "active",
  frozen: "frozen",
  inactive: "former",
} as const satisfies Record<string, z.infer<typeof dashboardMemberStatusSchema>>;

const memberCsvRowSchema = z.object({
  first_name: z.string().trim().min(1, "El nombre es obligatorio."),
  last_name: z.string().trim().min(1, "El apellido es obligatorio."),
  email: z.string().trim().email("Formato de email invalido."),
  phone: nullableTrimmedString(40).optional(),
  membership_plan: z.string().trim().min(2, "El plan de membresia es obligatorio."),
  membership_start_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe usar formato YYYY-MM-DD."),
  status: z
    .string()
    .trim()
    .toLowerCase()
    .refine((status): status is keyof typeof csvStatusMap => status in csvStatusMap, {
      message: "El estado debe ser: active, inactive o frozen",
    }),
  branch_name: nullableTrimmedString(120).optional(),
  external_code: nullableTrimmedString(50).optional(),
  notes: nullableTrimmedString(1000).optional(),
});

export type MemberCsvRow = z.input<typeof memberCsvRowSchema>;

export function mapMemberCsvRowToFormValues(row: MemberCsvRow): MemberFormValues {
  const parsed = memberCsvRowSchema.parse(row);
  const firstName = parsed.first_name.trim();
  const lastName = parsed.last_name.trim();

  return {
    address: null,
    birthDate: null,
    branchName: parsed.branch_name ?? null,
    districtOrUrbanization: null,
    email: parsed.email,
    externalCode: parsed.external_code ?? undefined,
    fullName: `${firstName} ${lastName}`.trim(),
    gender: null,
    joinDate: parsed.membership_start_date,
    legacyNotes: null,
    linkedUserId: null,
    notes: parsed.notes ?? null,
    occupation: null,
    phone: parsed.phone ?? null,
    planEndsAt: null,
    planLabel: parsed.membership_plan,
    planNotes: null,
    planStartedAt: parsed.membership_start_date,
    planStatus: parsed.status === "inactive" ? "cancelled" : "active",
    preferredSchedule: null,
    profileCompleted: false,
    status: csvStatusMap[parsed.status],
    trainerUserId: null,
  };
}

export const memberStatusUpdateSchema = z.object({
  status: MemberStatusSchema,
});

export const memberMobilePatchSchema = z.object({
  status: MemberStatusSchema.optional(),
  branchName: nullableTrimmedString(120).optional(),
  notes: nullableTrimmedString(1000).optional(),
});

export type MemberMobilePatchValues = z.input<typeof memberMobilePatchSchema>;
