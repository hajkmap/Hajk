import { describe, it, expect } from "vitest";
import {
  applyScaleChange,
  changeScaleRow,
  deriveScalesFromOptions,
  optionsForProjectionGroupChange,
  parseScale,
  removeScaleRow,
  scaleEditsBlockSave,
  scaleRowBounds,
  scaleRowOptions,
  scaleToResolution,
  validateScales,
  type ScaleValues,
} from "../map-scales";

const values = (overrides: Partial<ScaleValues> = {}): ScaleValues => ({
  scales: ["1:1000", "1:5000", "1:10000"],
  printScales: [],
  startScale: "1:5000",
  minScale: "1:10000",
  maxScale: "1:1000",
  ...overrides,
});

describe("parseScale", () => {
  it.each([
    ["1:5000", 5000],
    ["5000", 5000],
    ["1:5 000", 5000],
    [" 1 : 5 000 ", 5000],
  ])("reads %s", (text, scale) => {
    expect(parseScale(text)).toBe(scale);
  });

  it.each(["", "abc", "1:0", "0", "1:5000.5", "-100", "1:5,000"])(
    "rejects %s",
    (text) => {
      expect(parseScale(text)).toBeNull();
    },
  );
});

describe("scaleToResolution", () => {
  it("avoids float noise", () => {
    expect(scaleToResolution(3000)).toBe(0.84);
    expect(scaleToResolution(100)).toBe(0.028);
  });
});

describe("applyScaleChange", () => {
  it("removes duplicates and sorts scale and print rows", () => {
    const result = applyScaleChange(
      values({
        scales: ["1:1000", "5000", "1:10000", "1:5 000"],
        printScales: ["1:100", "1:500", "1:100"],
      }),
      {},
    );
    expect(result.values.scales).toEqual(["1:1000", "1:5000", "1:10000"]);
    expect(result.values.printScales).toEqual(["1:100", "1:500"]);
    expect(result.options?.resolutions).toBe("2.8, 1.4, 0.28");
    expect(result.options?.extraPrintResolutions).toBe("0.14, 0.028");
  });

  it("drops blank rows", () => {
    const result = applyScaleChange(
      values({
        scales: ["1:10000", "", "1:5000", "1:1000"],
        printScales: [""],
      }),
      {},
    );
    expect(result.values.scales).toEqual(["1:1000", "1:5000", "1:10000"]);
    expect(result.values.printScales).toEqual([]);
  });

  it("adds a typed Start, Min or Max as a row", () => {
    const result = applyScaleChange(
      values({ startScale: "2000", minScale: "1:20000", maxScale: "1:500" }),
      {},
    );
    expect(result.values.scales).toEqual([
      "1:500",
      "1:1000",
      "1:2000",
      "1:5000",
      "1:10000",
      "1:20000",
    ]);
    expect(result.values.startScale).toBe("1:2000");
    expect(result.options).toMatchObject({
      zoom: "3",
      minZoom: "0",
      maxZoom: "5",
    });
  });

  it("uses row indexes when rows lie outside Min and Max", () => {
    const result = applyScaleChange(
      values({
        scales: ["1:20000", "1:10000", "1:5000", "1:1000", "1:500"],
        minScale: "1:10000",
        maxScale: "1:1000",
      }),
      {},
    );
    expect(result.options).toMatchObject({
      zoom: "2",
      minZoom: "1",
      maxZoom: "3",
    });
  });

  it("keeps resolutions coarsest first while rows run finest first", () => {
    const result = applyScaleChange(values(), {});
    expect(result.values.scales[0]).toBe("1:1000");
    expect(result.options?.resolutions).toBe("2.8, 1.4, 0.28");
    expect(result.options).toMatchObject({ minZoom: "0", maxZoom: "2" });
  });

  it("keeps existing resolutions when another row changes", () => {
    const current = {
      resolutions: "2048, 1024, 8",
      extraPrintResolutions: "0.5",
    };
    const derived = deriveScalesFromOptions({
      ...current,
      zoom: "1",
      minZoom: "0",
      maxZoom: "2",
    });
    const result = applyScaleChange(
      { ...derived, scales: [...derived.scales, "1:5000"] },
      current,
    );
    expect(result.options?.resolutions).toBe("2048, 1024, 8, 1.4");
    expect(result.options?.extraPrintResolutions).toBe("0.5");
  });

  it("writes nothing while invalid", () => {
    const invalid = values({ scales: ["abc", "1:1000"] });
    expect(applyScaleChange(invalid, {})).toEqual({
      values: invalid,
      options: null,
    });
  });
});

