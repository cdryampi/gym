import { Readable } from "node:stream";

import ExcelJS from "exceljs";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export type MemberImportMode = "preview" | "commit";
export type MemberImportResultStatus = "processed" | "skipped" | "error";
export type MemberImportAction = "created" | "updated" | "ready";
export type MemberImportFirebaseAction = "created" | "existing" | "none";

export type MemberImportRow = {
  address: string | null;
  birthDate: string | null;
  districtOrUrbanization: string | null;
  email: string;
  externalCode: string;
  fullName: string;
  gender: "M" | "F" | null;
  joinDate: string;
  legacyNotes: string | null;
  occupation: string | null;
  phone: string | null;
  planEndsAt: string | null;
  planLabel: string;
  planStartedAt: string | null;
  rowNumber: number;
  status: "active" | "former" | "prospect";
};

export type MemberImportResult = {
  action?: MemberImportAction;
  code?: string;
  email?: string;
  firebaseAction?: MemberImportFirebaseAction;
  memberId?: string;
  message?: string;
  name?: string;
  rowNumber: number;
  status: MemberImportResultStatus;
};

export type MemberImportSummary = {
  errors: number;
  processed: number;
  skipped: number;
  totalRows: number;
};

export type MemberImportResponse = {
  results: MemberImportResult[];
  sheetName: string;
  summary: MemberImportSummary;
};

type MemberImportQueryResult = {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
};

