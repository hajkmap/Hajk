import SearchModel from "./SearchModel";
import Plugin from "./Plugin.js";
import ConfigMapper from "./../utils/ConfigMapper.js";
import CoordinateSystemLoader from "./../utils/CoordinateSystemLoader.js";
import { isMobile } from "./../utils/IsMobile.js";
// import ArcGISLayer from "./layers/ArcGISLayer.js";
// import DataLayer from "./layers/DataLayer.js";
import WMSLayer from "./layers/WMSLayer.js";
import WMTSLayer from "./layers/WMTSLayer.js";
import WFSVectorLayer from "./layers/VectorLayer.js";
import { bindMapClickEvent } from "./Click.js";
import MapClickModel from "./MapClickModel";
import { defaults as defaultInteractions } from "ol/interaction";
import { Map, View } from "ol";
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
import { register } from "ol/proj/proj4";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Icon, Fill, Stroke, Style } from "ol/style.js";
import SnapHelper from "./SnapHelper";
import { hfetch } from "utils/FetchWrapper";

class AppModel {
  /**
   * Initialize new AddModel
   * @param object Config
   * @param Observer observer
   */
  constructor(settings) {
    const { config, globalObserver, refreshMUITheme } = settings;
    this.map = undefined;
    this.windows = [];
    this.plugins = {};
    this.activeTool = undefined;
    this.config = config;
    this.decorateConfig();
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    this.globalObserver = globalObserver;
    this.layersFromParams = [];
    this.cqlFiltersFromParams = {};
    register(this.coordinateSystemLoader.getProj4());
    this.hfetch = hfetch;
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

    this.map = new Map({
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

    const useNewInfoclick =
      config.tools.find((t) => t.type === "infoclick")?.options
        ?.useNewInfoclick === true;
    if (useNewInfoclick) {
      const mapClickModel = new MapClickModel(this.map, this.globalObserver);

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
      useNewInfoclick === false
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
            return ![
              "pluginSearchResults",
              "pluginSketch",
              "pluginVisionIntegration",
            ].includes(feature?.layer.get("name"));
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
    // FIXME: Use map instead?
    Object.keys(this.layers)
      .sort((a, b) => this.layers[a].drawOrder - this.layers[b].drawOrder)
      .map((sortedKey) => this.layers[sortedKey])
      .forEach((layer) => {
        if (this.layersFromParams.length > 0) {
          layer.visibleAtStart = this.layersFromParams.some(
            (layerId) => layerId === layer.id
          );
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
   * @param {*} urlSearchParams
   * @returns {*} a Result of overwriting a with values from b
   * @memberof AppModel
   */
  mergeConfig(mapConfig, urlSearchParams) {
    // clean is used to strip the UI of all elements so we get a super clean viewport back, without any plugins
    const clean =
      Boolean(urlSearchParams.hasOwnProperty("clean")) &&
      urlSearchParams.clean !== "false" &&
      urlSearchParams.clean !== "0";

    // f contains our CQL Filters
    const f = urlSearchParams.f;

    // Merge query params to the map config from JSON
    let x = parseFloat(urlSearchParams.x),
      y = parseFloat(urlSearchParams.y),
      z = parseInt(urlSearchParams.z, 10),
      l = undefined;
    if (typeof urlSearchParams.l === "string") {
      l = urlSearchParams.l.split(",");
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

    if (l) {
      this.layersFromParams = l;
    }

    if (f) {
      // Filters come as a URI encoded JSON object, so we must parse it first
      this.cqlFiltersFromParams = JSON.parse(decodeURIComponent(f));
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
      layers.wfslayers.forEach((l) => (l.type = "wfs"));
      layers.wmtslayers.forEach((l) => (l.type = "wmts"));
      layers.wfstlayers.forEach((l) => (l.type = "edit"));
      layers.vectorlayers.forEach((l) => (l.type = "vector"));
      layers.arcgislayers.forEach((l) => (l.type = "arcgis"));

      let allLayers = [
        ...layers.wmslayers,
        ...layers.wfslayers,
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

          // Look into the layersInfo array - it will contain sublayers. We must
          // expose each one of them as a WFS service.
          return layer.layersInfo.map((sl) => {
            return {
              id: sl.id,
              pid: layer.id, // Relevant for group layers: will hold the actual OL layer name, not only current sublayer
              caption: sl.caption,
              url: sl.searchUrl || layer.url,
              layers: [sl.id],
              searchFields:
                typeof sl.searchPropertyName === "string"
                  ? sl.searchPropertyName.split(",")
                  : [],
              infobox: sl.infobox || "",
              infoclickIcon: sl.infoclickIcon || "",
              aliasDict: "",
              displayFields:
                typeof sl.searchDisplayName === "string"
                  ? sl.searchDisplayName.split(",")
                  : [],
              secondaryLabelFields:
                typeof sl.secondaryLabelFields === "string"
                  ? sl.secondaryLabelFields.split(",")
                  : [],
              shortDisplayFields:
                typeof sl.searchShortDisplayName === "string"
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
      // from now on they're equal to our code.
      Array.isArray(wmslayers) && wfslayers.push(...wmslayers);

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

    return this.mergeConfig(
      this.config.mapConfig,
      Object.fromEntries(new URLSearchParams(document.location.search))
    );
  }
}

export default AppModel;
