import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import log4js from "log4js";

const logger = log4js.getLogger("service.informative.documentCache");

const state = {
  cache: new Map(),
  watcher: null, // { w1, w2 } | null
  watcherWarnedOnce: false,
  preloadedOnce: false,
};

/**
 * Reads a JSON file from disk, served from an in-memory cache when possible.
 *
 * Cache semantics:
 * - A read is only served from cache if the entry's mtimeMs still matches
 *   the file's current mtime, so a stale entry can never be returned.
 * - Files that fail to parse (e.g. mid-write) are NOT cached, so the next
 *   read retries instead of returning a poisoned entry.
 *
 * @param {string} absPath Absolute path to a JSON file
 * @returns {Promise<object>} Parsed JSON value
 */
async function readFile(absPath) {
  const st = await fs.promises.stat(absPath);

  const hit = state.cache.get(absPath);
  if (hit && hit.mtimeMs === st.mtimeMs) {
    return hit.data;
  }

  const json = JSON.parse(await fs.promises.readFile(absPath, "utf-8"));
  state.cache.set(absPath, { mtimeMs: st.mtimeMs, data: json });
  return json;
}

function dropEntriesUnder(dirPath) {
  const prefix = dirPath.endsWith(path.sep) ? dirPath : dirPath + path.sep;
  for (const key of state.cache.keys()) {
    if (key === dirPath || key.startsWith(prefix)) {
      state.cache.delete(key);
    }
  }
}

function onWatcherEvent(event, p) {
  if (event === "addDir" || event === "unlinkDir") {
    dropEntriesUnder(p);
  } else {
    state.cache.delete(p);
  }
}

function onWatcherError(err) {
  if (!state.watcherWarnedOnce) {
    logger.warn(
      `File watcher unavailable, falling back to mtime-verification-only mode: ${
        err ? err.message : "unknown error"
      }`
    );
    state.watcherWarnedOnce = true;
  }
  state.watcher = null;
}

/**
 * Starts (once) the chokidar watchers that invalidate the cache when files
 * under App_Data/ change on disk. Idempotent and safe to call repeatedly.
 * If the watcher cannot be started, degrades silently to mtime-only mode.
 */
function ensureWatcher() {
  if (state.watcher) {
    return state.watcher;
  }

  const appDataRoot = path.join(process.cwd(), "App_Data");
  const docsDir = path.join(appDataRoot, "documents");
  const usePolling = process.env.INFORMATIVE_CACHE_POLLING === "true";

  try {
    // Two watchers: recursive on documents/, depth 0 on App_Data/*.json (skip Upload/, templates/).
    // w2 ignores documents/ so those files are not watched twice.
    const w1 = chokidar.watch(docsDir, {
      ignoreInitial: true,
      usePolling,
      pollInterval: 2000,
    });
    const w2 = chokidar.watch(appDataRoot, {
      ignoreInitial: true,
      usePolling,
      pollInterval: 2000,
      depth: 0,
      ignored: (p) => p === docsDir || p.startsWith(docsDir + path.sep),
    });

    for (const watcher of [w1, w2]) {
      watcher
        .on("all", onWatcherEvent)
        .on("error", onWatcherError)
        .on("ready", () => logger.debug("App_Data file watcher ready"));
    }

    state.watcher = { w1, w2 };
    return state.watcher;
  } catch (error) {
    logger.warn(
      `Failed to start App_Data file watcher, using mtime-only mode: ${error.message}`
    );
    state.watcher = null;
    return null;
  }
}

/**
 * Stops the watchers and releases their resources. For tests / manual use —
 * the application relies on process exit to free inotify handles.
 */
async function closeWatcher() {
  if (state.watcher) {
    const { w1, w2 } = state.watcher;
    state.watcher = null;
    await Promise.allSettled([w1.close(), w2.close()]);
  }
}

function collectJsonFilesIn(dir, out) {
  return (
    fs.promises
      .readdir(dir, { withFileTypes: true })
      .then((entries) => {
        const jobs = [];
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            jobs.push(collectJsonFilesIn(full, out));
          } else if (entry.isFile() && entry.name.endsWith(".json")) {
            out.push(full);
          }
        }
        return Promise.all(jobs).then(() => out);
      })
      // A missing directory simply contributes no files.
      .catch((error) => {
        if (error && error.code === "ENOENT") {
          return out;
        }
        throw error;
      })
  );
}

// Scope the preload walk to exactly what the cache ever serves:
//   * top level of App_Data — *.json directly inside it (map configs, layers.json)
//   * App_Data/documents/** — recursive
// Other App_Data subdirectories (e.g. templates/, Upload/) are intentionally
// excluded so a large file there can never be force-loaded into memory.
async function collectTargetFiles() {
  const appDataRoot = path.join(process.cwd(), "App_Data");
  const docsDir = path.join(appDataRoot, "documents");
  const files = [];

  // 1) Top level only (no recursion into sibling subdirs).
  try {
    const top = await fs.promises.readdir(appDataRoot, { withFileTypes: true });
    for (const entry of top) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(path.join(appDataRoot, entry.name));
      }
    }
  } catch (error) {
    if (!error || error.code !== "ENOENT") {
      throw error;
    }
  }

  // 2) Everything under App_Data/documents/**.
  await collectJsonFilesIn(docsDir, files);

  return files;
}

/**
 * Warms the cache by reading every App_Data/<map>.json and
 * App_Data/documents/** file once. Idempotent (runs only once), and never
 * throws: failures (a broken App_Data layout, a missing dir, a bad file) are
 * logged and skipped, so preload can never block server startup.
 */
async function preload() {
  if (state.preloadedOnce) {
    return;
  }
  state.preloadedOnce = true;

  try {
    ensureWatcher();

    const files = await collectTargetFiles();

    let loaded = 0;
    for (const file of files) {
      try {
        await readFile(file);
        loaded += 1;
      } catch (error) {
        logger.warn(
          `Preload: skipping "${file}": ${error ? error.message : "unknown error"}`
        );
      }
    }

    logger.debug(`Preload: cached ${loaded} of ${files.length} files.`);
  } catch (error) {
    logger.warn(
      `Preload aborted (cache will still fill lazily on first use): ${
        error ? error.message : "unknown error"
      }`
    );
  }
}

export { readFile, ensureWatcher, preload, closeWatcher };
