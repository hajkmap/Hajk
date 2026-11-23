import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import { FirService } from "../server/apis/v2/services/fir.service.js";

// Run with: npm test (loads .env.example, so the logger has what it needs)

let dir;

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "hajk-fir-"));
});

after(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const backdate = (p, ms) => {
  const t = new Date(Date.now() - ms);
  fs.utimesSync(p, t, t);
};

const TWO_HOURS = 2 * 60 * 60 * 1000;

describe("FirService", () => {
  test("cleanupOldReports only deletes old report files", async () => {
    const service = new FirService({ outputDir: dir, outputPath: "/temp/" });

    const oldReport = path.join(dir, "boendeforteckning-2026-01-01_a.xlsx");
    const freshReport = path.join(
      dir,
      "fastighetsforteckning-2026-01-01_b.xlsx"
    );
    const otherFile = path.join(dir, "other.xlsx");
    const reportDir = path.join(dir, "boendeforteckning-folder.xlsx");

    fs.writeFileSync(oldReport, "x");
    fs.writeFileSync(freshReport, "x");
    fs.writeFileSync(otherFile, "x");
    fs.mkdirSync(reportDir);
    backdate(oldReport, TWO_HOURS);
    backdate(otherFile, TWO_HOURS);
    backdate(reportDir, TWO_HOURS);

    await service.cleanupOldReports();

    assert.equal(fs.existsSync(oldReport), false);
    assert.equal(fs.existsSync(freshReport), true);
    assert.equal(fs.existsSync(otherFile), true);
    assert.equal(fs.existsSync(reportDir), true);
  });

  test("cleanupOldReports ignores a missing folder", async () => {
    const service = new FirService({
      outputDir: path.join(dir, "does-not-exist"),
      outputPath: "/temp/",
    });
    await assert.doesNotReject(service.cleanupOldReports());
  });

  test("getResidentList writes a report with an unguessable name", async () => {
    const service = new FirService({ outputDir: dir, outputPath: "/temp/" });
    const res = { setHeader() {} };
    const { url } = await service.getResidentList(
      {
        body: {
          json: JSON.stringify({
            columns: ["Namn", "Ålder"],
            rows: [["A", "42"]],
          }),
        },
      },
      res
    );

    const match = url.match(
      /^\/temp\/(boendeforteckning-.+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.xlsx)$/
    );
    assert.ok(match, `unexpected url ${url}`);
    assert.equal(fs.existsSync(path.join(dir, match[1])), true);
  });
});
