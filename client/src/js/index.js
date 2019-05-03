// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

/**
 * Singleton (static) object for the main application.
 * The variable HAJK2 is registred in the the global scope.
 * @class HAJK2
 * @global
 */
(global.HAJK2 = (function () {
  'use strict';

  window.location.hash = "";

  var ApplicationView = require('views/application'),
    cssModifier = require('utils/cssmodifier'),
    configPath = '/mapservice/settings/config/map_1',
    layersPath = '/mapservice/settings/config/layers',
    req,
    elem,
    that = {},
    internal = {}
    ;

  internal.load = function (config, bookmarks) {
    var application = new ApplicationView(config, bookmarks);
    if (config && config.map && config.map.colors) {
      cssModifier.configure(config.map.colors);
    }
    // Thememap selection need to force a rerender of rootnode
    application.render(true);
  };

  internal.init = function (config) {
    internal.load(config);
  };

  internal.parseQueryParams = function () {
    var o = {};
    document.location
      .search
      .replace(/(^\?)/, '')
      .split('&')
      .forEach(param => {
        var a = param.split('=');
        o[a[0]] = a[1];
      });
    return o;
  };

  internal.mergeConfig = function (a, b) {
    var x = parseFloat(b.x),
      y = parseFloat(b.y),
      z = parseInt(b.z);

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
  };

  internal.overrideGlobalInfoBox = function (layer, mapLayer) {
    layer.infobox = mapLayer.infobox;
    return layer;
  };

  internal.filterByLayerSwitcher = function (config, layers) {
    function f (groups, layer) {
      groups.forEach(group => {
        var mapLayer = group.layers.find(l => l.id === layer.id);

        if (mapLayer) {
          layer.drawOrder = mapLayer.drawOrder;

          if (mapLayer.infobox && mapLayer.infobox.length != 0) {
            layer = internal.overrideGlobalInfoBox(layer, mapLayer);
          }

          if (layer.visibleAtStart !== undefined) {
            layer.visibleAtStart = mapLayer.visibleAtStart;
          }
          filtered.push(layer);
        }

        if (group.hasOwnProperty('groups')) {
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
  };

  internal.getADSpecificSearchLayers = function () {
    $.ajax({
      url: '/mapservice/config/ADspecificSearch',
      method: 'GET',
      contentType: 'application/json',
      success: (data) => {

      },
      error: (message) => {
        callback(message);
      }
    });
  };

  /**
   * Overrides global search configuration and uses layers specified in mapconfiguration to do a search
   */
  internal.overrideGlobalSearchConfig = function (searchTool, data) {
    var configSpecificSearchLayers = searchTool.options.layers;
    var searchLayers = data.wfslayers.filter(layer => {
      if (configSpecificSearchLayers.find(x => x.id == layer.id)) {
        return layer;
      }
    });
    return searchLayers;
  };
  /**
   * Load config and start the application.
   * @memberof HAJK2
   * @alias start
   * @instance
   * @param {object} config - configuration object for the application.
   * @param {function} done - callback to trigger when the application is loaded.
   */
  that.start = function (config, done) {
    function load_map (map_config) {
      var layers = $.getJSON(config.layersPath || layersPath);

      layers.done(data => {
        // Set <title> in HTML if map has a title property in JSON config
        if (map_config.hasOwnProperty('map') && map_config.map.hasOwnProperty('title')) {
          document.title = map_config.map.title;
        }

        var layerSwitcherTool = map_config.tools.find(tool => {
          return tool.type === 'layerswitcher';
        });

        var searchTool = map_config.tools.find(tool => {
          return tool.type === 'search';
        });

        var firTool = map_config.tools.find(tool => {
            return tool.type === 'fir';
        });

        var kirTool = map_config.tools.find(tool => {
            return tool.type === 'kir';
        });

        var editTool = map_config.tools.find(tool => {
          return tool.type === 'edit';
        });

        if (layerSwitcherTool) {
          let layers = [];
          let _data = {
            wmslayers: data.wmslayers || [],
            wmtslayers: data.wmtslayers || [],
            vectorlayers: data.vectorlayers || [],
            arcgislayers: data.arcgislayers || [],
            extendedwmslayers: data.extendedwmslayers || []
          };

          _data.wmslayers.forEach(l => l.type = 'wms');
          _data.wmtslayers.forEach(l => l.type = 'wmts');
          _data.vectorlayers.forEach(l => l.type = 'vector');
          _data.arcgislayers.forEach(l => l.type = 'arcgis');
          _data.extendedwmslayers.forEach(l => l.type = 'extended_wms');

          layers = data.wmslayers
            .concat(_data.extendedwmslayers)
            .concat(_data.wmtslayers)
            .concat(_data.vectorlayers)
            .concat(_data.arcgislayers);
          map_config.layers = internal.filterByLayerSwitcher(layerSwitcherTool.options, layers);

          map_config.layers.sort((a, b) => a.drawOrder === b.drawOrder ? 0 : a.drawOrder < b.drawOrder ? -1 : 1);
        }

        if (searchTool) {
          if (searchTool.options.layers == null) {
            searchTool.options.sources = data.wfslayers;
          } else {
              var wfslayers = internal.overrideGlobalSearchConfig(searchTool, data);
              searchTool.options.sources = wfslayers;
            }
        }

        if (firTool) {
            if (firTool.options.layers == null) {
                firTool.options.sources = data.wfslayers;
            } else {
                if (firTool.options.layers.length != 0) {
                    var wfslayers = internal.overrideGlobalSearchConfig(firTool, data);
                    firTool.options.sources = wfslayers;
                } else {
                    firTool.options.sources = data.wfslayers;
                }
            }

            // add caption for real estate to the options
            var realEstateLayer = data.wfslayers.filter(layer => {
                if (layer.id === firTool.options.realEstateLayer.id) {
                    return layer;
                }
            });

            if (realEstateLayer[0]) {
              firTool.options.realEstateLayerCaption = realEstateLayer[0].caption;
            }

            // add caption for real estate WMS layer to the options
            var realEstateWMSLayer = data.wmslayers.filter(layer => {
                if (layer.id === firTool.options.realEstateWMSLayer.id) {
                    return layer;
                }
            });

            if (realEstateWMSLayer[0]) {
              firTool.options.realEstateWMSLayerCaption = realEstateWMSLayer[0].caption;
            }

            if (firTool.options.residentListDataLayer) {
              firTool.options.residentList.residentListWfsLayer = data.wfslayers.filter(l => {
                if (l.id === firTool.options.residentListDataLayer.id) return l;
              });
            }
         }

         if (kirTool) {
             if (kirTool.options.layers == null) {
                 kirTool.options.sources = data.wfslayers;
             } else {
                 if (kirTool.options.layers.length != 0) {
                     var wfslayers = internal.overrideGlobalSearchConfig(kirTool, data);
                     kirTool.options.sources = wfslayers;
                 } else {
                     kirTool.options.sources = data.wfslayers;
                 }
             }

             if (kirTool.options.residentListDataLayer) {
               firTool.options.residentList.residentListWfsLayer = data.wfslayers.filter(l => {
                 if (l.id === firTool.options.residentListDataLayer.id) return l;
               });
             }
        }

        if (editTool) {
          if (editTool.options.layers == null) {
            editTool.options.sources = data.wfstlayers;
          } else {
              var layers = data.wfstlayers.filter(layer => {
                if (editTool.options.layers.find(x => x.id == layer.id)) {
                  return layer;
                }
              });

              editTool.options.sources = layers;
              data.wfstlayers = layers;
            }
        }

        internal.init(
          internal.mergeConfig(map_config, internal.parseQueryParams())
        );
        if (done) done(true);
      })
        .fail(() => {
          if (done) { done(false, 'Kartans lagerkonfiguration kunde inte laddas in.'); }
        });
    }

    config = config || {};
    $.getJSON(config.configPath || configPath)
      .done(load_map)
      .fail(() => {
        if (done) { done(false, 'Kartans konfiguration kunde inte laddas in'); }
      });
  };

  return that;
}()));
