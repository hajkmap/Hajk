export const getDpiFromLegendGraphicUrl = (url) => {
  if (!url) {
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
  const fontColor = isDarkMode ? "0xFFFFFF" : "0x000000";
  const parsedUrl = new URL(url);
  const params = parsedUrl.searchParams;

  const requestParam = (
    params.get("REQUEST") || params.get("request")
  )?.toLowerCase();
  if (requestParam === "getlegendgraphic") {
    // Note that fontColor only works in GeoServer, not in QGIS Server.
    // TRANSPARENT is supported in both.

    params.set("TRANSPARENT", "true");

    const legendOptions = params.get("LEGEND_OPTIONS") || "";
    const optionsArray = legendOptions.split(";").filter(Boolean);
    const optionsObj = Object.fromEntries(
      optionsArray.map((option) => option.split(":").map((str) => str.trim()))
    );

    optionsObj.fontColor = fontColor;

    // Here we try to set the DPI to 180 so we can get nicer legends.
    // We shrink it back to 96 (using px in css) in the LegendImage component.
    if (!optionsObj.dpi || parseInt(optionsObj.dpi) < 180) {
      optionsObj.dpi = 180;
    }

    const newLegendOptions = Object.entries(optionsObj)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");

    params.set("LEGEND_OPTIONS", newLegendOptions + ";");
  }

  return parsedUrl.toString();
};
