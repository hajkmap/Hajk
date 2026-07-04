export const setOLSubLayers = (olLayer, visibleSubLayersArray) => {
  // Uses the configure filter for the source, cql or qgis filtering
  // Could and should be extended if other sources has their own filtering params
  const getFilterKey = (source) => {
    const params = source?.getParams?.() || {};
    return params.FILTER !== undefined ? "FILTER" : "CQL_FILTER";
  };

  if (visibleSubLayersArray.length === 0) {
    // Fix underlying source
    olLayer.getSource().updateParams({
      // Ensure that the list of sublayers is emptied (otherwise they'd be
      // "remembered" the next time user toggles group)
      LAYERS: "",
      // Remove any filters
      [getFilterKey(olLayer.getSource())]: null,
    });

    // Hide the layer in OL
    olLayer.setVisible(false);
  } else {
    const layerInfo = olLayer.get("layerInfo");
    // Set LAYERS and STYLES so that the exact sublayers that are needed
    // will be visible
    olLayer.getSource().updateParams({
      // join(), so we always provide a string as value to LAYERS
      LAYERS: visibleSubLayersArray.join(),
      // Filter STYLES to only contain styles for currently visible layers,
      // and maintain the order from layersInfo (it's crucial that the order
      // of STYLES corresponds exactly to the order of LAYERS!)
      STYLES: Object.entries(olLayer.layersInfo)
        .filter(([k]) => visibleSubLayersArray.indexOf(k) !== -1)
        .map(([name, info]) => {
          const labeled = olLayer.get("labeledSubLayers");
          return labeled?.has(name) ? `${name}_labels` : info.style || "";
        })
        .join(","),
      [getFilterKey(olLayer.getSource())]:
        layerInfo?.params?.CQL_FILTER || layerInfo?.params?.FILTER || null,
    });
    olLayer.set("subLayers", visibleSubLayersArray);
    olLayer.setVisible(true);
  }
};

export const getAllLayerIdsInGroup = (group) => {
  if (!group) {
    return [];
  }

  if (!group.children) {
    return [group.id];
  } else {
    return group.children.flatMap((c) => {
      return getAllLayerIdsInGroup(c);
    });
  }
};
