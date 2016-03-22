var types = {
  "wms": require('layers/wmslayer'),
  "wfs": require('layers/wfslayer'),
  "wmts": require('layers/wmtslayer')
}


/**
 * Add layer to openlayers map
 * @param {object} layer - Layer model to add
 */
function addToMap (layer) {

  var map = this.shell.get('map').getMap()
  ,   olLayer = layer.getLayer();

  layer.set("shell", this.shell);
  if (olLayer) {
    map.addLayer(olLayer);
  }
}

/**
 * Remove layer from openlayers map
 * @param  {object} layer - Layermodel to remove
 */
function removeFromMap(layer) {

  var map = this.shell.get('map').getMap()
  ,   olLayer = layer.getLayer();

  if (olLayer) {
    map.remvoeLayer(olLayer);
  }
}

/**
 * Layer Collection
 */
module.exports = Backbone.Collection.extend({

  model: function (args, event) {
    var layer_config = {
      type : "wms",
      options: {
        "id": args.id,
        "url": "/util/proxy/geturl/" + args.url,
        "name": args.id,
        "caption": args.caption,
        "visible": args.visibleAtStart,
        "singleTile" : false,
        "opacity": 1,
        "queryable": true,
        "information": args.infobox,
        "legend" : [{
          "Url" : args.legend || `http://${args.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${args.layers[0]}`,
          "Description" : "Teckenförklaring"
        }],
        "params": {
          "LAYERS": args.layers.join(','),
          "FORMAT": "image/png",
          "VERSION": "1.1.0",
          "SRS": "EPSG:3006"
        }
      }
    };

    if (args.searchFields && args.searchFields[0] !== "") {
      layer_config.options.search = {
        "url": "/postProxy.aspx?url=http://" + args.url.replace('wms', 'wfs'),
        "featureType": args.layers[0].split(':')[1],
        "propertyName": args.searchFields.join(','),
        "displayName": args.displayFields ? args.displayFields : (args.searchFields[0] || "Sökträff"),
        "srsName": "EPSG:3006"
      };
    }

    var Layer = types[layer_config.type];
    if(Layer) {
      return new Layer(layer_config.options, layer_config.type);
    } else {
      throw "Layer type not supported " + layer_config.type;
    }
  },

  initialize: function (options, args) {
    this.shell = args.shell;
    this.initialConfig = options;

    _.defer(_.bind(function () {
      this.forEach(addToMap, this);
    }, this));

    this.on("add", addToMap, this);
    this.on("remove", removeFromMap, this);
  },

  toJSON: function () {
    var json = this.initialConfig;
    var jsonLayers = this.map((layer) => {

      var jsonLayer = layer.toJSON()
      ,   jsonLayerInitialConfig = _.find(json, (c) => { return c.options.name === jsonLayer.name;  });

      return {
            "type": jsonLayerInitialConfig.type,
            "options": jsonLayer
      };
    });
    return jsonLayers;
  }
});
