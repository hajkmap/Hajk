import { describe, it, expect } from "vitest";
import { serviceRequestUrl } from "../service-request-url";

const capabilities = { SERVICE: "WMS", REQUEST: "GetCapabilities" };

describe("serviceRequestUrl", () => {
  it("adds the parameters to a plain url", () => {
    expect(serviceRequestUrl("https://example.org/wms", capabilities)).toBe(
      "https://example.org/wms?SERVICE=WMS&REQUEST=GetCapabilities",
    );
  });

  it("copes with a url that ends in a question mark", () => {
    expect(
      serviceRequestUrl(
        "https://geodata.naturvardsverket.se/inspire/am-uwwtd/ows?",
        capabilities,
      ),
    ).toBe(
      "https://geodata.naturvardsverket.se/inspire/am-uwwtd/ows?SERVICE=WMS&REQUEST=GetCapabilities",
    );
  });

  it("keeps the parameters the url already has", () => {
    const url = new URL(
      serviceRequestUrl(
        "https://qgis.example.org/qgisserver?MAP=/data/projekt.qgs",
        capabilities,
      ),
    );
    expect(url.searchParams.get("MAP")).toBe("/data/projekt.qgs");
    expect(url.searchParams.get("SERVICE")).toBe("WMS");
    expect(url.searchParams.get("REQUEST")).toBe("GetCapabilities");
  });

  it("replaces a parameter the url already sets", () => {
    const url = new URL(
      serviceRequestUrl("https://example.org/ows?SERVICE=WFS", capabilities),
    );
    expect(url.searchParams.getAll("SERVICE")).toEqual(["WMS"]);
  });
});
