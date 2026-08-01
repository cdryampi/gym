import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getAuth();
  }

  initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: stripWrappingQuotes(required("FIREBASE_PRIVATE_KEY")).replace(/\\n/g, "\n"),
    }),
    projectId: required("FIREBASE_PROJECT_ID"),
  });

  return getAuth();
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim() || required("NEXT_PUBLIC_SUPABASE_URL");

  return createClient(url, required("SUPABASE_SECRET_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function listAllSupabaseUsers(supabase) {
  const users = [];
  let page = 1;

  while (true) {
    const {
      data: { users: pageUsers },
      error,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    users.push(...pageUsers);

    if (pageUsers.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureFirebaseUser(firebaseAuth, supabaseUser) {
  const email = supabaseUser.email?.trim().toLowerCase();

  if (!email) {
    return {
      firebaseUid: null,
      mode: "skipped-no-email",
      supabaseUid: supabaseUser.id,
    };
  }

  const displayName =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.app_metadata?.full_name ??
    email.split("@")[0] ??
    "usuario";

  try {
    const existing = await firebaseAuth.getUserByEmail(email);
    const claims = existing.customClaims ?? {};

    if (claims.role !== "authenticated") {
      await firebaseAuth.setCustomUserClaims(existing.uid, {
        ...claims,
        role: "authenticated",
      });
    }

    return {
      firebaseUid: existing.uid,
      mode: "matched",
      supabaseUid: supabaseUser.id,
    };
  } catch {}

  const created = await firebaseAuth.createUser({
    uid: supabaseUser.id,
    email,
    emailVerified: Boolean(supabaseUser.email_confirmed_at),
    password: `Temp-${randomUUID()}`,
    displayName,
  });

  await firebaseAuth.setCustomUserClaims(created.uid, {
    role: "authenticated",
  });

  return {
    firebaseUid: created.uid,
    mode: "created",
    supabaseUid: supabaseUser.id,
  };
}

async function rewriteIdentityReferences(supabase, mapping) {
  if (!mapping.firebaseUid || mapping.firebaseUid === mapping.supabaseUid) {
    return;
  }

  const tables = [
    ["member_commerce_customers", "supabase_user_id"],
    ["user_roles", "user_id"],
    ["user_roles", "assigned_by"],
    ["trainer_profiles", "user_id"],
    ["member_profiles", "supabase_user_id"],
    ["member_profiles", "trainer_user_id"],
    ["routine_templates", "trainer_user_id"],
    ["routine_templates", "created_by"],
    ["routine_assignments", "trainer_user_id"],
    ["routine_assignments", "assigned_by_user_id"],
    ["marketing_testimonials", "supabase_user_id"],
    ["membership_requests", "supabase_user_id"],
    ["membership_request_annotations", "created_by_user_id"],
    ["membership_payment_entries", "created_by_user_id"],
    ["membership_qr_scan_events", "staff_user_id"],
  ];

  for (const [table, column] of tables) {
    const { error } = await supabase
      .from(table)
      .update({ [column]: mapping.firebaseUid })
      .eq(column, mapping.supabaseUid);

    if (error) {
      throw new Error(`Failed updating ${table}.${column}: ${error.message}`);
    }
  }
}

async function main() {
  const supabase = getSupabaseAdmin();
  const firebaseAuth = getFirebaseAdmin();
  const supabaseUsers = await listAllSupabaseUsers(supabase);
  const summary = {
    created: 0,
    matched: 0,
    skipped: 0,
    rewritten: 0,
  };

  for (const user of supabaseUsers) {
    const mapping = await ensureFirebaseUser(firebaseAuth, user);

    if (mapping.mode === "created") {
      summary.created += 1;
    } else if (mapping.mode === "matched") {
      summary.matched += 1;
    } else {
      summary.skipped += 1;
    }

    if (mapping.firebaseUid && mapping.firebaseUid !== mapping.supabaseUid) {
      await rewriteIdentityReferences(supabase, mapping);
      summary.rewritten += 1;
    }

    console.log(
      `[auth-migrate] ${mapping.mode} | ${user.email ?? "sin-email"} | ${mapping.supabaseUid} -> ${mapping.firebaseUid ?? "skip"}`,
    );
  }

  console.log("[auth-migrate] summary", summary);
}

main().catch((error) => {
  console.error("[auth-migrate] failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
