var LayerModel = require('layers/layer');

/**
 * Highlightlayer model properties
 * @class HighlightLayerProperties
 */
var HighlightLayerProperties = {
  /** property {external:ol.source} source */
  source: undefined,
  /** property {string} name */
  name: "highlight-wms",
  /** property {external:ol.layer} selectedLayer */
  selectedLayer: undefined
};

/**
 * Prototype for creating a highlightlayer.
 * @class HighlightLayer
 * @augments Layer
 */
var HighlightLayer = {
  /**
   * @property {HighlightLayerProperties} defualts - Default properties
   */
  defaults: HighlightLayerProperties,
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
   * Remove all features from the highlight layer.
   */
  clearHighlight: function () {
    var source = this.get('source');
    source.clear();
  },
  /**
   * Add a feature to the highlight layer.
   * @param {external:ol.Feature} feature
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
   * Set selected layer.
   * @param {external:ol.layer} layer
   */
  setSelectedLayer: function (layer) {
    this.set('selectedLayer', layer);
    this.get('selectedLayer').on("change:visible", (visibility) => {
      this.selectedLayerChanged();
    });
  },
  /**
   * Event handler, fires when the selected layer changes.
   * @param {object} options
   * @param {object} args
   */
  selectedLayerChanged: function () {
    var visible = this.get('selectedLayer').get('visible');
    this.set('visible', visible);
  }
};

/**
 * HighlightLayer module.<br>
 * Use <code>require('layer/highlightlayer')</code> for instantiation.
 * @module HighlightLayer-module
 * @returns {HighlightLayer}
 */
module.exports = LayerModel.extend(HighlightLayer);
