import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  url?: string;
  size?: number;
  mtime?: string;
}

/** Public shape sent to the client — filesystem location is intentionally omitted. */
export interface ReadableDir {
  id: string;
  label: string;
  urlBase: string;
}

/** Internal shape used only on the server side. */
interface ReadableDirInternal extends ReadableDir {
  filesystemPath: string;
}

/**
 * Reads FILEPICKER_DIR_<n>_{PATH,URL,LABEL} env vars and builds the list of
 * browsable directories. PATH is required; LABEL and URL are optional.
 */
function getReadableDirs(): ReadableDirInternal[] {
  const map: Record<
    string,
    Partial<{ label: string; path: string; url: string }>
  > = {};

  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^FILEPICKER_DIR_(\d+)_(PATH|URL|LABEL)$/);
    if (match && value) {
      const id = match[1];
      const field = match[2].toLowerCase() as "path" | "url" | "label";
      if (!map[id]) map[id] = {};
      map[id][field] = value;
    }
  }

  const dirs: ReadableDirInternal[] = [];
  for (const [id, fields] of Object.entries(map)) {
    if (!fields.path) continue; // PATH is required
    dirs.push({
      id,
      label: fields.label ?? fields.url ?? fields.path,
      urlBase: fields.url ?? "",
      filesystemPath: fields.path,
    });
  }

  dirs.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  return dirs;
}

function sanitizePath(input: string): string {
  const normalized = path.normalize(input).replace(/^(\.\.(\/|\\|$))+/, "");
  return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

/**
 * Returns true if `child` is `parent` itself or strictly inside it.
 * Uses path.relative to avoid the startsWith-prefix false-positive
 * where "/uploads-secret".startsWith("/uploads") would pass.
 */
function isWithinDir(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * Builds the public web URL for a file given its URL base and relative path.
 * Absolute http(s):// bases are joined directly; everything else produces a
 * root-relative path (leading slash guaranteed).
 */
function toWebUrl(urlBase: string, relPath: string): string {
  const normalizedRel = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const base = urlBase.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(base)) {
    return normalizedRel ? `${base}/${normalizedRel}` : base;
  }

  const rootBase = base.startsWith("/") ? base : `/${base}`;
  return normalizedRel ? `${rootBase}/${normalizedRel}` : rootBase;
}

function matchesFilter(name: string, filter: string): boolean {
  if (!filter) return true;
  const ext = path.extname(name).toLowerCase();
  // Support both ".png" and "*.png" styles for extension matching
  const filterNorm = filter.startsWith("*") ? filter.slice(1) : filter;
  if (filterNorm.startsWith(".")) {
    return ext === filterNorm.toLowerCase();
  }
  return name.toLowerCase().includes(filterNorm.toLowerCase());
}

class FilesController {
  async list(req: Request, res: Response): Promise<void> {
    const requestPath = (req.query.path as string) || "";
    const dirId = (req.query.dir as string) || undefined;
    const filter = (req.query.filter as string) || "";
    const dirs = getReadableDirs();

    // No readable dirs configured → legacy single-dir fallback.
    // Uses INFORMATIVE_CUSTOM_UPLOAD_DIR_ABSOLUTE_PATH or App_Data/Upload.
    if (dirs.length === 0) {
      const fallbackFs =
        process.env.INFORMATIVE_CUSTOM_UPLOAD_DIR_ABSOLUTE_PATH ||
        path.join(process.cwd(), "App_Data", "Upload");
      const fallbackUrl = "/Upload";

      if (!fs.existsSync(fallbackFs)) {
        res
          .status(HttpStatusCodes.NOT_FOUND)
          .json({ error: "Upload directory not configured" });
        return;
      }

      const safeRelative = sanitizePath(requestPath);
      const targetDir = path.join(fallbackFs, safeRelative);

      if (!isWithinDir(fallbackFs, targetDir)) {
        res.status(HttpStatusCodes.FORBIDDEN).json({ error: "Invalid path" });
        return;
      }

      const items = await readDir(targetDir, safeRelative, filter, fallbackUrl);
      res.status(HttpStatusCodes.OK).json({
        items,
        path: safeRelative,
        dir: "",
        dirs: [],
      });
      return;
    }

    const publicDirs: ReadableDir[] = dirs.map(({ id, label, urlBase }) => ({
      id,
      label,
      urlBase,
    }));

    // No dir id → root listing; return the configured dirs, no file items.
    if (!dirId) {
      res.status(HttpStatusCodes.OK).json({
        items: [],
        path: "",
        dir: "",
        dirs: publicDirs,
      });
      return;
    }

    const readableDir = dirs.find((d) => d.id === dirId);
    if (!readableDir) {
      res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: "Configured directory not found" });
      return;
    }

    const baseDir = readableDir.filesystemPath;
    if (!fs.existsSync(baseDir)) {
      res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: "Directory does not exist on disk" });
      return;
    }

    const safeRelative = sanitizePath(requestPath);
    const targetDir = path.join(baseDir, safeRelative);

    if (!isWithinDir(baseDir, targetDir)) {
      res.status(HttpStatusCodes.FORBIDDEN).json({ error: "Invalid path" });
      return;
    }

    const items = await readDir(
      targetDir,
      safeRelative,
      filter,
      readableDir.urlBase
    );

    res.status(HttpStatusCodes.OK).json({
      items,
      path: safeRelative,
      dir: readableDir.id,
      dirs: publicDirs,
    });
  }
}

async function readDir(
  targetDir: string,
  relativePath: string,
  filter: string,
  urlBase: string
): Promise<FileEntry[]> {
  if (!fs.existsSync(targetDir)) {
    throw new Error("Path not found");
  }

  const stat = fs.statSync(targetDir);
  if (!stat.isDirectory()) {
    throw new Error("Path is not a directory");
  }

  const entries = await fs.promises.readdir(targetDir, {
    withFileTypes: true,
  });

  const items: FileEntry[] = [];
  for (const entry of entries) {
    const entryPath = relativePath
      ? path.join(relativePath, entry.name)
      : entry.name;
    const fullPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: entryPath,
        type: "directory",
      });
    } else if (entry.isFile()) {
      if (!matchesFilter(entry.name, filter)) continue;
      const fileStat = await fs.promises.stat(fullPath);
      items.push({
        name: entry.name,
        path: entryPath,
        type: "file",
        url: toWebUrl(urlBase, entryPath),
        size: fileStat.size,
        mtime: fileStat.mtime.toISOString(),
      });
    }
  }

  items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return items;
}

export default new FilesController();
