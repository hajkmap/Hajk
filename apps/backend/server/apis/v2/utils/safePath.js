import path from "path";

/**
 * @summary Thrown when a user-supplied value can't be safely used as (part of) a
 * filesystem path. Has statusCode 400 so handleStandardResponse maps it correctly.
 */
export class InvalidPathError extends Error {
  constructor(message = "Invalid path.") {
    super(message);
    this.name = "InvalidPathError";
    this.statusCode = 400;
  }
}

/**
 * @summary Ensure that a value is a single, plain path segment, e.g. a file or folder name.
 * @description Deliberately permissive regarding which characters are allowed (so existing
 * document names keep working), but rejects anything that could change directory:
 * path separators, "." and "..", NUL bytes and absolute paths.
 *
 * @param {*} segment
 * @returns {string} The segment, unchanged
 */
export function assertSafeSegment(segment) {
  if (
    typeof segment !== "string" ||
    segment.length === 0 ||
    segment === "." ||
    segment === ".." ||
    /[/\\\0]/.test(segment) ||
    path.isAbsolute(segment)
  ) {
    throw new InvalidPathError("Invalid path segment.");
  }
  return segment;
}

/**
 * @summary Validate a map configuration name (file stem), e.g. "default_map-1".
 *
 * @param {*} map
 * @returns {string} The trimmed map name
 */
export function validateMapName(map) {
  if (typeof map !== "string") {
    throw new InvalidPathError("Invalid map name.");
  }

  const normalizedMap = map.trim();

  // Only allow simple map IDs (file stem), e.g. "default_map-1".
  if (!/^[A-Za-z0-9_-]+$/.test(normalizedMap)) {
    throw new InvalidPathError("Invalid map name.");
  }

  return normalizedMap;
}

/**
 * @summary Resolve segments against baseDir and make sure the result stays inside baseDir.
 *
 * @param {string} baseDir Directory that the resulting path must be contained in
 * @param {...string} segments Path segments, relative to baseDir
 * @returns {string} Absolute, resolved path
 */
export function resolvePathUnder(baseDir, ...segments) {
  if (segments.some((s) => path.isAbsolute(String(s ?? "")))) {
    throw new InvalidPathError("Invalid path segment.");
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, ...segments);
  const rel = path.relative(resolvedBase, resolvedTarget);

  if (
    rel === "" ||
    rel === ".." ||
    rel.startsWith(`..${path.sep}`) ||
    path.isAbsolute(rel)
  ) {
    throw new InvalidPathError("Path escapes allowed base directory.");
  }

  return resolvedTarget;
}
