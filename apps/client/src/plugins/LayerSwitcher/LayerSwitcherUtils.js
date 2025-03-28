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

    const newLegendOptions = Object.entries(optionsObj)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");

    params.set("LEGEND_OPTIONS", newLegendOptions + ";");
  }

  return parsedUrl.toString();
};