type MemberImportQueryBuilder = {
  eq(field: string, value: unknown): MemberImportQueryBuilder;
  insert(payload: Record<string, unknown>): MemberImportQueryBuilder;
  maybeSingle(): Promise<MemberImportQueryResult>;
  select(columns?: string): MemberImportQueryBuilder;
  single(): Promise<MemberImportQueryResult>;
  then<TResult1 = MemberImportQueryResult, TResult2 = never>(
    onfulfilled?: ((value: MemberImportQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
  update(payload: Record<string, unknown>): MemberImportQueryBuilder;
};

export type MemberImportSupabaseClient = {
  from(table: "member_profiles" | "member_plan_snapshots"): MemberImportQueryBuilder;
};

export type MemberImportAuth = {
  createUser(input: {
    displayName: string;
    email: string;
    password: string;
  }): Promise<{ uid: string }>;
  getUserByEmail(email: string): Promise<{ uid: string }>;
  updateUser(uid: string, input: { displayName: string }): Promise<unknown>;
};

type ParseMemberImportInput = {
  buffer: Buffer;
  filename: string;
  now?: Date;
};

type RunMemberImportInput = ParseMemberImportInput & {
  auth?: MemberImportAuth;
  client?: MemberImportSupabaseClient;
  defaultPassword?: string;
  mode: MemberImportMode;
};

type ParsedWorkbook = {
  rows: MemberImportRow[];
  sheetName: string;
};

type HeaderKey =
  | "address"
  | "birthDate"
  | "districtOrUrbanization"
  | "email"
  | "externalCode"
  | "fullName"
  | "gender"
  | "joinDate"
  | "legacyNotes"
  | "occupation"
  | "phone"
  | "planEndsAt"
  | "planLabel";

type HeaderMap = Partial<Record<HeaderKey, number>>;

const emailSchema = z.string().trim().email();
const TARGET_SHEET_NAME = "CLIENTES 2026";
const REQUIRED_HEADERS: HeaderKey[] = ["externalCode", "fullName"];

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function resolveHeaderKey(value: unknown): HeaderKey | null {
  switch (normalizeHeader(value)) {
    case "CODIGO":
      return "externalCode";
    case "NOMBRES Y APELLIDOS":
      return "fullName";
    case "SEXO":
      return "gender";
    case "TELEFONO":
      return "phone";
    case "F INICIO":
      return "joinDate";
    case "F VENCIMIENTO":
      return "planEndsAt";
    case "PRODUCTO":
      return "planLabel";
    case "OBSERVACIONES":
      return "legacyNotes";
    case "URB.":
      return "districtOrUrbanization";
    case "DIRECCION":
      return "address";
    case "CORREO":
      return "email";
    case "CUMPLEANOS":
      return "birthDate";
    case "OCUPACION":
      return "occupation";
    default:
      return null;
  }
}

function trimToNull(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const raw =
    typeof value === "object" && "text" in value
      ? String((value as { text: unknown }).text)
      : String(value);
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: unknown) {
  return trimToNull(value)?.toLowerCase() ?? "";
}

function normalizeGender(value: unknown): "M" | "F" | null {
  const normalized = trimToNull(value)?.toUpperCase();
  return normalized === "M" || normalized === "F" ? normalized : null;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getUTCFullYear(),
    padDatePart(date.getUTCMonth() + 1),
    padDatePart(date.getUTCDate()),
  ].join("-");
}

function excelSerialToDate(value: number) {
  const utcDays = Math.floor(value - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return formatDate(excelSerialToDate(value));
  }

  const text = trimToNull(value);
  if (!text) {
    return null;
  }

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${padDatePart(Number(iso[2]))}-${padDatePart(Number(iso[3]))}`;
  }

  const slashed = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashed) {
    const year = Number(slashed[3].length === 2 ? `20${slashed[3]}` : slashed[3]);
    const month = Number(slashed[2]);
    const day = Number(slashed[1]);
    return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
  }

  const parsed = new Date(text);
  return formatDate(parsed);
}

function resolveStatus(planEndsAt: string | null, now: Date): MemberImportRow["status"] {
  if (!planEndsAt) {
    return "prospect";
  }

  const today = formatDate(now) ?? new Date().toISOString().slice(0, 10);
  return planEndsAt >= today ? "active" : "former";
}

function buildHeaderMap(headerValues: unknown[]) {
  const headers: HeaderMap = {};

  headerValues.forEach((value, index) => {
    const key = resolveHeaderKey(value);
    if (key && typeof headers[key] === "undefined") {
      headers[key] = index;
    }
  });

  return headers;
}

function hasRequiredHeaders(headers: HeaderMap) {
  return REQUIRED_HEADERS.every((header) => typeof headers[header] === "number");
}

function rowValue(values: unknown[], headers: HeaderMap, key: HeaderKey) {
  const index = headers[key];
  return typeof index === "number" ? values[index] : null;
}

function parseWorksheetRows(worksheet: ExcelJS.Worksheet, now: Date) {
  let headerMap: HeaderMap | null = null;
  let headerRowNumber = 1;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerMap) {
      return;
    }

    const values = rowValues(row);
    const candidate = buildHeaderMap(values);
    if (hasRequiredHeaders(candidate)) {
      headerMap = candidate;
      headerRowNumber = rowNumber;
    }
  });

  if (!headerMap) {
    return null;
  }

  const rows: MemberImportRow[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (!headerMap || rowNumber <= headerRowNumber) {
      return;
    }

    const values = rowValues(row);
    const firstMappedValues = Object.values(headerMap)
      .filter((index): index is number => typeof index === "number")
      .map((index) => values[index]);

    if (!firstMappedValues.some((value) => trimToNull(value))) {
      return;
    }

    const planEndsAt = normalizeDate(rowValue(values, headerMap, "planEndsAt"));
    const joinDate =
      normalizeDate(rowValue(values, headerMap, "joinDate")) ??
      formatDate(now) ??
      new Date().toISOString().slice(0, 10);

    rows.push({
      address: trimToNull(rowValue(values, headerMap, "address")),
      birthDate: normalizeDate(rowValue(values, headerMap, "birthDate")),
      districtOrUrbanization: trimToNull(rowValue(values, headerMap, "districtOrUrbanization")),
      email: normalizeEmail(rowValue(values, headerMap, "email")),
      externalCode: trimToNull(rowValue(values, headerMap, "externalCode")) ?? "",
      fullName: trimToNull(rowValue(values, headerMap, "fullName")) ?? "",
      gender: normalizeGender(rowValue(values, headerMap, "gender")),
      joinDate,
      legacyNotes: trimToNull(rowValue(values, headerMap, "legacyNotes")),
      occupation: trimToNull(rowValue(values, headerMap, "occupation")),
      phone: trimToNull(rowValue(values, headerMap, "phone")),
      planEndsAt,
      planLabel: trimToNull(rowValue(values, headerMap, "planLabel")) ?? "Sin plan",
      planStartedAt: normalizeDate(rowValue(values, headerMap, "joinDate")),
      rowNumber,
      status: resolveStatus(planEndsAt, now),
    });
  });

  return rows;
}

function rowValues(row: ExcelJS.Row) {
  const values = row.values;
  return Array.isArray(values) ? values.slice(1) : [];
}

async function loadWorkbook(input: ParseMemberImportInput) {
  const workbook = new ExcelJS.Workbook();
  const extension = input.filename.toLowerCase().split(".").pop();

  if (extension === "csv") {
    await workbook.csv.read(Readable.from(input.buffer.toString("utf8")), {
      map: (value) => value,
    });
    workbook.worksheets[0].name = input.filename;
    return workbook;
  }

  await workbook.xlsx.load(input.buffer as unknown as ExcelJS.Buffer);
  return workbook;
}

export async function parseMemberImportFile(input: ParseMemberImportInput): Promise<ParsedWorkbook> {
  const now = input.now ?? new Date();
  const workbook = await loadWorkbook(input);
  const targetSheet = workbook.getWorksheet(TARGET_SHEET_NAME);
  const candidates = [
    ...(targetSheet ? [targetSheet] : []),
    ...workbook.worksheets.filter((worksheet) => worksheet.id !== targetSheet?.id),
  ];

  for (const worksheet of candidates) {
    const rows = parseWorksheetRows(worksheet, now);
    if (rows) {
      return {
        rows,
        sheetName: worksheet.name,
      };
    }
  }

  throw new Error("El archivo no contiene cabeceras compatibles para importar socios.");
}

function buildSummary(results: MemberImportResult[]): MemberImportSummary {
  return {
    totalRows: results.length,
    processed: results.filter((result) => result.status === "processed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    errors: results.filter((result) => result.status === "error").length,
  };
}

function validateRows(rows: MemberImportRow[]) {
  const seenCodes = new Set<string>();
  const results: MemberImportResult[] = [];
  const validRows: MemberImportRow[] = [];

  for (const row of rows) {
    const base = {
      code: row.externalCode,
      email: row.email,
      name: row.fullName,
      rowNumber: row.rowNumber,
    };

    if (!row.externalCode) {
      results.push({ ...base, message: "Fila sin CODIGO.", status: "skipped" });
      continue;
    }

    if (seenCodes.has(row.externalCode)) {
      results.push({ ...base, message: "CODIGO duplicado dentro del archivo.", status: "skipped" });
      continue;
    }

    seenCodes.add(row.externalCode);

    if (!row.fullName) {
      results.push({ ...base, message: "Fila sin NOMBRES Y APELLIDOS.", status: "skipped" });
      continue;
    }

    if (!emailSchema.safeParse(row.email).success) {
      results.push({ ...base, message: "Correo vacio o invalido.", status: "skipped" });
      continue;
    }

    validRows.push(row);
    results.push({ ...base, action: "ready", firebaseAction: "none", status: "processed" });
  }

  return { results, validRows };
}

function isFirebaseUserNotFound(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  return code === "auth/user-not-found" || message.includes("user-not-found");
}

async function resolveFirebaseUser(input: {
  auth: MemberImportAuth;
  defaultPassword: string;
  row: MemberImportRow;
}) {
  try {
    const user = await input.auth.getUserByEmail(input.row.email);
    await input.auth.updateUser(user.uid, { displayName: input.row.fullName });
    return { action: "existing" as const, uid: user.uid };
  } catch (error) {
    if (!isFirebaseUserNotFound(error)) {
      throw error;
    }
  }

  const user = await input.auth.createUser({
    displayName: input.row.fullName,
    email: input.row.email,
    password: input.defaultPassword,
  });
  return { action: "created" as const, uid: user.uid };
}

function buildMemberPayload(row: MemberImportRow, firebaseUserId: string) {
  return {
    address: row.address,
    birth_date: row.birthDate,
    district_or_urbanization: row.districtOrUrbanization,
    email: row.email,
    external_code: row.externalCode,
    full_name: row.fullName,
    gender: row.gender,
    join_date: row.joinDate,
    legacy_notes: row.legacyNotes,
    notes: null,
    occupation: row.occupation,
    phone: row.phone,
    preferred_schedule: null,
    profile_completed: Boolean(
      row.address && row.birthDate && row.districtOrUrbanization && row.gender && row.occupation,
    ),
    status: row.status,
    supabase_user_id: firebaseUserId,
    trainer_user_id: null,
  } satisfies Database["public"]["Tables"]["member_profiles"]["Update"];
}

function buildMemberNumber(row: MemberImportRow) {
  return `IMP-${row.externalCode}`;
}

function resolvePlanStatus(row: MemberImportRow) {
  return row.status === "former" ? "expired" : "active";
}

async function upsertPlan(input: {
  client: MemberImportSupabaseClient;
  memberId: string;
  row: MemberImportRow;
}) {
  const { data: currentPlan, error: currentPlanError } = await input.client
    .from("member_plan_snapshots")
    .select("id")
    .eq("member_id", input.memberId)
    .eq("is_current", true)
    .maybeSingle();

  if (currentPlanError) {
    throw new Error(currentPlanError.message);
  }

  const payload = {
    ends_at: input.row.planEndsAt,
    label: input.row.planLabel,
    notes: input.row.legacyNotes,
    started_at: input.row.planStartedAt,
    status: resolvePlanStatus(input.row),
  };

  if (currentPlan?.id) {
    const { error } = await input.client
      .from("member_plan_snapshots")
      .update(payload)
      .eq("id", currentPlan.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await input.client
    .from("member_plan_snapshots")
    .insert({
      ...payload,
      is_current: true,
      member_id: input.memberId,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function commitRow(input: {
  auth: MemberImportAuth;
  client: MemberImportSupabaseClient;
  defaultPassword: string;
  row: MemberImportRow;
}) {
  const firebase = await resolveFirebaseUser(input);
  const payload = buildMemberPayload(input.row, firebase.uid);
  const { data: existing, error: existingError } = await input.client
    .from("member_profiles")
    .select("id")
    .eq("external_code", input.row.externalCode)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    const { error } = await input.client
      .from("member_profiles")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    await upsertPlan({ client: input.client, memberId: String(existing.id), row: input.row });
    return {
      action: "updated" as const,
      firebaseAction: firebase.action,
      memberId: String(existing.id),
    };
  }

  const { data, error } = await input.client
    .from("member_profiles")
    .insert({
      ...payload,
      member_number: buildMemberNumber(input.row),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "No se pudo crear el socio importado.");
  }

  await upsertPlan({ client: input.client, memberId: String(data.id), row: input.row });
  return {
    action: "created" as const,
    firebaseAction: firebase.action,
    memberId: String(data.id),
  };
}

export async function runMemberImport(input: RunMemberImportInput): Promise<MemberImportResponse> {
  const parsed = await parseMemberImportFile(input);
  const validation = validateRows(parsed.rows);

  if (input.mode === "preview") {
    return {
      results: validation.results,
      sheetName: parsed.sheetName,
      summary: buildSummary(validation.results),
    };
  }

  if (!input.client || !input.auth || !input.defaultPassword) {
    throw new Error("Faltan dependencias de importacion para ejecutar commit.");
  }

  const resultsByRow = new Map(validation.results.map((result) => [result.rowNumber, result]));

  for (const row of validation.validRows) {
    const base = {
      code: row.externalCode,
      email: row.email,
      name: row.fullName,
      rowNumber: row.rowNumber,
    };

    try {
      const committed = await commitRow({
        auth: input.auth,
        client: input.client,
        defaultPassword: input.defaultPassword,
        row,
      });
      resultsByRow.set(row.rowNumber, {
        ...base,
        action: committed.action,
        firebaseAction: committed.firebaseAction,
        memberId: committed.memberId,
        status: "processed",
      });
    } catch (error) {
      resultsByRow.set(row.rowNumber, {
        ...base,
        message: error instanceof Error ? error.message : "Error desconocido al importar socio.",
        status: "error",
      });
    }
  }

  const results = parsed.rows
    .map((row) => resultsByRow.get(row.rowNumber))
    .filter((result): result is MemberImportResult => Boolean(result));

  return {
    results,
    sheetName: parsed.sheetName,
    summary: buildSummary(results),
  };
}
