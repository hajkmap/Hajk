import Error from "./Error.js";
import Plugin from "./Plugin.js";
import Drag from "./Drag.js";
import ConfigMapper from "./ConfigMapper.js";
import { configureCss } from "./../utils/CSSModifier.js";
import CoordinateSystemLoader from "./../utils/CoordinateSystemLoader.js";

// import ArcGISLayer from "./layers/ArcGISLayer.js";
// import DataLayer from "./layers/DataLayer.js";
// import ExtendedWMSLayer from "./layers/ExtendedWMSLayer.js";
import WMSLayer from "./layers/WMSLayer.js";
import WMTSLayer from "./layers/WMTSLayer.js";
import WFSLayer from "./layers/WFSLayer.js";

import interaction from "ol/interaction";
import proj from "ol/proj";
import Map from "ol/map";
import View from "ol/view";
import Zoom from "ol/control/zoom";
import Attribution from "ol/control/attribution";
import Rotate from "ol/control/rotate";
import ScaleLine from "ol/control/scaleline";
import Overlay from "ol/overlay";

const pluginsFolder = "plugins";
var map;

class AppModel {
  constructor(config) {
    this.plugins = {};
    this.activeTool = undefined;
    this.config = config;
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    proj.setProj4(this.coordinateSystemLoader.getProj4());
  }

  addPlugin(plugin) {
    this.plugins[plugin.type] = plugin;
  }

  togglePlugin(type) {
    if (this.activeTool !== undefined) {
      if (this.activeTool === type) {
        if (this.plugins[this.activeTool].isOpen()) {
          this.plugins[this.activeTool].minimize();
        } else {
          this.plugins[this.activeTool].open();
        }
      } else {
        this.plugins[this.activeTool].close();
        this.activeTool = type;
        this.plugins[this.activeTool].open();
      }
    } else {
      this.activeTool = type;
      this.plugins[this.activeTool].open();
    }
  }

  getPlugins() {
    return this.plugins;
  }

  getToolbarPlugins() {
    return Object.keys(this.plugins).reduce((v, key) => {
      if (this.plugins[key].target === "toolbar") {
        v = [...v, this.plugins[key]];
      }
      return v;
    }, []);
  }

  loadPlugins(plugins, callback) {
    if (undefined !== map) {
      let promises = [];
      plugins.forEach(plugin => {
        promises = [
          ...promises,
          import(`../${pluginsFolder}/${plugin}/view.js`)
            .then(module => {
              this.addPlugin(
                new Plugin({
                  map: map,
                  app: this,
                  type: plugin,
                  target: "toolbar",
                  component: module.default
                })
              );
              callback();
            })
            .catch(err => {
              console.error(err);
            })
        ];
      });
      return promises;
    } else {
      throw new Error("Initialize map before loading plugins.");
    }
  }

  /**
   * Configure application.
   * @return undefined
   */
  configureApplication() {
    configureCss(this.config.mapConfig);
    return this;
  }

  /**
   * Initialize open layers map
   * @param {string} target Target div
   * @return {ol.Map} map
   */
  createMap(target) {
    var config = this.translateConfig();
    map = new Map({
      interactions: interaction.defaults().extend([new Drag()]),
      target: config.map.target,
      layers: [],
      logo: false,
      pil: false,
      controls: [
        new Zoom({
          zoomInTipLabel: "Zooma in",
          zoomOutTipLabel: "Zooma ut"
        }),
        new Attribution({ collapsible: false }),
        new Rotate({ tipLabel: "Återställ rotation" }),
        new ScaleLine({
          target: "map-scale-bar"
        })
      ],
      overlays: [],
      view: new View({
        zoom: config.map.zoom,
        units: "m",
        resolutions: config.map.resolutions,
        center: config.map.center,
        projection: proj.get(config.map.projection),
        extent: config.map.length !== 0 ? config.map.extent : undefined
      })
    });
    //TODO: Fix better popups.
    //map.addOverlay(this.createPopupOverlay());
    return this;
  }

  getMap() {
    return map;
  }

