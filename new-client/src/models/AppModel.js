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

var map;

class AppModel {
  registerWindowPlugin(windowComponent) {
    this.windows.push(windowComponent);
  }

  invokeCloseOnAllWindowPlugins() {
    this.windows.forEach(window => {
      window.closeWindow();
    });
  }

  onWindowOpen(currentWindow) {
    this.windows
      .filter(window => window !== currentWindow)
      .forEach(window => {
        if (window.position === currentWindow.position || isMobile) {
          window.closeWindow();
        }
      });
  }

  /**
   * Initialize new AddModel
   * @param object Config
   * @param Observer observer
   */
  constructor(config, globalObserver) {
    this.windows = [];
    this.plugins = {};
    this.activeTool = undefined;
    this.config = config;
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    this.globalObserver = globalObserver;
    this.layersFromParams = [];
    this.cqlFiltersFromParams = {};
    register(this.coordinateSystemLoader.getProj4());
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
   * A plugin may have the 'target' option. Currently we use three
   * targets: toolbar, left and right. Toolbar means it's a
   * plugin that will be visible in Drawer list. Left and right
   * are Widget plugins, that on large displays show on left/right
   * side of the map viewport, while on small screens change its
   * appearance and end up as Drawer list plugins too.
   *
   * This method filters out those plugins that should go into
   * the Drawer or Widget list and returns them.
   *
   * It is used in AppModel to initiate all plugins' Components,
   * so whatever is returned here will result in a render() for
   * that plugin. That is the reason why 'search' is filtered out
   * from the results: we render Search plugin separately in App,
   * and we don't want a second render invoked from here.
   *
   * @returns array of Plugins
   * @memberof AppModel
   */
  getBothDrawerAndWidgetPlugins() {
    const r = this.getPlugins()
      .filter(plugin => {
        return ["toolbar", "left", "right", "control"].includes(
          plugin.options.target
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return r;
  }

  getDrawerPlugins() {
    return this.getPlugins().filter(plugin => {
      return ["toolbar"].includes(plugin.options.target);
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
    var promises = [];
    plugins.forEach(plugin => {
      var prom = import(`../plugins/${plugin}/${plugin}.js`)
        .then(module => {
          const toolConfig =
            this.config.mapConfig.tools.find(
              plug => plug.type.toLowerCase() === plugin.toLowerCase()
            ) || {};

          const toolOptions =
            toolConfig && toolConfig.options ? toolConfig.options : {};

          const sortOrder = toolConfig.hasOwnProperty("index")
            ? Number(toolConfig.index)
            : 0;

          if (Object.keys(toolConfig).length > 0) {
            this.addPlugin(
              new Plugin({
                map: map,
                app: this,
                type: plugin,
                sortOrder: sortOrder,
                options: toolOptions,
                component: module.default
              })
            );
          }
        })
        .catch(err => {
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
    var config = this.translateConfig();
    map = new Map({
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
      interactions: defaultInteractions(),
      layers: [],
      target: config.map.target,
      overlays: [],
      view: new View({
        center: config.map.center,
        extent: config.map.extent.length > 0 ? config.map.extent : undefined, // backend will always write extent as an Array, so basic "config.map.extent || undefined" wouldn't work here
        constrainOnlyCenter: config.map.constrainOnlyCenter, // If true, the extent constraint will only apply to the view center and not the whole extent.
        constrainResolution: config.map.constrainResolution, // If true, the view will always animate to the closest zoom level after an interaction; false means intermediary zoom levels are allowed.
        maxZoom: config.map.maxZoom || 24,
        minZoom: config.map.minZoom || 0,
        projection: config.map.projection,
        resolutions: config.map.resolutions,
        units: "m",
        zoom: config.map.zoom
      })
    });
    setTimeout(() => {
      map.updateSize();
    }, 0);

    if (config.tools.some(tool => tool.type === "infoclick")) {
      bindMapClickEvent(map, mapClickDataResult => {
        this.globalObserver.publish("core.mapClick", mapClickDataResult);
      });
    }
    return this;
  }

  getMap() {
    return map;
  }

  clear() {
    this.clearing = true;
    this.highlight(false);
    map
      .getLayers()
      .getArray()
      .forEach(layer => {
        if (
          layer.getProperties &&
          layer.getProperties().layerInfo &&
          layer.getProperties().layerInfo.layerType === "layer"
        ) {
          if (layer.layerType === "group") {
            this.globalObserver.publish("layerswitcher.hideLayer", layer);
          } else {
            layer.setVisible(false);
          }
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
        map.addLayer(layerItem.layer);
        break;
      case "wmts":
        layerConfig = configMapper.mapWMTSConfig(layer, this.config);
        layerItem = new WMTSLayer(
          layerConfig.options,
          this.config.appConfig.proxy,
          map
        );
        map.addLayer(layerItem.layer);
        break;
      case "vector":
        layerConfig = configMapper.mapVectorConfig(layer);
        layerItem = new WFSVectorLayer(
          layerConfig.options,
          this.config.appConfig.proxy,
          map
        );
        map.addLayer(layerItem.layer);
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
    var matchedLayers = [];
    layers.forEach(layer => {
      const layerConfig = this.config.layersConfig.find(
        lookupLayer => lookupLayer.id === layer.id
      );
      layer.layerType = type;
      // Use the general value for infobox if not present in map config.
      if (layerConfig !== undefined && layerConfig.type === "vector") {
        if (!layer.infobox && layerConfig) {
          layer.infobox = layerConfig.infobox;
        }
      }
      matchedLayers.push({
        ...layerConfig,
        ...layer
      });
    });
    return matchedLayers;
  }

  expand(groups) {
    var result = [];
    groups.forEach(group => {
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
      ...this.lookup(this.expand(layerSwitcherConfig.options.groups), "layer")
    ];

    return layers;
  }

  addLayers() {
    const layerSwitcherConfig = this.config.mapConfig.tools.find(
        tool => tool.type === "layerswitcher"
      ),
      infoclickConfig = this.config.mapConfig.tools.find(
        t => t.type === "infoclick"
      );

    // Prepare layers
    this.layers = this.flattern(layerSwitcherConfig);
    Object.keys(this.layers)
      .sort((a, b) => this.layers[a].drawOrder - this.layers[b].drawOrder)
      .map(sortedKey => this.layers[sortedKey])
      .forEach(layer => {
        if (this.layersFromParams.length > 0) {
          layer.visibleAtStart = this.layersFromParams.some(
            layerId => layerId === layer.id
          );
        }
        layer.cqlFilter = this.cqlFiltersFromParams[layer.id] || null;
        this.addMapLayer(layer);
      });

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
      strokeColor.a
    ];
    const fillColorAsArray = fillColor && [
      fillColor.r,
      fillColor.g,
      fillColor.b,
      fillColor.a
    ];
    this.highlightSource = new VectorSource();
    this.highlightLayer = new VectorLayer({
      source: this.highlightSource,
      style: new Style({
        stroke: new Stroke({
          color: strokeColorAsArray || [200, 0, 0, 0.7],
          width: strokeWidth || 4
        }),
        fill: new Fill({
          color: fillColorAsArray || [255, 0, 0, 0.1]
        }),
        image: new Icon({
          anchor: [anchor[0] || 0.5, anchor[1] || 1],
          scale: scale || 0.15,
          src: src || "marker.png"
        })
      })
    });
    map.addLayer(this.highlightLayer);
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
          map.getView().setCenter(this.getCenter(geom.getExtent()));
        }
      }
    }
  }

  parseQueryParams() {
    var o = {};
    document.location.search
      .replace(/(^\?)/, "")
      .split("&")
      .forEach(param => {
        var a = param.split("=");
        o[a[0]] = a[1];
      });
    return o;
  }
  /**
   * @summary Merges two objects.
   *
   * @param {*} a
   * @param {*} b
   * @returns {*} a Result of overwritting a with values from b
   * @memberof AppModel
   */
  mergeConfig(a, b) {
    // clean is used to strip the UI of all elements so we get a super clean viewport back, without any plugins
    const clean =
      Boolean(b.hasOwnProperty("clean")) &&
      b.clean !== "false" &&
      b.clean !== "0";

    // f contains our CQL Filters
    const f = b.f;

    // Merge query params to the map config from JSON
    let x = parseFloat(b.x),
      y = parseFloat(b.y),
      z = parseInt(b.z, 10),
      l = undefined;
    if (typeof b.l === "string") {
      l = b.l.split(",");
    }

    if (Number.isNaN(x)) {
      x = a.map.center[0];
    }
    if (Number.isNaN(y)) {
      y = a.map.center[1];
    }
    if (Number.isNaN(z)) {
      z = a.map.zoom;
    }

    a.map.clean = clean;
    a.map.center[0] = x;
    a.map.center[1] = y;
    a.map.zoom = z;

    if (l) {
      this.layersFromParams = l;
    }

    if (f) {
      // Filters come as a URI encoded JSON object, so we must parse it first
      this.cqlFiltersFromParams = JSON.parse(decodeURIComponent(f));
    }

    // If 'v' query param is specified, it looks like we will want to search on load
    if (b.v !== undefined && b.v.length > 0) {
      a.map.searchOnStart = {
        v: this.returnStringOrUndefined(b.v), // Search Value (will NOT search on start if null)
        s: this.returnStringOrUndefined(b.s), // Search Service (will search in all, if null)
        t: this.returnStringOrUndefined(b.t) // Search Type (controls which search plugin is used, default search if null)
      };
    }

    return a;
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

  overrideGlobalSearchConfig(searchTool, data) {
    var configSpecificSearchLayers = searchTool.options.layers;
    var searchLayers = data.wfslayers.filter(layer => {
      if (configSpecificSearchLayers.find(x => x.id === layer.id)) {
        return layer;
      } else {
        return undefined;
      }
    });
    return searchLayers;
  }

  translateConfig() {
    if (
      this.config.mapConfig.hasOwnProperty("map") &&
      this.config.mapConfig.map.hasOwnProperty("title")
    ) {
      document.title = this.config.mapConfig.map.title; // TODO: add opt-out in admin to cancel this override behaviour.
    }

    const layerSwitcherTool = this.config.mapConfig.tools.find(tool => {
      return tool.type === "layerswitcher";
    });

    const searchTool = this.config.mapConfig.tools.find(tool => {
      return tool.type === "search";
    });

    const editTool = this.config.mapConfig.tools.find(tool => {
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

      layers.wmslayers.forEach(l => (l.type = "wms"));
      layers.wmtslayers.forEach(l => (l.type = "wmts"));
      layers.wfstlayers.forEach(l => (l.type = "edit"));
      layers.vectorlayers.forEach(l => (l.type = "vector"));
      layers.arcgislayers.forEach(l => (l.type = "arcgis"));

      let allLayers = [
        ...layers.wmslayers,
        ...layers.wmtslayers,
        ...layers.vectorlayers,
        ...layers.wfstlayers,
        ...layers.arcgislayers
      ];

      this.config.layersConfig = allLayers;
    }

    if (searchTool) {
      if (searchTool.options.layers === null) {
        searchTool.options.sources = layers.wfslayers;
      } else {
        if (
          searchTool.options.layers &&
          searchTool.options.layers.length !== 0
        ) {
          let wfslayers = this.overrideGlobalSearchConfig(searchTool, layers);
          searchTool.options.sources = wfslayers;
          layers.wfslayers = wfslayers;
        } else {
          searchTool.options.sources = layers.wfslayers;
        }
      }
    }

    if (editTool) {
      editTool.options.sources = layers.wfstlayers;
    }

    return this.mergeConfig(this.config.mapConfig, this.parseQueryParams());
  }
}

export default AppModel;
