import Error from "./error.js";
import Plugin from "./plugin.js";
import Drag from "./drag.js";
import { configureCss } from "./../utils/cssmodifier.js";

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
      plugins.forEach(plugin => {
        import(`../${pluginsFolder}/${plugin}/view.js`).then(module => {
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
        });
      });
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
        new Rotate({ tipLabel: "Återställ rotation" })
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

    setTimeout(() => {
      var scaleLine = new ScaleLine({
        target: "map-scale-bar"
      });
      map.addControl(scaleLine);
      map.addOverlay(this.createPopupOverlay());
      //var el = document.querySelector(".ol-popup");
    }, 100);

    return map;
  }

  getMap() {
    return map;
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

  overrideGlobalInfoBox(layer, mapLayer) {
    layer.infobox = mapLayer.infobox;
    return layer;
  }

  filterByLayerSwitcher(config, layers) {
    function f(groups, layer) {
      groups.forEach(group => {
        var mapLayer = group.layers.find(l => l.id === layer.id);

        if (mapLayer) {
          layer.drawOrder = mapLayer.drawOrder;

          if (mapLayer.infobox && mapLayer.infobox.length !== 0) {
            layer = this.overrideGlobalInfoBox(layer, mapLayer);
          }

          if (layer.visibleAtStart !== undefined) {
            layer.visibleAtStart = mapLayer.visibleAtStart;
          }
          filtered.push(layer);
        }

        if (group.hasOwnProperty("groups")) {
          f(group.groups, layer);
        }
      });
    }

    var filtered = [];

    layers.forEach(layer => {
      var baseLayer = config.baselayers.find(l => l.id === layer.id);
      if (baseLayer) {
        layer.drawOrder = 0;
        filtered.push(layer);
      }
    });

    layers.forEach(layer => {
      f(config.groups, layer);
    });
    return filtered;
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
      layers.wmslayers = this.config.layersConfig.wmslayers || [];
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

      this.config.mapConfig.layers = this.filterByLayerSwitcher(
        layerSwitcherTool.options,
        allLayers
      );

      this.config.mapConfig.layers.sort(
        (a, b) =>
          a.drawOrder === b.drawOrder ? 0 : a.drawOrder < b.drawOrder ? -1 : 1
      );
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
