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

var Legend = require('components/legend'),
  LegendButton = require('components/legendbutton'),
  InfoButton = require('components/infobutton');

/**
 * HighlightLayerProperties object
 * @typedef {Object} Layer~LayerModelProperties
 * @property {string} name
 * @property {string} caption
 * @property {bool} visible
 * @property {external:"ol.layer"} layer
 */
var LayerModelProperties = {
  name: '',
  caption: '',
  visible: false,
  layer: undefined,
  visibleInLink: false
};

/**
 * Prototype for creating a layer.
 * @description Base class of layers, do not use this class to instantiate layers.
 * @class Layer
 * @augments {external:"Backbone.Model"}
 */
var Layer = {
  /**
   * @instance
   * @property {Layer~LayerModelProperties} - default properties
   */
  defaults: LayerModelProperties,

  /**
   * Load JSON data from script tag.
   * @instance
   * @param {string} url
   */
  loadJSON: function (url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    script.onload = () => { document.head.removeChild(script); };
    document.head.appendChild(script);
  },

  initialize: function () {
    this.initialState = _.clone(this.attributes);
    this.on('change:shell', function (sender, shell) {
      this.set('map', shell.get('map'));
    }, this);
  },

  /**
   * Get label visibility.
   * @instance
   * @return {boolean} visibility
   */
  getLabelVisibility: function () {
    return this.get('labelVisibility');
  },

  /**
   * Get label visibility.
   * @instance
   * @return {LegendView} legend
   */
  getLegend: function () {
    return this.get('legend');
  },

  /**
   * Get name.
   * @instance
   * @return {string} name
   */
  getName: function () {
    return this.get('name');
  },

  /**
   * Get caption.
   * @instance
   * @return {string} caption
   */
  getCaption: function () {
    return this.get('caption');
  },

  /**
   * Get visible.
   * @instance
   * @return {bool} visible
   */
  getVisible: function () {
    return this.get('visible');
  },

  /**
   * Get ol layer.
   * @instance
   * @return {external:ol.layer} layer
   */
  getLayer: function () {
    return this.layer || this.get('layer');
  },

  /**
   * Get info visibility.
   * @instance
   * @return {boolean} infoVisible
   */
  getInfoVisible: function () {
    return this.get('infoVisible');
  },

  /**
   * Get info title.
   * @instance
   * @return {string} infoTitle
   */
  getInfoTitle: function () {
    return this.get('infoTitle');
  },

  /**
   * Get info text.
   * @instance
   * @return {string} infoText
   */
  getInfoText: function () {
    return this.get('infoText');
  },

  /**
   * Get info url.
   * @instance
   * @return {string} infoUrl
   */
  getInfoUrl: function () {
    return this.get('infoUrl');
  },

  /**
   * Get info url text.
   * @instance
   * @return {string} infoUrlText
   */
  getInfoUrlText: function () {
    return this.get('infoUrlText');
  },

  /**
   * Get info owner.
   * @instance
   * @return {string} infoOwner
   */
  getInfoOwner: function () {
    return this.get('infoOwner');
  },

  /**
   * Set label visibility.
   * @instance
   * @param {bool} visibility
   * @return {undefined}
   */
  setVisible: function (visible) {
    this.set('visible', visible);
  },

  /**
   * Get flat JSON-friendly representation of this instance.
   * @instance
   * @return {object} JSON-representation.
   */
  toJSON: function () {
    var json = _.clone(this.initialState);
    delete json.options;
    json.visible = this.get('visible');
    return json;
  },

  /**
   * Get legend components
   * @instance
   * @return {external:ReactElement} components.
   */
  getLegendComponents: function (settings) {
    var legendComponents = {
      legendButton: null,
      legendPanel: null,
      infoButton: null
    };

    var legendProps = {
      showLegend: settings.legendExpanded,
      legends: this.getLegend(),
      layer: this.getLayer()
    };

    var legendButtonProps = {
      checked: settings.legendExpanded
    };

    var infoButtonProps = {
      checked: settings.infoExpanded
    };

    if (this.getLegend()) {
      legendComponents.legendPanel = React.createElement(Legend, legendProps);
      legendComponents.legendButton = React.createElement(LegendButton, legendButtonProps);
      legendComponents.infoButton = React.createElement(InfoButton, infoButtonProps);
    }

    return legendComponents;
  },

  /**
   * Get extended components
   * @instance
   * @deprecated
   */
  getExtendedComponents: function (settings) {
    return {
      legend: this.getLegendComponents(settings)
    };
  },

  /**
   * Create attribution array
   * @instance
   * @return {Array<external:"ol.Attribution">} attributions
   */
  getAttributions: function () {
    if (this.get('attribution')) {
      return [
        new ol.Attribution({
          html: this.get('attribution')
        })
      ];
    }
  }
};

module.exports = Backbone.Model.extend(Layer);
