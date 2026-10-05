// Discovers plugin entry modules at build time.
//
// A plugin is available when its folder name matches its entry file:
// `plugins/<Name>/<Name>.jsx` or `.tsx`. Sibling files such as
// `<Name>View.jsx` are not entries. Search is the exception and lives at
// `components/Search/Search.jsx|tsx`.
//
// `appConfig.availableTools` still chooses which of these plugins to load.

const pluginModules = import.meta.glob([
  "../../plugins/*/*.{jsx,tsx}",
  "../../components/Search/Search.{jsx,tsx}",
]);

const ENTRY_PATH = /\/(plugins|components)\/([^/]+)\/([^/]+)\.(jsx|tsx)$/;

/** @type {Map<string, { jsx?: () => Promise<{ default: unknown }>, tsx?: () => Promise<{ default: unknown }> }>} */
const entryLoaders = new Map();

for (const [path, loader] of Object.entries(pluginModules)) {
  const match = path.match(ENTRY_PATH);
  if (!match) {
    continue;
  }

  const [, root, folder, fileName, extension] = match;
  if (folder !== fileName) {
    continue;
  }

  const key = `${root}/${folder}`;
  const entry = entryLoaders.get(key) ?? { jsx: undefined, tsx: undefined };
  entry[extension] = loader;
  entryLoaders.set(key, entry);
}

for (const [key, entry] of entryLoaders) {
  if (entry.jsx && entry.tsx) {
    const name = key.slice(key.indexOf("/") + 1);
    console.warn(
      `Plugin "${name}" has both ${name}.jsx and ${name}.tsx. Using ${name}.tsx.`
    );
  }
}

const pluginNames = new Set();
for (const key of entryLoaders.keys()) {
  pluginNames.add(key.slice(key.indexOf("/") + 1));
}

export const AVAILABLE_PLUGINS = [...pluginNames].sort();

/**
 * Loader for a plugin entry module. `.tsx` is preferred over `.jsx`.
 * Search is resolved under `components/` rather than `plugins/`.
 * @param {string} name Plugin name (folder name)
 * @returns {(() => Promise<{ default: unknown }>) | undefined}
 */
export function getPluginLoader(name) {
  const root = name === "Search" ? "components" : "plugins";
  const entry = entryLoaders.get(`${root}/${name}`);
  if (!entry) {
    return undefined;
  }
  return entry.tsx || entry.jsx;
}
