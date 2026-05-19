import { getMergedSearchAndHashParams } from "../../utils/getMergedSearchAndHashParams";
import { mergeConfigWithValuesFromParams } from "./urlParamsMerger";

export function decorateConfig(appModel) {
  // .allResolutions should be used when creating layers etc
  // It will also be used in the print plugin to be able to print in higher resolutions.
  appModel.config.mapConfig.map.allResolutions = [
    ...appModel.config.mapConfig.map.resolutions,
    ...(appModel.config.mapConfig.map.extraPrintResolutions ?? []),
  ];
}

/**
 * @summary If supplied argument, v, is a string and is longer then 0, return an encoded value of v. Else return undefined.
 *
 * @param {*} v
 * @returns
 */
export function returnStringOrUndefined(v) {
  return typeof v === "string" && v.trim().length > 0 ? v : undefined;
}

export function overrideGlobalSearchConfig(searchTool, wfslayers) {
  const configSpecificSearchLayers = searchTool.options.layers;
  const searchLayers = wfslayers.filter((layer) => {
    if (configSpecificSearchLayers.find((x) => x.id === layer.id)) {
      return layer;
    } else {
      return undefined;
    }
  });
  return searchLayers;
}

export function overrideGlobalEditConfig(editTool, wfstlayers) {
  const configSpecificEditLayers = editTool.options.activeServices;
  const editLayers = wfstlayers.filter((layer) => {
    if (configSpecificEditLayers.find((x) => x.id === layer.id)) {
      return layer;
    } else {
      return undefined;
    }
  });
  return editLayers;
}

function setDocumentTitleFromConfig(mapConfig) {
  if (
    mapConfig.hasOwnProperty("map") &&
    mapConfig.map.hasOwnProperty("title")
  ) {
    document.title = mapConfig.map.title; // TODO: add opt-out in admin to cancel this override behaviour.
  }
}

function normalizeLayersConfig(appModel, layers) {
  layers.wmslayers = appModel.config.layersConfig.wmslayers || [];
  layers.wfslayers = appModel.config.layersConfig.wfslayers || [];
  layers.wfstlayers = appModel.config.layersConfig.wfstlayers || [];
  layers.wmtslayers = appModel.config.layersConfig.wmtslayers || [];
  layers.vectorlayers = appModel.config.layersConfig.vectorlayers || [];
  layers.arcgislayers = appModel.config.layersConfig.arcgislayers || [];

  layers.wmslayers.forEach((l) => (l.type = "wms"));
  layers.wmtslayers.forEach((l) => (l.type = "wmts"));
  layers.wfstlayers.forEach((l) => (l.type = "edit"));
  layers.vectorlayers.forEach((l) => (l.type = "vector"));
  layers.arcgislayers.forEach((l) => (l.type = "arcgis"));

  const allLayers = [
    ...layers.wmslayers,
    ...layers.wmtslayers,
    ...layers.vectorlayers,
    ...layers.wfstlayers,
    ...layers.arcgislayers,
  ];

  appModel.config.layersConfig = allLayers;
}

