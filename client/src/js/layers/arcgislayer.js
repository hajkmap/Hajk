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

function toParamString(obj) {
  return Object.keys(obj).map(k => `${k}=${obj[k]}`).join('&');
}

var LayerModel = require('layers/layer');

/**
 * @typedef {Object} ArcGISLayer~ArcGISLayerProperties
 * @property {string} url
 * @property {string} projection - Default: EPSG:3006
 * @property {number} opacity - Default: 1
 */
var ArcGISLayerProperties = {
  url: "http://ksdgis.se/arcgis/rest/services/hpl/MapServer",
  projection: "EPSG:3006",
  opacity: 0.8,
  extent: [413888.8487813738, 6581993.154569996, 416840.2595669881, 6584784.713516495]
};

/**
 * Layer to be used as a display layer wich loads its content from ArcGIS server MapExport.
 * @class ArcGISLayer
 * @param {WmsLayer~WmsLayerProperties} options
 * @param {string} type
 */
var ArcGISLayer = {

  /**
   * @property {ArcGISLayer~ArcGISLayerProperties} defaults - Default properties
   * @instance
   */
  defaults: ArcGISLayerProperties,

  /**
   * @property {bool} validInfo - Default: true
   * @instance
   */
  validInfo: true,

  initialize: function () {
    LayerModel.prototype.initialize.call(this);

    this.layer = new ol.layer.Tile({
      extent: this.get('extent'),
      opacity: this.get('opacity'),
      visible: this.get('visible'),
      name: this.get('name'),
      projection: this.get('projection'),
      source: new ol.source.TileArcGISRest({
        url: this.get('url'),
        params: this.get('params')
      })
    });

    this.layer.getSource().on('tileloaderror', e => {
      this.tileLoadError();
    });

    this.layer.getSource().on('tileloadend', e => {
      this.tileLoadOk();
    });

    this.layer.on('change:visible', (e) => {
      if (!this.get('visible')) {
        this.tileLoadOk();
      }
    });

    this.layer.getSource().set('url', this.get('url'));
    this.set("type", "arcgis");
  },

  /**
   * Parse response from Identify request
   * @instance
   * @param {object} data - response data from request
   * @param {function} callback
   */
  parseFeatueInfoResponse: function(data, callback) {

    if (data && data.results && Array.isArray(data.results)) {

      if (data.results.length === 0) {
        callback();
      }

      data.results.forEach(result => {
        var features = new ol.format.EsriJSON().readFeatures(result);
        callback(features);
      });

    } else {
      callback();
    }
  },

  /**
   * Generate request query params.
   * @instance
   * @param {external:"ol.coordinate"} coordinate
   * @return {object} query params
   */
  getQueryParams: function(coordinate) {

    var layers = this.get('params')['LAYERS'].replace('show', 'visible')
    ,   size   = this.get('map').getMap().getSize()
    ,   extent = this.get('map').getMap().getView().calculateExtent(size).join(',')
    ,   geom   = coordinate[0] + "," + coordinate[1]
    ,   imgd   = size.concat([96]).join(',')
    ;

    return {
      geometryType: "esriGeometryPoint",
      geometry: geom,
      tolerance: 10,
      layers: layers,
      mapExtent: extent,
      imageDisplay: imgd,
      returnGeometry: true,
      f: 'json'
    };
  },

  /**
   * Load feature information.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {external:"ol.style"} style
   */
  getFeatureInformation: function (params) {

    var url = this.get('url');
    url += "/identify?";
    url += toParamString(this.getQueryParams(params.coordinate));

    $.ajax({
      url: url,
      dataType: 'json',
      success: (data) => {
        this.parseFeatueInfoResponse(data, params.success);
      },
      error: (rsp) => {
        params.error();
      }
    });
  },

  /**
   * Triggers when a tile fails to load.
   * @instance
   */
  tileLoadError: function () {
    this.set("status", "loaderror");
  },

  /**
   * Triggers when a tile loads.
   * @instance
   */
  tileLoadOk: function () {
    this.set("status", "ok");
  }

};

/**
 * ArcGISLayer module.<br>
 * Use <code>require('layer/arcgislayer')</code> for instantiation.
 * @module ArcGISLayer-module
 * @returns {ArcGISLayer}
 */
module.exports = LayerModel.extend(ArcGISLayer);
