import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";

import { CaptchaService } from "../server/apis/v2/services/captcha.service.js";
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
    captcha: new CaptchaService({ active: true, hmacKey: "test-key" }),
    maxFileSize: 1024 * 1024,
    maxFiles: 3,
    minFreeDisk: 1,
    mapHasFeedbackTool: async (map) => map === "demo",
    ...options,
  });

const solve = async (service) => {
  const challenge = await service.captcha.getChallenge();
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
    assert.equal((await service.submit({})).error.statusCode, 404);
  });

  test("saves valid feedback and returns it to admins", async () => {
    clearDir();
    const service = createService({ storeAuthUser: false });
    const result = await service.submit(
      {
        map: "demo",
        message: "<script>alert(1)</script> Fel i kartan",
        captcha: await solve(service),
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
      { map: "demo", message: "Hej", captcha: await solve(service) },
      "someuser"
    );
    assert.equal((await service.getAll())[0].user, "someuser");
  });

  test("rejects missing, invalid and reused captchas", async () => {
    const service = createService();
    const body = { map: "demo", message: "Hej" };

    assert.equal((await service.submit(body)).error.statusCode, 403);
    assert.equal(
      (await service.submit({ ...body, captcha: "bm9wZQ==" })).error.statusCode,
      403
    );

    // Solved by someone with another key
    const other = createService({
      captcha: new CaptchaService({ active: true, hmacKey: "other-key" }),
    });
    assert.equal(
      (await service.submit({ ...body, captcha: await solve(other) })).error
        .statusCode,
      403
    );

    const captcha = await solve(service);
    assert.ok((await service.submit({ ...body, captcha })).id);
    const reused = await service.submit({ ...body, captcha });
    assert.equal(reused.error.statusCode, 403);
    assert.match(reused.error.message, /already been used/);
  });

  test("validates input before using up the captcha", async () => {
    const service = createService({ maxMessageLength: 10 });
    const captcha = await solve(service);
    const cases = [
      { map: "../demo", message: "Hej" },
      { map: "demo", message: "   " },
      { map: "demo", message: 42 },
      { map: "demo", message: "Alldeles för långt" },
      { map: "demo", message: "Hej", context: { anchorUrl: "javascript:1" } },
      { map: "demo", message: "Hej", context: { clientVersion: "<b>" } },
    ];
    for (const body of cases) {
      const result = await service.submit({ ...body, captcha });
      assert.equal(result.error?.statusCode, 400, JSON.stringify(body));
    }
    // Still unused
    assert.ok(
      (await service.submit({ map: "demo", message: "Hej", captcha })).id
    );
  });

  test("rejects maps without the Feedback tool", async () => {
    const service = createService();
    const result = await service.submit({
      map: "other",
      message: "Hej",
      captcha: await solve(service),
    });
    assert.equal(result.error.statusCode, 400);
  });

  test("refuses to write when disk space is low", async () => {
    const service = createService({ minFreeDisk: Number.MAX_SAFE_INTEGER });
    const result = await service.submit({
      map: "demo",
      message: "Hej",
      captcha: await solve(service),
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
          captcha: await solve(service),
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
      captcha: await solve(service),
    });
    const result = await service.deleteAll();
    assert.ok(result.deletedFiles > 0);
    assert.deepEqual(listFiles(), []);
    assert.equal((await service.getStats()).entryCount, 0);
  });

  test("marks feedback as answered and back again", async () => {
    clearDir();
    const service = createService();
    const submit = async (message) =>
      (
        await service.submit({
          map: "demo",
          message,
          captcha: await solve(service),
        })
      ).id;
    const first = await submit("Första");
    const second = await submit("Andra");

    let entries = await service.getAll();
    assert.ok(entries.every((e) => e.answered === false));
    assert.ok(entries.every((e) => e.answeredAt === null));

    const marked = await service.setAnswered(first, true, "admin1");
    assert.equal(marked.answered, true);
    assert.equal(marked.answeredBy, "admin1");
    assert.ok(Date.parse(marked.answeredAt));

    entries = await service.getAll();
    assert.equal(entries.find((e) => e.id === first).answered, true);
    assert.equal(entries.find((e) => e.id === first).answeredBy, "admin1");
    assert.equal(entries.find((e) => e.id === second).answered, false);

    let stats = await service.getStats();
    assert.equal(stats.answeredCount, 1);
    assert.equal(stats.unansweredCount, 1);
    // answered.json is not counted as a feedback file
    assert.equal(stats.files.length, 1);

    // Marking again keeps who and when
    const again = await service.setAnswered(first, true, "admin2");
    assert.equal(again.answeredBy, "admin1");
    assert.equal(again.answeredAt, marked.answeredAt);

    const unmarked = await service.setAnswered(first, false);
    assert.equal(unmarked.answered, false);
    assert.equal(unmarked.answeredAt, null);
    assert.equal(
      (await service.getAll()).find((e) => e.id === first).answered,
      false
    );
    // Nothing answered, so no file is left behind
    assert.ok(!listFiles().includes("answered.json"));

    // Without a known user
    assert.equal((await service.setAnswered(second, true)).answeredBy, null);
    stats = await service.getStats();
    assert.equal(stats.answeredCount, 1);
  });

  test("rejects invalid input when marking as answered", async () => {
    clearDir();
    const service = createService();
    const id = (
      await service.submit({
        map: "demo",
        message: "Hej",
        captcha: await solve(service),
      })
    ).id;
    assert.equal(
      (await service.setAnswered("../../etc/passwd", true)).error.statusCode,
      400
    );
    assert.equal((await service.setAnswered(id, "yes")).error.statusCode, 400);
    assert.equal(
      (await service.setAnswered("00000000-0000-4000-8000-000000000000", true))
        .error.statusCode,
      404
    );
  });

  test("treats a broken answered.json as nothing answered", async () => {
    clearDir();
    const service = createService();
    const id = (
      await service.submit({
        map: "demo",
        message: "Hej",
        captcha: await solve(service),
      })
    ).id;
    fs.writeFileSync(path.join(dir, "answered.json"), "{ not json");
    assert.equal((await service.getAll())[0].answered, false);
    assert.ok((await service.setAnswered(id, true)).answered);
    assert.equal((await service.getAll())[0].answered, true);
  });

  test("forgets answered entries removed by rotation", async () => {
    clearDir();
    const service = createService({ maxFileSize: 500, maxFiles: 2 });
    const submit = async (i) =>
      (
        await service.submit(
          {
            map: "demo",
            message: `Meddelande ${i}`,
            captcha: await solve(service),
          },
          undefined,
          "Mozilla/5.0"
        )
      ).id;
    const oldest = await submit(0);
    await service.setAnswered(oldest, true);
    let newest;
    for (let i = 1; i < 8; i++) newest = await submit(i);
    assert.ok(!(await service.getAll()).some((e) => e.id === oldest));

    await service.setAnswered(newest, true);
    const answered = JSON.parse(
      fs.readFileSync(path.join(dir, "answered.json"), "utf-8")
    );
    assert.deepEqual(Object.keys(answered), [newest]);
  });

  test("deleting all feedback also removes answered status", async () => {
    clearDir();
    const service = createService();
    const id = (
      await service.submit({
        map: "demo",
        message: "Hej",
        captcha: await solve(service),
      })
    ).id;
    await service.setAnswered(id, true);
    assert.ok(listFiles().includes("answered.json"));
    await service.deleteAll();
    assert.deepEqual(listFiles(), []);
  });
});
