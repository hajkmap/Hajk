import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import { applyStyle, applyBackground } from "ol-mapbox-style";
import { mapDirectionToAngle } from "../../utils/mapDirectionToAngle";
import { easeOut } from "ol/easing";
import { BACKGROUND_LAYER_IDS } from "../../constants/backgroundLayers";
import i18n from "src/i18n";

const DEFAULT_OSM_VECTOR_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

export function createWhiteLayer(appModel) {
  // Creates a empty vectorlayer to let the url handle them like other layers. BackgroundSwitcher then
  // sets the real colors based on matching the name.
  const whiteLayer = new VectorLayer({
    visible: false,
    source: new VectorSource(),
    zIndex: -1,
    layerType: "base",
    rotateMap: "n",
    name: BACKGROUND_LAYER_IDS.WHITE,
    caption: i18n.t("backgroundLayers.white"),
    layerInfo: {
      caption: i18n.t("backgroundLayers.white"),
      layerType: "base",
    },
  });

  whiteLayer.on("change:visible", (e) => {
    appModel.globalObserver.publish("core.layerVisibilityChanged", e);
  });

  // Add the white layer to the map
  appModel.map.addLayer(whiteLayer);
}

export function createBlackLayer(appModel) {
  // Creates a empty vectorlayer to let the url handle them like other layers. BackgroundSwitcher then
  // sets the real colors based on matching the name.
  const blackLayer = new VectorLayer({
    visible: false,
    source: new VectorSource(),
    zIndex: -1,
    layerType: "base",
    rotateMap: "n",
    name: BACKGROUND_LAYER_IDS.BLACK,
    caption: i18n.t("backgroundLayers.black"),
    layerInfo: {
      caption: i18n.t("backgroundLayers.black"),
      layerType: "base",
    },
  });

  blackLayer.on("change:visible", (e) => {
    appModel.globalObserver.publish("core.layerVisibilityChanged", e);
  });

  // Add the black layer to the map
  appModel.map.addLayer(blackLayer);
}

export function createOSMLayer(appModel) {
  const layerSwitcherConf = appModel.config.mapConfig.tools.find(
    (tool) => tool.type === "layerswitcher"
  );

  // Respect the OSMVisibleAtStart option from layerswitcher config
  // only if no override is provided in URLSearchParams (else we will
  // end up with multiple background layers visible at start).
  const visibleAtStart =
    (appModel.layersFromParams.length === 0 &&
      layerSwitcherConf?.options?.OSMVisibleAtStart === true) ??
    false;

  const osmLayer = new TileLayer({
    visible: visibleAtStart,
    source: new OSM({
      reprojectionErrorThreshold: 5,
    }),
    zIndex: -1,
    layerType: "base",
    rotateMap: "n", // OpenStreetMap should be rotated to North
    name: BACKGROUND_LAYER_IDS.OSM,
    caption: "OpenStreetMap",
    layerInfo: {
      infoText: i18n.t("backgroundLayers.osmInfoText"),
      infoTitle: i18n.t("backgroundLayers.osmInfoTitle"),
      infoUrl:
        "https://wiki.openstreetmap.org/wiki/OpenStreetMap_Carto/Symbols",
      infoUrlText: i18n.t("backgroundLayers.legendLink"),
      information: i18n.t("backgroundLayers.moreInfo"),
      layerType: "base",
      hideExpandArrow: false,
      showAttributeTableButton: false,
    },
  });

  osmLayer.on("change:visible", (e) => {
    const olLayer = e.target;

    // If the layer becomes visible, set the map rotation to match
    if (olLayer.get("visible")) {
      const direction = olLayer.get("rotateMap");
      const duration = 1000;

      const angle = mapDirectionToAngle(direction);
      appModel.map.getView().animate({
        rotation: angle,
        duration: duration,
        easing: easeOut,
      });
    }

    // Publish event to ensure DrawOrder tab is updated with osmLayer changes
    appModel.globalObserver.publish("core.layerVisibilityChanged", e);
  });

  // Add the osmLayer to the map
  appModel.map.addLayer(osmLayer);
}

