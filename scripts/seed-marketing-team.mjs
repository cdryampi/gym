import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(workspaceRoot, "public", "images", "trainers");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SECRET_KEY.",
  );
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const seedMembers = [
  {
    id: "77777777-7777-7777-7777-777777777771",
    name: "Carlos Mendoza",
    role: "Powerlifting & Hipertrofia",
    bio: "Ex-competidor nacional enfocado en mecanicas de levantamiento pesado y prevencion de lesiones.",
    imageName: "trainer-1.png",
    order: 0,
  },
  {
    id: "77777777-7777-7777-7777-777777777772",
    name: "Elena Vargas",
    role: "Entrenamiento Funcional",
    bio: "Especialista en movilidad y acondicionamiento metabolico. Certificacion NASM.",
    imageName: "trainer-2.png",
    order: 1,
  },
  {
    id: "77777777-7777-7777-7777-777777777773",
    name: "Ricardo Diaz",
    role: "Nutricion Deportiva",
    bio: "Experto en recomposicion corporal y diseno de planes alimenticios personalizados para atletas.",
    imageName: "trainer-3.png",
    order: 2,
  },
];

async function uploadTrainerImage(member) {
  const localFilePath = path.join(publicRoot, member.imageName);
  const extension = path.extname(member.imageName).toLowerCase();
  const storagePath = `marketing/team/${member.id}${extension}`;
  const file = await readFile(localFilePath);

  const { error } = await supabase.storage
    .from("medusa-media")
    .upload(storagePath, file, {
      contentType: `image/${extension.replace(".", "") === "jpg" ? "jpeg" : extension.replace(".", "")}`,
      upsert: true,
    });

  if (error) {
    throw new Error(`Could not upload ${member.imageName}: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("medusa-media").getPublicUrl(storagePath);

  return publicUrl;
}

async function run() {
  const payload = [];

  for (const member of seedMembers) {
    const imageUrl = await uploadTrainerImage(member);
    payload.push({
      id: member.id,
      site_settings_id: 1,
      name: member.name,
      role: member.role,
      bio: member.bio,
      image_url: imageUrl,
      order: member.order,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
    console.log(`Uploaded ${member.imageName} -> ${imageUrl}`);
  }

  const { error } = await supabase
    .from("marketing_team_members")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`Could not upsert marketing_team_members: ${error.message}`);
  }

  console.log(`Seeded ${payload.length} marketing team members.`);
}

run().catch((error) => {
  console.error("[seed:marketing:team]", error);
  process.exitCode = 1;
});
