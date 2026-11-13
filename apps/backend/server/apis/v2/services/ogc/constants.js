export const CONSTANTS = {
  // null = allow all (fallback); otherwise, comma-separated allowlist in env.
  // Lower-cased on load: the URL parser always lower-cases u.hostname, so a
  // mixed-case entry (e.g. "Karta.Example.se") would otherwise never match.
  ALLOWED_HOSTS: process.env.WFS_ALLOWED_HOSTS
    ? process.env.WFS_ALLOWED_HOSTS.split(",").map((h) =>
        h.trim().toLowerCase()
      )
    : null,
};
