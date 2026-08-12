export const CONSTANTS = {
  // null = allow all (fallback); otherwise, comma-separated allowlist in env
  ALLOWED_HOSTS: process.env.WFS_ALLOWED_HOSTS
    ? process.env.WFS_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : null,
};
