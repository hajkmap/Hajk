import AppModel from "models/AppModel";

const { options } = AppModel.config.mapConfig.tools.find(
  (tool) => tool.type.toLowerCase() === "layerswitcher"
);

const isMobile = window.matchMedia("(max-width: 600px)").matches;

export const getLegendBackgroundColor = (theme) => {
  if (!options.legendForceTransparency) {
    return "#fff";
  }

  return theme.palette.mode === "dark"
    ? theme.palette.grey[800]
    : theme.palette.grey[200];
};

export const getDpiFromLegendGraphicUrl = (url) => {
  if (!url || !options.legendTryHiDPI) {
    // Nothing to do here, return default and move on.
    return 90;
  }

  url = decodeURIComponent(url).toLowerCase();

  if (url.includes("request=getlegendgraphic")) {
    const dpiMatch = url.match(/dpi:(\d+)/);
    if (dpiMatch) {
      return dpiMatch[1];
    }
  }

  return 90;
};

export const getThemedLegendGraphicUrl = (url, isDarkMode) => {
  if (!url) {
    // Nothing to do here, move on.
    return;
  }

  const parsedUrl = new URL(url, window.location.href);
  const params = parsedUrl.searchParams;

  const requestParam = (
    params.get("REQUEST") || params.get("request")
  )?.toLowerCase();

  if (requestParam === "getlegendgraphic") {
    // Note that fontColor only works in GeoServer, not in QGIS Server.
    // TRANSPARENT is supported in both.

    if (options.legendForceTransparency === true) {
      params.set("TRANSPARENT", "true");
    }

    const legendOptions = params.get("LEGEND_OPTIONS") || "";
    const optionsArray = legendOptions.split(";").filter(Boolean);
    const optionsObj = Object.fromEntries(
      optionsArray.map((option) => option.split(":").map((str) => str.trim()))
    );

    if (options.legendForceTransparency === true) {
      const fontColor = isDarkMode ? "0xFFFFFF" : "0x000000";
      optionsObj.fontColor = fontColor;
    }

    if (options.legendTryHiDPI === true) {
      // Here we try to set the DPI to 180 so we can get nicer legends.
      // We shrink it back to 96 (using px in css) in the LegendImage component.
      if (!optionsObj.dpi || parseInt(optionsObj.dpi) < 180) {
        optionsObj.dpi = 180;
      }
    }

    const newLegendOptions = Object.entries(optionsObj)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");

    params.set("LEGEND_OPTIONS", newLegendOptions + ";");
  }

  return parsedUrl.toString();
};

export const getIsMobile = () => {
  return isMobile;
};