function buildSearchSources(searchTool, layers) {
  // Take a look at all available wfslayers in layers repository,
  // but let the search tool only see those that are specified in searchTool.options
  const wfslayers = overrideGlobalSearchConfig(searchTool, layers.wfslayers);

  // See if admin wants to expose any WMS layers. selectedSources will
  // in that case be an array that will hold the IDs of corresponding layers
  // (that can be found in our layers.wmslayers array). In there, a properly
  // configured WMS layer that is to be searchable will have certain search-related
  // settings active (such as name of the geometry column or URL to the WFS service).
  const wmslayers = searchTool.options.selectedSources?.flatMap((wmslayerId) => {
    // Find the corresponding layer
    const layer = layers.wmslayers.find((l) => l.id === wmslayerId);

    // Prevent crash if no layer was found, see #1206
    if (layer === undefined) {
      console.warn(
        `WMS layer with ID "${wmslayerId}" does not exist and should be removed from config. Please contact the system administrator.`
      );
      return undefined;
    }

    // Look into the layersInfo array - it will contain sublayers. We must
    // expose each one of them as a WFS service.
    return layer?.layersInfo.map((sl) => {
      return {
        id: sl.id,
        pid: layer.id, // Relevant for group layers: will hold the actual OL layer name, not only current sublayer
        caption: sl.caption,
        url: sl.searchUrl || layer.url,
        layers: [sl.id],
        searchFields:
          typeof sl.searchPropertyName === "string" &&
          sl.searchPropertyName.length > 0
            ? sl.searchPropertyName.split(",")
            : [],
        infobox: sl.infobox || "",
        infoclickIcon: sl.infoclickIcon || "",
        aliasDict: "",
        displayFields:
          typeof sl.searchDisplayName === "string" &&
          sl.searchDisplayName.length > 0
            ? sl.searchDisplayName.split(",")
            : [],
        secondaryLabelFields:
          typeof sl.secondaryLabelFields === "string" &&
          sl.secondaryLabelFields.length > 0
            ? sl.secondaryLabelFields.split(",")
            : [],
        shortDisplayFields:
          typeof sl.searchShortDisplayName === "string" &&
          sl.searchShortDisplayName.length > 0
            ? sl.searchShortDisplayName.split(",")
            : [],
        geometryField: sl.searchGeometryField || "geom",
        outputFormat: sl.searchOutputFormat || "GML3",
        serverType: layer.serverType || "geoserver",
      };
    });
  });

  // Spread the WMS search layers onto the array with WFS search sources,
  // from now on they're equal to our code. Before spreading, let's filter
  // the wmslayers so we get rid of potential undefined values (see #1206).
  Array.isArray(wmslayers) && wfslayers.push(...wmslayers.filter(Boolean));

  searchTool.options.sources = wfslayers;
}

function normalizeEditTool(editTool, layers) {
  // This is for backwards compatibility prior to adding locking WFST edit layers with AD.
  // This code handles if activeServices does not have an object with "id", "visibleForGroups"
  if (editTool.options.activeServices === null) {
    editTool.options.sources = [];
  } else {
    if (
      editTool.options.activeServices &&
      editTool.options.activeServices.length !== 0
    ) {
      if (
        typeof editTool.options.activeServices[0].visibleForGroups ===
        "undefined"
      ) {
        // If activeService does not have an object with "id", "visibleForGroups", add it
        let as = [];
        for (let i = 0; i < editTool.options.activeServices.length; i++) {
          let service = {
            id: editTool.options.activeServices[i],
            visibleForGroups: [],
          };
          as.push(service);
        }
        editTool.options.activeServices = as;
      }

      let wfstlayers = overrideGlobalEditConfig(editTool, layers.wfstlayers);
      editTool.options.sources = wfstlayers;
      layers.wfstlayers = wfstlayers;
    } else {
      editTool.options.sources = [];
    }
  }
}

export function translateConfig(appModel) {
  setDocumentTitleFromConfig(appModel.config.mapConfig);

  const layerSwitcherTool = appModel.config.mapConfig.tools.find((tool) => {
    return tool.type === "layerswitcher";
  });

  const searchTool = appModel.config.mapConfig.tools.find((tool) => {
    return tool.type === "search";
  });

  const editTool = appModel.config.mapConfig.tools.find((tool) => {
    return tool.type === "edit";
  });

  let layers = {};

  if (layerSwitcherTool) {
    normalizeLayersConfig(appModel, layers);
  }

  if (searchTool) {
    buildSearchSources(searchTool, layers);
  }

  if (editTool) {
    normalizeEditTool(editTool, layers);
  }

  return mergeConfigWithValuesFromParams(
    appModel,
    appModel.config.mapConfig,
    Object.fromEntries(getMergedSearchAndHashParams())
  );
}
