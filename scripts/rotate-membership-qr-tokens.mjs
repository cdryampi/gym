import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(fileName) {
  const filePath = path.join(repoRoot, fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = normalizedValue;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() || "";
const dryRun = process.argv.includes("--dry-run");

if (!supabaseUrl || !secretKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SECRET_KEY para regenerar QR.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listMembers() {
  const { data, error } = await supabase
    .from("member_profiles")
    .select("id, full_name, member_number, membership_qr_token")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function rotateMemberToken(member) {
  const nextToken = randomUUID();
  const { error } = await supabase
    .from("member_profiles")
    .update({ membership_qr_token: nextToken })
    .eq("id", member.id);

  if (error) {
    throw new Error(`${member.full_name ?? member.id}: ${error.message}`);
  }

  return {
    id: member.id,
    fullName: member.full_name ?? "Socio sin nombre",
    memberNumber: member.member_number ?? "Sin codigo",
  };
}

async function run() {
  const members = await listMembers();

  if (members.length === 0) {
    console.log("No hay socios en member_profiles. No fue necesario regenerar QR.");
    return;
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Se encontraron ${members.length} socios con QR para regenerar.`,
  );

  if (dryRun) {
    for (const member of members.slice(0, 10)) {
      console.log(`- ${member.full_name ?? "Socio"} (${member.member_number ?? member.id})`);
    }

    if (members.length > 10) {
      console.log(`- ... y ${members.length - 10} mas`);
    }

    return;
  }

  const rotated = [];

  for (const member of members) {
    rotated.push(await rotateMemberToken(member));
  }

  console.log(`QR regenerados correctamente para ${rotated.length} socios.`);

  for (const member of rotated.slice(0, 10)) {
    console.log(`- ${member.fullName} (${member.memberNumber})`);
  }

  if (rotated.length > 10) {
    console.log(`- ... y ${rotated.length - 10} mas`);
  }
}

await run();
