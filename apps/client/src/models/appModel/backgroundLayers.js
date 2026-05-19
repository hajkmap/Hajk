import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { mapDirectionToAngle } from "../../utils/mapDirectionToAngle";
import { easeOut } from "ol/easing";

export function createWhiteLayer(appModel) {
  // Creates a empty vectorlayer to let the url handle them like other layers. BackgroundSwitcher then
  // sets the real colors based on matching the name.
  const whiteLayer = new VectorLayer({
    visible: false,
    source: new VectorSource(),
    zIndex: -1,
    layerType: "base",
    rotateMap: "n",
    name: "-1",
    caption: "Vit",
    layerInfo: {
      caption: "Vit",
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
    name: "-2",
    caption: "Svart",
    layerInfo: {
      caption: "Svart",
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
    name: "-3",
    caption: "OpenStreetMap",
    layerInfo: {
      infoText:
        "OpenStreetMap är en öppen, användargenererad karta där vem som helst kan bidra med information. Innehållet är inte kvalitetssäkrat, granskat eller godkänt av Lantmäteriet.",
      infoTitle: "Om OpenStreetMap",
      infoUrl:
        "https://wiki.openstreetmap.org/wiki/OpenStreetMap_Carto/Symbols",
      infoUrlText: "Länk till teckenförklaring",
      information: "Här finns mer info",
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
}
