// Covers dashboard member form validation, including legacy Excel/CSV master fields.
import {
  mapMemberCsvRowToFormValues,
  memberFormSchema,
} from "@/lib/validators/gym-members";

const validMemberFormPayload = {
  externalCode: "000123",
  linkedUserId: null,
  trainerUserId: null,
  fullName: "Laura Ramos",
  email: "laura.ramos@example.com",
  phone: "+51 999 111 222",
  status: "active",
  birthDate: "1990-05-15",
  gender: "F",
  address: "Av. Progreso 245",
  districtOrUrbanization: "Urb. Central",
  occupation: "Administradora",
  preferredSchedule: "Manana",
  branchName: "Sede principal",
  notes: "Socia legacy migrada desde Excel.",
  legacyNotes: "Codigo original preservado.",
  joinDate: "2026-05-01",
  planLabel: "Plan mensual",
  planStatus: "active",
  planStartedAt: "2026-05-01",
  planEndsAt: "2026-05-31",
  planNotes: "Renovacion manual.",
};

describe("memberFormSchema", () => {
  it("accepts legacy external codes with leading zeroes", () => {
    const result = memberFormSchema.safeParse(validMemberFormPayload);

    expect(result.success).toBe(true);
  });

  it("rejects an empty external code", () => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      externalCode: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts ISO birth dates", () => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      birthDate: "1990-05-15",
    });

    expect(result.success).toBe(true);
  });

  it("rejects localized birth date formats", () => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      birthDate: "15/05/1990",
    });

    expect(result.success).toBe(false);
  });

  it.each(["M", "F"])("accepts gender %s", (gender) => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      gender,
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported gender values", () => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      gender: "X",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes empty nullable legacy fields to null", () => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      birthDate: "",
      gender: "",
      address: "",
      districtOrUrbanization: "  ",
      occupation: "",
      preferredSchedule: "",
      legacyNotes: "",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      birthDate: null,
      gender: null,
      address: null,
      districtOrUrbanization: null,
      occupation: null,
      preferredSchedule: null,
      legacyNotes: null,
    });
  });

  it.each(["expired", "frozen"])("accepts dashboard-only status %s", (status) => {
    const result = memberFormSchema.safeParse({
      ...validMemberFormPayload,
      status,
    });

    expect(result.success).toBe(true);
  });

  it("defaults profileCompleted to false", () => {
    const result = memberFormSchema.safeParse(validMemberFormPayload);

    expect(result.success).toBe(true);
    expect(result.data?.profileCompleted).toBe(false);
  });
});

describe("mapMemberCsvRowToFormValues", () => {
  it("maps a valid snake_case CSV row into member form values", () => {
    const values = mapMemberCsvRowToFormValues({
      email: "  lucia@example.com ",
      first_name: " Lucia ",
      last_name: " Vega ",
      membership_plan: "Plan mensual",
      membership_start_date: "2026-06-01",
      status: "active",
    });

    expect(values).toMatchObject({
      email: "lucia@example.com",
      fullName: "Lucia Vega",
      joinDate: "2026-06-01",
      planLabel: "Plan mensual",
      planStartedAt: "2026-06-01",
      status: "active",
    });

    expect(memberFormSchema.safeParse(values).success).toBe(true);
  });

  it("maps inactive CSV status to archived member and cancelled plan state", () => {
    const values = mapMemberCsvRowToFormValues({
      email: "marco@example.com",
      first_name: "Marco",
      last_name: "Rios",
      membership_plan: "Plan anual",
      membership_start_date: "2026-01-15",
      status: "inactive",
    });

    expect(values).toMatchObject({
      planStatus: "cancelled",
      status: "former",
    });
  });

  it("keeps the CSV status error scoped to accepted CSV values", () => {
    expect(() =>
      mapMemberCsvRowToFormValues({
        email: "ana@example.com",
        first_name: "Ana",
        last_name: "Lopez",
        membership_plan: "Plan mensual",
        membership_start_date: "2026-06-01",
        status: "paused",
      }),
    ).toThrow("El estado debe ser: active, inactive o frozen");
  });
});
