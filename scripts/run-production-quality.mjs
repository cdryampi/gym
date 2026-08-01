import { spawnSync } from "node:child_process";

const commands = [
  ["pnpm", ["run", "security:all"]],
  ["pnpm", ["run", "lint", "--max-warnings=0"]],
  ["pnpm", ["run", "typecheck"]],
  ["pnpm", ["run", "test:coverage"]],
  ["pnpm", ["run", "test:e2e:critical"]],
  ["pnpm", ["run", "build"]],
  ["npm", ["--prefix", "apps/medusa", "run", "test:unit"]],
  ["pnpm", ["run", "build:medusa"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
