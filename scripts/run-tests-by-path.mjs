import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const vitestBin = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");
const jestBin = path.join(repoRoot, "apps", "medusa", "node_modules", "jest", "bin", "jest.js");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Uso: node scripts/run-tests-by-path.mjs <ruta-o-fichero> [...]");
  process.exit(1);
}

const vitestExtensions = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];
const jestExtensions = [".unit.spec.ts", ".unit.spec.js", ".spec.ts", ".spec.js"];

function normalize(inputPath) {
  return path.resolve(repoRoot, inputPath);
}

function isMedusaPath(targetPath) {
  return targetPath.includes(`${path.sep}apps${path.sep}medusa${path.sep}`);
}

function isTestFile(filePath, extensions) {
  return extensions.some((extension) => filePath.endsWith(extension));
}

function walk(dirPath, matcher, allFiles = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") {
        continue;
      }

      walk(entryPath, matcher, allFiles);
      continue;
    }

    if (matcher(entryPath)) {
      allFiles.push(entryPath);
    }
  }

  return allFiles;
}

function findSiblingTests(filePath, extensions) {
  const directory = path.dirname(filePath);
  const basename = path.basename(filePath, path.extname(filePath));
  const directCandidates = extensions.map((extension) => path.join(directory, `${basename}${extension}`));
  const nestedCandidates = extensions.map((extension) =>
    path.join(directory, "__tests__", `${basename}${extension}`),
  );

  return [...directCandidates, ...nestedCandidates].filter((candidate) => fs.existsSync(candidate));
}

function resolveTargets(inputPath, extensions) {
  const absolutePath = normalize(inputPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`La ruta no existe: ${inputPath}`);
  }

  const stat = fs.statSync(absolutePath);

  if (stat.isDirectory()) {
    return walk(absolutePath, (candidate) => isTestFile(candidate, extensions));
  }

  if (isTestFile(absolutePath, extensions)) {
    return [absolutePath];
  }

  const siblingTests = findSiblingTests(absolutePath, extensions);

  if (siblingTests.length > 0) {
    return siblingTests;
  }

  throw new Error(`No encontré tests asociados para: ${inputPath}`);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

const vitestTargets = new Set();
const jestTargets = new Set();

for (const inputPath of args) {
  const absolutePath = normalize(inputPath);
  const targets = resolveTargets(
    inputPath,
    isMedusaPath(absolutePath) ? jestExtensions : vitestExtensions,
  );

  for (const target of targets) {
    if (isMedusaPath(target)) {
      jestTargets.add(path.relative(path.join(repoRoot, "apps", "medusa"), target));
    } else {
      vitestTargets.add(path.relative(repoRoot, target));
    }
  }
}

if (vitestTargets.size > 0) {
  run(process.execPath, [vitestBin, "run", ...Array.from(vitestTargets)], { cwd: repoRoot });
}

if (jestTargets.size > 0) {
  run(
    process.execPath,
    [jestBin, "--silent", "--runInBand", "--forceExit", "--runTestsByPath", ...Array.from(jestTargets)],
    {
      cwd: path.join(repoRoot, "apps", "medusa"),
      env: {
        ...process.env,
        TEST_TYPE: "unit",
        NODE_OPTIONS: "--experimental-vm-modules",
      },
    },
  );
}
