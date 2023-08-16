import AnchorModel from "./AnchorModel";
import MapClickModel from "./MapClickModel";
import SearchModel from "./SearchModel";
import Plugin from "./Plugin";
import SnapHelper from "./SnapHelper";
import { bindMapClickEvent } from "./Click";

import ConfigMapper from "../utils/ConfigMapper";
import CoordinateSystemLoader from "../utils/CoordinateSystemLoader";
import { hfetch } from "../utils/FetchWrapper";
import { isMobile } from "../utils/IsMobile";
import { getMergedSearchAndHashParams } from "../utils/getMergedSearchAndHashParams";
// import ArcGISLayer from "./layers/ArcGISLayer.js";
// import DataLayer from "./layers/DataLayer.js";
import WMSLayer from "./layers/WMSLayer.js";
import WMTSLayer from "./layers/WMTSLayer.js";
import WFSVectorLayer from "./layers/VectorLayer.js";
// TODO: Uncomment and ensure they show as expected
// import {
// defaults as defaultControls,
// Attribution,
// Control,
// FullScreen, // TODO: Consider implementation
// MousePosition, // TODO: Consider implementation, perhaps in a separate plugin
// OverviewMap // TODO: Consider implementation
// Rotate,
// ScaleLine
// Zoom,
// ZoomSlider,
// ZoomToExtent
// } from "ol/control";

import { Map as OLMap, View } from "ol";
import { defaults as defaultInteractions } from "ol/interaction";
import { register } from "ol/proj/proj4";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Fill, Stroke, Style } from "ol/style";

class AppModel {
  /**
   * Initialize new AddModel
   * @param object Config
   * @param Observer observer
   */
  constructor(settings) {
    this.map = undefined;
    this.windows = [];
    this.plugins = {};
    this.activeTool = undefined;
    this.layersFromParams = [];
    this.groupLayersFromParams = [];
    this.cqlFiltersFromParams = {};
    this.hfetch = hfetch;
    this.pluginHistory = new Map();

    // We store the click location data here for later use.
    // Right now this is only used in the new infoClick but it will most likely be used in other parts of the program.
    // Not optimal...
    this.clickLocationData = {
      x: 0,
      y: 0,
      zoom: 0,
    };
  }

  init(settings) {
    // Lets prevent multiple instances...
    if (this.initialized)
      throw new Error("You should only initialize AppModel once!");

    this.initialized = true;

    const { config, globalObserver, refreshMUITheme } = settings;

    this.config = config;
    this.decorateConfig();
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    this.globalObserver = globalObserver;
    register(this.coordinateSystemLoader.getProj4());
    this.refreshMUITheme = refreshMUITheme;
  }

  decorateConfig() {
    // .allResolutions should be used when creating layers etc
    // It will also be used in the print plugin to be able to print in higher resolutions.
    this.config.mapConfig.map.allResolutions = [
      ...this.config.mapConfig.map.resolutions,
      ...(this.config.mapConfig.map.extraPrintResolutions ?? []),
    ];
  }

  registerWindowPlugin(windowComponent) {
    this.windows.push(windowComponent);
  }

  invokeCloseOnAllWindowPlugins() {
    this.windows.forEach((window) => {
      window.closeWindow();
    });
  }

  onWindowOpen(currentWindow) {
    this.windows
      .filter((window) => window !== currentWindow)
      .forEach((window) => {
        if (window.position === currentWindow.position || isMobile) {
          window.closeWindow();
        }
      });
  }

  pushPluginIntoHistory(plugin) {
    // plugin is an object that will contain a 'type' as well as some
    // other properties. We use the 'type' as a unique key in our Map.
    const { type, ...rest } = plugin;
    // If plugin already exists in set…
    if (this.pluginHistory.has(type)) {
      // …remove it first so that we don't have duplicates.
      this.pluginHistory.delete(type);
    }
    this.pluginHistory.set(type, rest);

    // Finally, announce to everyone who cares
    this.globalObserver.publish(
      "core.pluginHistoryChanged",
      this.pluginHistory
    );
  }

  getClickLocationData() {
    return this.clickLocationData;
  }

  setClickLocationData(x, y, zoom) {
    this.clickLocationData = {
      x: x,
      y: y,
      zoom: zoom,
    };
  }

