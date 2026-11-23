import { afterEach, describe, mock, test } from "node:test";
import assert from "node:assert/strict";

import ConfigService from "../server/apis/v2/services/config.service.js";
import restrictToTools from "../server/apis/v2/middlewares/restrict.tool.js";
import { AccessError } from "../server/apis/v2/utils/AccessError.js";
import { InvalidPathError } from "../server/apis/v2/utils/safePath.js";

// Run with: npm test (loads .env.example, so the logger has what it needs)

const REALESTATE = [{ type: "fir", option: "propertyList" }];
const RESIDENT = [
  { type: "fir", option: "residentList" },
  { type: "kir", option: "residentList" },
];

const fakeRes = () => {
  const res = {
    locals: { authUser: "someuser" },
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

// Runs the middleware and reports what happened.
const run = async (rules, getMapConfigResult, body = { map: "map_1" }) => {
  const getMapConfig = mock.method(ConfigService, "getMapConfig", async () =>
    typeof getMapConfigResult === "function"
      ? getMapConfigResult()
      : getMapConfigResult
  );
  const req = { body, originalUrl: "/api/v2/fir/test" };
  const res = fakeRes();
  let nextCalled = false;
  await restrictToTools(rules)(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled, getMapConfig };
};

const tools = (...list) => ({ tools: list });

afterEach(() => mock.restoreAll());

describe("restrictToTools", () => {
  test("passes map and user to getMapConfig", async () => {
    const { getMapConfig } = await run(
      REALESTATE,
      tools({ type: "fir", options: { propertyList: {} } })
    );
    assert.equal(getMapConfig.mock.callCount(), 1);
    assert.deepEqual(getMapConfig.mock.calls[0].arguments.slice(0, 2), [
      "map_1",
      "someuser",
    ]);
  });

  describe("realestate owner report", () => {
    test("fir with propertyList → allowed", async () => {
      const { nextCalled } = await run(
        REALESTATE,
        tools({ type: "Fir", options: { propertyList: {} } })
      );
      assert.equal(nextCalled, true);
    });

    test("fir without propertyList → 403", async () => {
      const { res, nextCalled } = await run(
        REALESTATE,
        tools({ type: "fir", options: { residentList: {} } })
      );
      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
    });

    test("only kir with residentList → 403", async () => {
      const { res, nextCalled } = await run(
        REALESTATE,
        tools({ type: "kir", options: { residentList: {} } })
      );
      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
    });
  });

  describe("resident report", () => {
    test("fir with residentList → allowed", async () => {
      const { nextCalled } = await run(
        RESIDENT,
        tools({ type: "fir", options: { residentList: {} } })
      );
      assert.equal(nextCalled, true);
    });

    test("kir with residentList → allowed", async () => {
      const { nextCalled } = await run(
        RESIDENT,
        tools({ type: "kir", options: { residentList: {} } })
      );
      assert.equal(nextCalled, true);
    });

    test("kir without residentList → 403", async () => {
      const { res, nextCalled } = await run(
        RESIDENT,
        tools({ type: "kir", options: {} })
      );
      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
    });
  });

  test("no fir/kir tools → 403 Access denied", async () => {
    const { res, nextCalled } = await run(
      RESIDENT,
      tools({ type: "layerswitcher", options: {} })
    );
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Access denied." });
  });

  for (const [label, body] of [
    ["missing", {}],
    ["empty", { map: "  " }],
    ["not a string", { map: ["map_1"] }],
  ]) {
    test(`map ${label} → 403 without reading any config`, async () => {
      const { res, nextCalled, getMapConfig } = await run(
        RESIDENT,
        tools({ type: "fir", options: { residentList: {} } }),
        body
      );
      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 403);
      assert.equal(getMapConfig.mock.callCount(), 0);
    });
  }

  test("no access to the map → 403 without map or user names", async () => {
    const { res, nextCalled } = await run(RESIDENT, {
      error: new AccessError(
        '[getMapConfig] Access to map "map_1" not allowed for user "someuser"'
      ),
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Access denied." });
  });

  test("unknown map (ENOENT) → 403 without the path", async () => {
    const error = new Error(
      "ENOENT: no such file or directory, open '/srv/hajk/App_Data/nope.json'"
    );
    error.code = "ENOENT";
    const { res, nextCalled } = await run(RESIDENT, { error }, { map: "nope" });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { error: "Access denied." });
  });

  test("invalid map name → 403 (not 400)", async () => {
    const { res, nextCalled } = await run(
      RESIDENT,
      { error: new InvalidPathError() },
      { map: "../x" }
    );
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  });

  test("other config error → generic 500", async () => {
    const { res, nextCalled } = await run(RESIDENT, {
      error: new Error('Failed to parse "map_1.json"'),
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Could not verify access." });
  });

  test("getMapConfig throws → generic 500", async () => {
    const { res, nextCalled } = await run(RESIDENT, () => {
      throw new Error("boom /srv/hajk");
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Could not verify access." });
  });
});
