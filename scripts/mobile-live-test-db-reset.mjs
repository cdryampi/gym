import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

const demoUsers = [
  {
    email: process.env.TEST_MOBILE_TRAINER_EMAIL ?? "entrenador@novaforza.com",
    password: process.env.TEST_MOBILE_TRAINER_PASSWORD ?? "Demo1234!",
    role: "trainer",
  },
  {
    email: process.env.TEST_MOBILE_USER_1_EMAIL ?? "usuario1@novaforza.com",
    password: process.env.TEST_MOBILE_USER_1_PASSWORD ?? "Demo1234!",
    role: "member",
  },
  {
    email: process.env.TEST_MOBILE_USER_2_EMAIL ?? "usuario2@novaforza.com",
    password: process.env.TEST_MOBILE_USER_2_PASSWORD ?? "Demo1234!",
    role: "member",
  },
  {
    email: process.env.TEST_MOBILE_USER_3_EMAIL ?? "usuario3@novaforza.com",
    password: process.env.TEST_MOBILE_USER_3_PASSWORD ?? "Demo1234!",
    role: "member",
  },
];

const fixedIds = {
  memberOne: "10000000-0000-0000-0000-000000000001",
  memberTwo: "10000000-0000-0000-0000-000000000002",
  memberThree: "10000000-0000-0000-0000-000000000003",
  planOne: "20000000-0000-0000-0000-000000000001",
  planTwo: "20000000-0000-0000-0000-000000000002",
  planThree: "20000000-0000-0000-0000-000000000003",
  templateOne: "30000000-0000-0000-0000-000000000001",
  templateTwo: "30000000-0000-0000-0000-000000000002",
  blockOne: "31000000-0000-0000-0000-000000000001",
  blockTwo: "31000000-0000-0000-0000-000000000002",
  exerciseOne: "32000000-0000-0000-0000-000000000001",
  exerciseTwo: "32000000-0000-0000-0000-000000000002",
  exerciseThree: "32000000-0000-0000-0000-000000000003",
  exerciseFour: "32000000-0000-0000-0000-000000000004",
  assignmentOne: "33000000-0000-0000-0000-000000000001",
  assignmentTwo: "33000000-0000-0000-0000-000000000002",
};

function runSupabaseCommand(args, { capture = false } = {}) {
  return execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["supabase", ...args],
    {
      cwd: repoRoot,
      encoding: capture ? "utf8" : "inherit",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    },
  );
}

function parseEnvBlock(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key] = rest.join("=").replace(/^"|"$/g, "");
      return acc;
    }, {});
}

async function ensureAuthUsers(client) {
  for (const user of demoUsers) {
    const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = data.users.find((candidate) => candidate.email === user.email);

    if (existing) {
      await client.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password: user.password,
      });
      continue;
    }

    const { error } = await client.auth.admin.createUser({
      email: user.email,
      email_confirm: true,
      password: user.password,
    });

    if (error) {
      throw new Error(`No se pudo crear ${user.email}: ${error.message}`);
    }
  }
}

async function listDemoAuthUsers(client) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error) {
    throw new Error(error.message);
  }

  const usersByEmail = new Map();

  for (const user of data.users) {
    if (user.email) {
      usersByEmail.set(user.email, user);
    }
  }

  return usersByEmail;
}

