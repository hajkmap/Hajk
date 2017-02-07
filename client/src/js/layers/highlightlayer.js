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
// https://github.com/Johkar/Hajk2

var LayerModel = require('layers/layer');

/**
 * HighlightLayerProperties object
 * @typedef {Object} HighlightLayer~HighlightLayerProperties
 * @property {external:ol.source} source
 * @property {string} name
 * @property {external:ol.layer} selectedLayer
 */
var HighlightLayerProperties = {
  source: undefined,
  name: "highlight-wms",
  selectedLayer: undefined,
  markerImg: 'assets/icons/marker.png'
};

/**
 * Prototype for creating a highlightlayer.
 * @class HighlightLayer
 * @augments Layer
 * @param {HighlightLayer~HighlightLayerProperties} options
 * @param {string} type
 */
var HighlightLayer = {
  /**
   * @property {HighlightLayer~HighlightLayerProperties} defualts - Default properties
   */
  defaults: HighlightLayerProperties,

  getDefaultStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(20, 20, 255, 0.8)',
        width: 4
      }),
      image: new ol.style.Icon({
        anchor: this.get('anchor'),
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        src: this.get('markerImg'),
        imgSize: this.get('imgSize')
      })
    });
  },

  initialize: function (props) {
    LayerModel.prototype.initialize.call(this);

    this.set({
      anchor: props.anchor,
      imgSize: props.imgSize,
      markerImg: props.markerImg,
      source: new ol.source.Vector({}),
      queryable: false,
      visible: true,
      type: "highlight"
    });

    this.layer = new ol.layer.Vector({
      visible: true,
      name: this.get('name'),
      source: this.get('source'),
      style: props.style || this.getDefaultStyle()
    });
  },

  /**
   * Remove all features from the highlight layer.
   * @instance
   */
  clearHighlight: function () {
    var source = this.get('source');
    source.clear();
  },

  /**
   * Add a feature to the highlight layer.
   * @instance
   * @param {external:ol.Feature} feature
   */
  addHighlight: function (feature, clear, style) {
    var source = this.get('source');
    this.set('visible', true);
    if (clear && source.getFeatures().length > 0) {
      this.clearHighlight();
    }
    feature.setStyle(style || this.layer.getStyle());
    source.addFeature(feature);
  },

  /**
   * Remove a feature from the highlight layer.
   * @instance
   * @param {external:ol.Feature} feature
   */
  removeHighlight: function (feature) {
    var f = this.get('source').getFeatures().find(f => f.getId() === feature.getId());
    if (f) {
      this.get('source').removeFeature(f);
    }
  },

  /**
   * Set selected layer.
   * @param {external:ol.layer} layer
   * @instance
   */
  setSelectedLayer: function (layer) {
    this.set('selectedLayer', layer);
    this.get('selectedLayer').on("change:visible", (visibility) => {
      this.selectedLayerChanged();
    });
  },

  /**
   * Event handler, fires when the selected layer changes.
   * @instance
   * @param {object} options
   * @param {object} args
   */
  selectedLayerChanged: function () {
    var visible = this.get('selectedLayer').get('visible');
    this.set('visible', visible);
  },

  getFeatures: function() {
    return this.get('source').getFeatures();
  }

};

/**
 * HighlightLayer module.<br>
 * Use <code>require('layer/highlightlayer')</code> for instantiation.
 * @module HighlightLayer-module
 * @returns {HighlightLayer}
 */
module.exports = LayerModel.extend(HighlightLayer);
