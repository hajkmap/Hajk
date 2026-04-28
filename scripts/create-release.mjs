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

async function refreshDependencies() {
  const reinstallScriptPath = path.join(
    rootDir,
    "scripts",
    "reinstall_modules.sh",
  );

  if (process.platform === "win32") {
    console.log(
      "\nWindows detected: reinstall_modules.sh is bash-only, using npm install per app instead...",
    );
    await runCommand("npm", ["install"], BACKEND_DIR);
    await runCommand("npm", ["install"], ADMIN_DIR);
    await runCommand("npm", ["install"], CLIENT_DIR);
    return;
  }

  console.log(
    "\nRefreshing dependencies using scripts/reinstall_modules.sh...",
  );
  await runCommand("bash", [reinstallScriptPath], rootDir);
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
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid version "${inputVersion}". Use "major.minor.patch" or "major.minor.patch".`,
    );
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = match[3] ? Number.parseInt(match[3], 10) : 0;
  return `${major}.${minor}.${patch}`;
}

async function getClientPackageVersion() {
  const packageRaw = await readFile(CLIENT_PACKAGE_JSON_PATH, "utf8");
  const packageJson = JSON.parse(packageRaw);

  if (typeof packageJson.version !== "string" || packageJson.version.trim() === "") {
    throw new Error(`Missing or invalid version in ${CLIENT_PACKAGE_JSON_PATH}.`);
  }

  return normalizeVersion(packageJson.version);
}

function buildReleaseName(version, isRc, rcNumber, type) {
  const rcPart = isRc ? `-rc.${rcNumber}` : "";
  return `hajk-v${version}${rcPart}-${type}`;
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
  const rl = createInterface({ input, output });

  try {
    await ensureDirectory(DEFAULT_RELEASES_DIR);

    const targetParentDirInput = await rl.question(
      `Where should the release folders be created? (default: ${DEFAULT_RELEASES_DIR}): `,
    );
    const targetParentDir =
      targetParentDirInput.trim() === ""
        ? DEFAULT_RELEASES_DIR
        : path.resolve(targetParentDirInput.trim());
    await ensureDirectory(targetParentDir);

    const defaultVersion = await getClientPackageVersion();

    const versionInput = await rl.question(
      `Release version override (default ${defaultVersion}, press Enter to keep): `,
    );
    const version =
      versionInput.trim() === ""
        ? defaultVersion
        : normalizeVersion(versionInput);

    const rcInput = await rl.question("Is this a release candidate? (y/N): ");
    const isRc = /^(y|yes)$/i.test(rcInput.trim());

    const refreshDepsInput = await rl.question(
      "Reinstall dependencies before build? (y/N): ",
    );
    const shouldRefreshDependencies = /^(y|yes)$/i.test(
      refreshDepsInput.trim(),
    );

    const zipReleasesInput = await rl.question(
      "Create .zip archives for release folders automatically? (y/N): ",
    );
    const shouldZipReleases = /^(y|yes)$/i.test(zipReleasesInput.trim());

    let rcNumber = 1;
    if (isRc) {
      const rcNumberInput = await rl.question(
        "Release candidate number (default 1): ",
      );
      if (rcNumberInput.trim() !== "") {
        const parsedRc = Number.parseInt(rcNumberInput.trim(), 10);
        if (!Number.isInteger(parsedRc) || parsedRc <= 0) {
          throw new Error("RC number must be a positive integer.");
        }
        rcNumber = parsedRc;
      }
    }

    const simpleReleaseName = buildReleaseName(
      version,
      isRc,
      rcNumber,
      "simple",
    );
    const nodeReleaseName = buildReleaseName(version, isRc, rcNumber, "nodejs");
    const simpleReleaseDir = path.join(targetParentDir, simpleReleaseName);
    const nodeReleaseDir = path.join(targetParentDir, nodeReleaseName);

    if (shouldRefreshDependencies) {
      await refreshDependencies();
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
    rl.close();
  }
}

main().catch((error) => {
  console.error(`\nRelease creation failed: ${error.message}`);
  process.exitCode = 1;
});
