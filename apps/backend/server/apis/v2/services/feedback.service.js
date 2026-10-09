import fs from "fs";
import path from "path";
import { createHmac, randomBytes, randomUUID } from "crypto";
import log4js from "log4js";
import {
  CappedMap,
  createChallenge,
  randomInt,
  verifySolution,
} from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

import ConfigService from "./config.service.js";
import {
  grabBoolean,
  grabPositiveInt,
} from "../../../common/utils/dotEnvHelpers.js";
import { resolvePathUnder, validateMapName } from "../utils/safePath.js";

const logger = log4js.getLogger("service.feedback.v2");

const MB = 1024 * 1024;

// Proof-of-work settings for the ALTCHA challenge. The cost is per attempt, and the
// client needs ~counter attempts. That takes a second or two on one CPU core, and
// the widget spreads the work over several.
const ALTCHA_ALGORITHM = "PBKDF2/SHA-256";
const ALTCHA_COST = 2_000;
const ALTCHA_MIN_COUNTER = 2_500;
const ALTCHA_MAX_COUNTER = 5_000;
const ALTCHA_EXPIRES_MS = 20 * 60 * 1000; // Leave time to write the message
const MAX_ALTCHA_PAYLOAD_LENGTH = 8192;

const MAX_ANCHOR_URL_LENGTH = 2048;
const MAX_CLIENT_VERSION_LENGTH = 64;
const MAX_USER_AGENT_LENGTH = 512;

// C0/C1 control characters (except tab and line feed), zero-width characters
// (except the joiner, used in emojis) and bidi overrides. Nothing a user needs
// in a short text, but useful for hiding or disguising content.
/* eslint-disable no-control-regex */
const UNWANTED_CHARS =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
/* eslint-enable no-control-regex */

/**
 * @summary Error with a HTTP status code, so handleStandardResponse can map it.
 */
class FeedbackError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "FeedbackError";
    this.statusCode = statusCode;
  }
}

/**
 * @summary Remove unwanted characters from user supplied text.
 * @param {string} text
 * @returns {string} Normalized (NFC) text with Unix line breaks and without control characters, trimmed
 */
export function cleanText(text) {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(UNWANTED_CHARS, "")
    .trim();
}

/**
 * @summary Default check: map must exist, the user must have access to it, and it must
 * have the Feedback tool (that the user has access to, if AD is active).
 * @param {string} map Validated map name
 * @param {string} user
 * @returns {Promise<boolean>}
 */
async function mapHasFeedbackTool(map, user) {
  const mapConfig = await ConfigService.getMapConfig(map, user, true);
  if (mapConfig.error) {
    // Don't tell anonymous users more than necessary about why
    throw mapConfig.error.statusCode === 403
      ? new FeedbackError("Access denied.", 403)
      : new FeedbackError("Unknown map.");
  }
  return (
    Array.isArray(mapConfig.tools) &&
    mapConfig.tools.some((t) => t.type?.toLowerCase() === "feedback")
  );
}

/**
 * @summary Receives feedback from users and stores it as JSON Lines files, with size based
 * rotation, in App_Data/feedback. Also lets admins read and remove the stored feedback.
 * @description Each line is one JSON object, see #createEntry. Files are named
 * feedback[_<HAJK_INSTANCE_ID>].jsonl (the active one) and
 * feedback[_<HAJK_INSTANCE_ID>]-<timestamp>.jsonl (rotated ones), so that several
 * instances can share the folder without writing to the same file.
 */
export class FeedbackService {
  #queue = Promise.resolve();
  #usedChallenges = new CappedMap({ maxSize: 10_000 });
  #signatureSecret;
  #keySignatureSecret;

