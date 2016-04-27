(global.HAJK2 = function() {

  "use strict";

  var ApplicationView = require('views/application')
  ,   configPath = "/mapservice/settings/config/map_1"
  ,   layersPath = "/mapservice/settings/config/layers"
  ,   req
  ,   elem
  ,   that = {}
  ,   internal = {}

  if (!window.Promise) {
    elem = document.createElement('script');
    elem.src = "js/es6-polyfill.js";
    document.body.appendChild(elem);
  }

  /**
   * Initialize the application.
   * @param config
   * @param bookmark
   *
   */
  internal.load = function (config, bookmarks) {
    var application = new ApplicationView(config, bookmarks);
    application.render();
    //global.window.app = application;
  };
  /**
   * Creates a dom element and render the app into it.
   * @param config
   */
  internal.init = function (config) {
    $('<div id="application" style="width: 100%; height: 100%;"></div>').prependTo('body');
    internal.load(config);
  };
  /**
   * Read marameters from global querystring
   * @return {object} parameters
   */
  internal.parseQueryParams = function () {
    var o = {};
    document.location
            .search
            .replace(/(^\?)/,'')
            .split("&")
            .forEach(param => {
               var a = param.split('=');
               o[a[0]] = a[1];
             });
    return o;
  };
  /**
   * Merge two subsets of configs.
   * @param {object} a - config to merge into
   * @param {object} b - config to merge with
   * @return {object} config
   */
  internal.mergeConfig = function(a, b) {

      var ls = a.tools.find(tool => tool.type === 'layerswitcher');

      var x = parseFloat(b.x) || a.map.center[0]
      ,   y = parseFloat(b.y) || a.map.center[1]
      ,   z = parseInt(b.z) || a.map.zoom
      ,   l = b.l;

      a.map.center[0] = x;
      a.map.center[1] = y;
      a.map.zoom      = z;

      if (l) {
        l = l.split(',');
        a.layers.filter(layer => {
          layer.visibleAtStart = false;
          return typeof l.find(str => str === layer.id) === "string"
        }).forEach(layer => {
          layer.visibleAtStart = true;
        });
      }

      return a;
  };
  /**
   * Load config and start the application.
   * @param {object} config
   * @param {function} done
   */
  that.start = function (config, done) {

      function load_map(map_config) {

        var layers = $.getJSON(config.layersPath || layersPath);

        layers.done(data => {
          data.layers.sort((a, b) =>
            a.drawOrder === b.drawOrder ? 0 : a.drawOrder > b.drawOrder ? 1 : -1
          );
          map_config.layers = data.layers;
          internal.init(
            internal.mergeConfig(map_config, internal.parseQueryParams())
          );
          if (done) done(true);

        });

        layers.error(() => {
          if (done)
            done(false, "Kartans lagerkonfiguration kunde inte laddas in.");
        });
      }

      config = config || {};
      app = $.getJSON(config.configPath || configPath);
      app.done(load_map);
      app.error(() => {
        if (done)
          done(false, "Kartans konfiguration kunde inte laddas in");
      });

  }

  return that;

}());
