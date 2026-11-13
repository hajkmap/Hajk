import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

import {
  CaptchaError,
  CaptchaService,
} from "../server/apis/v2/services/captcha.service.js";

// Run with: npm test (loads .env.example, so the logger has what it needs)

const createService = (options = {}) =>
  new CaptchaService({ active: true, hmacKey: "test-key", ...options });

const solve = async (service) => {
  const challenge = await service.getChallenge();
  const solution = await solveChallenge({ challenge, deriveKey });
  return Buffer.from(JSON.stringify({ challenge, solution })).toString(
    "base64"
  );
};

const rejectsWith = (promise, pattern) =>
  assert.rejects(promise, (error) => {
    assert.ok(error instanceof CaptchaError);
    assert.equal(error.statusCode, 403);
    assert.match(error.message, pattern);
    return true;
  });

describe("CaptchaService", () => {
  test("hands out no challenges when not active", async () => {
    const service = createService({ active: false });
    assert.equal((await service.getChallenge()).error.statusCode, 404);
  });

  test("accepts a solved challenge once", async () => {
    const service = createService();
    const captcha = await solve(service);
    await service.verify(captcha);
    await rejectsWith(service.verify(captcha), /already been used/);
  });

  test("rejects missing and malformed payloads", async () => {
    const service = createService();
    for (const captcha of [undefined, "", 42, "bm9wZQ==", "x".repeat(9000)]) {
      await rejectsWith(service.verify(captcha), /Missing or invalid/);
    }
  });

  test("rejects challenges signed with another key", async () => {
    const service = createService();
    const other = createService({ hmacKey: "other-key" });
    await rejectsWith(service.verify(await solve(other)), /Invalid captcha/);
  });
});
