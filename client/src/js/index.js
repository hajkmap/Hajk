(function() {

  "use strict";

  var ApplicationView = require('views/application')
  ,   configPath      = "/mapservice/settings/config/map_1"
  ,   layersPath      = "/mapservice/settings/config/layers"
  ,   req
  ,   elem
  ,   that = {};

  if (!window.Promise) {
    elem = document.createElement('script');
    elem.src = "js/es6-polyfill.js";
    document.body.appendChild(elem);
  }

  /**
   *
   *
   */
  that.load = function (config, bookmarks) {
    var application = new ApplicationView(config, bookmarks);
    application.render();
    global.window.app = application;
  };
  /**
   *
   *
   */
  that.init = function (config) {
    $('<div id="application" style="width: 100%; height: 100%;"></div>').prependTo('body');
    that.load(config);
  };
  /**
   *
   *
   */
  that.parseQueryParams = function () {
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
   *
   *
   */
  that.mergeConfig = function(a, b) {

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
        a.layers =
          a.layers.filter(layer =>
            typeof l.find(str => str === layer.id) === "string"
          )
        a.layers.forEach(layer => {
          layer.visibleAtStart = true;
        });
      }

      return a;
  };
  /**
   *
   *
   */
  that.start = function () {
      $.ajaxSetup({ cache: false });

      req = $.getJSON(configPath);

      req.done(config => {
        var layers = $.getJSON(layersPath);
        layers.done(data => {
          data.layers.sort((a, b) =>
            a.drawOrder === b.drawOrder ? 0 : a.drawOrder > b.drawOrder ? 1 : -1
          );
          config.layers = data.layers;
          that.init(
            that.mergeConfig(config, that.parseQueryParams())
          );
        });
      });

  }

  return that;

}().start());
