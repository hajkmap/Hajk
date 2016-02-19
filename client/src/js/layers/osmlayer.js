var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

  defaults: {},

  initialize: function () {
  	LayerModel.prototype.initialize.call(this);
    this.layer = new ol.layer.Tile({
        source: new ol.source.OSM()
    });
    this.set("queryable", false);
    this.set("type", "osm");

  }
});
