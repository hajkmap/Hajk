import AnchorModel from "./AnchorModel";
import SearchModel from "./SearchModel";
import WindowZModel from "./WindowZModel";
import { decorateConfig } from "./appModel/configTranslator";
import { createMap } from "./appModel/mapFactory";
import { addLayers, highlight, clear } from "./appModel/layerLoader";
import { setLayerVisibilityFromParams } from "./appModel/layerVisibility";
import PluginManager from "./appModel/pluginManager";

import CoordinateSystemLoader from "../utils/CoordinateSystemLoader";
import { hfetch } from "../utils/FetchWrapper";
// import ArcGISLayer from "./layers/ArcGISLayer.js";
// import DataLayer from "./layers/DataLayer.js";
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

class AppModel {
  /**
   * Initialize new AddModel
   * @param object Config
   * @param Observer observer
   */
  constructor(_settings) {
    this.map = undefined;
    this.activeTool = undefined;
    this.layersFromParams = [];
    this.groupLayersFromParams = [];
    this.cqlFiltersFromParams = {};
    this.hfetch = hfetch;
    this.windowZModel = WindowZModel;
    this.pluginManager = new PluginManager();

    // We store the click location data here for later use.
    // Right now this is only used in the new infoClick but it will most likely be used in other parts of the program.
    // Not optimal...
    this.clickLocationData = {
      x: 0,
      y: 0,
      zoom: 0,
    };
  }

  get windows() {
    return this.pluginManager.windows;
  }

  get plugins() {
    return this.pluginManager.plugins;
  }

  get pluginHistory() {
    return this.pluginManager.pluginHistory;
  }

  init(settings) {
    // Lets prevent multiple instances...
    if (this.initialized)
      throw new Error("You should only initialize AppModel once!");

    this.initialized = true;

    const { config, globalObserver, refreshMUITheme } = settings;

    this.config = config;
    decorateConfig(this);
    this.coordinateSystemLoader = new CoordinateSystemLoader(
      config.mapConfig.projections
    );
    this.globalObserver = globalObserver;
    register(this.coordinateSystemLoader.getProj4());
    this.refreshMUITheme = refreshMUITheme;
    this.windowZModel.init(globalObserver);
  }

  registerWindowPlugin(windowComponent) {
    this.pluginManager.registerWindowPlugin(windowComponent);
  }

  onWindowOpen(currentWindow) {
    this.pluginManager.onWindowOpen(currentWindow);
  }

  pushPluginIntoHistory(plugin) {
    this.pluginManager.pushPluginIntoHistory(plugin, this.globalObserver);
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
   * Get loaded plugins
   * @returns Array<Plugin>
   */
  getPlugins() {
    return this.pluginManager.getPlugins();
  }

  getBothDrawerAndWidgetPlugins() {
    return this.pluginManager.getBothDrawerAndWidgetPlugins();
  }

  getDrawerPlugins() {
    return this.pluginManager.getDrawerPlugins();
  }

  /**
   * @summary Return all plugins that might render in Drawer.
   *
   * @description There reason this functions exists is that we must
   * have a way to determine whether the Drawer toggle button should be
   * rendered. It's not as easy as checking for Drawer plugins only (i.e.
   * those with target=toolbar) - this simple logic gets complicated by
   * the fact that Widget plugins (target=left|right) and Control buttons (target=control)
   * also render Drawer buttons on small screens.
   */
  getPluginsThatMightRenderInDrawer() {
    return this.pluginManager.getPluginsThatMightRenderInDrawer();
  }

  /**
   * Dynamically load plugins from the configured plugins folder.
   * Assumed that a folder exists with the same name as the requested plugin.
   * There must also be a file present with the same name as well.
   * We look for both .jsx and .tsx files.
   * @param {Array} - List of plugins to be loaded.
   * @returns {Array} - List of promises to be resolved.
   */
  loadPlugins(plugins) {
    return this.pluginManager.loadPlugins(this, plugins);
  }

  /**
   * Initialize open layers map
   * @return {ol.Map} map
   */
  createMap() {
    createMap(this);
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
    clear(this);
  }

  addLayers() {
    addLayers(this);
    return this;
  }

  highlight(f) {
    highlight(this, f);
  }

  /**
   * @param {string} layers: Comma-separated list of layers to be shown
   * @param {string} groupLayers: A stringified JSON object specifing sublayer
   * visibility. E.g. "{"1242"%3A"name_of_sublayer_a, name_of_sublayer_b"}".
   */
  setLayerVisibilityFromParams(layers = null, groupLayers = "{}") {
    setLayerVisibilityFromParams(this, layers, groupLayers);
  }
}

export default new AppModel();
