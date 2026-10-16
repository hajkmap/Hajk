import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  getGroupDelimiter,
  parseGroupHeader,
} from "../server/apis/v2/utils/parseGroupHeader.js";

// Run with: npm test (loads .env.example, so the logger has what it needs)

describe("parseGroupHeader", () => {
  test("splits on comma by default", () => {
    assert.deepEqual(parseGroupHeader("a,b,c"), ["a", "b", "c"]);
  });

  test("splits on a custom delimiter", () => {
    assert.deepEqual(parseGroupHeader("a;b;c", ";"), ["a", "b", "c"]);
    assert.deepEqual(parseGroupHeader("a,b;c", ";"), ["a,b", "c"]);
  });

  test("supports multi-character delimiters", () => {
    assert.deepEqual(parseGroupHeader("a||b||c", "||"), ["a", "b", "c"]);
  });

  test("keeps whitespace and parentheses inside group names", () => {
    assert.deepEqual(
      parseGroupHeader("GIS Editors (Planning);Domain Users", ";"),
      ["GIS Editors (Planning)", "Domain Users"]
    );
  });

  test("does not treat parentheses as role parameters", () => {
    assert.deepEqual(
      parseGroupHeader("role_a;role_b(pnr=123,nick=max);role_c", ";"),
      ["role_a", "role_b(pnr=123,nick=max)", "role_c"]
    );
  });

  test("trims names and drops empty and duplicate groups", () => {
    assert.deepEqual(parseGroupHeader(" a , ,b,,a, c "), ["a", "b", "c"]);
  });

  test("returns empty array for empty or missing input", () => {
    assert.deepEqual(parseGroupHeader(""), []);
    assert.deepEqual(parseGroupHeader(undefined), []);
    assert.deepEqual(parseGroupHeader(null), []);
    assert.deepEqual(parseGroupHeader(";;", ";"), []);
  });
});

describe("getGroupDelimiter", () => {
  const original = process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER;
    } else {
      process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER = original;
    }
  });

  test("defaults to comma", () => {
    delete process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER;
    assert.equal(getGroupDelimiter(), ",");
    process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER = "";
    assert.equal(getGroupDelimiter(), ",");
  });

  test("uses the configured delimiter", () => {
    process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER = ";";
    assert.equal(getGroupDelimiter(), ";");
    process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER = ")";
    assert.equal(getGroupDelimiter(), ")");
  });

  test("falls back to comma for whitespace-only values", () => {
    for (const value of [" ", "  ", "\t"]) {
      process.env.AD_TRUSTED_GROUP_HEADER_DELIMITER = value;
      assert.equal(getGroupDelimiter(), ",");
    }
  });
});
