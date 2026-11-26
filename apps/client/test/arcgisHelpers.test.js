import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  TRANSPARENT_PIXEL,
  buildArcGISImageUrl,
  getWkid,
  limitArcGISImageSize,
  normalizeLegendUrl,
  parseExtent,
  parseOpacity,
  splitLegend,
  filterLegendBySubLayers,
} from "../src/utils/arcgisHelpers.js";

// Run with: npm test

// What OpenLayers' ImageArcGISRest builds for a MapServer on screen
const OL_URL =
  "https://gis.example.se/arcgis/rest/services/X/MapServer/export?f=image&format=png32&transparent=true&LAYERS=17%2C21&size=852%2C601&bbox=177140.18%2C6421204.25%2C184629.62%2C6426518.48&bboxSR=3007&imageSR=3007&dpi=90";

describe("splitLegend", () => {
  test("splits Admin's data URLs on # and reads the layer name after &", () => {
    // Format created by Admin's "Hämta teckenförklaring"
    const legend =
      "data:image/png;base64,AAA=&Museum#data:image/png;base64,BBB=&Bibliotek";
    assert.deepEqual(splitLegend(legend), [
      { url: "data:image/png;base64,AAA=", description: "Museum" },
      { url: "data:image/png;base64,BBB=", description: "Bibliotek" },
    ]);
  });

  test("keeps & and # inside the layer name", () => {
    assert.deepEqual(
      splitLegend("data:image/png;base64,AAA=&Parker & lekplatser"),
      [
        {
          url: "data:image/png;base64,AAA=",
          description: "Parker & lekplatser",
        },
      ]
    );
  });

  test("a data URL without a layer name is returned as it is", () => {
    assert.deepEqual(splitLegend("data:image/png;base64,AAA="), [
      { url: "data:image/png;base64,AAA=", description: "" },
    ]);
  });

  test("does not touch & or # in a plain URL", () => {
    assert.deepEqual(splitLegend("https://x.se/legend?a=1&b=2#frag"), [
      { url: "https://x.se/legend?a=1&b=2#frag", description: "" },
    ]);
  });

  test("adds https:// to a URL without protocol", () => {
    assert.deepEqual(splitLegend("x.se/legend.png"), [
      { url: "https://x.se/legend.png", description: "" },
    ]);
  });

  test("returns [] for empty or non-string input", () => {
    assert.deepEqual(splitLegend(""), []);
    assert.deepEqual(splitLegend(undefined), []);
    assert.deepEqual(splitLegend(null), []);
    assert.deepEqual(splitLegend([{ url: "x" }]), []);
  });
});

describe("normalizeLegendUrl", () => {
  test("leaves data, http, https and protocol-relative URLs alone", () => {
    for (const url of [
      "data:image/png;base64,AAA=",
      "http://x.se/a.png",
      "HTTPS://x.se/a.png",
      "//x.se/a.png",
    ]) {
      assert.equal(normalizeLegendUrl(url), url);
    }
  });

  test("leaves empty and non-string values alone", () => {
    assert.equal(normalizeLegendUrl(""), "");
    assert.equal(normalizeLegendUrl(undefined), undefined);
  });
});

describe("parseOpacity", () => {
  test("keeps an opacity of 0, as number and as string", () => {
    assert.equal(parseOpacity(0), 0);
    assert.equal(parseOpacity("0"), 0);
  });

  test("parses strings from Admin", () => {
    assert.equal(parseOpacity("1"), 1);
    assert.equal(parseOpacity("0.5"), 0.5);
  });

  test("falls back to 1 for missing or invalid values", () => {
    assert.equal(parseOpacity(undefined), 1);
    assert.equal(parseOpacity(null), 1);
    assert.equal(parseOpacity(""), 1);
    assert.equal(parseOpacity("abc"), 1);
    assert.equal(parseOpacity(NaN), 1);
  });

  test("clamps to 0-1", () => {
    assert.equal(parseOpacity(5), 1);
    assert.equal(parseOpacity(-1), 0);
  });
});

describe("parseExtent", () => {
  test("converts the strings Admin saves into numbers", () => {
    assert.deepEqual(
      parseExtent(["150426.3", "6393573.9", "219084.9", "6467982.3"]),
      [150426.3, 6393573.9, 219084.9, 6467982.3]
    );
  });

  test("accepts numbers and a comma separated string", () => {
    assert.deepEqual(parseExtent([1, 2, 3, 4]), [1, 2, 3, 4]);
    assert.deepEqual(parseExtent("1,2,3,4"), [1, 2, 3, 4]);
  });

  test("returns undefined for incomplete or invalid values", () => {
    assert.equal(parseExtent([]), undefined);
    assert.equal(parseExtent(undefined), undefined);
    assert.equal(parseExtent([1, 2, 3]), undefined);
    assert.equal(parseExtent(["1", "2", "", "4"]), undefined, "blank is not 0");
    assert.equal(parseExtent(["1", "2", "x", "4"]), undefined);
  });
});

describe("getWkid", () => {
  test("returns the numeric part of the projection code", () => {
    assert.equal(getWkid("EPSG:3006"), "3006");
    assert.equal(getWkid("EPSG:3857"), "3857");
    assert.equal(getWkid("urn:ogc:def:crs:EPSG::3007"), "3007");
  });

  test("returns undefined if there is none", () => {
    assert.equal(getWkid("CRS:84"), "84");
    assert.equal(getWkid("custom"), undefined);
    assert.equal(getWkid(undefined), undefined);
  });
});

