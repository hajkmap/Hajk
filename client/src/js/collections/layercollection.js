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
      var Layer = types[args.type];
      if(Layer) {
        return new Layer(args.options, args.type);
      } else {
        throw "layer type not supported " + args.type;
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