describe("changeScaleRow", () => {
  it("lets Start, Min and Max follow the edited row", () => {
    const edited = changeScaleRow(values(), 1, "1:6000");
    expect(edited.startScale).toBe("1:6000");
    expect(applyScaleChange(edited, {}).values.scales).toEqual([
      "1:1000",
      "1:6000",
      "1:10000",
    ]);
  });

  it("moves them to the nearest row when the row is blanked", () => {
    expect(changeScaleRow(values(), 1, "").startScale).toBe("1:10000");
  });

  it("recovers after a typo", () => {
    const typo = changeScaleRow(values(), 1, "abc");
    const fixed = changeScaleRow(typo, 1, "1:6000");
    expect(applyScaleChange(fixed, {}).values.scales).toEqual([
      "1:1000",
      "1:6000",
      "1:10000",
    ]);
  });
});

describe("removeScaleRow", () => {
  it("does not add back a row used by Start, Min or Max", () => {
    const removed = removeScaleRow(values(), 0);
    const start = values({ startScale: "1:10000" });
    expect(removed.maxScale).toBe("1:5000");
    expect(removeScaleRow(start, 1).scales).toEqual(["1:1000", "1:10000"]);

    const result = applyScaleChange(removed, {});
    expect(result.values.scales).toEqual(["1:5000", "1:10000"]);
  });

  it("leaves Start, Min and Max alone when a duplicate row remains", () => {
    const duplicate = values({
      scales: ["1:1000", "1:5000", "5000", "1:10000"],
    });
    expect(removeScaleRow(duplicate, 1).startScale).toBe("1:5000");
  });
});

describe("deriveScalesFromOptions", () => {
  it("round-trips 0.028 as a 1:100 print row", () => {
    const derived = deriveScalesFromOptions({
      resolutions: "2.8, 1.4",
      extraPrintResolutions: "0.028",
      zoom: "0",
      minZoom: "0",
      maxZoom: "1",
    });
    expect(derived.printScales).toEqual(["1:100"]);
    expect(applyScaleChange(derived, {}).options?.extraPrintResolutions).toBe(
      "0.028",
    );
  });

  it("finds Start, Min and Max, rounding zoom", () => {
    expect(
      deriveScalesFromOptions({
        resolutions: "2.8, 1.4, 0.28",
        zoom: "1.33",
        minZoom: "0",
        maxZoom: "2",
      }),
    ).toEqual(values());
  });

  it("clamps zoom values outside the list", () => {
    const derived = deriveScalesFromOptions({
      resolutions: "2.8, 1.4",
      zoom: "9",
      minZoom: "-1",
      maxZoom: "20",
    });
    expect(derived).toMatchObject({
      startScale: "1:5000",
      minScale: "1:10000",
      maxScale: "1:5000",
    });
  });

  it("reads a maxZoom of 0 as no limit, like the client", () => {
    const derived = deriveScalesFromOptions({
      resolutions: "2.8, 1.4",
      maxZoom: "0",
    });
    expect(derived.maxScale).toBe("1:5000");
  });

  it("gives custom scales for resolutions off the presets", () => {
    const derived = deriveScalesFromOptions({ resolutions: "2048" });
    expect(derived.scales).toEqual(["1:7314286"]);
  });

  it("handles missing options", () => {
    expect(deriveScalesFromOptions({})).toEqual({
      scales: [],
      printScales: [],
      startScale: "",
      minScale: "",
      maxScale: "",
    });
  });
});

describe("validateScales", () => {
  it("accepts valid values and ignores blank rows", () => {
    expect(
      validateScales(values({ scales: ["1:10000", "", "1:1000"] })),
    ).toEqual([]);
  });

  it.each<[string, Partial<ScaleValues>, string]>([
    ["no rows", { scales: [""] }, "noScales"],
    ["a bad row", { scales: ["abc", "1:1000"] }, "invalidScale"],
    ["a bad print row", { printScales: ["abc"] }, "invalidPrintScale"],
    ["a bad Start", { startScale: "abc" }, "invalidZoomScale"],
    ["Start above Min", { startScale: "1:20000" }, "zoomOrder"],
    ["Start below Max", { startScale: "1:500" }, "zoomOrder"],
    ["Min below Max", { minScale: "1:500" }, "zoomOrder"],
    [
      "Max on the coarsest row",
      { startScale: "1:10000", maxScale: "1:10000" },
      "maxIsCoarsest",
    ],
    ["print equal to a row", { printScales: ["1:1000"] }, "printNotFiner"],
    ["print coarser than a row", { printScales: ["1:5000"] }, "printNotFiner"],
  ])("rejects %s", (_label, overrides, error) => {
    expect(validateScales(values(overrides))).toContain(error);
  });

  it("checks print rows against typed scales", () => {
    expect(
      validateScales(values({ maxScale: "1:100", printScales: ["1:200"] })),
    ).toContain("printNotFiner");
  });

  it("allows Max on the only row", () => {
    expect(
      validateScales(
        values({
          scales: ["1:1000"],
          startScale: "1:1000",
          minScale: "1:1000",
          maxScale: "1:1000",
        }),
      ),
    ).toEqual([]);
  });
});

