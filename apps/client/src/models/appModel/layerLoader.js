import ConfigMapper from "../../utils/ConfigMapper";
import WMSLayer from "../layers/WMSLayer";
import WMTSLayer from "../layers/WMTSLayer";
import WFSVectorLayer from "../layers/VectorLayer";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Fill, Stroke, Style } from "ol/style";

export function addMapLayer(appModel, layer) {
  const configMapper = new ConfigMapper(appModel.config.appConfig.proxy);
  let layerItem, layerConfig;
  switch (layer.type) {
    case "wms":
      layerConfig = configMapper.mapWMSConfig(layer, appModel.config);
      layerItem = new WMSLayer(
        {
          ...layerConfig.options,
          requestLabelLayer: layer._requestLabelLayer === true,
        },
        appModel.config.appConfig.proxy,
        appModel.globalObserver
      );

      if (layer.hasLabelStyle === true) {
        layerItem.layer.set("hasLabelStyle", true);
        // Store the layername so we can access it before wms layer changes
        // ex when switching labels
        layerItem.layer.set("wmsLayerName", layer.layers?.[0] || layer.name); // ← Store it!

        const source = layerItem.layer.getSource();
        if (source && source.getParams) {
          const params = source.getParams();
          layerItem.layer.set("initialStyles", params.STYLES || "");
        }
      }

      // Check if we should load the label layer for this layer
      if (
        layer._requestLabelLayer &&
        layerItem?.layer?.getSource?.()?.updateParams
      ) {
        const olLayer = layerItem.layer;
        const source = olLayer.getSource();
        const params = source.getParams?.() || {};
        const layerName = params.LAYERS;

        // Save the provided style before we change it
        olLayer.set("initialStyles", params.STYLES || "");
        olLayer.set("useLabelStyle", true);

        source.updateParams({
          ...params,
          STYLES: `${layerName}_labels`,
        });
      }
      appModel.map.addLayer(layerItem.layer);
      break;
    case "wmts":
      layerConfig = configMapper.mapWMTSConfig(layer, appModel.config);
      layerItem = new WMTSLayer(
        layerConfig.options,
        appModel.config.appConfig.proxy,
        appModel.map
      );
      appModel.map.addLayer(layerItem.layer);
      break;
    case "vector":
      layerConfig = configMapper.mapVectorConfig(layer);
      layerItem = new WFSVectorLayer(
        layerConfig.options,
        appModel.config.appConfig.proxy,
        appModel.map
      );
      appModel.map.addLayer(layerItem.layer);
      break;
    // case "arcgis":
    //   layerConfig = configMapper.mapArcGISConfig(layer);
    //   layer = new ArcGISLayer(layerConfig);
    //   break;
    // case "data":
    //   layerConfig = configMapper.mapDataConfig(layer);
    //   layer = new DataLayer(layerConfig);
    //   break;
    default:
      break;
  }
}

export function lookup(appModel, layers, type) {
  const matchedLayers = [];
  layers.forEach((layer) => {
    const layerConfig = appModel.config.layersConfig.find(
      (lookupLayer) => lookupLayer.id === layer.id
    );
    // Note that "layer" below IS NOT an OL Layer, only a structure from our config.
    // Hence, no layer.set("layerType"). Instead we do this:
    layer.layerType = type;
    // Use the general value for infobox if not present in map config.
    if (layerConfig !== undefined && layerConfig.type === "vector") {
      if (!layer.infobox && layerConfig) {
        layer.infobox = layerConfig.infobox;
      }
    }
    matchedLayers.push({
      ...layerConfig,
      ...layer,
    });
  });
  return matchedLayers;
}

export function expand(groups) {
  var result = [];
  groups.forEach((group) => {
    result = [...result, ...group.layers];
    if (group.groups) {
      result = [...result, ...expand(group.groups)];
    }
  });
  return result;
}

export function flatten(appModel, layerSwitcherConfig) {
  const layers = [
    ...lookup(appModel, layerSwitcherConfig.options.baselayers, "base"),
    ...lookup(appModel, expand(layerSwitcherConfig.options.groups), "layer"),
  ];

  return layers;
}

function applyUrlOverridesToLayer(
  layer,
  layersFromParams,
  groupLayersFromParams,
  cqlFiltersFromParams
) {
  if (layersFromParams.length > 0) {
    // Override the default visibleAtStart if a value was provided in URLSearchParams
    layer.visibleAtStart = layersFromParams.some((layerId) => {
      return layerId === layer.id || layerId === `${layer.id}_l`;
    });

    layer._requestLabelLayer =
      layer.hasLabelStyle === true &&
      layersFromParams.includes(`${layer.id}_l`);

    // groupLayersFromParams is an object where keys are layer IDs and values are
    // the sublayers that should be active for this given layer. A layer's key will
    // only exist in groupLayersFromParams if there is a subset of sublayers to be shown
    // at start (default behavior is to turn on all sublayers).
    layer.visibleAtStartSubLayers = Object.hasOwn(groupLayersFromParams, layer.id)
      ? groupLayersFromParams[layer.id]?.split(",")
      : [];
  }
  layer.cqlFilter = cqlFiltersFromParams[layer.id] || null;
}

