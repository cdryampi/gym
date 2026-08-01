import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const testType = process.argv[2] ?? "unit";
const jestBin = fileURLToPath(new URL("../node_modules/jest/bin/jest.js", import.meta.url));
const result = spawnSync(
  process.execPath,
  [jestBin, "--silent", "--runInBand", "--forceExit"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TEST_TYPE: testType,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--experimental-vm-modules"]
        .filter(Boolean)
        .join(" "),
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
