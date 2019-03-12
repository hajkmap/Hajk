var types = {
  'wms': require('layers/wmslayer'),
  'vector': require('layers/wfslayer'),
  'wmts': require('layers/wmtslayer'),
  'data': require('layers/datalayer'),
  'arcgis': require('layers/arcgislayer'),
  'extended_wms': require('layers/extendedwmslayer')
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

  findLayers: function(mapGroups, layerId){
    // check all layers in the group
    for(var i = 0; i < mapGroups.layers.length; i++){
      if(mapGroups.layers[i].id === layerId){
        return mapGroups.layers[i];
      }
    }
    // if could not find, run the function for all possible groups
      if (typeof mapGroups.groups === "undefined"){
        return null;
      }
      for(var j = 0; j < mapGroups.groups.length; j++){
      var ret = this.findLayers(mapGroups.groups[j], layerId);
        if(ret !== null){
          return ret;
        }
      }
      return null;
  },

  addToMap: function (layer) {
    var map = this.shell.get('map').getMap(),
      olLayer = layer.getLayer();

    layer.set('olMap', map);
    layer.set('shell', this.shell);

    var visibleAtStart = false;
    var found = false;

    for (var i = 0; i < this.mapGroups.length; i++) {
      var ret = this.findLayers(this.mapGroups[i], layer.get('id'));

      if(ret !== null){
        visibleAtStart = ret.visibleAtStart;
        found = true;
        break;
      }
    }

    //  If
    if (!found) {
      for (var i = 0; i < this.baseLayers.length; i++) {
        if (layer.get('id') == this.baseLayers[i].id) {
          visibleAtStart = this.baseLayers[i].visibleAtStart;
          found = true;
          break;
        }
      }
    }

    if (this.linkLayers.length > 0){
        var isLayerInUrl = typeof this.linkLayers.find(str => str === layer.get("id")) === 'string';
        visibleAtStart = isLayerInUrl;
    }

    layer.setVisible(visibleAtStart);
    layer.getLayer().setVisible(visibleAtStart);

    if (olLayer) {
      map.addLayer(olLayer);
    }
  },

  update: function (layers) {
    for (var i = 0; i < layers.length; i++) {
      this.forEach(mapLayer => {
        var savedLayer = layers[i];
        if (savedLayer.id === mapLayer.id) {
          mapLayer.layer.setVisible(savedLayer.visibleAtStart);
          mapLayer.setVisible(savedLayer.visibleAtStart);
        }
      });
    }
  },
  /**
   * Remove layer from openlayers map
   * @instance
   * @param {Layer} layer - Layermodel to remove
   */
  removeFromMap: function (layer) {
    var map = this.shell.get('map').getMap(),
      olLayer = layer.getLayer();

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
  mapWMTSConfig: function (args, properties) {
    var config = {
      type: 'wmts',
      options: {
        id: args.id,
        name: args.id,
        caption: args.caption,
        visible: args.visibleAtStart !== false,
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
        attribution: args.attribution
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
  mapWMSConfig: function (args, properties) {
    function getLegendUrl () {
      var proxy = HAJK2.wmsProxy || '';

      // If property exists in map settings, use specified legend options (font, color, size, etc)
      let geoserverLegendOptions = '';
      if (properties.mapConfig.hasOwnProperty('geoserverLegendOptions')) {
        geoserverLegendOptions = 'legend_options=' + properties.mapConfig.geoserverLegendOptions;
      }

      if (args.legend === '') {
        args.legend = `${proxy}${args.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${args.layers[0]}&${geoserverLegendOptions}`;
      }

      var protocol = /^http/.test(args.legend) ? '' : 'http://';
      return protocol + args.legend;
    }

    var config = {
      type: 'wms',
      options: {
        'id': args.id,
        'url': (HAJK2.wmsProxy || '') + args.url,
        'name': args.id,
        'caption': args.caption,
        'visible': args.visibleAtStart,
        'opacity': args.opacity || 1,
        'queryable': args.queryable !== false,
        'information': args.infobox,
        'resolutions': properties.mapConfig.resolutions,
        'projection': properties.mapConfig.projection || 'EPSG:3006',
        'origin': properties.mapConfig.origin,
        'extent': properties.mapConfig.extent,
        'singleTile': args.singleTile || false,
        'imageFormat': args.imageFormat || 'image/png',
        'serverType': args.serverType || 'geoserver',
        'attribution': args.attribution,
        'searchUrl': args.searchUrl,
        'searchPropertyName': args.searchPropertyName,
        'searchDisplayName': args.searchDisplayName,
        'searchOutputFormat': args.searchOutputFormat,
        'searchGeometryField': args.searchGeometryField,
        'legend': [{
          'Url': getLegendUrl(args),
          'Description': 'Teckenförklaring'
        }],
        'params': {
          'LAYERS': args.layers.join(','),
          'FORMAT': args.imageFormat,
          'VERSION': '1.1.0',
          'SRS': properties.mapConfig.projection || 'EPSG:3006',
          'TILED': args.tiled
        },
        'infoVisible': args.infoVisible || false,
        'infoTitle': args.infoTitle,
        'infoText': args.infoText,
        'infoUrl': args.infoUrl,
        'infoUrlText': args.infoUrlText,
        'infoOwner': args.infoOwner
      }
    };

    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        'url': (HAJK2.searchProxy || '') + args.url.replace('wms', 'wfs'),
        'featureType': args.layers[0].split(':')[1] || args.layers[0].split(':')[0],
        'propertyName': args.searchFields.join(','),
        'displayName': args.displayFields ? args.displayFields : (args.searchFields[0] || 'Sökträff'),
        'srsName': properties.mapConfig.projection || 'EPSG:3006'
      };
    }

    return config;
  },

  mapExtendedWMSConfig: function (args, properties) {
    const createLegendConfig = (url, layer) => {
      let strippedUrl = url ? url.split('?')[0] : args.url;
      let legendUrl = `${strippedUrl}?REQUEST=GetLegendGraphic&VERSION=${args.version}&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${layer.name}&STYLE=${layer.style}&legend_options=forceLabels:on`;
      let protocol = /^http/.test(legendUrl) ? '' : 'http://';

      return {
        Url: protocol + legendUrl,
        Description: layer.name
      };
    };

    var config = {
      type: args.type,
      options: {
        'id': args.id,
        'url': (HAJK2.wmsProxy || '') + args.url,
        'name': args.id,
        'caption': args.caption,
        'visible': args.visibleAtStart,
        'opacity': 1,
        'queryable': true,
        'information': args.infobox,
        'resolutions': properties.mapConfig.resolutions,
        'projection': args.projection || properties.mapConfig.projection || 'EPSG:3006',
        'origin': properties.mapConfig.origin,
        'extent': properties.mapConfig.extent,
        'singleTile': args.singleTile || false,
        'imageFormat': args.imageFormat || 'image/png',
        'serverType': args.serverType || 'geoserver',
        'attribution': args.attribution,
        'legend': args.layers.map((l) => createLegendConfig(args.legend, l)),
        'layersconfig': args.layers,
        'params': {
          'LAYERS': args.layers.map(function (l) { return l.name; }).join(','),
          'STYLES': args.layers.map(function (l) { return l.style || ''; }).join(','),
          'FORMAT': args.imageFormat,
          // Openlayers stödjer ej SWEREF 99  i wms verion 1.3.0
          // Vi har överlagring av funktion för tile men inte för single tile

          // Single tile är inte längre valbart i admin för WMS-version 1.3.0
          'VERSION': /* args.singleTile || false ? '1.1.0' : */ args.version,
          'TILED': args.tiled,
          'INFO_FORMAT': args.infoFormat
        },
        'infoVisible': args.infoVisible || false,
        'infoTitle': args.infoTitle,
        'infoText': args.infoText,
        'infoUrl': args.infoUrl,
        'infoUrlText': args.infoUrlText,
        'infoOwner': args.infoOwner
      }
    };

    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        'url': (HAJK2.searchProxy || '') + args.url.replace('wms', 'wfs'),
        'featureType': args.layers[0].split(':')[1] || args.layers[0].split(':')[0],
        'propertyName': args.searchFields.join(','),
        'displayName': args.displayFields ? args.displayFields : (args.searchFields[0] || 'Sökträff'),
        'srsName': properties.mapConfig.projection || 'EPSG:3006'
      };
    }
    return config;
  },

  mapDataConfig: function (args) {
    var config = {
      type: 'data',
      options: {
        'id': args.id,
        'url': (HAJK2.wfsProxy || '') + args.url,
        'name': args.id,
        'caption': args.caption,
        'visible': args.visibleAtStart,
        'opacity': 1,
        'queryable': args.queryable !== false,
        'extent': args.extent,
        'projection': args.projection
      }
    };

    return config;
  },

  mapWFSConfig: function (args) {
    var config = {
      type: 'vector',
      options: {
        'id': args.id,
        'dataFormat': args.dataFormat,
        'name': args.id,
        'caption': args.caption,
        'visible': args.visibleAtStart,
        'opacity': args.opacity,
        'serverType': 'arcgis',
        'loadType': 'ajax',
        'projection': args.projection,
        'fillColor': args.fillColor,
        'lineColor': args.lineColor,
        'lineStyle': args.lineStyle,
        'lineWidth': args.lineWidth,
        'url': args.url,
        'queryable': args.queryable,
        'information': args.infobox,
        'icon': args.legend,
        'symbolXOffset': args.symbolXOffset,
        'symbolYOffset': args.symbolYOffset,
        'labelAlign': args.labelAlign,
        'labelBaseline': args.labelBaseline,
        'labelSize': args.labelSize,
        'labelOffsetX': args.labelOffsetX,
        'labelOffsetY': args.labelOffsetY,
        'labelWeight': args.labelWeight,
        'labelFont': args.labelFont,
        'labelFillColor': args.labelFillColor,
        'labelOutlineColor': args.labelOutlineColor,
        'labelOutlineWidth': args.labelOutlineWidth,
        'labelAttribute': args.labelAttribute,
        'showLabels': args.showLabels,
        'featureId': 'FID',
        'legend': [{
          'Url': args.legend,
          'Description': args.caption
        }],
        'params': {
          'service': 'WFS',
          'version': '1.1.0',
          'request': 'GetFeature',
          'typename': args.layer,
          'srsname': args.projection,
          'bbox': ''
        },
        'infoVisible': args.infoVisible || false,
        'infoTitle': args.infoTitle,
        'infoText': args.infoText,
        'infoUrl': args.infoUrl,
        'infoUrlText': args.infoUrlText,
        'infoOwner': args.infoOwner
      }
    };

    return config;
  },

  mapArcGISConfig: function (args) {
    function getLegendUrl () {
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
      type: 'arcgis',
      options: {
        'id': args.id,
        'url': args.url,
        'name': args.id,
        'caption': args.caption,
        'visible': args.visibleAtStart,
        'queryable': args.queryable !== false,
        'singleTile': args.singleTile !== false,
        'extent': args.extent,
        'information': args.infobox,
        'projection': args.projection,
        'opacity': args.opacity,
        'attribution': args.attribution,
        'params': {
          'LAYERS': 'show:' + args.layers.join(',')
        },
        'legend': [{
          'Url': getLegendUrl(args),
          'Description': 'Teckenförklaring'
        }],
        'infoVisible': args.infoVisible || false,
        'infoTitle': args.infoTitle,
        'infoText': args.infoText,
        'infoUrl': args.infoUrl,
        'infoUrlText': args.infoUrlText,
        'infoOwner': args.infoOwner
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
    if (args.type === 'wms') {
      config = LayerCollection.mapWMSConfig(args, properties);
    }

    if (args.type === 'extended_wms') {
      config = LayerCollection.mapExtendedWMSConfig(args, properties);
    }

    if (args.type === 'wmts') {
      config = LayerCollection.mapWMTSConfig(args, properties);
    }
    if (args.type === 'data') {
      config = LayerCollection.mapDataConfig(args);
    }
    if (args.type === 'arcgis') {
      config = LayerCollection.mapArcGISConfig(args);
    }

    if (args.type === 'vector') {
      config = LayerCollection.mapWFSConfig(args);
    }
    var Layer = types[config.type];
    if (Layer) {
      return new Layer(config.options, config.type);
    } else {
      throw 'Layer type not supported: ' + config.type;
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
    var toolConfig = args.tools;

    var layerSwitcherTool = args.tools.find(tool => tool.type === 'layerswitcher');
    this.mapGroups = layerSwitcherTool.options.groups;
    this.baseLayers = layerSwitcherTool.options.baselayers;

    // Parse the URL-parameters for link parsing of visible layers
    var urlParams = {};
    document.location.search.replace(/(^\?)/, '').split('&')
        .forEach(param => {var a = param.split('=');
      urlParams[a[0]] = a[1];});
    try {
        this.linkLayers = urlParams["l"].split(',');
    } catch (e) {
      this.linkLayers = [];
    }


    _.defer(_.bind(function () {
      this.forEach(this.addToMap, this);
    }, this));

    this.on('add', this.addToMap, this);
    this.on('remove', this.removeFromMap, this);
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
