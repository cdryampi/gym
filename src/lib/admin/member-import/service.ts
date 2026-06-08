/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/server";
import { generateMemberNumber } from "@/lib/data/gym-management";
import { csvRowSchema, CsvImportRowInput } from "./schema";
import { parseCsv } from "./csv";
import {
  MemberImportBatchResult,
  MemberImportRowResult,
} from "./types";

function generateImportRequestNumber() {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `MEM-${stamp}-${suffix}`;
}

export async function validateCsvData(
  rawCsvContent: string,
  fileName: string,
  dbClient?: any
): Promise<MemberImportBatchResult> {
  const client = (dbClient || createSupabaseAdminClient()) as any;
  const parsedRecords = parseCsv(rawCsvContent);

  const batchResult: MemberImportBatchResult = {
    fileName,
    totalRows: parsedRecords.length,
    validRows: 0,
    invalidRows: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    status: "pending",
    rows: [],
  };

  if (parsedRecords.length === 0) {
    return batchResult;
  }

  // Load all active plans to resolve plan slugs
  const { data: plans, error: plansError } = await client
    .from("membership_plans")
    .select("id, slug, title, duration_days, price_amount, currency_code, billing_label")
    .eq("is_active", true);

  if (plansError) {
    throw new Error(`Error cargando planes de membresía: ${plansError.message}`);
  }

  const activePlanSlugs = new Set((plans || []).map((p: any) => p.slug));
  const seenEmails = new Set<string>();

  for (let idx = 0; idx < parsedRecords.length; idx++) {
    const rawRow = parsedRecords[idx];
    const rowNumber = idx + 2; // Row numbers are 2-indexed since header is row 1
    const errors: string[] = [];
    const warnings: string[] = [];
    const email = rawRow.email?.trim().toLowerCase() || "";
    const firstName = rawRow.first_name?.trim() || "";
    const lastName = rawRow.last_name?.trim() || "";

    // 1. Zod schema validation
    const parsed = csvRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // 2. Check internal duplicate email
    if (email) {
      if (seenEmails.has(email)) {
        errors.push(`email: El correo electrónico ya está repetido en este archivo CSV`);
      } else {
        seenEmails.add(email);
      }
    }

    // 3. Verify plan slug
    const planSlug = rawRow.membership_plan?.trim();
    if (planSlug && !activePlanSlugs.has(planSlug)) {
      errors.push(`membership_plan: El plan de membresía "${planSlug}" no existe o no está activo`);
    }

    const isValid = errors.length === 0;
    if (isValid) {
      batchResult.validRows++;
    } else {
      batchResult.invalidRows++;
    }

    batchResult.rows!.push({
      rowNumber,
      email,
      firstName,
      lastName,
      status: isValid ? "created" : "failed",
      errors,
      warnings,
      rawRow,
    });
  }

  return batchResult;
}

