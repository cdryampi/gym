import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { resetMobileLiveTestDb } from "./mobile-live-test-db-reset.mjs";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const vitestBin = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");
const liveTestFile = "src/app/api/mobile/mobile-live.test.ts";

const env = await resetMobileLiveTestDb();

const result = spawnSync(
  process.execPath,
  [
    vitestBin,
    "run",
    liveTestFile,
  ],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.anonKey,
      NEXT_PUBLIC_SUPABASE_URL: env.apiUrl,
      SUPABASE_SECRET_KEY: env.secretKey,
      TEST_MOBILE_DEMO_TRAINER_EMAIL: process.env.TEST_MOBILE_TRAINER_EMAIL ?? "entrenador@novaforza.com",
      TEST_MOBILE_DEMO_TRAINER_PASSWORD: process.env.TEST_MOBILE_TRAINER_PASSWORD ?? "Demo1234!",
      TEST_MOBILE_DEMO_USER_1_EMAIL: process.env.TEST_MOBILE_USER_1_EMAIL ?? "usuario1@novaforza.com",
      TEST_MOBILE_DEMO_USER_1_PASSWORD: process.env.TEST_MOBILE_USER_1_PASSWORD ?? "Demo1234!",
      TEST_MOBILE_DEMO_USER_2_EMAIL: process.env.TEST_MOBILE_USER_2_EMAIL ?? "usuario2@novaforza.com",
      TEST_MOBILE_DEMO_USER_2_PASSWORD: process.env.TEST_MOBILE_USER_2_PASSWORD ?? "Demo1234!",
      TEST_MOBILE_DEMO_USER_3_EMAIL: process.env.TEST_MOBILE_USER_3_EMAIL ?? "usuario3@novaforza.com",
      TEST_MOBILE_DEMO_USER_3_PASSWORD: process.env.TEST_MOBILE_USER_3_PASSWORD ?? "Demo1234!",
      TEST_MOBILE_LIVE_DB_URL: env.dbUrl,
      TEST_MOBILE_SUPABASE_URL: env.apiUrl,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
