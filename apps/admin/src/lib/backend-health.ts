const PROBE_TIMEOUT_MS = 5000;

/**
 * Probes the backend by hitting GET /healthz with a timeout.
 * Returns true if the server responds with any HTTP status (server is up),
 * false on a network error, timeout, or if apiBaseUrl is empty.
 */
export async function checkBackendReachable(
  apiBaseUrl: string,
): Promise<boolean> {
  if (!apiBaseUrl) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await fetch(`${apiBaseUrl}/healthz`, {
      method: "GET",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