describe("optionsForProjectionGroupChange", () => {
  const savedOptions = {
    resolutions: "156543.03, 78271.51",
    extent: "-20037508, -20037508, 20037508, 20037508",
    origin: "-20037508, 20037508",
    minZoom: "0",
  };

  it("sets valid defaults going from zoom levels to scales", () => {
    const options = optionsForProjectionGroupChange({
      usesZoomFields: false,
      savedUsesZoomFields: true,
      savedOptions,
      extent: [60436, 6192389, 217643, 6682784],
    });
    expect(options).toMatchObject({
      startScale: "1:100000",
      minScale: "1:500000",
      maxScale: "1:500",
      printScales: [],
      extraPrintResolutions: "",
      minZoom: "0",
      maxZoom: "9",
      zoom: "2",
      extent: "60436, 6192389, 217643, 6682784",
      center: "139040, 6437587",
      origin: "0,0",
    });
    expect(options?.resolutions).toContain("140, 56, 28");
    expect(validateScales(options as unknown as ScaleValues)).toEqual([]);
  });

  it("keeps the coordinates when the extent is unknown", () => {
    const options = optionsForProjectionGroupChange({
      usesZoomFields: false,
      savedUsesZoomFields: true,
      savedOptions,
    });
    expect(options).not.toHaveProperty("extent");
    expect(options).toHaveProperty("resolutions");
  });

  it("restores the saved values when coming back", () => {
    const options = optionsForProjectionGroupChange({
      usesZoomFields: true,
      savedUsesZoomFields: true,
      savedOptions,
    });
    expect(options).toMatchObject(savedOptions);
  });

  it("leaves a scale map moved to zoom levels alone", () => {
    expect(
      optionsForProjectionGroupChange({
        usesZoomFields: true,
        savedUsesZoomFields: false,
        savedOptions,
      }),
    ).toBeNull();
  });
});

describe("scaleRowOptions", () => {
  it("hides scales at or finer than the row above", () => {
    const options = scaleRowOptions(["1:500", ""], 1);
    expect(options[0]).toBe("1:1000");
    expect(options).not.toContain("1:500");
    expect(options).not.toContain("1:400");
  });

  it("hides scales used by another row", () => {
    const options = scaleRowOptions(["1:500", "1:1000", "1:5000"], 1);
    expect(options).toContain("1:1000");
    expect(options).toContain("1:2000");
    expect(options).not.toContain("1:5000");
  });

  it("offers every free preset on the first row", () => {
    const options = scaleRowOptions(["1:500", "1:1000"], 0);
    expect(options).toContain("1:100");
    expect(options).toContain("1:500");
    expect(options).not.toContain("1:1000");
  });

  it("skips rows that don't parse", () => {
    expect(scaleRowOptions(["abc", ""], 1)).toContain("1:100");
  });

  it("keeps print rows finer than the scale rows, and the reverse", () => {
    const bounds = scaleRowBounds(values({ printScales: ["1:200"] }));
    expect(bounds).toEqual({
      scales: { coarserThan: 200 },
      printScales: { finerThan: 1000 },
    });

    const print = scaleRowOptions(["1:200"], 0, bounds.printScales);
    expect(print).toContain("1:500");
    expect(print).not.toContain("1:1000");

    const rows = scaleRowOptions(["1:1000"], 0, bounds.scales);
    expect(rows).toContain("1:300");
    expect(rows).not.toContain("1:200");
  });
});

describe("scaleEditsBlockSave", () => {
  const invalid = values({ startScale: "1:20000" });

  it("blocks invalid edits", () => {
    expect(scaleEditsBlockSave(invalid, values())).toBe(true);
  });

  it("allows a map that loaded invalid", () => {
    expect(scaleEditsBlockSave(invalid, invalid)).toBe(false);
  });

  it("allows valid edits", () => {
    expect(
      scaleEditsBlockSave(values({ startScale: "1:1000" }), values()),
    ).toBe(false);
  });
});