async function upsertDemoData(client) {
  const authUsers = await listDemoAuthUsers(client);
  const trainer = authUsers.get(demoUsers[0].email);
  const user1 = authUsers.get(demoUsers[1].email);
  const user2 = authUsers.get(demoUsers[2].email);
  const user3 = authUsers.get(demoUsers[3].email);

  if (!trainer || !user1 || !user2 || !user3) {
    throw new Error("No se pudieron resolver todos los usuarios demo en auth.users.");
  }

  const now = new Date().toISOString();

  await client.from("member_commerce_customers").upsert(
    [trainer, user1, user2, user3].map((user) => ({
      created_at: now,
      email: user.email,
      medusa_customer_id: `demo-${user.email.split("@")[0]}`,
      supabase_user_id: user.id,
      updated_at: now,
    })),
    { onConflict: "supabase_user_id" },
  );

  await client.from("user_roles").upsert(
    {
      assigned_at: now,
      created_at: now,
      is_irreversible: true,
      note: "Demo mobile trainer seed",
      role: "trainer",
      updated_at: now,
      user_id: trainer.id,
    },
    { onConflict: "user_id,role" },
  );

  await client.from("trainer_profiles").upsert(
    {
      bio: "Perfil demo mobile para staff.",
      branch_name: "Centro - Monolito",
      created_at: now,
      display_name: "Coach Nova",
      is_active: true,
      updated_at: now,
      user_id: trainer.id,
    },
    { onConflict: "user_id" },
  );

  await client.from("member_profiles").upsert(
    [
      {
        branch_name: "Centro - Monolito",
        created_at: now,
        email: user1.email,
        full_name: "Usuario Uno",
        id: fixedIds.memberOne,
        join_date: "2025-01-10",
        member_number: "NF-101",
        notes: null,
        phone: "+34 600 111 111",
        status: "active",
        supabase_user_id: user1.id,
        trainer_user_id: trainer.id,
        updated_at: now,
      },
      {
        branch_name: "Centro - Monolito",
        created_at: now,
        email: user2.email,
        full_name: "Usuario Dos",
        id: fixedIds.memberTwo,
        join_date: "2025-02-14",
        member_number: "NF-102",
        notes: "Demo sin rutina activa para validar empty state real.",
        phone: "+34 600 222 222",
        status: "active",
        supabase_user_id: user2.id,
        trainer_user_id: trainer.id,
        updated_at: now,
      },
      {
        branch_name: "Centro - Monolito",
        created_at: now,
        email: user3.email,
        full_name: "Usuario Tres",
        id: fixedIds.memberThree,
        join_date: "2025-03-01",
        member_number: "NF-103",
        notes: null,
        phone: "+34 600 333 333",
        status: "paused",
        supabase_user_id: user3.id,
        trainer_user_id: trainer.id,
        updated_at: now,
      },
    ],
    { onConflict: "supabase_user_id" },
  );

  await client.from("member_plan_snapshots").upsert(
    [
      {
        created_at: now,
        ends_at: null,
        id: fixedIds.planOne,
        is_current: true,
        label: "Elite Performance",
        member_id: fixedIds.memberOne,
        notes: "Plan demo con rutina activa.",
        started_at: "2025-01-10",
        status: "active",
        updated_at: now,
      },
      {
        created_at: now,
        ends_at: null,
        id: fixedIds.planTwo,
        is_current: true,
        label: "Fuerza Basica",
        member_id: fixedIds.memberTwo,
        notes: "Plan demo sin rutina para validar asignacion.",
        started_at: "2025-02-14",
        status: "active",
        updated_at: now,
      },
      {
        created_at: now,
        ends_at: null,
        id: fixedIds.planThree,
        is_current: true,
        label: "Hipertrofia Controlada",
        member_id: fixedIds.memberThree,
        notes: "Plan demo pausado.",
        started_at: "2025-03-01",
        status: "paused",
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );

  await client.from("routine_templates").upsert(
    [
      {
        created_at: now,
        created_by: trainer.id,
        duration_label: "8 semanas",
        goal: "Construir base de fuerza general.",
        id: fixedIds.templateOne,
        intensity_label: "Media / Alta",
        is_active: true,
        status_label: "Activa",
        summary: "Empuje, traccion y pierna con volumen controlado.",
        title: "FUERZA BASE A",
        trainer_user_id: trainer.id,
        updated_at: now,
      },
      {
        created_at: now,
        created_by: trainer.id,
        duration_label: "6 semanas",
        goal: "Mejorar volumen y tecnica.",
        id: fixedIds.templateTwo,
        intensity_label: "Media",
        is_active: true,
        status_label: "Activa",
        summary: "Trabajo estructurado para torso y pierna con fatiga moderada.",
        title: "HIPERTROFIA CONTROLADA",
        trainer_user_id: trainer.id,
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );

  await client.from("routine_template_blocks").upsert(
    [
      {
        created_at: now,
        description: "Fuerza bilateral y empuje.",
        id: fixedIds.blockOne,
        routine_template_id: fixedIds.templateOne,
        sort_order: 0,
        title: "Bloque 1",
        updated_at: now,
      },
      {
        created_at: now,
        description: "Trabajo mixto de hipertrofia.",
        id: fixedIds.blockTwo,
        routine_template_id: fixedIds.templateTwo,
        sort_order: 0,
        title: "Bloque 1",
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );

  await client.from("routine_template_exercises").upsert(
    [
      {
        created_at: now,
        id: fixedIds.exerciseOne,
        name: "Press banca",
        notes: "Subir carga si sale limpio.",
        reps_label: "6",
        rest_seconds: 120,
        routine_block_id: fixedIds.blockOne,
        sets_label: "4",
        sort_order: 0,
        updated_at: now,
      },
      {
        created_at: now,
        id: fixedIds.exerciseTwo,
        name: "Remo con barra",
        notes: null,
        reps_label: "8",
        rest_seconds: 90,
        routine_block_id: fixedIds.blockOne,
        sets_label: "4",
        sort_order: 1,
        updated_at: now,
      },
      {
        created_at: now,
        id: fixedIds.exerciseThree,
        name: "Sentadilla goblet",
        notes: null,
        reps_label: "12",
        rest_seconds: 75,
        routine_block_id: fixedIds.blockTwo,
        sets_label: "3",
        sort_order: 0,
        updated_at: now,
      },
      {
        created_at: now,
        id: fixedIds.exerciseFour,
        name: "Jalon al pecho",
        notes: "Controla la excentrica.",
        reps_label: "12",
        rest_seconds: 60,
        routine_block_id: fixedIds.blockTwo,
        sets_label: "3",
        sort_order: 1,
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );

  await client.from("routine_assignments").upsert(
    [
      {
        assigned_at: now,
        assigned_by_user_id: trainer.id,
        created_at: now,
        ends_on: null,
        id: fixedIds.assignmentOne,
        member_id: fixedIds.memberOne,
        notes: "Asignacion demo activa para usuario 1.",
        routine_template_id: fixedIds.templateOne,
        starts_on: "2025-03-15",
        status: "active",
        trainer_user_id: trainer.id,
        updated_at: now,
      },
      {
        assigned_at: now,
        assigned_by_user_id: trainer.id,
        created_at: now,
        ends_on: "2025-03-28",
        id: fixedIds.assignmentTwo,
        member_id: fixedIds.memberThree,
        notes: "Historial demo archivado para usuario 3.",
        routine_template_id: fixedIds.templateTwo,
        starts_on: "2025-03-05",
        status: "archived",
        trainer_user_id: trainer.id,
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );
}

export async function resetMobileLiveTestDb() {
  runSupabaseCommand(["start"]);
  runSupabaseCommand(["db", "reset", "--local"]);

  const statusEnv = parseEnvBlock(runSupabaseCommand(["status", "-o", "env"], { capture: true }));
  const supabaseUrl = statusEnv.API_URL;
  const secretKey = statusEnv.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("No se pudieron resolver API_URL y SERVICE_ROLE_KEY desde supabase status.");
  }

  const client = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await ensureAuthUsers(client);
  await upsertDemoData(client);

  return {
    apiUrl: statusEnv.API_URL,
    anonKey: statusEnv.ANON_KEY,
    dbUrl: statusEnv.DB_URL,
    secretKey: statusEnv.SERVICE_ROLE_KEY,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const env = await resetMobileLiveTestDb();
  process.stdout.write(`${JSON.stringify(env)}\n`);
}
