(function() {

  "use strict";

  var ApplicationView = require('views/application');
  var configPath = "clientconfig.json";
  var req;
  var elem;
  var that = {};

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

      var x = parseFloat(b.x) || a.map.center[0]
      ,   y = parseFloat(b.y) || a.map.center[1]
      ,   z = parseInt(b.z) || a.map.zoom
      ,   l = b.l;

      a.map.center[0] = x;
      a.map.center[1] = y;
      a.map.zoom      = z;

      if (l) {
        l = l.split(',');
        a.layers
         .filter((layer) =>
            typeof l.find(str => str === layer.options.name) === "string"
          )
         .forEach((layer) => {
            layer.options.visible = true
          });
      }

      return a;
  };

  $.ajaxSetup({ cache: false });

  req = $.getJSON(configPath);

  req.done(function (config) {
    that.init(
      that.mergeConfig(config, that.parseQueryParams())
    );
  });

  req.error(function (e, a) {
    that.start();
  });

}());
