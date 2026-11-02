#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const BACKEND_DIR = path.join(rootDir, "apps", "backend");
const CLIENT_DIR = path.join(rootDir, "apps", "client");
const ADMIN_DIR = path.join(rootDir, "apps", "admin");
const CLIENT_PACKAGE_JSON_PATH = path.join(CLIENT_DIR, "package.json");
const DEFAULT_RELEASES_DIR = path.join(rootDir, "releases");

const NODE_MAPSERVICE_BASE = "http://localhost:3002/api/v2";
const SIMPLE_MAPSERVICE_BASE = "";

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed (${code}): ${command} ${args.join(" ")} in ${cwd}`,
          ),
        );
      }
    });

    child.on("error", reject);
  });
}

// npm ci removes node_modules and installs exactly what package-lock.json
// says, so the packages contain the dependencies of the checked-out commit.
async function cleanInstallDependencies() {
  for (const appDir of [BACKEND_DIR, ADMIN_DIR, CLIENT_DIR]) {
    console.log(
      `\nClean installing dependencies in ${path.relative(rootDir, appDir)}...`,
    );
    await runCommand("npm", ["ci"], appDir);
  }
}

async function ensureDirectoryExists(dirPath) {
  let dirStat;
  try {
    dirStat = await stat(dirPath);
  } catch {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  if (!dirStat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }
}

async function ensureDirectory(dirPath) {
  await mkdir(dirPath, { recursive: true });
  await ensureDirectoryExists(dirPath);
}

function normalizeVersion(inputVersion) {
  const trimmed = inputVersion.trim();
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?(-[0-9A-Za-z.-]+)?$/.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid version "${inputVersion}". Use "major.minor.patch" or "major.minor.patch-rc.N".`,
    );
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = match[3] ? Number.parseInt(match[3], 10) : 0;
  const preRelease = match[4] ?? "";
  return `${major}.${minor}.${patch}${preRelease}`;
}

async function getClientPackageVersion() {
  const packageRaw = await readFile(CLIENT_PACKAGE_JSON_PATH, "utf8");
  const packageJson = JSON.parse(packageRaw);

  if (typeof packageJson.version !== "string" || packageJson.version.trim() === "") {
    throw new Error(`Missing or invalid version in ${CLIENT_PACKAGE_JSON_PATH}.`);
  }

  return normalizeVersion(packageJson.version);
}

function buildReleaseName(version, type) {
  return `hajk-v${version}-${type}`;
}

async function zipDirectory(sourceDir) {
  const absoluteSourceDir = path.resolve(sourceDir);
  const parentDir = path.dirname(absoluteSourceDir);
  const archiveName = `${path.basename(absoluteSourceDir)}.zip`;
  const archivePath = path.join(parentDir, archiveName);

  await rm(archivePath, { force: true });

  if (process.platform === "win32") {
    await runCommand(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${absoluteSourceDir}' -DestinationPath '${archivePath}' -Force`,
      ],
      parentDir,
    );
  } else {
    await runCommand("zip", ["-r", "-q", archiveName, path.basename(absoluteSourceDir)], parentDir);
  }

  return archivePath;
}

