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
 * @typedef {Object} WfsLayer~WfsLayerPropertiesParams
 * @property {string} service - Type of service @default WFS.
 * @property {string} version - Version of the WFS-protocol.
 * @property {string} request - Type of request to perform.
 * @property {string} typename - Name of the featureclass to query.
 * @property {string} outputFormat - Version ov the output format eg: GML2, GML3.
 * @property {string} srsname - SRID of the coordinatesystem eg: EPSG:3007.
 * @property {Array} bbox - Bounding box of wich to restrict the query.
 */

/**
 * @typedef {Object} WfsLayer~WfsLayerProperties
 * @property {string} url
 * @property {external:"ol.source"} vectorSurce
 * @property {external:"ol.source"} imageSource
 * @property {Array} filterFeatures
 * @property {bool} filterApplied Default: false
 * @property {WfsLayer~WfsLayerPropertiesParams} params
 */
var WfsLayerProperties = {
  url: "",
  vectorSource: undefined,
  imageSource: undefined,
  filterFeatures: [],
  filterApplied: false,
  params: {
    service: "WFS",
    version: "",
    request: "",
    typename: "",
    outputFormat: "",
    srsname: "",
    bbox: []
  }
};

/**
 * @description
 *
 *   Layer to be used as a display layer wich loads its features from a WFS-service.
 *   Currently this is supported for both geoserver and ArcGIS for Server.
 *
 * @class WfsLayer
 * @todo Add this layertype in the admintool for creation.
 * @param {WfsLayer~WfsLayerProperties} options
 * @param {string} type
 */
var WfsLayer = {
  /**
  * @property {WfsLayer~WfsLayerProperties} defaults - Default properties
  * @instance
  */
  defaults: WfsLayerProperties,

  initialize: function () {
    LayerModel.prototype.initialize.call(this);
    var format = new ol.format.GeoJSON();
    this.stdStyle = new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'rgba(244, 210, 66, 0.6)'
        }),
        stroke: new ol.style.Stroke({
          color: '#F4D242',
          width: 2
        }),
        radius: 5
      }),
      fill: new ol.style.Fill({
        color: 'rgba(244, 210, 66, 0.6)'
      }),
      stroke: new ol.style.Stroke({
        color: '#F4D242',
        width: 2
      })
    });

    this.vectorSource = new ol.source.Vector({
      loader: (extent) => { this.loadJSON(this.createUrl(extent)) },
      strategy: ol.loadingstrategy.bbox
    });

    this.imageSource = new ol.source.ImageVector({
      source: this.vectorSource,
      style: this.getStyle.bind(this)
    });

    this.on('change:filterApplied', function () {
      this.refresh();
    });

    this.layer = new ol.layer.Image({
      caption: this.get('caption'),
      name: this.get('name'),
      maxResolution: this.get('maxResolution') || 20,
      minResolution: this.get('minResolution') || 0.5,
      visible: this.get("visible"),
      source: this.imageSource
    });

    global.window[this.get('callbackFunction')] = (features) => {this.updateLayer(format.readFeatures(features))};

    if (this.get('filterList') && this.get('filterList').length > 0) {
      this.applyFilter();
    }

    this.set("queryable", true);
    this.set("type", "wfs");
  },

  /**
  * getStyle - Generates a style for given feature in layer.
  * @instance
  * @param {external:"ol.feature"} feature
  * @return {external:"ol.style"} style
  */
  getStyle: function (feature) {
    var style = this.get('style');

    var icon = this.get('icon')
    ,   filterApplied = this.get('filterApplied')
    ,   filterFeatures = this.get('filterFeatures')
    ,   showIcon = filterFeatures.length === 0 ||  _.find(filterFeatures, function (filterValue) {
          return filterValue === '' + feature.getProperties().spGid;
        })
    , style
    ;

    if (showIcon || !filterApplied) {

      style = style.condition ? this.getConditionStyle(style, feature) :
                       this.getIconStyle(style.icon);

      if (feature.getProperties().messages) {
        style = [new ol.style.Style({
                image: new ol.style.Circle({
                  fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 220, 0.66)'
                  }),
                  radius: z > 10 ? 10 / s : 10
                })
              })].concat(style);
      }

      return style;
    }
  },

  /**
  * getIconStyle - Generates a new icon style for point features
  * @instance
  * @param {string} iconSrc
  * @return {Array<{external:"ol.Style"}>} styles
  */
  getIconStyle: function (iconSrc) {
    var zoom = this.get("map").getZoom()
    ,   scale = 1;
    return iconSrc ?
      [new ol.style.Style({
        image: new ol.style.Icon({
          src: iconSrc,
          scale: scale
        })
      })] :
      [this.stdStyle]
  },

    /**
  * getConditionStyle - get conditional style
  * @instance
  * @param {object} styleConfig
  * @param {external:"ol.feature"} feature
  * @return {external:"ol.Style"} feature
  */
  getConditionStyle: function (styleConfig, feature) {

    var property = feature.getProperties()[styleConfig.condition.property]
    ,   alternative = _.find(styleConfig.condition.alternatives || [], function (alt) { return property === alt.value; });

    if (alternative) {
      return this.getIconStyle(alternative.icon);
    } else  if (styleConfig.icon) {
      return this.getIconStyle(styleConfig.icon);
    }

    return [this.stdStyle];
  },

 /**
  * getSource - Get the source of this laer
  * @instance
  * @return {external:"ol.source"} style
  */
  getSource: function () {
    return this.vectorSource;
  },

 /**
  * updateLayer - Add features to this layer source
  * @instance
  * @param {Array<{external:"ol.feature"}>} feature
  */
  updateLayer: function (features) {
    this.getSource().addFeatures(features);
  },

 /**
  * refresh - redraw the layer
  * @instance
  */
  refresh: function () {
    this.imageSource.setStyle(this.imageSource.getStyle());
  },

 /**
  * createUrl - generate url to be used in JSONP requests.
  * @instance
  * @param {Array} extent
  * @return {string} url
  */
  createUrl: function (extent) {
    var parameters = this.get('params');
    if (extent) {
      parameters.bbox = extent.join(',') + "," + parameters['srsname'];
    } else if (parameters.hasOwnProperty('bbox')) {
      delete parameters.bbox;
    }
    parameters = _.map(parameters, (value, key) => key.concat("=", value));
    parameters = parameters.join('&');
    return this.get('url') + '?' + parameters;
  },

 /**
  * applyFilter - filter the layer.
  * @instance
  * @param {external:ol.feature} feature
  * @return {external.ol.Style} style
  */
  applyFilter: function () {

    var filterList = this.get('filterList').toArray()
    ,   filterIds = [];

    _.each(filterList, (filter) => {
      _.each(filter.attributes.features.features, (feature) => {
        filterIds.push(feature.gid);
      })
    });

    filterIds = _.uniq(filterIds);
    this.set('filterFeatures', filterIds);
    this.refresh();

  }
};

/**
 * WfsLayer module.<br>
 * Use <code>require('layer/wfslayer')</code> for instantiation.
 * @module WfsLayer-module
 * @returns {WfsLayer}
 */
module.exports = LayerModel.extend(WfsLayer);
