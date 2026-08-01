import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const migrationPath = path.join(
  workspaceRoot,
  "supabase",
  "migrations",
  "202604090001_harden_membership_qr_reception.sql",
);
const edgeFunctionPath = path.join(
  workspaceRoot,
  "supabase",
  "functions",
  "membership-qr-validate",
  "index.ts",
);
const docsPath = path.join(workspaceRoot, "docs", "membership-qr-ops.md");

function logResult(label, ok, detail) {
  const prefix = ok ? "[OK]" : "[WARN]";
  console.log(`${prefix} ${label}: ${detail}`);
}

function getEnv(name) {
  return process.env[name]?.trim() || "";
}

async function run() {
  console.log("Membership QR doctor\n");

  logResult(
    "Migration file",
    fs.existsSync(migrationPath),
    fs.existsSync(migrationPath) ? migrationPath : "Falta la migracion del dominio QR.",
  );
  logResult(
    "Edge function",
    fs.existsSync(edgeFunctionPath),
    fs.existsSync(edgeFunctionPath) ? edgeFunctionPath : "Falta la edge function membership-qr-validate.",
  );
  logResult(
    "Ops docs",
    fs.existsSync(docsPath),
    fs.existsSync(docsPath) ? docsPath : "Falta la guia operativa del flujo QR.",
  );

  const supabaseUrl =
    getEnv("NEXT_PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL") || "http://127.0.0.1:54321";
  const secretKey = getEnv("SUPABASE_SECRET_KEY");

  logResult(
    "SUPABASE_SECRET_KEY",
    Boolean(secretKey),
    secretKey ? "Configurada." : "Configura la service role para validar y diagnosticar QR.",
  );
  logResult("Supabase URL", true, supabaseUrl);

  if (!secretKey) {
    console.log(
      "\nSiguiente paso sugerido:\n- exporta SUPABASE_SECRET_KEY\n- ejecuta `npx supabase db push`\n- ejecuta `npx supabase functions serve membership-qr-validate` o despliegala",
    );
    process.exitCode = 1;
    return;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/membership-qr-validate`, {
    method: "POST",
    headers: {
      apikey: secretKey,
      "Content-Type": "application/json",
      "x-site-url": "https://novaforza.pe",
    },
    body: JSON.stringify({
      scannedValue: "00000000-0000-4000-8000-000000000000",
    }),
  }).catch((error) => error);

  if (response instanceof Error) {
    logResult("Runtime probe", false, response.message);
    console.log(
      "\nNo se pudo contactar con la function. Si estas en local, arranca Supabase y sirve la function:\n- npx supabase start\n- npx supabase db push\n- npx supabase functions serve membership-qr-validate",
    );
    process.exitCode = 1;
    return;
  }

  const payload = await response.json().catch(() => null);
  const reasonCode = payload && typeof payload.reasonCode === "string" ? payload.reasonCode : null;
  const looksOperational =
    response.status === 422 &&
    (reasonCode === "member_not_found" || reasonCode === "invalid_format");

  logResult(
    "Runtime probe",
    looksOperational,
    looksOperational
      ? `La function responde con ${reasonCode}.`
      : `Respuesta inesperada (${response.status})${reasonCode ? ` con ${reasonCode}` : ""}.`,
  );

  if (!looksOperational) {
    console.log(
      "\nRevisa este orden:\n- npx supabase db push\n- npx supabase functions serve membership-qr-validate\n- npx supabase functions deploy membership-qr-validate",
    );
    process.exitCode = 1;
  }
}

await run();