  addMapLayer(layer) {
    const configMapper = new ConfigMapper(this.config.appConfig.proxy);
    let layerItem, layerConfig;
    switch (layer.type) {
      case "wms":
        layerConfig = configMapper.mapWMSConfig(layer, this.config);
        layerItem = new WMSLayer(
          layerConfig.options,
          this.config.appConfig.proxy
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

      // case "wfs":
      //   layerConfig = configMapper.mapWFSConfig(layer);
      //   console.info("WFS", layerConfig);
      //   layerItem = new WFSLayer(
      //     layerConfig.options,
      //     this.config.appConfig.proxy
      //   );
      //   map.addLayer(layerItem.layer);
      //   console.info("layerItem", layerItem);
      //   break;
      // case "arcgis":
      //   layerConfig = configMapper.mapArcGISConfig(layer);
      //   layer = new ArcGISLayer(layerConfig);
      //   break;
      // case "data":
      //   layerConfig = configMapper.mapDataConfig(layer);
      //   layer = new DataLayer(layerConfig);
      //   break;
      // case "extendedwms":
      //   layerConfig = configMapper.mapExtendedWMSConfig(layer);
      //   layer = new ExtendedWMSLayer(layerConfig);
      //   break;
      default:
        break;
    }
  }

  lookup(layers, type) {
    var matchedLayers = [];
    layers.forEach(layer => {
      var layerConfig = this.config.layersConfig.find(
        lookupLayer => lookupLayer.id === layer.id
      );
      layer.layerType = type;
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
        return this.expand(group.groups);
      }
    });
    return result;
  }

  flattern(layerSwitcherConfig) {
    var layers = [
      ...this.lookup(layerSwitcherConfig.options.baselayers, "base"),
      ...this.lookup(this.expand(layerSwitcherConfig.options.groups), "layer")
    ];
    return layers
      .sort(
        (a, b) =>
          a.drawOrder === b.drawOrder ? 0 : a.drawOrder > b.drawOrder ? 1 : -1
      )
      .reduce((a, b) => {        
        a[b["id"]] = b;
        return a;
      }, {});
  }

  addLayers() {
    let layerSwitcherConfig = this.config.mapConfig.tools.find(
      tool => tool.type === "layerswitcher"
    );
    this.layers = this.flattern(layerSwitcherConfig);
    for (var key in this.layers) {
      this.addMapLayer(this.layers[key]);
    }
    return this;
  }

  createPopupOverlay() {
    var container = document.getElementById("popup"),
      closer = document.getElementById("popup-closer"),
      overlay = new Overlay({
        element: container,
        autoPan: false,
        id: "popup-0"
      });

    if (closer) {
      closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };
    }

    return overlay;
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

  mergeConfig(a, b) {
    var x = parseFloat(b.x),
      y = parseFloat(b.y),
      z = parseInt(b.z, 10);

    if (isNaN(x)) {
      x = a.map.center[0];
    }
    if (isNaN(y)) {
      y = a.map.center[1];
    }
    if (isNaN(z)) {
      z = a.map.zoom;
    }

    // The parameters s and v can also be specified through the url. These are decoded and used in searchbar.jsx
    // for snabbsok.
    a.map.center[0] = x;
    a.map.center[1] = y;
    a.map.zoom = z;

    return a;
  }

  getADSpecificSearchLayers() {
    // $.ajax({
    //   url: "/mapservice/config/ADspecificSearch",
    //   method: "GET",
    //   contentType: "application/json",
    //   success: data => {},
    //   error: message => {
    //     callback(message);
    //   }
    // });
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
      document.title = this.config.mapConfig.map.title;
    }

    let layerSwitcherTool = this.config.mapConfig.tools.find(tool => {
      return tool.type === "layerswitcher";
    });

    let searchTool = this.config.mapConfig.tools.find(tool => {
      return tool.type === "search";
    });

    let editTool = this.config.mapConfig.tools.find(tool => {
      return tool.type === "edit";
    });

    let layers = {};

    if (layerSwitcherTool) {
      layers.wmslayers = this.config.layersConfig.wmslayers || [];
      layers.wfslayers = this.config.layersConfig.wfslayers || [];
      layers.wmtslayers = this.config.layersConfig.wmtslayers || [];
      layers.vectorlayers = this.config.layersConfig.vectorlayers || [];
      layers.arcgislayers = this.config.layersConfig.arcgislayers || [];
      layers.extendedwmslayers =
        this.config.layersConfig.extendedwmslayers || [];

      layers.wmslayers.forEach(l => (l.type = "wms"));
      layers.wmtslayers.forEach(l => (l.type = "wmts"));
      layers.vectorlayers.forEach(l => (l.type = "vector"));
      layers.arcgislayers.forEach(l => (l.type = "arcgis"));
      layers.extendedwmslayers.forEach(l => (l.type = "extended_wms"));

      let allLayers = [
        ...layers.wmslayers,
        ...layers.extendedwmslayers,
        ...layers.wmtslayers,
        ...layers.vectorlayers,
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
