import { createHmac, randomBytes } from "crypto";
import log4js from "log4js";
import {
  CappedMap,
  createChallenge,
  randomInt,
  verifySolution,
} from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

import { grabBoolean } from "../../../common/utils/dotEnvHelpers.js";

const logger = log4js.getLogger("service.captcha.v2");

// Proof-of-work settings for the ALTCHA challenge. The cost is per attempt, and the
// client needs ~counter attempts. That takes a second or two on one CPU core, and
// the widget spreads the work over several.
const ALTCHA_ALGORITHM = "PBKDF2/SHA-256";
const ALTCHA_COST = 2_000;
const ALTCHA_MIN_COUNTER = 2_500;
const ALTCHA_MAX_COUNTER = 5_000;
const ALTCHA_EXPIRES_MS = 20 * 60 * 1000; // Leave time to fill in the form
const MAX_ALTCHA_PAYLOAD_LENGTH = 8192;

/**
 * @summary Error with a HTTP status code, so handleStandardResponse can map it.
 */
export class CaptchaError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "CaptchaError";
    this.statusCode = statusCode;
  }
}

/**
 * @summary Captcha (ALTCHA, a proof-of-work that runs in the browser) for public
 * endpoints. Hands out signed challenges, and verifies solved ones, making sure that
 * each one is only used once.
 * @description Challenges are only handed out if some feature that needs them is
 * active. Add new features to the default of `active` in the constructor.
 */
export class CaptchaService {
  #usedChallenges = new CappedMap({ maxSize: 10_000 });
  #signatureSecret;
  #keySignatureSecret;

  /**
   * @param {object} [options] Overrides for the settings in .env, mostly useful for testing
   */
  constructor(options = {}) {
    this.active = options.active ?? grabBoolean("FEEDBACK_ACTIVE", false);

    let hmacKey = options.hmacKey ?? process.env.CAPTCHA_HMAC_KEY;
    if (!hmacKey) {
      hmacKey = randomBytes(32).toString("hex");
      if (this.active) {
        logger.warn(
          "CAPTCHA_HMAC_KEY isn't set in .env, using a random key. Challenges will be invalidated on restart, and won't work if Hajk runs in several instances."
        );
      }
    }
    // Derive separate secrets for the challenge and key signatures from one key
    this.#signatureSecret = createHmac("sha256", hmacKey)
      .update("signature")
      .digest("hex");
    this.#keySignatureSecret = createHmac("sha256", hmacKey)
      .update("key-signature")
      .digest("hex");
  }

  /**
   * @summary Create a new ALTCHA challenge for the client to solve.
   */
  async getChallenge() {
    try {
      if (!this.active) {
        throw new CaptchaError("Captcha is not enabled.", 404);
      }
      return await createChallenge({
        algorithm: ALTCHA_ALGORITHM,
        cost: ALTCHA_COST,
        counter: randomInt(ALTCHA_MIN_COUNTER, ALTCHA_MAX_COUNTER),
        deriveKey,
        expiresAt: new Date(Date.now() + ALTCHA_EXPIRES_MS),
        hmacSignatureSecret: this.#signatureSecret,
        hmacKeySignatureSecret: this.#keySignatureSecret,
      });
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Verify an ALTCHA payload (base64 encoded JSON), and make sure it's only used once.
   * @throws {CaptchaError} If the payload is missing, invalid, expired or already used
   */
  async verify(captcha) {
    if (
      typeof captcha !== "string" ||
      captcha.length === 0 ||
      captcha.length > MAX_ALTCHA_PAYLOAD_LENGTH
    ) {
      throw new CaptchaError("Missing or invalid captcha.");
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(captcha, "base64").toString("utf-8"));
    } catch {
      throw new CaptchaError("Missing or invalid captcha.");
    }
    if (!payload?.challenge?.parameters || !payload?.solution) {
      throw new CaptchaError("Missing or invalid captcha.");
    }

    const result = await verifySolution({
      challenge: payload.challenge,
      solution: payload.solution,
      deriveKey,
      hmacSignatureSecret: this.#signatureSecret,
      hmacKeySignatureSecret: this.#keySignatureSecret,
    });
    if (!result.verified) {
      throw new CaptchaError(
        result.expired ? "Captcha has expired." : "Invalid captcha."
      );
    }

    // The nonce is covered by the signature, so it identifies the challenge. Expired
    // challenges are rejected above, so the map only needs to hold the recent ones.
    const { nonce, expiresAt } = payload.challenge.parameters;
    if (!this.#usedChallenges.setIfAbsent(nonce, expiresAt)) {
      throw new CaptchaError("Captcha has already been used.");
    }
  }
}

export default new CaptchaService();
