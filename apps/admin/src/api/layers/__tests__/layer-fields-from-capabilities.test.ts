import { describe, it, expect } from "vitest";
import { layerFieldsFromCapabilities } from "../layer-fields-from-capabilities";

describe("layerFieldsFromCapabilities", () => {
  it("names the layer by its title, with the abstract as description", () => {
    expect(
      layerFieldsFromCapabilities("ws:byggnader", {
        title: "Byggnader",
        abstract: "Byggnader i kommunen",
      }),
    ).toEqual({
      name: "Byggnader",
      description: "Byggnader i kommunen",
      metadata: { title: "Byggnader" },
    });
  });

  it("leaves out an abstract that only repeats the title", () => {
    expect(
      layerFieldsFromCapabilities("PS.ProtectedSite", {
        title: "Protected Sites INSPIRE",
        abstract: "Protected Sites INSPIRE",
      }),
    ).toEqual({
      name: "Protected Sites INSPIRE",
      metadata: { title: "Protected Sites INSPIRE" },
    });
  });

  it("keeps the source layer's name when there is no title", () => {
    expect(layerFieldsFromCapabilities("ws:vagar", undefined)).toEqual({
      name: "ws:vagar",
    });
  });
});