async function updateMapserviceBase(configPath, mapserviceBase) {
  const rawConfig = await readFile(configPath, "utf8");
  const config = JSON.parse(rawConfig);
  config.mapserviceBase = mapserviceBase;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function assembleSimpleRelease(simpleReleaseDir, clientDistDir) {
  await rm(simpleReleaseDir, { recursive: true, force: true });
  await mkdir(simpleReleaseDir, { recursive: true });
  await cp(clientDistDir, simpleReleaseDir, { recursive: true });

  const simpleConfig = path.join(simpleReleaseDir, "appConfig.json");
  await updateMapserviceBase(simpleConfig, SIMPLE_MAPSERVICE_BASE);
}

async function assembleNodeRelease(
  nodeReleaseDir,
  backendDistDir,
  adminBuildDir,
  clientDistDir,
) {
  await rm(nodeReleaseDir, { recursive: true, force: true });
  await mkdir(nodeReleaseDir, { recursive: true });

  await cp(
    path.join(BACKEND_DIR, ".env.example"),
    path.join(nodeReleaseDir, ".env"),
  );
  await cp(
    path.join(BACKEND_DIR, "App_Data"),
    path.join(nodeReleaseDir, "App_Data"),
    {
      recursive: true,
    },
  );

  await cp(
    path.join(backendDistDir, "apis"),
    path.join(nodeReleaseDir, "apis"),
    {
      recursive: true,
    },
  );
  await cp(
    path.join(backendDistDir, "common"),
    path.join(nodeReleaseDir, "common"),
    {
      recursive: true,
    },
  );
  await cp(
    path.join(backendDistDir, "index.js"),
    path.join(nodeReleaseDir, "index.js"),
  );
  await cp(
    path.join(backendDistDir, "routes.js"),
    path.join(nodeReleaseDir, "routes.js"),
  );
  await cp(
    path.join(BACKEND_DIR, "package.json"),
    path.join(nodeReleaseDir, "package.json"),
  );
  await cp(
    path.join(BACKEND_DIR, "package-lock.json"),
    path.join(nodeReleaseDir, "package-lock.json"),
  );

  const staticDir = path.join(nodeReleaseDir, "static");
  await cp(path.join(BACKEND_DIR, "static"), staticDir, { recursive: true });

  const staticClientDir = path.join(staticDir, "client");
  const staticAdminDir = path.join(staticDir, "admin");

  await rm(staticClientDir, { recursive: true, force: true });
  await rm(staticAdminDir, { recursive: true, force: true });

  await cp(clientDistDir, staticClientDir, { recursive: true });
  await cp(adminBuildDir, staticAdminDir, { recursive: true });

  const nodeConfig = path.join(staticClientDir, "appConfig.json");
  await updateMapserviceBase(nodeConfig, NODE_MAPSERVICE_BASE);
}

async function main() {
  // With --ci, every question gets its default answer and archives are always
  // created. Used by the release workflow in .github/workflows/release.yml.
  const isCi = process.argv.includes("--ci");
  const rl = isCi ? null : createInterface({ input, output });
  const ask = (question, ciAnswer) =>
    isCi ? Promise.resolve(ciAnswer) : rl.question(question);

  try {
    await ensureDirectory(DEFAULT_RELEASES_DIR);

    const targetParentDirInput = await ask(
      `Where should the release folders be created? (default: ${DEFAULT_RELEASES_DIR}): `,
      "",
    );
    const targetParentDir =
      targetParentDirInput.trim() === ""
        ? DEFAULT_RELEASES_DIR
        : path.resolve(targetParentDirInput.trim());
    await ensureDirectory(targetParentDir);

    const defaultVersion = await getClientPackageVersion();

    // The version comes from apps/client/package.json and includes any
    // pre-release part, e.g. 4.4.0-rc.1 for a release candidate.
    const versionInput = await ask(
      `Release version override (default ${defaultVersion}, press Enter to keep): `,
      "",
    );
    const version =
      versionInput.trim() === ""
        ? defaultVersion
        : normalizeVersion(versionInput);

    const cleanInstallInput = await ask(
      "Clean install dependencies (npm ci) before build? (Y/n): ",
      "y",
    );
    const shouldCleanInstall = !/^(n|no)$/i.test(cleanInstallInput.trim());

    const zipReleasesInput = await ask(
      "Create .zip archives for release folders automatically? (y/N): ",
      "y",
    );
    const shouldZipReleases = /^(y|yes)$/i.test(zipReleasesInput.trim());

    const simpleReleaseName = buildReleaseName(version, "simple");
    const nodeReleaseName = buildReleaseName(version, "nodejs");
    const simpleReleaseDir = path.join(targetParentDir, simpleReleaseName);
    const nodeReleaseDir = path.join(targetParentDir, nodeReleaseName);

    if (shouldCleanInstall) {
      await cleanInstallDependencies();
    }

    console.log("\nBuilding backend...");
    await runCommand("npm", ["run", "compile"], BACKEND_DIR);

    console.log("\nBuilding admin...");
    await runCommand("npm", ["run", "build"], ADMIN_DIR);

    console.log("\nBuilding client...");
    await runCommand("npm", ["run", "build"], CLIENT_DIR);

    const backendDistDir = path.join(BACKEND_DIR, "dist");
    const adminBuildDir = path.join(ADMIN_DIR, "build");
    const clientDistDir = path.join(CLIENT_DIR, "build");

    console.log("\nAssembling simple release...");
    await assembleSimpleRelease(simpleReleaseDir, clientDistDir);

    console.log("Assembling nodejs release...");
    await assembleNodeRelease(
      nodeReleaseDir,
      backendDistDir,
      adminBuildDir,
      clientDistDir,
    );

    console.log("\nRelease creation complete!");
    console.log(`Simple release: ${simpleReleaseDir}`);
    console.log(`Nodejs release: ${nodeReleaseDir}`);

    if (shouldZipReleases) {
      console.log("\nCreating zip archives...");
      const simpleArchivePath = await zipDirectory(simpleReleaseDir);
      const nodeArchivePath = await zipDirectory(nodeReleaseDir);
      console.log(`Simple release archive: ${simpleArchivePath}`);
      console.log(`Nodejs release archive: ${nodeArchivePath}`);
    }
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(`\nRelease creation failed: ${error.message}`);
  process.exitCode = 1;
});
