import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  getWmsLegends,
  getPrintLegendUrl,
  setLegendUrlStyle,
  uniqueLegendEntries,
} from "../src/utils/wmsLegendHelpers.js";

// Run with: npm test

const auto = (layer) =>
  `https://wms.example.se/wms?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer}&STYLE=`;

describe("getWmsLegends", () => {
  test("the layer's own legend wins over the sublayers' legends (#1644)", () => {
    const legends = getWmsLegends({
      layers: ["a", "b"],
      layersInfo: [{ id: "a", legend: "legend/a.png" }, { id: "b" }],
      legend: "legend/layer.png",
      getLegendUrl: auto,
    });
    assert.deepEqual(
      legends.map((l) => [l.url, l.automatic]),
      [
        ["legend/layer.png", false],
        ["legend/layer.png", false],
      ]
    );
  });

  test("a sublayer legend is used, other sublayers get an automatic legend", () => {
    const legends = getWmsLegends({
      layers: ["a", "b"],
      layersInfo: [{ id: "a", legend: "legend/a.png" }, { id: "b" }],
      legend: "",
      getLegendUrl: auto,
    });
    assert.deepEqual(
      legends.map((l) => [l.url, l.automatic]),
      [
        ["legend/a.png", false],
        [auto("b"), true],
      ]
    );
  });

  test("a whitespace-only legend means automatic legend", () => {
    const legends = getWmsLegends({
      layers: ["a", "b"],
      layersInfo: [
        { id: "a", legend: " " },
        { id: "b", legend: " b.png " },
      ],
      legend: "  ",
      getLegendUrl: auto,
    });
    assert.deepEqual(
      legends.map((l) => [l.url, l.automatic]),
      [
        [auto("a"), true],
        ["b.png", false],
      ]
    );
  });

  test("a non-string legend (hand-edited config) means automatic legend", () => {
    const legends = getWmsLegends({
      layers: ["a", "b"],
      layersInfo: [
        { id: "a", legend: ["a.png"] },
        { id: "b", legend: {} },
      ],
      legend: 42,
      getLegendUrl: auto,
    });
    assert.deepEqual(
      legends.map((l) => [l.url, l.automatic]),
      [
        [auto("a"), true],
        [auto("b"), true],
      ]
    );
  });

  test("works without layersInfo or legend (older configs)", () => {
    for (const layersInfo of [null, undefined]) {
      const legends = getWmsLegends({
        layers: ["a"],
        layersInfo,
        getLegendUrl: auto,
      });
      assert.deepEqual(legends, [
        { url: auto("a"), description: "Teckenförklaring", automatic: true },
      ]);
    }
  });
});

describe("setLegendUrlStyle", () => {
  test("replaces STYLE but not STYLES", () => {
    const url = "https://x/wms?STYLES=keep&LAYER=a&STYLE=old&FORMAT=image/png";
    assert.equal(
      setLegendUrlStyle(url, "new"),
      "https://x/wms?STYLES=keep&LAYER=a&STYLE=new&FORMAT=image/png"
    );
  });

  test("encodes the style and supports an empty style", () => {
    assert.equal(
      setLegendUrlStyle(auto("a"), "ws:roads labels"),
      auto("a") + "ws%3Aroads%20labels"
    );
    assert.equal(setLegendUrlStyle(auto("a") + "old", ""), auto("a"));
  });

  test("leaves the URL unchanged when the style is already right", () => {
    const url = auto("a") + "ws:roads";
    assert.equal(setLegendUrlStyle(url, "ws:roads"), url);
  });

  test("leaves URLs without STYLE alone", () => {
    assert.equal(setLegendUrlStyle("legend/a.png", "x"), "legend/a.png");
  });
});

describe("getPrintLegendUrl", () => {
  const generatedUrl = "https://x/wms?REQUEST=GetLegendGraphic&LAYER=a";

  test("an Admin legend is used as is", () => {
    assert.equal(
      getPrintLegendUrl({
        configuredEntry: { url: "legend/a.png", automatic: false },
        generatedUrl,
        activeStyle: "labels",
        isSingleSublayer: true,
      }),
      "legend/a.png"
    );
  });

  test("an automatic legend of a single-sublayer layer gets the active style", () => {
    assert.equal(
      getPrintLegendUrl({
        configuredEntry: { url: auto("a") + "default", automatic: true },
        generatedUrl,
        activeStyle: "labels",
        isSingleSublayer: true,
      }),
      auto("a") + "labels"
    );
  });

  test("an automatic legend of a group layer keeps the configured style", () => {
    // STYLES isn't guaranteed to line up with LAYERS for several sublayers.
    assert.equal(
      getPrintLegendUrl({
        configuredEntry: { url: auto("a") + "styleA", automatic: true },
        generatedUrl,
        activeStyle: "styleB",
        isSingleSublayer: false,
      }),
      auto("a") + "styleA"
    );
  });

  test("falls back to Print's own URL without a configured entry", () => {
    assert.equal(
      getPrintLegendUrl({ configuredEntry: undefined, generatedUrl }),
      generatedUrl
    );
    assert.equal(
      getPrintLegendUrl({ configuredEntry: { Url: "legend/a.png" } }),
      "legend/a.png"
    );
  });
});

describe("uniqueLegendEntries", () => {
  test("keeps the first entry per URL and entries without a URL", () => {
    const entries = [
      { sublayer: "a", url: "legend/layer.png" },
      { sublayer: "b", url: "legend/layer.png" },
      { sublayer: "c", url: null },
      { sublayer: "d", url: null },
      { sublayer: "e", url: "legend/e.png" },
    ];
    assert.deepEqual(
      uniqueLegendEntries(entries).map((e) => e.sublayer),
      ["a", "c", "d", "e"]
    );
  });

  test("takes a custom URL getter", () => {
    const entries = [
      { getLegendGraphicUrl: "x" },
      { getLegendGraphicUrl: "x" },
    ];
    assert.equal(
      uniqueLegendEntries(entries, (e) => e.getLegendGraphicUrl).length,
      1
    );
  });
});