export async function executeMemberImport(
  rawCsvContent: string,
  fileName: string,
  actorUserId?: string | null,
  actorEmail?: string | null
): Promise<MemberImportBatchResult> {
  const client = createSupabaseAdminClient() as any;
  const validation = await validateCsvData(rawCsvContent, fileName, client);

  if (validation.totalRows === 0) {
    throw new Error("El archivo CSV está vacío.");
  }

  const fileSha256 = crypto
    .createHash("sha256")
    .update(rawCsvContent)
    .digest("hex");

  // Create import batch in database
  const { data: batch, error: batchError } = await client
    .from("member_import_batches")
    .insert({
      file_name: fileName,
      file_sha256: fileSha256,
      created_by_user_id: actorUserId || null,
      created_by_email: actorEmail || null,
      total_rows: validation.totalRows,
      valid_rows: validation.validRows,
      invalid_rows: validation.invalidRows,
      status: "processing",
    })
    .select("id")
    .single();

  if (batchError) {
    throw new Error(`Fallo al crear registro de importación: ${batchError.message}`);
  }

  const batchId = batch.id;
  const auth = getFirebaseAdminAuth();

  // Load plans again for processing
  const { data: plans } = await client
    .from("membership_plans")
    .select("*")
    .eq("is_active", true);

  const planMap = new Map<string, any>((plans || []).map((p: any) => [p.slug, p]));
  const rowsResults: MemberImportRowResult[] = [];

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const valRow of validation.rows!) {
    if (valRow.errors.length > 0) {
      // Row had validation errors during dry-run
      failedCount++;
      rowsResults.push({
        ...valRow,
        status: "failed",
      });

      await client.from("member_import_rows").insert({
        batch_id: batchId,
        row_number: valRow.rowNumber,
        email: valRow.email,
        status: "failed",
        errors: valRow.errors,
        warnings: valRow.warnings,
        raw_row: valRow.rawRow,
      });

      continue;
    }

    try {
      const email = valRow.email;
      const firstName = valRow.firstName;
      const lastName = valRow.lastName;
      const rawRow = valRow.rawRow as unknown as CsvImportRowInput;

      let firebaseUid: string;

      // 1. Firebase Auth Step
      try {
        const existing = await auth.getUserByEmail(email);
        firebaseUid = existing.uid;
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          const tempPassword = `Temp-${crypto.randomUUID()}`;
          const displayName = `${firstName} ${lastName}`.trim();
          const created = await auth.createUser({
            email,
            emailVerified: false,
            password: tempPassword,
            displayName,
          });

          await auth.setCustomUserClaims(created.uid, {
            role: "authenticated",
          });

          firebaseUid = created.uid;
        } else {
          throw err;
        }
      }

      // 2. Member Profile Step
      let memberProfileId: string;
      let profileStatus: "created" | "updated" = "created";

      // Look up profile by firebaseUid or email
      const { data: existingProfile, error: profileGetError } = await client
        .from("member_profiles")
        .select("*")
        .or(`supabase_user_id.eq.${firebaseUid},email.eq.${email}`)
        .maybeSingle();

      if (profileGetError) {
        throw new Error(`Fallo al consultar perfil existente: ${profileGetError.message}`);
      }

      const birthDate = rawRow.birth_date ? rawRow.birth_date : null;
      const profileCompleted = Boolean(
        rawRow.address &&
        birthDate
      );

      // Merge emergency contact information into notes
      const contactParts: string[] = [];
      if (rawRow.emergency_contact_name) {
        contactParts.push(`Contacto: ${rawRow.emergency_contact_name}`);
      }
      if (rawRow.emergency_contact_phone) {
        contactParts.push(`Teléfono: ${rawRow.emergency_contact_phone}`);
      }

      if (existingProfile) {
        memberProfileId = existingProfile.id;
        profileStatus = "updated";

        let finalNotes = rawRow.notes || existingProfile.notes || "";
        if (contactParts.length > 0) {
          const contactInfo = `[Emergencia - ${contactParts.join(", ")}]`;
          if (!finalNotes.includes(contactInfo)) {
            finalNotes = finalNotes ? `${finalNotes}\n${contactInfo}` : contactInfo;
          }
        }

        // Update profile
        const { error: profileUpdateError } = await client
          .from("member_profiles")
          .update({
            supabase_user_id: firebaseUid,
            full_name: `${firstName} ${lastName}`.trim(),
            phone: rawRow.phone || existingProfile.phone,
            external_code: rawRow.document_id || existingProfile.external_code,
            birth_date: birthDate || existingProfile.birth_date,
            address: rawRow.address || existingProfile.address,
            notes: finalNotes || null,
            profile_completed: profileCompleted || existingProfile.profile_completed,
            status: rawRow.status || existingProfile.status,
          })
          .eq("id", memberProfileId);

        if (profileUpdateError) {
          throw new Error(`Fallo al actualizar perfil de socio: ${profileUpdateError.message}`);
        }
      } else {
        const memberNumber = generateMemberNumber();
        profileStatus = "created";

        let finalNotes = rawRow.notes || "";
        if (contactParts.length > 0) {
          const contactInfo = `[Emergencia - ${contactParts.join(", ")}]`;
          finalNotes = finalNotes ? `${finalNotes}\n${contactInfo}` : contactInfo;
        }

        const { data: newProfile, error: profileInsertError } = await client
          .from("member_profiles")
          .insert({
            supabase_user_id: firebaseUid,
            email,
            full_name: `${firstName} ${lastName}`.trim(),
            phone: rawRow.phone || null,
            member_number: memberNumber,
            external_code: rawRow.document_id || memberNumber,
            birth_date: birthDate,
            address: rawRow.address || null,
            notes: finalNotes || null,
            profile_completed: profileCompleted,
            status: rawRow.status || "active",
            join_date: rawRow.membership_start_date,
          })
          .select("id")
          .single();

        if (profileInsertError) {
          throw new Error(`Fallo al crear perfil de socio: ${profileInsertError.message}`);
        }

        memberProfileId = newProfile.id;
      }

      // 3. Membership Resolution Step
      const plan = planMap.get(rawRow.membership_plan)!;
      let finalStatus: "created" | "updated" | "skipped" = "created";
      let membershipRequestId: string | undefined;
      const warnings: string[] = [];

      // Check if they already have an active request for this plan
      const { data: activeRequest, error: activeReqError } = await client
        .from("membership_requests")
        .select("id")
        .eq("member_id", memberProfileId)
        .eq("membership_plan_id", plan.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (activeReqError) {
        throw new Error(`Fallo al verificar membresía activa: ${activeReqError.message}`);
      }

      if (activeRequest) {
        finalStatus = "skipped";
        membershipRequestId = activeRequest.id;
        warnings.push("El socio ya tiene una membresía activa equivalente para este plan. Se omitió la creación.");
        skippedCount++;

        if (profileStatus === "created") {
          createdCount++;
        } else {
          updatedCount++;
        }
      } else {
        // Calculate cycle window
        const cycleStartsOn = rawRow.membership_start_date;
        let cycleEndsOn = rawRow.membership_end_date;

        if (!cycleEndsOn) {
          const startDateObj = new Date(cycleStartsOn);
          startDateObj.setDate(startDateObj.getDate() + plan.duration_days);
          cycleEndsOn = startDateObj.toISOString().split("T")[0];
        }

        // Insert membership request as active & paid
        const requestNumber = generateImportRequestNumber();
        const { data: newRequest, error: requestError } = await client
          .from("membership_requests")
          .insert({
            request_number: requestNumber,
            member_id: memberProfileId,
            supabase_user_id: firebaseUid,
            membership_plan_id: plan.id,
            email,
            plan_title_snapshot: plan.title,
            price_amount: plan.price_amount,
            currency_code: plan.currency_code,
            billing_label: plan.billing_label,
            duration_days: plan.duration_days,
            source: "admin-csv-import",
            status: "active",
            cycle_starts_on: cycleStartsOn,
            cycle_ends_on: cycleEndsOn,
            activated_at: new Date().toISOString(),
            manual_payment_status: "paid",
            manual_paid_total: plan.price_amount,
            manual_balance_due: 0,
          })
          .select("id")
          .single();

        if (requestError) {
          throw new Error(`Fallo al registrar la membresía: ${requestError.message}`);
        }

        membershipRequestId = newRequest.id;

        // Sync back plan to profile
        const { error: syncError } = await client
          .from("member_profiles")
          .update({
            membership_plan_id: plan.id,
            status: rawRow.status || "active",
          })
          .eq("id", memberProfileId);

        if (syncError) {
          throw new Error(`Fallo al sincronizar plan con el perfil: ${syncError.message}`);
        }

        if (profileStatus === "created") {
          createdCount++;
        } else {
          updatedCount++;
        }
      }

      rowsResults.push({
        rowNumber: valRow.rowNumber,
        email,
        firstName,
        lastName,
        status: finalStatus,
        errors: [],
        warnings,
        firebaseUid,
        memberProfileId,
        membershipRequestId,
        rawRow: valRow.rawRow,
      });

      await client.from("member_import_rows").insert({
        batch_id: batchId,
        row_number: valRow.rowNumber,
        email,
        status: finalStatus,
        errors: [],
        warnings,
        firebase_uid: firebaseUid,
        member_profile_id: memberProfileId,
        membership_request_id: membershipRequestId,
        raw_row: valRow.rawRow,
      });

    } catch (rowErr: any) {
      failedCount++;
      const errorMessage = rowErr instanceof Error ? rowErr.message : String(rowErr);
      const errors = [errorMessage];

      rowsResults.push({
        rowNumber: valRow.rowNumber,
        email: valRow.email,
        firstName: valRow.firstName,
        lastName: valRow.lastName,
        status: "failed",
        errors,
        warnings: [],
        rawRow: valRow.rawRow,
      });

      await client.from("member_import_rows").insert({
        batch_id: batchId,
        row_number: valRow.rowNumber,
        email: valRow.email,
        status: "failed",
        errors,
        warnings: [],
        raw_row: valRow.rawRow,
      });
    }
  }

  // Update batch overall metrics
  const { error: batchUpdateError } = await client
    .from("member_import_batches")
    .update({
      status: "completed",
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
    })
    .eq("id", batchId);

  if (batchUpdateError) {
    console.error("Fallo al actualizar lote de importación final:", batchUpdateError.message);
  }

  return {
    id: batchId,
    fileName,
    totalRows: validation.totalRows,
    validRows: validation.validRows,
    invalidRows: validation.invalidRows,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
    status: "completed",
    rows: rowsResults,
  };
}
export type ValidateCsvDataType = typeof validateCsvData;
export type ExecuteMemberImportType = typeof executeMemberImport;
