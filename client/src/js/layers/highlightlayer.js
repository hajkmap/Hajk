var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({
  /**
   * @property defualts - Default properties
   */
  defaults: {
    /** property {object} source */
    source: undefined,
    /** property {string} name */
    name: "highlight-wms",
    /** property {ol.Layer} selectedLayer */
    selectedLayer: undefined
  },
  /**
   * Constructor method
   */
  initialize: function () {
    LayerModel.prototype.initialize.call(this);
    var selectInteraction;
    this.set('source', new ol.source.Vector({}));
    this.layer = new ol.layer.Vector({
      visible: true,
      name: this.get('name'),
      source: this.get('source'),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.6)',
          width: 4
        }),
        image: new ol.style.Icon({
          anchor: [0.5, 32],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: this.get('markerImg'),
          imgSize: [32, 32]
        })
      })
    });
    this.set('selectInteraction', selectInteraction);
    this.set("queryable", false);
    this.set("visible", true);
    this.set("type", "highlight");
  },
  /**
   * Clear highlight layer
   */
  clearHighlight: function () {
    var source = this.get('source');
    source.clear();
  },
  /**
   * Clear faeture to highlight layer
   * @param {ol.Feature} feature
   */
  addHighlight: function (feature) {
    var source = this.get('source');
    this.set('visible', true);
    if (source.getFeatures().length>0) {
      this.clearHighlight();
    }
    source.addFeature(feature);
  },
  /**
   * Clear faeture to highlight layer
   * @param {ol.Layer} layer
   */
  setSelectedLayer: function (layer) {
    this.set('selectedLayer', layer);
    this.get('selectedLayer').on("change:visible", (visibility) => {
      this.selectedLayerChanged();
    });
  },
  /**
   * Constructor method
   * @param {object} options
   * @param {object} args
   */
  selectedLayerChanged: function () {
    var visible = this.get('selectedLayer').get('visible');
    this.set('visible', visible);
  }

});
