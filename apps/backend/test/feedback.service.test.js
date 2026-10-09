import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

import {
  FeedbackService,
  cleanText,
} from "../server/apis/v2/services/feedback.service.js";

// Run with: npm test (loads .env.example, so the logger has what it needs)

let dir;

const createService = (options = {}) =>
  new FeedbackService({
    active: true,
    dir,
    hmacKey: "test-key",
    maxFileSize: 1024 * 1024,
    maxFiles: 3,
    minFreeDisk: 1,
    mapHasFeedbackTool: async (map) => map === "demo",
    ...options,
  });

const solve = async (service) => {
  const challenge = await service.getChallenge();
  const solution = await solveChallenge({ challenge, deriveKey });
  return Buffer.from(JSON.stringify({ challenge, solution })).toString(
    "base64"
  );
};

const listFiles = () => fs.readdirSync(dir).sort();

const clearDir = () =>
  fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "hajk-feedback-"));
});

after(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("cleanText", () => {
  test("removes control and invisible characters but keeps line breaks", () => {
    const zeroWidthSpace = String.fromCharCode(0x200b);
    const rtlOverride = String.fromCharCode(0x202e);
    assert.equal(
      cleanText(`  Hej\r\nvärlden\u0000${zeroWidthSpace}${rtlOverride}!  `),
      "Hej\nvärlden!"
    );
  });

  test("keeps the zero width joiner used in emojis", () => {
    const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
    assert.equal(cleanText(family), family);
  });
});

describe("FeedbackService", () => {
  test("rejects everything when not active", async () => {
    const service = createService({ active: false });
    assert.equal((await service.getChallenge()).error.statusCode, 404);
    assert.equal((await service.submit({})).error.statusCode, 404);
  });

  test("saves valid feedback and returns it to admins", async () => {
    clearDir();
    const service = createService({ storeAuthUser: false });
    const result = await service.submit(
      {
        map: "demo",
        message: "<script>alert(1)</script> Fel i kartan",
        altcha: await solve(service),
        context: {
          anchorUrl: "https://example.com/?m=demo#x=1",
          clientVersion: "abc123",
        },
        unknownField: "ignored",
      },
      "someuser",
      "Mozilla/5.0"
    );
    assert.ok(result.id, JSON.stringify(result));

    const entries = await service.getAll();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].id, result.id);
    assert.equal(entries[0].map, "demo");
    // Stored as plain text, escaping is up to whoever displays it
    assert.equal(entries[0].message, "<script>alert(1)</script> Fel i kartan");
    assert.equal(entries[0].context.userAgent, "Mozilla/5.0");
    assert.equal(entries[0].unknownField, undefined);
    assert.equal(entries[0].user, undefined);

    const stats = await service.getStats();
    assert.equal(stats.entryCount, 1);
    assert.equal(stats.files.length, 1);
  });

  test("stores the user only when configured to", async () => {
    clearDir();
    const service = createService({ storeAuthUser: true });
    await service.submit(
      { map: "demo", message: "Hej", altcha: await solve(service) },
      "someuser"
    );
    assert.equal((await service.getAll())[0].user, "someuser");
  });

  test("rejects missing, invalid and reused captchas", async () => {
    const service = createService();
    const body = { map: "demo", message: "Hej" };

    assert.equal((await service.submit(body)).error.statusCode, 403);
    assert.equal(
      (await service.submit({ ...body, altcha: "bm9wZQ==" })).error.statusCode,
      403
    );

    // Solved by someone with another key
    const other = createService({ hmacKey: "other-key" });
    assert.equal(
      (await service.submit({ ...body, altcha: await solve(other) })).error
        .statusCode,
      403
    );

    const altcha = await solve(service);
    assert.ok((await service.submit({ ...body, altcha })).id);
    const reused = await service.submit({ ...body, altcha });
    assert.equal(reused.error.statusCode, 403);
    assert.match(reused.error.message, /already been used/);
  });

  test("validates input before using up the captcha", async () => {
    const service = createService({ maxMessageLength: 10 });
    const altcha = await solve(service);
    const cases = [
      { map: "../demo", message: "Hej" },
      { map: "demo", message: "   " },
      { map: "demo", message: 42 },
      { map: "demo", message: "Alldeles för långt" },
      { map: "demo", message: "Hej", context: { anchorUrl: "javascript:1" } },
      { map: "demo", message: "Hej", context: { clientVersion: "<b>" } },
    ];
    for (const body of cases) {
      const result = await service.submit({ ...body, altcha });
      assert.equal(result.error?.statusCode, 400, JSON.stringify(body));
    }
    // Still unused
    assert.ok(
      (await service.submit({ map: "demo", message: "Hej", altcha })).id
    );
  });

  test("rejects maps without the Feedback tool", async () => {
    const service = createService();
    const result = await service.submit({
      map: "other",
      message: "Hej",
      altcha: await solve(service),
    });
    assert.equal(result.error.statusCode, 400);
  });

  test("refuses to write when disk space is low", async () => {
    const service = createService({ minFreeDisk: Number.MAX_SAFE_INTEGER });
    const result = await service.submit({
      map: "demo",
      message: "Hej",
      altcha: await solve(service),
    });
    assert.equal(result.error.statusCode, 507);
  });

  test("rotates files and keeps at most maxFiles", async () => {
    clearDir();
    // Room for about two entries per file
    const service = createService({ maxFileSize: 500, maxFiles: 3 });
    const ids = [];
    for (let i = 0; i < 8; i++) {
      const r = await service.submit(
        {
          map: "demo",
          message: `Meddelande ${i}`,
          altcha: await solve(service),
        },
        undefined,
        "Mozilla/5.0"
      );
      assert.ok(r.id, JSON.stringify(r));
      ids.push(r.id);
    }

    const files = listFiles();
    assert.equal(files.length, 3, files.join(", "));
    assert.ok(files.includes("feedback.jsonl"));
    files.forEach((f) =>
      assert.ok(fs.statSync(path.join(dir, f)).size <= 500, f)
    );

    // The newest entries are kept, newest first
    const entries = await service.getAll();
    assert.equal(entries[0].id, ids.at(-1));
    assert.ok(!entries.some((e) => e.id === ids[0]));
  });

  test("filters on 'since' and rejects invalid dates", async () => {
    const service = createService();
    assert.equal((await service.getAll("2999-01-01")).length, 0);
    assert.equal((await service.getAll("not a date")).error.statusCode, 400);
  });

  test("deletes all files", async () => {
    const service = createService();
    await service.submit({
      map: "demo",
      message: "Hej",
      altcha: await solve(service),
    });
    const result = await service.deleteAll();
    assert.ok(result.deletedFiles > 0);
    assert.deepEqual(listFiles(), []);
    assert.equal((await service.getStats()).entryCount, 0);
  });
});