function applyBackgroundLayerVisibilityFromParams(
  map,
  layersFromParams,
  layerSwitcherConf
) {
  // Check if the layerParams contains -1 (white background) and handle set it to visible on load
  if (
    layersFromParams.includes("-1") &&
    layerSwitcherConf?.options?.backgroundSwitcherWhite
  ) {
    const whiteLayer = map.getAllLayers().find((l) => l.get("name") === "-1");
    whiteLayer.setVisible(true);
  }

  // Check if the layerParams contains -2 (black background) and handle set it to visible on load
  if (
    layersFromParams.includes("-2") &&
    layerSwitcherConf?.options?.backgroundSwitcherBlack
  ) {
    const blackLayer = map.getAllLayers().find((l) => l.get("name") === "-2");
    blackLayer.setVisible(true);
  }

  // Check if the layerParams contains -3 (osm-layer) and handle set it to visible on load
  if (layersFromParams.includes("-3") && layerSwitcherConf?.options?.enableOSM) {
    const osmLayer = map.getAllLayers().find((l) => l.get("name") === "-3");
    if (osmLayer === undefined) {
      console.warn(`Cannot find the OSM layer`);
    } else {
      osmLayer.setVisible(true);
    }
  }
}

export function addLayers(appModel) {
  const layerSwitcherConfig = appModel.config.mapConfig.tools.find(
      (tool) => tool.type === "layerswitcher"
    ),
    infoclickConfig = appModel.config.mapConfig.tools.find(
      (t) => t.type === "infoclick"
    );

  // Prepare layers — note: mutates appModel.layers
  appModel.layers = flatten(appModel, layerSwitcherConfig);

  // Loop the layers and add each of them to the map
  appModel.layers.forEach((layer) => {
    applyUrlOverridesToLayer(
      layer,
      appModel.layersFromParams,
      appModel.groupLayersFromParams,
      appModel.cqlFiltersFromParams
    );
    addMapLayer(appModel, layer);
  });

  // Now that layers exist, we set useLabelStyle on the proper layers
  appModel.layers.forEach((layer) => {
    if (layer._requestLabelLayer === true) {
      const olLayer = appModel.map
        .getAllLayers()
        .find((l) => l.get("name") === layer.id);

      if (olLayer && olLayer.get("hasLabelStyle")) {
        if (!olLayer.get("useLabelStyle")) {
          olLayer.set("useLabelStyle", true);
        }
      }
    }
  });

  applyBackgroundLayerVisibilityFromParams(
    appModel.map,
    appModel.layersFromParams,
    layerSwitcherConfig
  );

  // FIXME: Move to infoClick instead. All other plugins create their own layers.
  if (infoclickConfig !== undefined) {
    addHighlightLayer(appModel, infoclickConfig.options);
  }

  return appModel;
}

export function addHighlightLayer(appModel, options) {
  const { anchor, scale, src, strokeColor, strokeWidth, fillColor } = options;
  const strokeColorAsArray = strokeColor && [
    strokeColor.r,
    strokeColor.g,
    strokeColor.b,
    strokeColor.a,
  ];
  const fillColorAsArray = fillColor && [
    fillColor.r,
    fillColor.g,
    fillColor.b,
    fillColor.a,
  ];
  appModel.highlightSource = new VectorSource();
  appModel.highlightLayer = new VectorLayer({
    caption: "Infoclick layer",
    name: "pluginInfoclick",
    layerType: "system",
    zIndex: 5001, // System layer's zIndex start at 5000, ensure click is above
    source: appModel.highlightSource,
    style: new Style({
      stroke: new Stroke({
        color: strokeColorAsArray || [200, 0, 0, 0.7],
        width: strokeWidth || 4,
      }),
      fill: new Fill({
        color: fillColorAsArray || [255, 0, 0, 0.1],
      }),
      image: new Icon({
        anchor: [anchor[0] || 0.5, anchor[1] || 1],
        scale: scale || 0.15,
        src: src || "marker.png",
      }),
    }),
  });
  appModel.map.addLayer(appModel.highlightLayer);
}

export function getCenter(e) {
  return [e[0] + Math.abs(e[2] - e[0]) / 2, e[1] + Math.abs(e[3] - e[1]) / 2];
}

export function highlight(appModel, features) {
  if (appModel.highlightSource) {
    appModel.highlightSource.clear();
    if (features) {
      // Let's handle multiple features as array and keep backward compatibility with single features.
      features = Array.isArray(features) ? features : [features];
      appModel.highlightSource.addFeatures(features);
    }
  }
}

export function clear(appModel) {
  appModel.clearing = true;
  highlight(appModel, false);
  appModel.map
    .getAllLayers()
    .filter(
      (l) =>
        l.getVisible() === true &&
        ["layer", "group"].includes(l.get("layerType"))
    )
    .forEach((l) => {
      l.setVisible(false);
      if (l.get("layerType") === "group") {
        appModel.globalObserver.publish("layerswitcher.hideLayer", l);
      }
    });
  setTimeout(() => {
    appModel.clearing = false;
  }, 100);
}
