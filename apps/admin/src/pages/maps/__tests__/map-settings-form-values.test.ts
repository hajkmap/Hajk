import { describe, it, expect } from "vitest";
import type { Map as MapRecord } from "../../../api/maps/types";
import {
  buildMapSettingsFormValues,
  buildMapUpdatePayload,
} from "../map-settings-form-values";

const map = {
  name: "test",
  locked: false,
  projection: { code: "EPSG:3006" },
  projections: [],
  options: {
    resolutions: "2.8, 1.4, 0.28",
    extraPrintResolutions: "0.028",
    zoom: "1",
    minZoom: "0",
    maxZoom: "2",
  },
} as unknown as MapRecord;

describe("map settings form values", () => {
  it("derives the scale values on load", () => {
    expect(buildMapSettingsFormValues(map).options).toMatchObject({
      scales: ["1:1000", "1:5000", "1:10000"],
      printScales: ["1:100"],
      startScale: "1:5000",
      minScale: "1:10000",
      maxScale: "1:1000",
    });
  });

  it("keeps options stored as arrays", () => {
    const arrayMap = {
      ...map,
      options: {
        resolutions: [2.8, 1.4],
        origin: [-20037508.34, 20037508.34],
        extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        minZoom: 0,
        maxZoom: 1,
      },
    } as unknown as MapRecord;
    const formValues = buildMapSettingsFormValues(arrayMap);

    expect(formValues.options).toMatchObject({
      resolutions: "2.8, 1.4",
      scales: ["1:5000", "1:10000"],
    });
    expect(buildMapUpdatePayload(formValues, arrayMap).options).toMatchObject({
      resolutions: "2.8, 1.4",
      origin: "-20037508.34, 20037508.34",
      extent: "-20037508.34, -20037508.34, 20037508.34, 20037508.34",
    });
  });

  it("loads the values of a map file and saves them under the same keys", () => {
    const fileMap = {
      ...map,
      options: {
        center: [1325000, 7900000],
        zoom: 6,
        minZoom: 0,
        maxZoom: 2,
        resolutions: [2.8, 1.4, 0.28],
        extraPrintResolutions: [],
        logo: "/logo.png",
        geoserverLegendOptions: "dpi:90",
        activeDrawerOnStart: "documenthandler",
        defaultCookieNoticeMessage: "Kakor",
        defaultCookieNoticeUrl: "https://example.com",
        zoomDelta: null,
        zoomDuration: 300,
        mapselector: true,
        mapcleaner: false,
        introductionSteps: [{ title: "Hej" }],
        title: "Kept",
        colors: {
          primaryColor: "#1976d2",
          secondaryColor: "#ffa000",
          preferredColorScheme: "dark",
          custom: "kept",
        },
      },
    } as unknown as MapRecord;
    const formValues = buildMapSettingsFormValues(fileMap);

    expect(formValues.options).toMatchObject({
      center: "1325000, 7900000",
      zoom: "6",
      logoLight: "/logo.png",
      mapselector: true,
      mapcleaner: false,
      zoomDuration: "300",
      colors: { primaryColor: "#1976d2", preferredColorScheme: "dark" },
    });
    expect(buildMapUpdatePayload(formValues, fileMap).options).toMatchObject({
      center: "1325000, 7900000",
      zoom: "6",
      geoserverLegendOptions: "dpi:90",
      activeDrawerOnStart: "documenthandler",
      defaultCookieNoticeMessage: "Kakor",
      defaultCookieNoticeUrl: "https://example.com",
      zoomDelta: "",
      zoomDuration: "300",
      mapselector: "true",
      mapcleaner: "false",
      introductionSteps: '[{"title":"Hej"}]',
      title: "Kept",
      colors: {
        primaryColor: "#1976d2",
        secondaryColor: "#ffa000",
        preferredColorScheme: "dark",
        custom: "kept",
      },
    });
  });

  it("leaves the scale values out of the saved options", () => {
    const { options } = buildMapUpdatePayload(
      buildMapSettingsFormValues(map),
      map,
    );
    expect(options).toMatchObject({ resolutions: "2.8, 1.4, 0.28" });
    for (const key of [
      "scales",
      "printScales",
      "startScale",
      "minScale",
      "maxScale",
    ]) {
      expect(options).not.toHaveProperty(key);
    }
  });
});
