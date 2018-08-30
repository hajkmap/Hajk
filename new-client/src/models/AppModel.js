import Error from "./Error.js";
import Plugin from "./Plugin.js";

import ConfigMapper from "./../utils/ConfigMapper.js";
// import { configureCss } from "./../utils/CSSModifier.js"; // TODO: Remove
import CoordinateSystemLoader from "./../utils/CoordinateSystemLoader.js";

// import ArcGISLayer from "./layers/ArcGISLayer.js";
// import DataLayer from "./layers/DataLayer.js";
// import ExtendedWMSLayer from "./layers/ExtendedWMSLayer.js";

import WMSLayer from "./layers/WMSLayer.js";
import WMTSLayer from "./layers/WMTSLayer.js";
import WFSVectorLayer from "./layers/VectorLayer.js";
import { bindMapClickEvent } from "./Click.js";
import { defaults as defaultInteractions } from "ol/interaction";

import { Map, View } from "ol";
import { Zoom, Rotate, ScaleLine, Attribution, FullScreen } from "ol/control";
import { register } from "ol/proj/proj4";

const pluginsFolder = "plugins";
var map;

class AppModel {
  constructor(config, observer) {
    this.plugins = {};
    this.activeTool = undefined;
    this.config = config;
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    this.observer = observer;
    register(this.coordinateSystemLoader.getProj4());
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
    return Object.keys(this.plugins)      
      .reduce((v, key) => {                  
        return [...v, this.plugins[key]];
      }, [])      
  }

  getToolbarPlugins() {
    return this.getPlugins()
      .filter(plugin => plugin.options.target === "toolbar")
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  loadPlugins(plugins, callback) {
    if (undefined !== map) {
      let promises = [];
      plugins.forEach(plugin => {
        promises = [
          ...promises,
          import(`../${pluginsFolder}/${plugin}/view.js`)
            .then(module => {

              const toolConfig = this.config.mapConfig.tools.find(                
                plug => plug.type.toLowerCase() === plugin.toLowerCase()
              ) || {};
              
              const toolOptions = toolConfig && toolConfig.options ? toolConfig.options : {};
              
              const target =                
                toolOptions.hasOwnProperty("options")
                  ? toolConfig.options.target
                  : "toolbar";
              
              const sortOrder =                
                toolConfig.hasOwnProperty("index")
                  ? Number(toolConfig.index)
                  : 0;              

              if (Object.keys(toolConfig).length > 0) {                
                this.addPlugin(
                  new Plugin({
                    map: map,
                    app: this,
                    type: plugin,
                    target: target,
                    component: module.default,
                    sortOrder: sortOrder,
                    options: toolOptions
                  })       
                );
                callback(plugin);
              } else {
                callback();
              }
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
   * Initialize open layers map
   * @return {ol.Map} map
   */
  createMap() {
    var config = this.translateConfig();
    map = new Map({
      interactions: defaultInteractions(),
      target: config.map.target,
      layers: [],
      logo: false,
      pil: false,
      controls: [
        new Zoom({
          zoomInTipLabel: "Zooma in",
          zoomOutTipLabel: "Zooma ut"
        }),
        new Attribution({ collapsible: true }),
        new Rotate({ tipLabel: "Återställ rotation" }),
        new ScaleLine({
          target: "map-scale-bar"
        }),
        new FullScreen()
      ],
      overlays: [],
      view: new View({
        zoom: config.map.zoom,
        units: "m",
        resolutions: config.map.resolutions,
        center: config.map.center,
        projection: config.map.projection,
        extent: config.map.length !== 0 ? config.map.extent : undefined
      })
    });
    setTimeout(() => {
      map.updateSize();
    }, 0);

    bindMapClickEvent(map, mapClickDataResult => {
      this.observer.publish("mapClick", mapClickDataResult);
    });
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
      // case "extendedwms":
      //   layerConfig = configMapper.mapExtendedWMSConfig(layer);
      //   layer = new ExtendedWMSLayer(layerConfig);
      //   break;
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
      var layerConfig = this.config.layersConfig.find(
        lookupLayer => lookupLayer.id === layer.id
      );
      layer.layerType = type;
      // Use the general value for infobox if not present in map config.
      if (layer.infobox === "" && layerConfig !== undefined) {
        layer.infobox = layerConfig.infobox;
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
    var layers = [
      ...this.lookup(layerSwitcherConfig.options.baselayers, "base"),
      ...this.lookup(this.expand(layerSwitcherConfig.options.groups), "layer")
    ];
    layers = layers.reduce((a, b) => {
      a[b["id"]] = b;
      return a;
    }, {});

    return layers;
  }

  addLayers() {
    let layerSwitcherConfig = this.config.mapConfig.tools.find(
      tool => tool.type === "layerswitcher"
    );
    this.layers = this.flattern(layerSwitcherConfig);
    Object.keys(this.layers)
      .sort((a, b) => this.layers[a].drawOrder - this.layers[b].drawOrder)
      .map(sortedKey => this.layers[sortedKey])
      .forEach(layer => {
        this.addMapLayer(layer);
      });

    return this;
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
