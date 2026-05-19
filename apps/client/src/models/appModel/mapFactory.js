import { Map as OLMap, View } from "ol";
import { defaults as defaultInteractions } from "ol/interaction";
import SnapHelper from "../SnapHelper";
import { isMobile } from "../../utils/IsMobile";
import { translateConfig } from "./configTranslator";
import { attachInfoclickHandlers } from "./clickBindings";
import { addConfiguredBackgroundLayers } from "./backgroundLayers";

function buildInteractionsOptions(configMap) {
  // Prepare OL interactions options, refer to https://openlayers.org/en/latest/apidoc/module-ol_interaction.html#.defaults.
  // We use conditional properties to ensure that only existing keys are set. The rest
  // will fallback to defaults from OL. (The entire interactionsOptions object, as well as all its properties are optional
  // according to OL documentation, so there's no need to set stuff that won't be needed.)
  return {
    ...(configMap.hasOwnProperty("altShiftDragRotate") && {
      altShiftDragRotate: configMap.altShiftDragRotate,
    }),
    ...(configMap.hasOwnProperty("onFocusOnly") && {
      onFocusOnly: configMap.onFocusOnly,
    }),
    ...(configMap.hasOwnProperty("doubleClickZoom") && {
      doubleClickZoom: configMap.doubleClickZoom,
    }),
    ...(configMap.hasOwnProperty("keyboard") && {
      keyboard: configMap.keyboard,
    }),
    ...(configMap.hasOwnProperty("mouseWheelZoom") && {
      mouseWheelZoom: configMap.mouseWheelZoom,
    }),
    ...(configMap.hasOwnProperty("shiftDragZoom") && {
      shiftDragZoom: configMap.shiftDragZoom,
    }),
    ...(configMap.hasOwnProperty("dragPan") && {
      dragPan: configMap.dragPan,
    }),
    ...(configMap.hasOwnProperty("pinchRotate") && {
      pinchRotate: configMap.pinchRotate,
    }),
    ...(configMap.hasOwnProperty("pinchZoom") && {
      pinchZoom: configMap.pinchZoom,
    }),
    ...(!Number.isNaN(Number.parseInt(configMap.zoomDelta)) && {
      zoomDelta: configMap.zoomDelta,
    }),
    ...(!Number.isNaN(Number.parseInt(configMap.zoomDuration)) && {
      zoomDuration: configMap.zoomDuration,
    }),
  };
}

function buildView(configMap) {
  return new View({
    center: configMap.center,
    extent: configMap.extent.length > 0 ? configMap.extent : undefined, // backend will always write extent as an Array, so basic "config.map.extent || undefined" wouldn't work here
    constrainOnlyCenter: configMap.constrainOnlyCenter, // If true, the extent constraint will only apply to the view center and not the whole extent.
    constrainResolution:
      isMobile && configMap.constrainResolutionMobile !== undefined
        ? configMap.constrainResolutionMobile
        : configMap.constrainResolution, // If true, the view will always animate to the closest zoom level after an interaction; false means intermediary zoom levels are allowed.
    maxZoom: configMap.maxZoom || 24,
    minZoom: configMap.minZoom || 0,
    projection: configMap.projection,
    resolutions: configMap.resolutions,
    units: "m",
    zoom: configMap.zoom,
  });
}

function attachZoomEndEvent(map, globalObserver) {
  // Create throttled zoomEnd event
  let currentZoom = map.getView().getZoom();

  map.on("moveend", () => {
    // using moveend to create a throttled zoomEnd event
    // instead of using change:resolution to minimize events being fired.
    const newZoom = map.getView().getZoom();
    if (currentZoom !== newZoom) {
      globalObserver.publish("core.zoomEnd", { zoom: newZoom });
      currentZoom = newZoom;
    }
  });
}

function attachClickLockAndSnap(map, appModel) {
  // Add Snap Helper to the Map
  map.snapHelper = new SnapHelper(appModel);

  // Add the clickLock set. Its primary use is to disable infoclick action
  // when some other plugin (such as Draw or Measure) is active (in that case
  // we want the plugin to handle click - not to show infoclick).
  // It's easy to think that this is only needed if Infoclick plugin is active
  // in map config - but that is not the case:
  // A lot of plugins rely on the 'clickLock' property to exist on Map,
  // and to be a Set (we use .has()).
  // So, we create the Set no matter what:
  map.clickLock = new Set();
}

/**
 * Constructs the OL map, attaches all event handlers and background layers,
 * and stores the result on appModel.map.
 *
 * Side-effect order (must stay consistent with original createMap):
 *   new OLMap → attachZoomEndEvent → snapHelper → clickLock → infoclick handlers → background layers
 *
 * @param {object} appModel - The AppModel instance
 */
export function createMap(appModel) {
  const config = translateConfig(appModel);

  const interactionsOptions = buildInteractionsOptions(config.map);

  appModel.map = new OLMap({
    controls: [
      // new FullScreen({ target: document.getElementById("controls-column") }),
      // new Rotate({ target: document.getElementById("controls-column") }),
      // new MousePosition({
      //   target: document.querySelector("#root > div > footer")
      // }),
      // new OverviewMap({
      //   target: document.querySelector("#root > div > footer"),
      //   view: new View({
      //     projection: config.map.projection
      //   })
      // })
    ],
    interactions: defaultInteractions(interactionsOptions),
    layers: [],
    target: config.map.target,
    overlays: [],
    view: buildView(config.map),
  });

  attachZoomEndEvent(appModel.map, appModel.globalObserver);

  attachClickLockAndSnap(appModel.map, appModel);

  attachInfoclickHandlers(appModel, config);

  // Creation of non server background layers.
  const layerSwitcherConf = config.tools.find(
    (tool) => tool.type === "layerswitcher"
  );
  addConfiguredBackgroundLayers(appModel, layerSwitcherConf);
}