describe("buildArcGISImageUrl", () => {
  test("adds the show: prefix that ArcGIS requires", () => {
    const url = buildArcGISImageUrl(OL_URL);
    assert.match(url, /[?&]LAYERS=show%3A17%2C21(&|$)/);
  });

  test("changes nothing else in the URL", () => {
    const url = buildArcGISImageUrl(OL_URL);
    assert.equal(
      url,
      OL_URL.replace("LAYERS=17%2C21", "LAYERS=show%3A17%2C21")
    );
  });

  test("works when LAYERS is the first parameter and behind a proxy", () => {
    const proxied =
      "https://hajk.se/proxy/https://gis.example.se/MapServer/export?LAYERS=5&size=1%2C1";
    assert.equal(
      buildArcGISImageUrl(proxied),
      "https://hajk.se/proxy/https://gis.example.se/MapServer/export?LAYERS=show%3A5&size=1%2C1"
    );
  });

  test("does not add show: twice", () => {
    const url = buildArcGISImageUrl(OL_URL.replace("17%2C21", "show%3A17"));
    assert.match(url, /LAYERS=show%3A17(&|$)/);
    assert.doesNotMatch(url, /show%3Ashow/i);
  });

  test("returns null when no sublayer is visible", () => {
    assert.equal(buildArcGISImageUrl(OL_URL.replace("17%2C21", "")), null);
    assert.equal(
      buildArcGISImageUrl("https://x.se/MapServer/export?f=image"),
      null
    );
  });

  test("removes the WMS-only STYLES and CQL_FILTER that group layers get", () => {
    const withWmsParams = OL_URL.replace(
      "LAYERS=17%2C21",
      "LAYERS=17%2C21&STYLES=%2C&CQL_FILTER=a%3D1"
    );
    const url = buildArcGISImageUrl(withWmsParams);
    assert.doesNotMatch(url, /styles|cql_filter/i);
    assert.match(url, /LAYERS=show%3A17%2C21&size=852%2C601/);
  });

  test("keeps a URL that has the WMS-only parameter last well-formed", () => {
    const url = buildArcGISImageUrl(
      "https://x.se/MapServer/export?LAYERS=1&STYLES="
    );
    assert.equal(url, "https://x.se/MapServer/export?LAYERS=show%3A1");
  });
});

describe("limitArcGISImageSize", () => {
  test("leaves a request within the limit alone", () => {
    assert.equal(limitArcGISImageSize(OL_URL, 4096), OL_URL);
  });

  test("scales size and dpi down together when too large", () => {
    const big = OL_URL.replace("size=852%2C601", "size=8192%2C4096").replace(
      "dpi=90",
      "dpi=300"
    );
    const url = limitArcGISImageSize(big, 4096);
    assert.match(url, /size=4096%2C2048/);
    assert.match(url, /dpi=150(&|$)/);
    // The extent must not change, or the image would show another place
    assert.match(
      url,
      /bbox=177140\.18%2C6421204\.25%2C184629\.62%2C6426518\.48/
    );
  });

  test("handles a plain comma in size", () => {
    const url = limitArcGISImageSize(
      "https://x.se/export?size=5000,2500&dpi=96",
      2500
    );
    assert.match(url, /size=2500%2C1250/);
    assert.match(url, /dpi=48/);
  });

  test("returns the URL as it is when there is no size or no limit", () => {
    assert.equal(
      limitArcGISImageSize("https://x.se/export?f=image", 4096),
      "https://x.se/export?f=image"
    );
    assert.equal(limitArcGISImageSize(OL_URL, undefined), OL_URL);
  });
});

describe("TRANSPARENT_PIXEL", () => {
  test("is a PNG data URL", () => {
    assert.match(TRANSPARENT_PIXEL, /^data:image\/png;base64,/);
  });
});

describe("filterLegendBySubLayers", () => {
  const layersInfo = {
    0: { caption: "Riksintresse_yta" },
    1: { caption: "Oversiktsplan_yta" },
    3: { caption: "Information_yta" },
  };
  const legend = [
    { url: "a", description: "Riksintresse_yta" },
    { url: "b", description: "Oversiktsplan_yta" },
    { url: "c", description: "Information_yta" },
    { url: "d", description: "Information_yta" },
    { url: "e", description: "" },
    { url: "f", description: "Namn som inte finns" },
  ];

  test("keeps entries of visible sublayers, all symbols of a sublayer", () => {
    const urls = (ids) =>
      filterLegendBySubLayers(legend, ids, layersInfo).map((l) => l.url);
    assert.deepEqual(urls(["3"]), ["c", "d", "e", "f"]);
    assert.deepEqual(urls(["0", "1"]), ["a", "b", "e", "f"]);
  });

  test("keeps entries that can't be matched to a sublayer", () => {
    const urls = filterLegendBySubLayers(legend, [], layersInfo).map(
      (l) => l.url
    );
    assert.deepEqual(urls, ["e", "f"]);
  });

  test("keeps everything when there is no sublayer info", () => {
    assert.equal(filterLegendBySubLayers(legend, ["0"], {}).length, 6);
    assert.equal(filterLegendBySubLayers(legend, ["0"], undefined).length, 6);
    assert.deepEqual(filterLegendBySubLayers(undefined, [], {}), []);
  });
});