  /**
   * @param {object} [options] Overrides for the settings in .env, mostly useful for testing
   */
  constructor(options = {}) {
    this.active = options.active ?? grabBoolean("FEEDBACK_ACTIVE", false);
    this.storeAuthUser =
      options.storeAuthUser ?? grabBoolean("FEEDBACK_STORE_AUTH_USER", false);
    this.maxMessageLength =
      options.maxMessageLength ??
      grabPositiveInt("FEEDBACK_MAX_MESSAGE_LENGTH", 2000);
    this.maxFileSize =
      options.maxFileSize ??
      grabPositiveInt("FEEDBACK_MAX_FILE_SIZE_MB", 5) * MB;
    this.maxFiles =
      options.maxFiles ?? grabPositiveInt("FEEDBACK_MAX_FILES", 10);
    this.minFreeDisk =
      options.minFreeDisk ??
      grabPositiveInt("FEEDBACK_MIN_FREE_DISK_MB", 500) * MB;
    this.dir = options.dir ?? path.join(process.cwd(), "App_Data", "feedback");
    this.mapHasFeedbackTool = options.mapHasFeedbackTool ?? mapHasFeedbackTool;

    const instanceId = process.env.HAJK_INSTANCE_ID?.trim();
    this.filePrefix = instanceId ? `feedback_${instanceId}` : "feedback";

    let hmacKey = options.hmacKey ?? process.env.FEEDBACK_ALTCHA_HMAC_KEY;
    if (!hmacKey) {
      hmacKey = randomBytes(32).toString("hex");
      if (this.active) {
        logger.warn(
          "FEEDBACK_ALTCHA_HMAC_KEY isn't set in .env, using a random key. Challenges will be invalidated on restart, and won't work if Hajk runs in several instances."
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

    if (this.active) {
      logger.info(
        `Feedback is active. Writing to ${this.dir}, max ${this.maxFiles} files of ${this.maxFileSize / MB} MB each.`
      );
    }
  }

  /**
   * @summary Run fn after all previously queued file operations, so that appending,
   * rotating and deleting never interleave within this process.
   */
  #enqueue(fn) {
    const run = this.#queue.then(fn, fn);
    this.#queue = run.catch(() => {});
    return run;
  }

  #assertActive() {
    if (!this.active) {
      throw new FeedbackError("Feedback is not enabled.", 404);
    }
  }

  /**
   * @summary Create a new ALTCHA challenge for the client to solve.
   */
  async getChallenge() {
    try {
      this.#assertActive();
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
   * @throws {FeedbackError} If the payload is missing, invalid, expired or already used
   */
  async #verifyAltcha(altcha) {
    if (
      typeof altcha !== "string" ||
      altcha.length === 0 ||
      altcha.length > MAX_ALTCHA_PAYLOAD_LENGTH
    ) {
      throw new FeedbackError("Missing or invalid captcha.", 403);
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(altcha, "base64").toString("utf-8"));
    } catch {
      throw new FeedbackError("Missing or invalid captcha.", 403);
    }
    if (!payload?.challenge?.parameters || !payload?.solution) {
      throw new FeedbackError("Missing or invalid captcha.", 403);
    }

    const result = await verifySolution({
      challenge: payload.challenge,
      solution: payload.solution,
      deriveKey,
      hmacSignatureSecret: this.#signatureSecret,
      hmacKeySignatureSecret: this.#keySignatureSecret,
    });
    if (!result.verified) {
      throw new FeedbackError(
        result.expired ? "Captcha has expired." : "Invalid captcha.",
        403
      );
    }

    // The nonce is covered by the signature, so it identifies the challenge. Expired
    // challenges are rejected above, so the map only needs to hold the recent ones.
    const { nonce, expiresAt } = payload.challenge.parameters;
    if (!this.#usedChallenges.setIfAbsent(nonce, expiresAt)) {
      throw new FeedbackError("Captcha has already been used.", 403);
    }
  }

  /**
   * @summary Validate and clean the request body, and build the entry that will be stored.
   * @throws {FeedbackError} If anything is invalid
   */
  #createEntry(body, user, userAgent) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new FeedbackError("Request body must be a JSON object.");
    }

