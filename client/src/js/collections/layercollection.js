var types = {
  "wms": require('layers/wmslayer'),
  "wfs": require('layers/wfslayer'),
  "wmts": require('layers/wmtslayer')
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
        matrixIds: args.matrixIds
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
        }
      }
    };

    if (args.searchFields && args.searchFields[0] !== "") {
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
    if (args.type === "wmts") {
      config = LayerCollection.mapWMTSConfig(args, properties);
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
