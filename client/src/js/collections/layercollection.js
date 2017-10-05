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

var types = {
  "wms": require('layers/wmslayer'),
  "vector": require('layers/wfslayer'),
  "wmts": require('layers/wmtslayer'),
  "data": require('layers/datalayer'),
  "arcgis": require('layers/arcgislayer'),
  "extended_wms": require('layers/extendedwmslayer')
};

/**
 * Prototype for creating a layer collecton.
 * @class LayerCollection
 * @augments external:"Backbone.Collection"
 */
var LayerCollection = {

  /**
   * Add layer to openlayers map
   * @instance
   * @param {Layer} layer - Layer model to add
   */
  addToMap: function(layer) {
    var map = this.shell.get('map').getMap()
    ,   olLayer = layer.getLayer();

    layer.set("olMap", map);
    layer.set("shell", this.shell);

    if (olLayer) {
      map.addLayer(olLayer);
    }
  },

  /**
   * Remove layer from openlayers map
   * @instance
   * @param {Layer} layer - Layermodel to remove
   */
  removeFromMap: function(layer) {
    var map = this.shell.get('map').getMap()
    ,   olLayer = layer.getLayer();

    if (olLayer) {
      map.removeLayer(olLayer);
    }
  },

  /**
   * Generates a model for this layer
   * @instance
   * @param {object} args
   * @param {object} properties
   * @return {object} config
   */
  mapWMTSConfig: function(args, properties) {
    var config = {
      type: 'wmts',
      options: {
        id: args.id,
        name: args.id,
        caption: args.caption,
        visible: args.visibleAtStart === false ? false : true,
        extent: properties.mapConfig.extent,
        queryable: false,
        opacity: args.opacity || 1,
        format: 'image/png',
        wrapX: false,
        url: args.url,
        layer: args.layer,
        matrixSet: args.matrixSet,
        style: args.style,
        projection: args.projection,
        origin: args.origin,
        resolutions: args.resolutions,
        matrixIds: args.matrixIds,
        attribution: args.attribution,
      }
    };
    return config;
  },

  /**
   * Generates a model for this layer
   * @instance
   * @param {object} args
   * @param {object} properties
   * @return {object} config
   */
  mapWMSConfig: function(args, properties) {
    function getLegendUrl() {
      if (args.legend === "") {
        args.legend = `${args.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${args.layers[0]}`
      }
      var protocol = /^http/.test(args.legend) ? '' : 'http://';
      return protocol + args.legend;
    }

    var config = {
      type : "wms",
      options: {
        "id": args.id,
        "url": (HAJK2.wmsProxy || "") + args.url,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "opacity": 1,
        "queryable": args.queryable === false ? false : true,
        "information": args.infobox,
        "resolutions": properties.mapConfig.resolutions,
        "projection": properties.mapConfig.projection || "EPSG:3006",
        "origin": properties.mapConfig.origin,
        "extent": properties.mapConfig.extent,
        "singleTile": args.singleTile || false,
        "imageFormat": args.imageFormat || "image/png",
        "serverType": args.serverType || "geoserver",
        "attribution": args.attribution,
        "searchUrl": args.searchUrl,
        "searchPropertyName": args.searchPropertyName,
        "searchDisplayName": args.searchDisplayName,
        "searchOutputFormat": args.searchOutputFormat,
        "searchGeometryField": args.searchGeometryField,
        "legend" : [{
          "Url": getLegendUrl(args),
          "Description" : "Teckenförklaring"
        }],
        "params": {
          "LAYERS": args.layers.join(','),
          "FORMAT": args.imageFormat,
          "VERSION": "1.1.0",
          "SRS": properties.mapConfig.projection || "EPSG:3006",
          "TILED": args.tiled
        },
        "infoVisible": args.infoVisible || false,
        "infoTitle": args.infoTitle,
        "infoText": args.infoText,
        "infoUrl": args.infoUrl,
        "infoOwner": args.infoOwner
      }
    };
    
    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        "url": (HAJK2.searchProxy || "") + args.url.replace('wms', 'wfs'),
        "featureType": args.layers[0].split(':')[1] || args.layers[0].split(':')[0],
        "propertyName": args.searchFields.join(','),
        "displayName": args.displayFields ? args.displayFields : (args.searchFields[0] || "Sökträff"),
        "srsName": properties.mapConfig.projection || "EPSG:3006"
      };
    }

    return config;
  },

  mapExtendedWMSConfig: function (args, properties) {
    const createLegendConfig = (url, layer) => {
      let strippedUrl = url ? url.split("?")[0] : args.url;
      let legendUrl = `${strippedUrl}?REQUEST=GetLegendGraphic&VERSION=${args.version}&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${layer.name}`;
      let protocol = /^http/.test(legendUrl) ? '' : 'http://';

      return {
        Url: protocol + legendUrl,
        Description: layer.name
      };
    };

    var config = {
      type : args.type,
      options: {
        "id": args.id,
        "url": (HAJK2.wmsProxy || "") + args.url,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "opacity": 1,
        "queryable": true,
        "information": args.infobox,
        "resolutions": properties.mapConfig.resolutions,
        "projection": args.projection || properties.mapConfig.projection || "EPSG:3006",
        "origin": properties.mapConfig.origin,
        "extent": properties.mapConfig.extent,
        "singleTile": args.singleTile || false,
        "imageFormat": args.imageFormat || "image/png",
        "serverType": args.serverType || "geoserver",
        "attribution": args.attribution,
        "legend": args.layers.map((l) => createLegendConfig(args.url, l)),
        "layersconfig": args.layers,
        "params": {
          "LAYERS": args.layers.map(function (l) { return l.name; }).join(','),
          "STYLES": args.layers.map(function (l) { return l.style || ""; }).join(','),
          "FORMAT": args.imageFormat,
          //Openlayers stödjer ej SWEREF 99  i wms verion 1.3.0
          //Vi har överlagring av funktion för tile men inte för single tile
          "VERSION": args.singleTile || false ? '1.1.0': args.version, 
          "TILED": args.tiled,
          "INFO_FORMAT": args.infoFormat
        }
      }
    };

    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        "url": (HAJK2.searchProxy || "") + args.url.replace('wms', 'wfs'),
        "featureType": args.layers[0].split(':')[1] || args.layers[0].split(':')[0],
        "propertyName": args.searchFields.join(','),
        "displayName": args.displayFields ? args.displayFields : (args.searchFields[0] || "Sökträff"),
        "srsName": properties.mapConfig.projection || "EPSG:3006"
      };
    }
    return config;
  },

  mapDataConfig: function(args) {

    var config = {
      type : "data",
      options: {
        "id": args.id,
        "url": (HAJK2.wfsProxy || "") + args.url,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "opacity": 1,
        "queryable": args.queryable === false ? false : true,
        "extent": args.extent,
        "projection": args.projection
      }
    };

    return config;
  },

  mapWFSConfig: function(args) {

    var config = {
      type : "vector",
      options: {
        "id": args.id,
        "dataFormat": args.dataFormat,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "opacity": args.opacity,
        "serverType": "arcgis",
        "loadType": "ajax",
        "projection": args.projection,
        "fillColor": args.fillColor,
        "lineColor": args.lineColor,
        "lineStyle": args.lineStyle,
        "lineWidth": args.lineWidth,
        "url": args.url,
        "queryable": args.queryable,
        "information": args.infobox,
        "icon": args.legend,
        "symbolXOffset": args.symbolXOffset,
        "symbolYOffset": args.symbolYOffset,
        "labelAlign": args.labelAlign,
        "labelBaseline": args.labelBaseline,
        "labelSize": args.labelSize,
        "labelOffsetX": args.labelOffsetX,
        "labelOffsetY": args.labelOffsetY,
        "labelWeight": args.labelWeight,
        "labelFont": args.labelFont,
        "labelFillColor": args.labelFillColor,
        "labelOutlineColor": args.labelOutlineColor,
        "labelOutlineWidth": args.labelOutlineWidth,
        "labelAttribute": args.labelAttribute,
        "showLabels": args.showLabels,
        "featureId": "FID",
        "legend": [{
          "Url": args.legend,
          "Description": args.caption
        }],
        "params": {
          "service": "WFS",
          "version": "1.1.0",
          "request": "GetFeature",
          "typename": args.layer,
          "srsname": args.projection,
          "bbox": ""
        }
      }
    };

    return config;
  },

  mapArcGISConfig: function(args) {

    function getLegendUrl() {
      if (!Array.isArray(args.legend)) {
        if (/^data/.test(args.legend)) {
          args.legend = args.legend.split('#');
        } else if (!/^http/.test(args.legend)) {
          args.legend = 'http://' + args.legend;
        }
      }
      return args.legend;
    }

    var config = {
      type : "arcgis",
      options: {
        "id": args.id,
        "url": args.url,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "queryable": args.queryable === false ? false : true,
        "singleTile": args.singleTile === false ? false : true,
        "extent": args.extent,
        "information": args.infobox,
        "projection": args.projection,
        "opacity": args.opacity,
        "attribution": args.attribution,
        "params": {
          "LAYERS": 'show:' + args.layers.join(',')
        },
        "legend" : [{
          "Url": getLegendUrl(args),
          "Description" : "Teckenförklaring"
        }],
      }
    };

    return config;
  },

  /**
   * Generates a model for this layer
   * @instance
   * @param {object} args
   * @param {object} properties
   * @return {Layer} layer
   */
  model: function (args, properties) {
    var config = false;

    if (args.type === "wms") {
      config = LayerCollection.mapWMSConfig(args, properties);
    }

    if(args.type === "extended_wms") {
      config = LayerCollection.mapExtendedWMSConfig(args, properties);
    }

    if (args.type === "wmts") {
      config = LayerCollection.mapWMTSConfig(args, properties);
    }
    if (args.type === "data") {
      config = LayerCollection.mapDataConfig(args);
    }
    if (args.type === "arcgis") {
      config = LayerCollection.mapArcGISConfig(args);
    }

    if (args.type === "vector") {
      config = LayerCollection.mapWFSConfig(args);
    }
    var Layer = types[config.type];
    if (Layer) {
      return new Layer(config.options, config.type);
    } else {
      throw "Layer type not supported: " + config.type;
    }
  },

  /**
   * Constructor method
   * @instance
   * @param {object} options
   * @param {object} args
   */
  initialize: function (options, args) {

    this.shell = args.shell;
    this.initialConfig = options;

    _.defer(_.bind(function () {

      this.forEach(this.addToMap, this);

    }, this));

    this.on("add", this.addToMap, this);
    this.on("remove", this.removeFromMap, this);
  },

  /**
   * Get the objects data state as json-friendly representation.
   * @instance
   * @return {object} state
   */
  toJSON: function () {
    return this.initialConfig.map(layer => {
      var found = this.find(collectionLayer => collectionLayer.get('id') === layer.id);
      if (found) {
        layer.visibleAtStart = found.get('visible');
      }
      return layer;
    });
  }
};

/**
 * Layer collection module.<br>
 * Use <code>require('collections/layercollection')</code> for instantiation.
 * @module LayerCollection-module
 * @returns {LayerCollection}
 */
module.exports = Backbone.Collection.extend(LayerCollection);
