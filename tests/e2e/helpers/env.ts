import { randomUUID } from "node:crypto";

export function getBaseUrl() {
  return process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
}

export function getAdminCredentials() {
  const identity = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!identity || !password) {
    throw new Error(
      "Playwright necesita ADMIN_USER y ADMIN_PASSWORD para ejecutar smoke tests del dashboard.",
    );
  }

  return { identity, password };
}

export function createSmokeLeadPayload() {
  const id = randomUUID().slice(0, 8);

  return {
    name: `Smoke Lead ${id}`,
    email: `smoke-${id}@example.com`,
    phone: "+51 900 000 000",
    message: `Lead generado por smoke QA ${id}`,
  };
}