  /**
   * Add plugin to this tools property of loaded plugins.
   * @internal
   */
  addPlugin(plugin) {
    this.plugins[plugin.type] = plugin;
  }

  /**
   * Get loaded plugins
   * @returns Array<Plugin>
   */
  getPlugins() {
    return Object.keys(this.plugins).reduce((v, key) => {
      return [...v, this.plugins[key]];
    }, []);
  }

  /**
   * @summary Helper used by getBothDrawerAndWidgetPlugins(), checks
   * that the supplied parameter has one of the valid "target" values.
   *
   * @param {string} t Target to be tested
   * @returns {boolean}
   */
  #validPluginTarget = (t) => {
    // FIXME: Why is "hidden" included in this list, anyone?
    return ["toolbar", "left", "right", "control", "hidden"].includes(t);
  };

  /**
   * A plugin may have the 'target' option. Currently we use four
   * targets: toolbar, control, left and right. Toolbar means it's a
   * plugin that will be visible in Drawer list. Left and right
   * are Widget plugins, that on large displays show on left/right
   * side of the map viewport, while on small screens change its
   * appearance and end up as Drawer list plugins too. Control buttons
   * are displayed in the same area as map controls, e.g. zoom buttons.
   *
   * This method filters out those plugins that should go into
   * the Drawer, Widget or Control list and returns them.
   *
   * It is used in AppModel to initiate all plugins' Components,
   * so whatever is returned here will result in a render() for
   * that plugin.
   *
   * @returns array of Plugins
   * @memberof AppModel
   */
  getBothDrawerAndWidgetPlugins() {
    const r = this.getPlugins()
      .filter((plugin) => {
        return (
          // If "options" is an Array (of plugin entities) we must
          // look for the "target" property inside that array. As soon
          // as one of the entities has a valid "target" value, we
          // consider the entire plugin to be valid and included in this list.
          plugin.options.some?.((p) => this.#validPluginTarget(p.target)) ||
          // If "options" isn't an array, we can grab the "target" directly.
          this.#validPluginTarget(plugin.options.target)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return r;
  }

  getDrawerPlugins() {
    return this.getPlugins().filter((plugin) => {
      return ["toolbar"].includes(plugin.options.target);
    });
  }

  /**
   * @summary Return all plugins that might render in Drawer.
   *
   * @description There reason this functions exists is that we must
   * have a way to determine whether the Drawer toggle button should be
   * rendered. It's not as easy as checking for Drawer plugins only (i.e.
   * those with target=toolbar) - this simple logic gets complicated by
   * the fact that Widget plugins (target=left|right) also render Drawer
   * buttons on small screens.
   */
  getPluginsThatMightRenderInDrawer() {
    return this.getPlugins().filter((plugin) => {
      return ["toolbar", "left", "right"].includes(plugin.options.target);
    });
  }

  /**
   * Dynamically load plugins from the configured plugins folder.
   * Assumed that a folder exists with the same name as the requested plugin.
   * There must also be a file present with the same name as well.
   * @param {Array} - List of plugins to be loaded.
   * @returns {Array} - List of promises to be resolved for.
   */
  loadPlugins(plugins) {
    const promises = [];
    plugins.forEach((plugin) => {
      const dir = ["Search"].includes(plugin) ? "components" : "plugins";
      const prom = import(`../${dir}/${plugin}/${plugin}.js`)
        .then((module) => {
          const toolConfig =
            this.config.mapConfig.tools.find(
              (plug) => plug.type.toLowerCase() === plugin.toLowerCase()
            ) || {};

          const toolOptions =
            toolConfig && toolConfig.options ? toolConfig.options : {};

          const sortOrder = toolConfig.hasOwnProperty("index")
            ? Number(toolConfig.index)
            : 0;

          if (Object.keys(toolConfig).length > 0) {
            this.addPlugin(
              new Plugin({
                map: this.map,
                app: this,
                type: plugin.toLowerCase(),
                searchInterface: {},
                sortOrder: sortOrder,
                options: toolOptions,
                component: module.default,
              })
            );
          }
        })
        .catch((err) => {
          console.error(err);
        });
      promises.push(prom);
    });
    return promises;
  }

  /**
   * Initialize open layers map
   * @return {ol.Map} map
   */
  createMap() {
    const config = this.translateConfig();

    // Prepare OL interactions options, refer to https://openlayers.org/en/latest/apidoc/module-ol_interaction.html#.defaults.
    // We use conditional properties to ensure that only existing keys are set. The rest
    // will fallback to defaults from OL. (The entire interactionsOptions object, as well as all its properties are optional
    // according to OL documentation, so there's no need to set stuff that won't be needed.)
    const interactionsOptions = {
      ...(config.map.hasOwnProperty("altShiftDragRotate") && {
        altShiftDragRotate: config.map.altShiftDragRotate,
      }),
      ...(config.map.hasOwnProperty("onFocusOnly") && {
        onFocusOnly: config.map.onFocusOnly,
      }),
      ...(config.map.hasOwnProperty("doubleClickZoom") && {
        doubleClickZoom: config.map.doubleClickZoom,
      }),
      ...(config.map.hasOwnProperty("keyboard") && {
        keyboard: config.map.keyboard,
      }),
      ...(config.map.hasOwnProperty("mouseWheelZoom") && {
        mouseWheelZoom: config.map.mouseWheelZoom,
      }),
      ...(config.map.hasOwnProperty("shiftDragZoom") && {
        shiftDragZoom: config.map.shiftDragZoom,
      }),
      ...(config.map.hasOwnProperty("dragPan") && {
        dragPan: config.map.dragPan,
      }),
      ...(config.map.hasOwnProperty("pinchRotate") && {
        pinchRotate: config.map.pinchRotate,
      }),
      ...(config.map.hasOwnProperty("pinchZoom") && {
        pinchZoom: config.map.pinchZoom,
      }),
      ...(!Number.isNaN(Number.parseInt(config.map.zoomDelta)) && {
        zoomDelta: config.map.zoomDelta,
      }),
      ...(!Number.isNaN(Number.parseInt(config.map.zoomDuration)) && {
        zoomDuration: config.map.zoomDuration,
      }),
    };

    this.map = new OLMap({
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
      view: new View({
        center: config.map.center,
        extent: config.map.extent.length > 0 ? config.map.extent : undefined, // backend will always write extent as an Array, so basic "config.map.extent || undefined" wouldn't work here
        constrainOnlyCenter: config.map.constrainOnlyCenter, // If true, the extent constraint will only apply to the view center and not the whole extent.
        constrainResolution:
          isMobile && config.map.constrainResolutionMobile !== undefined
            ? config.map.constrainResolutionMobile
            : config.map.constrainResolution, // If true, the view will always animate to the closest zoom level after an interaction; false means intermediary zoom levels are allowed.
        maxZoom: config.map.maxZoom || 24,
        minZoom: config.map.minZoom || 0,
        projection: config.map.projection,
        resolutions: config.map.resolutions,
        units: "m",
        zoom: config.map.zoom,
      }),
    });

    // Create throttled zoomEnd event
    let currentZoom = this.map.getView().getZoom();

    this.map.on("moveend", (e) => {
      // using moveend to create a throttled zoomEnd event
      // instead of using change:resolution to minimize events being fired.
      const newZoom = this.map.getView().getZoom();
      if (currentZoom !== newZoom) {
        this.globalObserver.publish("core.zoomEnd", { zoom: newZoom });
        currentZoom = newZoom;
      }
    });

    // Add Snap Helper to the Map
    this.map.snapHelper = new SnapHelper(this);

    // Add the clickLock set. Its primary use is to disable infoclick action
    // when some other plugin (such as Draw or Measure) is active (in that case
    // we want the plugin to handle click - not to show infoclick).
    // It's easy to think that this is only needed if Infoclick plugin is active
    // in map config - but that is not the case:
    // A lot of plugins rely on the 'clickLock' property to exist on Map,
    // and to be a Set (we use .has()).
    // So, we create the Set no matter what:
    this.map.clickLock = new Set();

    const infoclickOptions = config.tools.find(
      (t) => t.type === "infoclick"
    )?.options;
    if (infoclickOptions?.useNewInfoclick === true) {
      const mapClickModel = new MapClickModel(
        this.map,
        this.globalObserver,
        infoclickOptions
      );

      mapClickModel.bindMapClick((featureCollections) => {
        const featureCollectionsToBeHandledByMapClickViewer =
          featureCollections.filter((fc) => fc.type !== "SearchResults");

        // Publish the retrived collections, even if they're empty. We want the
        // handling components to know, so they can act accordingly (e.g. close
        // window if no features are to be shown).
        this.globalObserver.publish(
          "mapClick.featureCollections",
          featureCollectionsToBeHandledByMapClickViewer
        );

        // Next, handle search results features.
        // Check if we've got any features from the search layer,
        // and if we do, announce it to the search component so it can
        // show relevant feature in the search results list.
        const searchResultFeatures = featureCollections.find(
          (c) => c.type === "SearchResults"
        )?.features;

        if (searchResultFeatures?.length > 0) {
          this.globalObserver.publish(
            "infoClick.searchResultLayerClick",
            searchResultFeatures // Clicked features sent to the search-component for display
          );
        }
      });
    }

    // FIXME: Potential miss here: don't we want to register click on search results
    // But we register the Infoclick handler only if the plugin exists in map config:
    // even if Infoclick plugin is inactive? Currently search won't register clicks in
    // map without infoclick, which seems as an unnecessary limitation.
    if (
      config.tools.some((tool) => tool.type === "infoclick") &&
      infoclickOptions?.useNewInfoclick !== true
    ) {
      bindMapClickEvent(this.map, (mapClickDataResult) => {
        // We have to separate features coming from the searchResult-layer
        // from the rest, since we want to render this information in the
        // search-component rather than in the featureInfo-component.
        const searchResultFeatures = mapClickDataResult.features.filter(
          (feature) => {
            return feature?.layer.get("name") === "pluginSearchResults";
          }
        );
        const infoclickFeatures = mapClickDataResult.features.filter(
          (feature) => {
            return feature?.layer.get("name") !== "pluginSearchResults";
          }
        );

        // If there are any results from search layer, send an event about that.
        if (searchResultFeatures.length > 0) {
          this.globalObserver.publish(
            "infoClick.searchResultLayerClick",
            searchResultFeatures // Clicked features sent to the search-component for display
          );
        }

        // Do the same for regular infoclick results from WMS layers
        if (infoclickFeatures.length > 0) {
          // Note that infoclick.mapClick seems to have a different interface…
          this.globalObserver.publish("infoClick.mapClick", {
            ...mapClickDataResult, // as it requires the entire object, not just "features", like infoClick.searchResultLayerClick.
            features: infoclickFeatures, // Hence, we send everything from mapClickDataResult, but replace the features property.
          });
        }
      });
    }
    return this;
  }

  getMap() {
    return this.map;
  }

  addSearchModel() {
    // TODO: Move configuration somewhere else, shouldn't be plugin-dependent.

    // See if Search is configured in map config
    const searchConfigIndex = this.config.mapConfig.tools.findIndex(
      (t) => t.type === "search"
    );

    // If it is, go on and add the search model to App model
    if (searchConfigIndex !== -1) {
      this.searchModel = new SearchModel(
        this.config.mapConfig.tools[searchConfigIndex].options,
        this.getMap(),
        this
      );
    }

    // Either way, return self, so we can go on and chain more methods on App model
    return this;
  }

  addAnchorModel() {
    this.anchorModel = new AnchorModel({
      app: this,
      globalObserver: this.globalObserver,
      map: this.map,
    });

    // Either way, return self, so we can go on and chain more methods on App model
    return this;
  }

  clear() {
    this.clearing = true;
    this.highlight(false);
    this.map
      .getAllLayers()
      .filter(
        (l) =>
          l.getVisible() === true &&
          ["layer", "group"].includes(l.get("layerType"))
      )
      .forEach((l) => {
        l.setVisible(false);
        if (l.get("layerType") === "group") {
          this.globalObserver.publish("layerswitcher.hideLayer", l);
        }
      });
    setTimeout(() => {
      this.clearing = false;
    }, 100);
  }

  addMapLayer(layer) {
    const configMapper = new ConfigMapper(this.config.appConfig.proxy);
    let layerItem, layerConfig;
    switch (layer.type) {
      case "wms":
        layerConfig = configMapper.mapWMSConfig(layer, this.config);
        layerItem = new WMSLayer(
          layerConfig.options,
          this.config.appConfig.proxy,
          this.globalObserver
        );
        this.map.addLayer(layerItem.layer);
        break;
      case "wmts":
        layerConfig = configMapper.mapWMTSConfig(layer, this.config);
        layerItem = new WMTSLayer(
          layerConfig.options,
          this.config.appConfig.proxy,
          this.map
        );
        this.map.addLayer(layerItem.layer);
        break;
      case "vector":
        layerConfig = configMapper.mapVectorConfig(layer);
        layerItem = new WFSVectorLayer(
          layerConfig.options,
          this.config.appConfig.proxy,
          this.map
        );
        this.map.addLayer(layerItem.layer);
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

  lookup(layers, type) {
    const matchedLayers = [];
    layers.forEach((layer) => {
      const layerConfig = this.config.layersConfig.find(
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

  expand(groups) {
    var result = [];
    groups.forEach((group) => {
      result = [...result, ...group.layers];
      if (group.groups) {
        result = [...result, ...this.expand(group.groups)];
      }
    });
    return result;
  }

  flattern(layerSwitcherConfig) {
    const layers = [
      ...this.lookup(layerSwitcherConfig.options.baselayers, "base"),
      ...this.lookup(this.expand(layerSwitcherConfig.options.groups), "layer"),
    ];

    return layers;
  }

  addLayers() {
    const layerSwitcherConfig = this.config.mapConfig.tools.find(
        (tool) => tool.type === "layerswitcher"
      ),
      infoclickConfig = this.config.mapConfig.tools.find(
        (t) => t.type === "infoclick"
      );

    // Prepare layers
    this.layers = this.flattern(layerSwitcherConfig);
    // Loop the layers and add each of them to the map
    this.layers.forEach((layer) => {
      if (this.layersFromParams.length > 0) {
        // Override the default visibleAtStart if a value was provided in URLSearchParams
        layer.visibleAtStart = this.layersFromParams.some(
          (layerId) => layerId === layer.id
        );

        // groupLayersFromParams is an object where keys are layer IDs and values are
        // the sublayers that should be active for this given layer. A layer's key will
        // only exist in groupLayersFromParams if there is a subset of sublayers to be shown
        // at start (default behavior is to turn on all sublayers).
        layer.visibleAtStartSubLayers = Object.hasOwn(
          this.groupLayersFromParams,
          layer.id
        )
          ? this.groupLayersFromParams[layer.id]?.split(",")
          : [];
      }
      layer.cqlFilter = this.cqlFiltersFromParams[layer.id] || null;
      this.addMapLayer(layer);
    });

    // FIXME: Move to infoClick instead. All other plugins create their own layers.
    if (infoclickConfig !== undefined) {
      this.addHighlightLayer(infoclickConfig.options);
    }

    return this;
  }

  addHighlightLayer(options) {
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
    this.highlightSource = new VectorSource();
    this.highlightLayer = new VectorLayer({
      caption: "Infoclick layer",
      name: "pluginInfoclick",
      layerType: "system",
      zIndex: 5001, // System layer's zIndex start at 5000, ensure click is above
      source: this.highlightSource,
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
    this.map.addLayer(this.highlightLayer);
  }

  getCenter(e) {
    return [e[0] + Math.abs(e[2] - e[0]) / 2, e[1] + Math.abs(e[3] - e[1]) / 2];
  }

  highlight(feature) {
    if (this.highlightSource) {
      this.highlightSource.clear();
      if (feature) {
        this.highlightSource.addFeature(feature);
        if (window.innerWidth < 600) {
          let geom = feature.getGeometry();
          if (geom) {
            this.map.getView().setCenter(this.getCenter(geom.getExtent()));
          }
        }
      }
    }
  }

  /**
   * @summary Merges two objects.
   *
   * @param {*} mapConfig
   * @param {*} paramsAsPlainObject
   * @returns {*} a Result of overwriting a with values from b
   * @memberof AppModel
   */
  mergeConfigWithValuesFromParams(mapConfig, paramsAsPlainObject) {
    // clean is used to strip the UI of all elements so we get a super clean viewport back, without any plugins
    const clean =
      Boolean(paramsAsPlainObject.hasOwnProperty("clean")) &&
      paramsAsPlainObject.clean !== "false" &&
      paramsAsPlainObject.clean !== "0";

    // Merge query params to the map config from JSON
    let x = parseFloat(paramsAsPlainObject.x),
      y = parseFloat(paramsAsPlainObject.y),
      z = parseInt(paramsAsPlainObject.z, 10);

    if (typeof paramsAsPlainObject.l === "string") {
      this.layersFromParams = paramsAsPlainObject.l.split(",");
    }

    if (typeof paramsAsPlainObject.gl === "string") {
      try {
        this.groupLayersFromParams = JSON.parse(paramsAsPlainObject.gl);
      } catch (error) {
        console.error(
          "Couldn't parse the group layers parameter. Attempted with this value:",
          paramsAsPlainObject.gl
        );
      }
    }

    if (Number.isNaN(x)) {
      x = mapConfig.map.center[0];
    }
    if (Number.isNaN(y)) {
      y = mapConfig.map.center[1];
    }
    if (Number.isNaN(z)) {
      z = mapConfig.map.zoom;
    }

    mapConfig.map.clean = clean;
    mapConfig.map.center[0] = x;
    mapConfig.map.center[1] = y;
    mapConfig.map.zoom = z;

    // f contains our CQL Filters
    const f = paramsAsPlainObject.f;
    if (f) {
      // Filters come as a URI encoded JSON object, so we must parse it first
      this.cqlFiltersFromParams = JSON.parse(decodeURIComponent(f));
    }

    // If the 'p' param exists, we want to modify which plugins are visible at start
    const pluginsToShow = paramsAsPlainObject?.p?.split(",");
    if (pluginsToShow) {
      // If the value of 'p' is an empty string, it means that no plugin should be shown at start
      if (pluginsToShow.length === 1 && pluginsToShow[0] === "") {
        mapConfig.tools.forEach((t) => {
          t.options.visibleAtStart = false;
        });
      }
      // If 'p' exists but is not an empty string, we have a list of plugins that should be
      // shown at start. All others should be hidden (no matter the setting in Admin).
      else {
        mapConfig.tools.forEach((t) => {
          t.options.visibleAtStart = pluginsToShow.includes(t.type);
        });
      }
    }

    // If enableAppStateInHash exists in params, let's override
    // the corresponding setting from map config. This allows users
    // to activate live hash params (#1252).
    const enableAppStateInHash = Object.hasOwn(
      paramsAsPlainObject,
      "enableAppStateInHash"
    );
    if (enableAppStateInHash) {
      console.info("Activating live updating of query parameters");
      mapConfig.map.enableAppStateInHash = true;
    }

    return mapConfig;
  }
  /**
   * @summary If supplied argument, v, is a string and is longer then 0, return an encoded value of v. Else return undefined.
   *
   * @param {*} v
   * @returns
   * @memberof AppModel
   */
  returnStringOrUndefined(v) {
    return typeof v === "string" && v.trim().length > 0 ? v : undefined;
  }

  overrideGlobalSearchConfig(searchTool, wfslayers) {
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

  overrideGlobalEditConfig(editTool, wfstlayers) {
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

  translateConfig() {
    if (
      this.config.mapConfig.hasOwnProperty("map") &&
      this.config.mapConfig.map.hasOwnProperty("title")
    ) {
      document.title = this.config.mapConfig.map.title; // TODO: add opt-out in admin to cancel this override behaviour.
    }

    const layerSwitcherTool = this.config.mapConfig.tools.find((tool) => {
      return tool.type === "layerswitcher";
    });

    const searchTool = this.config.mapConfig.tools.find((tool) => {
      return tool.type === "search";
    });

    const editTool = this.config.mapConfig.tools.find((tool) => {
      return tool.type === "edit";
    });

    let layers = {};

    if (layerSwitcherTool) {
      layers.wmslayers = this.config.layersConfig.wmslayers || [];
      layers.wfslayers = this.config.layersConfig.wfslayers || [];
      layers.wfstlayers = this.config.layersConfig.wfstlayers || [];
      layers.wmtslayers = this.config.layersConfig.wmtslayers || [];
      layers.vectorlayers = this.config.layersConfig.vectorlayers || [];
      layers.arcgislayers = this.config.layersConfig.arcgislayers || [];

      layers.wmslayers.forEach((l) => (l.type = "wms"));
      layers.wmtslayers.forEach((l) => (l.type = "wmts"));
      layers.wfstlayers.forEach((l) => (l.type = "edit"));
      layers.vectorlayers.forEach((l) => (l.type = "vector"));
      layers.arcgislayers.forEach((l) => (l.type = "arcgis"));

      let allLayers = [
        ...layers.wmslayers,
        ...layers.wmtslayers,
        ...layers.vectorlayers,
        ...layers.wfstlayers,
        ...layers.arcgislayers,
      ];

      this.config.layersConfig = allLayers;
    }

    if (searchTool) {
      // Take a look at all available wfslayers in layers repository,
      // but let the search tool only see those that are specified in searchTool.options
      const wfslayers = this.overrideGlobalSearchConfig(
        searchTool,
        layers.wfslayers
      );

      // See if admin wants to expose any WMS layers. selectedSources will
      // in that case be an array that will hold the IDs of corresponding layers
      // (that can be found in our layers.wmslayers array). In there, a properly
      // configured WMS layer that is to be searchable will have certain search-related
      // settings active (such as name of the geometry column or URL to the WFS service).
      const wmslayers = searchTool.options.selectedSources?.flatMap(
        (wmslayerId) => {
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
        }
      );

      // Spread the WMS search layers onto the array with WFS search sources,
      // from now on they're equal to our code. Before spreading, let's filter
      // the wmslayers so we get rid of potential undefined values (see #1206).
      Array.isArray(wmslayers) && wfslayers.push(...wmslayers.filter(Boolean));

      searchTool.options.sources = wfslayers;
    }

    // This is for backwards compatibility prior to adding locking WFST edit layers with AD.
    // This code handles if activeServices does not have an object with "id", "visibleForGroups"
    if (editTool) {
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

          let wfstlayers = this.overrideGlobalEditConfig(
            editTool,
            layers.wfstlayers
          );
          editTool.options.sources = wfstlayers;
          layers.wfstlayers = wfstlayers;
        } else {
          editTool.options.sources = [];
        }
      }
    }

    return this.mergeConfigWithValuesFromParams(
      this.config.mapConfig,
      Object.fromEntries(getMergedSearchAndHashParams())
    );
  }

  /**
   * @param {string} layers: Comma-separated list of layers to be shown
   * @param {string} groupLayers: A stringified JSON object specifing sublayer
   * visibility. E.g. "{"1242"%3A"name_of_sublayer_a, name_of_sublayer_b"}".
   */
  setLayerVisibilityFromParams(layers = null, groupLayers = "{}") {
    // Grab the wanted values from params
    const l = layers;
    const gl = groupLayers ?? "{}"; // Default to a stringified empty object, as that's what we'll compare against

    // Find out what's currently visible
    const visibleLayers = this.anchorModel.getVisibleLayers();
    const partlyToggledGroupLayers =
      this.anchorModel.getPartlyToggledGroupLayers();

    // Compare these two
    if (
      l === visibleLayers &&
      JSON.stringify(partlyToggledGroupLayers) === gl
    ) {
      // console.log("No changes");
    } else {
      // It's easier to work on the values if we parse them first
      const wantedL = l.split(",");
      const wantedGl = JSON.parse(gl);
      const currentL = visibleLayers.split(",");
      const currentGl = partlyToggledGroupLayers; // This is already an object, no need to parse

      // Get what should be shown
      const lToShow = wantedL.filter((a) => !currentL.includes(a));

      // Get what should be hidden
      const lToHide = currentL.filter((a) => !wantedL.includes(a));

      // Act!
      lToShow.forEach((layer) => {
        // Grab the corresponding OL layer from Map
        const olLayer = this.map
          .getAllLayers()
          .find((l) => l.get("name") === layer);

        // First, ensure that we had a match. It is possible that pretty much
        // anything shows up as layer id here (as it can come from multiple sources)
        // and we can't assume that the requested layer actually exists in current
        // map's config. In order to prevent a silent failure (see #1305), this check is added.
        if (olLayer === undefined) {
          console.warn(
            `Attempt to show layer with id ${layer} failed: layer not found in current map`
          );
        }
        // If it's a group layer we can use the 'layerswitcher.showLayer' event
        // that each group layer listens to.
        else if (olLayer.get("layerType") === "group") {
          // We can publish the 'layerswitcher.showLayer' event with two different
          // sets of parameters, depending on whether the group layer has all
          // sublayers selected, or only a subset.

          // If only a subset is selected, we will find the sublayers in our 'wantedGl' object.
          // Anything else than 'undefined' here means that we want to publish
          // the showLayer event and supply the sub-selection of sublayers too.
          if (wantedGl[layer]) {
            // In addition, this looks like a group layer that has
            // its sublayers specified and we should take care of that too
            this.globalObserver.publish("layerswitcher.showLayer", {
              layer: olLayer,
              subLayersToShow: wantedGl[layer]?.split(","),
            });
          }
          // On the other hand, if the layer to be shown does not exist in 'wantedGl',
          // it means that we should show ALL the sublayers.
          // For that we must publish the event slightly differently. (Also, see
          // where we subscribe to layerswitcher.showLayer for further understanding.)
          else {
            this.globalObserver.publish("layerswitcher.showLayer", olLayer);
          }
        }
        // That's it for group layer. The other layers, the "normal"
        // ones, are easier: just show them.
        else {
          // Each layer has a listener that will take care of toggling
          // the checkbox in LayerSwitcher.
          olLayer.setVisible(true);
        }
      });

      // Next, let's take care of layers that should be hidden.
      lToHide.forEach((layer) => {
        const olLayer = this.map
          .getAllLayers()
          .find((l) => l.get("name") === layer);

        if (olLayer === undefined) {
          console.warn(
            `Attempt to hide layer with id ${layer} failed: layer not found in current map`
          );
        } else if (olLayer.get("layerType") === "group") {
          // Tell the LayerSwitcher about it
          this.globalObserver.publish("layerswitcher.hideLayer", olLayer);
        } else {
          olLayer.setVisible(false);
        }
      });

      // One more special case must be taken care of. lToShow and lToHide can be empty
      // if user toggled only a sublayer WITHIN a group layer. In that case we
      // won't need to change visibility for any OL layers, but we must still fix the group
      // layer's components' visibility.
      // We start by looping the wantedGl and comparing to currentGl.
      for (const key of Object.keys(wantedGl)) {
        // If the currently visible groups object has the layer's key…
        // …and it's value differs from the wantedGl's corresponding value…
        if (Object.hasOwn(currentGl, key) && currentGl[key] !== wantedGl[key]) {
          const olLayer = this.map
            .getAllLayers()
            .find((l) => l.get("name") === key);
          this.globalObserver.publish("layerswitcher.showLayer", {
            layer: olLayer,
            subLayersToShow: wantedGl[key]?.split(","),
          });
        }
      }

      // Super-special case:
      // If a partly-toggled group layer becomes fully toggled it will
      // not show up as a diff in wanted vs current layers. Neither will
      // we see anything in 'wantedGl' (it will be empty, as that's what we
      // expect for fully toggled group layers [no sub-selection]).
      // So what can we do?
      // One solution is to loop through our visible layers (again). Any of them
      // that are of type 'groupLayer', and where a wantedGl key is missing should
      // be toggled on completely.
      wantedL.forEach((layer) => {
        const olLayer = this.map
          .getAllLayers()
          .find(
            (l) => l.get("name") === layer && l.get("layerType") === "group"
          );

        if (olLayer !== undefined) {
          // Determine how we should call the layerswitcher.showLayer event.
          // A: No sublayers specified for layer in 'wantedGl'. That means show ALL sublayers.
          // B: Sublayers found in 'wantedGl'. Set visibility accordingly.
          const param =
            wantedGl[layer] === undefined
              ? olLayer
              : {
                  layer: olLayer,
                  subLayersToShow: wantedGl[layer]?.split(","),
                };
          this.globalObserver.publish("layerswitcher.showLayer", param);
        }
      });
    }
  }
}

/* eslint import/no-anonymous-default-export: [2, {"allowNew": true}] */
export default new AppModel();