    let map;
    try {
      map = validateMapName(body.map);
    } catch {
      throw new FeedbackError("Invalid map name.");
    }

    if (typeof body.message !== "string") {
      throw new FeedbackError("Message is required.");
    }
    const message = cleanText(body.message);
    if (message.length === 0) {
      throw new FeedbackError("Message is required.");
    }
    if (message.length > this.maxMessageLength) {
      throw new FeedbackError(
        `Message is too long, max ${this.maxMessageLength} characters.`
      );
    }

    const context = body.context ?? {};
    if (typeof context !== "object" || Array.isArray(context)) {
      throw new FeedbackError("Invalid context.");
    }

    let anchorUrl = null;
    if (context.anchorUrl !== undefined && context.anchorUrl !== null) {
      try {
        if (
          typeof context.anchorUrl !== "string" ||
          context.anchorUrl.length > MAX_ANCHOR_URL_LENGTH
        ) {
          throw new Error();
        }
        const url = new URL(context.anchorUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
        anchorUrl = url.href;
      } catch {
        throw new FeedbackError("Invalid anchor URL.");
      }
    }

    let clientVersion = null;
    if (context.clientVersion !== undefined && context.clientVersion !== null) {
      if (
        typeof context.clientVersion !== "string" ||
        context.clientVersion.length > MAX_CLIENT_VERSION_LENGTH ||
        !/^[\w.+-]*$/.test(context.clientVersion)
      ) {
        throw new FeedbackError("Invalid client version.");
      }
      clientVersion = context.clientVersion;
    }

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      map,
      message,
      context: {
        anchorUrl,
        clientVersion,
        userAgent:
          typeof userAgent === "string"
            ? cleanText(userAgent).slice(0, MAX_USER_AGENT_LENGTH)
            : null,
      },
      ...(this.storeAuthUser && user && { user }),
    };
  }

  async #assertEnoughDiskSpace() {
    const stats = await fs.promises.statfs(this.dir);
    const free = stats.bavail * stats.bsize;
    if (free < this.minFreeDisk) {
      logger.error(
        `Not saving feedback: only ${Math.round(free / MB)} MB free disk space, FEEDBACK_MIN_FREE_DISK_MB requires ${this.minFreeDisk / MB} MB.`
      );
      throw new FeedbackError(
        "Feedback can't be saved at the moment. Please try again later.",
        507
      );
    }
  }

  /**
   * @summary Rename the active file if the new line wouldn't fit, and remove the oldest
   * rotated files so that at most maxFiles files (including the active one) are kept.
   */
  async #rotateIfNeeded(activeFile, bytesToAdd) {
    let size = 0;
    try {
      size = (await fs.promises.stat(activeFile)).size;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (size === 0 || size + bytesToAdd <= this.maxFileSize) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.promises.rename(
      activeFile,
      resolvePathUnder(this.dir, `${this.filePrefix}-${timestamp}.jsonl`)
    );

    // Rotated names end with a timestamp, so sorting by name sorts by age
    const rotated = (await fs.promises.readdir(this.dir))
      .filter(
        (f) => f.startsWith(`${this.filePrefix}-`) && f.endsWith(".jsonl")
      )
      .sort();
    const toRemove = rotated.slice(
      0,
      Math.max(0, rotated.length - (this.maxFiles - 1))
    );
    for (const file of toRemove) {
      await fs.promises.unlink(resolvePathUnder(this.dir, file));
      logger.info(`Removed old feedback file ${file}`);
    }
  }

  /**
   * @summary Validate, verify and store one piece of feedback.
   * @param {object} body Request body: { map, message, altcha, context: { anchorUrl, clientVersion } }
   * @param {string} [user] Authenticated user, if any
   * @param {string} [userAgent] The User-Agent request header
   * @returns {Promise<{id: string} | {error: Error}>}
   */
  async submit(body, user, userAgent) {
    try {
      this.#assertActive();
      const entry = this.#createEntry(body, user, userAgent);
      await this.#verifyAltcha(body.altcha);

      if (!(await this.mapHasFeedbackTool(entry.map, user))) {
        throw new FeedbackError("Feedback is not enabled for this map.");
      }

      const line = `${JSON.stringify(entry)}\n`;
      await this.#enqueue(async () => {
        await fs.promises.mkdir(this.dir, { recursive: true });
        await this.#assertEnoughDiskSpace();
        const activeFile = resolvePathUnder(
          this.dir,
          `${this.filePrefix}.jsonl`
        );
        await this.#rotateIfNeeded(activeFile, Buffer.byteLength(line));
        await fs.promises.appendFile(activeFile, line, {
          encoding: "utf-8",
          mode: 0o640,
        });
      });

      logger.debug(`Saved feedback ${entry.id} for map ${entry.map}`);
      return { id: entry.id };
    } catch (error) {
      if (!(error instanceof FeedbackError)) {
        logger.error(`Failed to save feedback: ${error.message}`);
      }
      return { error };
    }
  }

  /**
   * @returns {Promise<string[]>} Names of all feedback files, from all instances
   */
  async #listFiles() {
    try {
      return (await fs.promises.readdir(this.dir))
        .filter((f) => f.startsWith("feedback") && f.endsWith(".jsonl"))
        .sort();
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  /**
   * @summary Get all stored feedback, newest first.
   * @param {string} [since] Only return feedback newer than this (ISO 8601 date/time)
   */
  async getAll(since) {
    try {
      let sinceTime = null;
      if (since !== undefined) {
        sinceTime = typeof since === "string" ? Date.parse(since) : NaN;
        if (Number.isNaN(sinceTime)) {
          throw new FeedbackError("Invalid date in 'since'.");
        }
      }

      const entries = [];
      for (const file of await this.#listFiles()) {
        const text = await fs.promises.readFile(
          resolvePathUnder(this.dir, file),
          "utf-8"
        );
        text.split("\n").forEach((line, i) => {
          if (line.trim().length === 0) return;
          try {
            entries.push(JSON.parse(line));
          } catch {
            logger.warn(`Skipping invalid line ${i + 1} in ${file}`);
          }
        });
      }

      return entries
        .filter(
          (e) => sinceTime === null || Date.parse(e.timestamp) > sinceTime
        )
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Get some numbers about the stored feedback and the limits.
   */
  async getStats() {
    try {
      const files = [];
      let entryCount = 0;
      for (const name of await this.#listFiles()) {
        const filePath = resolvePathUnder(this.dir, name);
        const [stat, text] = await Promise.all([
          fs.promises.stat(filePath),
          fs.promises.readFile(filePath, "utf-8"),
        ]);
        files.push({
          name,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
        entryCount += text
          .split("\n")
          .filter((l) => l.trim().length > 0).length;
      }

      let freeDiskSpace = null;
      try {
        const stats = await fs.promises.statfs(
          files.length > 0 ? this.dir : process.cwd()
        );
        freeDiskSpace = stats.bavail * stats.bsize;
      } catch (error) {
        logger.warn(`Could not determine free disk space: ${error.message}`);
      }

      return {
        active: this.active,
        entryCount,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        files,
        freeDiskSpace,
        limits: {
          maxMessageLength: this.maxMessageLength,
          maxFileSize: this.maxFileSize,
          maxFiles: this.maxFiles,
          minFreeDiskSpace: this.minFreeDisk,
        },
      };
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Remove all stored feedback files, from all instances.
   */
  async deleteAll() {
    try {
      return await this.#enqueue(async () => {
        const files = await this.#listFiles();
        for (const file of files) {
          await fs.promises.unlink(resolvePathUnder(this.dir, file));
        }
        return { deletedFiles: files.length };
      });
    } catch (error) {
      return { error };
    }
  }
}

export default new FeedbackService();
