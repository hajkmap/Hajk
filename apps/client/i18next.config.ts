/// <reference types="node" />
import { existsSync, readdirSync } from "node:fs";
import { defineConfig, type Plugin } from "i18next-cli";

// Plugins own their strings in src/plugins/<Plugin>/i18n/<lng>.json, under a
// single top-level key: the camelCased folder name (LayerSwitcher → layerSwitcher),
// the same key BaseWindowPlugin uses for "<area>.title"/".description".
//
// This config runs in two modes:
// - core (default): src/** except plugins with an i18n/ folder → src/i18n/<lng>.json
// - one plugin (I18N_PLUGIN=<Folder>, see scripts/i18n-plugins.mjs) → that plugin's i18n/
const toArea = (folder: string) =>
  folder.charAt(0).toLowerCase() + folder.slice(1);

const pluginsWithOwnI18n = readdirSync("src/plugins", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`src/plugins/${d.name}/i18n`))
  .map((d) => d.name);

const plugin = process.env.I18N_PLUGIN;
if (plugin && !pluginsWithOwnI18n.includes(plugin)) {
  throw new Error(`I18N_PLUGIN: src/plugins/${plugin}/i18n/ doesn't exist.`);
}

// Languages are the core files in src/i18n/, so adding a language only takes
// a new src/i18n/<lng>.json (even just "{}"). Swedish is the source and comes first.
const locales = [
  "sv",
  ...readdirSync("src/i18n")
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter((lng) => lng !== "sv")
    .sort(),
];

const areaOf = (key: string) => key.split(".")[0];

// Keeps each file to the areas it owns. Core scans all of src/, so that core
// keys used by plugins (common.*, search.*…) aren't removed.
// - core drops plugin areas. Core may read a plugin's admin-configurable default
//   (e.g. Introduction uses "layerSwitcher.title"), but the plugin owns that key.
// - a plugin drops core areas and fails on another plugin's area. Borrowing
//   another plugin's key would write it to this plugin's file as "", which can
//   shadow the real string when the files are merged at runtime.
const scopeKeys: Plugin = {
  name: "hajk-scope-keys",
  onEnd(keys) {
    const pluginAreas = pluginsWithOwnI18n.map(toArea);
    const foreign = new Set<string>();
    for (const [id, { key, locations }] of keys) {
      const area = areaOf(key);
      const isPluginArea = pluginAreas.includes(area);
      if (!plugin) {
        if (isPluginArea) keys.delete(id);
      } else if (!isPluginArea) {
        keys.delete(id); // core area
      } else if (area !== toArea(plugin)) {
        const where = locations?.map((l) => `${l.file}:${l.line}`).join(", ");
        foreign.add(`  ${key} (${where})`);
      }
    }
    if (plugin && foreign.size > 0) {
      throw new Error(
        `${plugin} uses other plugins' keys. ` +
          `Move these to common.* or to ${toArea(plugin)}.*:\n${[...foreign].join("\n")}`
      );
    }
  },
};

export default defineConfig({
  locales,
  extract: {
    input: plugin
      ? `src/plugins/${plugin}/**/*.{js,jsx,ts,tsx}`
      : "src/**/*.{js,jsx,ts,tsx}",
    ignore: plugin
      ? [`src/plugins/${plugin}/i18n/**`]
      : ["src/i18n/**", "src/plugins/*/i18n/**"],
    output: plugin
      ? `src/plugins/${plugin}/i18n/{{language}}.json`
      : "src/i18n/{{language}}.json",
    // One file per language holding the default namespace ("translation") as-is,
    // i.e. top-level keys are areas (common, print…), not namespaces.
    defaultNS: false,
    primaryLanguage: "sv",
    sort: true,
    // configText(defaultKey, adminValue) takes its key first, just like t().
    functions: ["t", "*.t", "configText"],
    // Keys built at runtime, so extract can't find them in source:
    // - BaseWindowPlugin reads "<pluginType>.title" and "<pluginType>.description".
    // - Introduction steps read "introduction.steps.<id>.*" (see steps/step.js).
    preservePatterns: plugin
      ? [`${toArea(plugin)}.title`, `${toArea(plugin)}.description`]
      : ["*.title", "*.description", "introduction.steps.*"],
  },
  plugins: [scopeKeys],
  lint: {
    // Only user-facing attributes, so technical ones (className, id, variant,
    // color, size, href…) are never reported.
    acceptedAttributes: [
      "title",
      "label",
      "placeholder",
      "aria-label",
      "alt",
      "helperText",
      // Hajk's own components
      "tooltip",
      "ariaLabel",
      "abstract",
      "primary",
      "secondary",
      "headerText",
    ],
    // Most of Hajk's text sits in MUI components (Typography, Button…), which
    // the default tag list would skip.
    acceptedTags: "all",
  },
  types: {
    // Core and plugin sv.json deep-merged by scripts/i18n-plugins.mjs, so that
    // plugin keys are typed too. Several files named sv.json can't be passed
    // directly: types derives the namespace from the file name.
    input: "node_modules/.cache/hajk-i18n/sv.json",
    output: "src/types/i18next.d.ts",
  },
});
