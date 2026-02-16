import { CONSTANTS } from "../constants.js";
import { logger } from "../logger.js";

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Build Authorization headers for upstream WFS requests.
 * Mode is set via OGC_UPSTREAM_AUTH in .env.
 *
 * - "none"   → {} (no auth, current default)
 * - "basic"  → Authorization: Basic base64(user:pass)
 * - "bearer" → Authorization: Bearer <static token>
 * - "oauth2" → Authorization: Bearer <auto-refreshed token>
 */
export async function getUpstreamHeaders() {
  switch (CONSTANTS.UPSTREAM_AUTH) {
    case "basic": {
      const cred = Buffer.from(
        `${CONSTANTS.UPSTREAM_USER}:${CONSTANTS.UPSTREAM_PASS}`
      ).toString("base64");
      return { Authorization: `Basic ${cred}` };
    }

    case "bearer":
      return { Authorization: `Bearer ${CONSTANTS.UPSTREAM_TOKEN}` };

    case "oauth2": {
      if (Date.now() >= tokenExpiry) {
        await refreshOAuth2Token();
      }
      return cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {};
    }

    default:
      return {};
  }
}

async function refreshOAuth2Token() {
  const {
    OAUTH2_TOKEN_URL,
    OAUTH2_CLIENT_ID,
    OAUTH2_CLIENT_SECRET,
    OAUTH2_SCOPE,
  } = CONSTANTS;

  if (!OAUTH2_TOKEN_URL || !OAUTH2_CLIENT_ID) {
    logger.error(
      "OAuth2 configured but OGC_OAUTH2_TOKEN_URL or OGC_OAUTH2_CLIENT_ID missing"
    );
    return;
  }

  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: OAUTH2_CLIENT_ID,
      client_secret: OAUTH2_CLIENT_SECRET,
    });
    if (OAUTH2_SCOPE) {
      body.set("scope", OAUTH2_SCOPE);
    }

    const res = await fetch(OAUTH2_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error("OAuth2 token request failed", {
        status: res.status,
        body: text.slice(0, 200),
      });
      cachedToken = null;
      return;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    // Refresh 60s before expiry to avoid edge-case failures
    const expiresIn = data.expires_in || 3600;
    tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

    logger.info("OAuth2 token refreshed", {
      expiresIn,
      tokenUrl: OAUTH2_TOKEN_URL,
    });
  } catch (err) {
    logger.error("OAuth2 token request error", { err: err?.message });
    cachedToken = null;
  }
}