export function createOSMVectorLayer(appModel) {
  const layerSwitcherConf = appModel.config.mapConfig.tools.find(
    (tool) => tool.type === "layerswitcher"
  );

  // Respect the OSMVectorVisibleAtStart option from layerswitcher config
  // only if no override is provided in URLSearchParams (else we will
  // end up with multiple background layers visible at start).
  const visibleAtStart =
    (appModel.layersFromParams.length === 0 &&
      layerSwitcherConf?.options?.OSMVectorVisibleAtStart === true) ??
    false;

  const styleUrl =
    layerSwitcherConf?.options?.osmVectorStyleUrl ||
    DEFAULT_OSM_VECTOR_STYLE_URL;

  const renderMode =
    layerSwitcherConf?.options?.osmVectorRenderMode || "vector";

  const osmVectorLayer = new VectorTileLayer({
    declutter: true,
    // "vector": everything drawn as vectors, stays sharp through zoom/rotate
    // animations and preserves the style's real paint order. "hybrid":
    // polygons/lines are cached to a bitmap per tile (cheaper on dense
    // styles, but can blur during zoom animations). Admin-configurable
    // since the best choice depends on the chosen style and target hardware.
    renderMode: renderMode,
    visible: visibleAtStart,
    zIndex: -1,
    layerType: "base",
    rotateMap: "n", // OpenStreetMap should be rotated to North
    name: BACKGROUND_LAYER_IDS.OSM_VECTOR,
    caption: i18n.t("backgroundLayers.osmVector"),
    layerInfo: {
      infoText: i18n.t("backgroundLayers.osmVectorInfoText"),
      infoTitle: i18n.t("backgroundLayers.osmVectorInfoTitle"),
      infoUrl:
        "https://wiki.openstreetmap.org/wiki/OpenStreetMap_Carto/Symbols",
      infoUrlText: i18n.t("backgroundLayers.legendLink"),
      information: i18n.t("backgroundLayers.moreInfo"),
      layerType: "base",
      hideExpandArrow: false,
      showAttributeTableButton: false,
    },
  });

  applyStyle(osmVectorLayer, styleUrl)
    .then(() => applyBackground(osmVectorLayer, styleUrl))
    .catch((error) => {
      console.error("Could not load the OSM vector style:", error);
    });

  osmVectorLayer.on("change:visible", (e) => {
    const olLayer = e.target;

    // If the layer becomes visible, set the map rotation to match
    if (olLayer.get("visible")) {
      const direction = olLayer.get("rotateMap");
      const duration = 1000;

      const angle = mapDirectionToAngle(direction);
      appModel.map.getView().animate({
        rotation: angle,
        duration: duration,
        easing: easeOut,
      });
    }

    // Publish event to ensure DrawOrder tab is updated with osmVectorLayer changes
    appModel.globalObserver.publish("core.layerVisibilityChanged", e);
  });

  // Add the osmVectorLayer to the map
  appModel.map.addLayer(osmVectorLayer);
}

/**
 * Checks the layerSwitcher config and creates whichever background layers are enabled.
 * Called from mapFactory after the OL map is constructed.
 *
 * @param {object} appModel - The AppModel instance
 * @param {object} layerSwitcherConf - The layerswitcher tool config entry
 */
export function addConfiguredBackgroundLayers(appModel, layerSwitcherConf) {
  // Create the white and black background layers if they are enabled in config
  if (layerSwitcherConf?.options?.backgroundSwitcherWhite) {
    createWhiteLayer(appModel);
  }

  if (layerSwitcherConf?.options?.backgroundSwitcherBlack) {
    createBlackLayer(appModel);
  }

  // Add the OSM layer if it is enabled in the conf
  if (layerSwitcherConf?.options?.enableOSM) {
    createOSMLayer(appModel);
  }

  // Add the vector-tile based OSM layer if it is enabled in the conf
  if (layerSwitcherConf?.options?.enableOSMVector) {
    createOSMVectorLayer(appModel);
  }
}
