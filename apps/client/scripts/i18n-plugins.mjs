// Runs an i18next-cli command for each plugin that owns an i18n/ folder
// (src/plugins/<Plugin>/i18n/<lng>.json), see I18N_PLUGIN in i18next.config.ts.
//
// Usage:
//   node scripts/i18n-plugins.mjs extract|status   run the command per plugin
//   node scripts/i18n-plugins.mjs merge-types      write the deep-merged core +
//                                                  plugin sv.json that `types` reads
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { delimiter, resolve } from "node:path";

const SOURCE_LANGUAGE = "sv";
const TYPES_INPUT = "node_modules/.cache/hajk-i18n/sv.json";

const plugins = readdirSync("src/plugins", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`src/plugins/${d.name}/i18n`))
  .map((d) => d.name);

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

// Same rule as the runtime (src/i18n/index.js): core wins on conflicts.
function mergeMissing(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] ??= {};
      mergeMissing(target[key], value);
    } else if (!(key in target)) {
      target[key] = value;
    }
  }
  return target;
}

const [command, ...args] = process.argv.slice(2);

if (command === "merge-types") {
  const merged = readJson(`src/i18n/${SOURCE_LANGUAGE}.json`);
  for (const plugin of plugins) {
    const file = `src/plugins/${plugin}/i18n/${SOURCE_LANGUAGE}.json`;
    existsSync(file) && mergeMissing(merged, readJson(file));
  }
  mkdirSync(TYPES_INPUT.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(TYPES_INPUT, JSON.stringify(merged, null, 2));
} else if (["extract", "status"].includes(command)) {
  let failed = false;
  for (const plugin of plugins) {
    console.log(`\n▸ ${plugin}`);
    const { status, error } = spawnSync("i18next-cli", [command, ...args], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        PATH: `${resolve("node_modules/.bin")}${delimiter}${process.env.PATH}`,
        I18N_PLUGIN: plugin,
      },
    });
    error && console.error(error.message);
    failed ||= status !== 0;
  }
  process.exit(failed ? 1 : 0);
} else {
  console.error(
    "Usage: node scripts/i18n-plugins.mjs extract|status|merge-types"
  );
  process.exit(1);
}
