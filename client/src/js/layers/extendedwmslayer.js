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

var LayerModel = require('layers/layer');
var {customGetTileUrl, customGetFeatureInformationUrl} = require('oloverrides/wmsurl');
/**
 * @typedef {Object} WmsLayer~WmsLayerProperties
 * @property {string} url
 * @property {string} projection - Default: EPSG:3007
 * @property {string} serverType - argis | geoserver. Default: geoserver
 * @property {number} opacity - Default: 1
 * @property {string} status - Load status for layer. Default: ok
 * @property {object} params
 */
var WmsLayerProperties = {
  url: "",
  projection: "EPSG:3007",
  serverType: 'geoserver',
  opacity: 1,
  status: "ok",
  params: {}
};

/**
 * @description
 *
 * Layer to be used as a display layer wich loads its content WMS-service.
 * This layer type is supported for both geoserver and ArcGIS for Server.
 *
 * @class WmsLayer
 * @param {WmsLayer~WmsLayerProperties} options
 * @param {string} type
 */
var WmsLayer = {

  /**
   * @property {WmsLayer~WmsLayerProperties} defaults - Default properties
   * @instance
   */
  defaults: WmsLayerProperties,

  /**
   * @property {bool} validInfo - Default: true
   * @instance
   */
  validInfo: true,

  initialize: function () {
    LayerModel.prototype.initialize.call(this);

    let parmas  = this.get('params');

    var source = {
      url: this.get('url'),
      params: parmas,
      projection: this.get('projection'),
      serverType: this.get('serverType'),
      imageFormat: this.get('imageFormat'),
      attributions: this.getAttributions()
    };

    var infoClickSource = {
      url: this.get('url'),
      params: Object.assign({}, parmas),
      projection: this.get('projection'),
      serverType: this.get('serverType'),
      imageFormat: this.get('imageFormat'),
      attributions: this.getAttributions()
    };

    this.queryableLayerNames =  this.get('layersconfig').filter((l) => l.queryable).map((l) => l.name).join(',');
    this.set('queryable', this.queryableLayerNames.length > 0);
    
    if (this.get('resolutions') &&
      this.get('resolutions').length > 0 &&
      this.get('origin') &&
      this.get('origin').length > 0) {
        source.tileGrid = new ol.tilegrid.TileGrid({
          resolutions: this.get('resolutions'),
          origin: this.get('origin')
        });
        source.extent = this.get('extent')
    }

    if (this.get('singleTile')) {
      this.layer = new ol.layer.Image({
        name: this.get('name'),
        visible: this.get('visible'),
        queryable:  this.get('queryable'),
        caption: this.get('caption'),
        opacity: this.get("opacity"),
        source: new ol.source.ImageWMS(source)
      });
    } else {
      this.layer = new ol.layer.Tile({
        name: this.get('name'),
        visible: this.get('visible'),
        queryable: this.get('queryable'),
        caption: this.get('caption'),
        opacity: this.get("opacity"),
        source: new ol.source.TileWMS(source)
      });
      if (source.params.VERSION == "1.3.0") {
        //Openlayers stöder ej sweref 99 TM när wms version 1.3.0 används
        //För att komma runt detta har vi skapat en egen getTileUrl funktion.
        this.layer.getSource().setTileUrlFunction(customGetTileUrl.bind(this.layer.getSource()));
      }
    }

    this.set("wmsCallbackName", "wmscallback" + Math.floor(Math.random() * 1000) + 1);
    global.window[this.get("wmsCallbackName")] = _.bind(this.getFeatureInformationReponse, this);

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
    this.set("type", "wms");
  },

  /**
   * Load feature information.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {external:"ol.style"} style
   */
  getFeatureInformation: function (args) {
    /*
     let url = this.layer.getSource().getGetFeatureInfoUrl(params.coordinate,
        params.resolution,
        params.projection,
        {
          'INFO_FORMAT': this.get('serverType') === "arcgis" ? 'application/geojson' : 'application/json',
          'feature_count': 100
        });
     */
    let sourceConfig = this.get('params');
    let url = customGetFeatureInformationUrl({
      source: this.layer.getSource(),
      layers: this.queryableLayerNames,
      coordinate: args.coordinate,
      resolution:  args.resolution,
      projection: args.projection,
      isSingleTile: this.get('singleTile'),
      params: {
        'INFO_FORMAT': sourceConfig.INFO_FORMAT,
        'feature_count': 100
      }
    });
    //GML
    //Plain text
    if (url) {
      this.featureInformationCallback = args.success;
      if (HAJK2.searchProxy) {
        url = encodeURIComponent(url);
      }

      var request = $.ajax({
        url: HAJK2.searchProxy + url,
        success: (data, status, xhr) => {
          let type = xhr.getResponseHeader("Content-Type").split(';')[0]
          switch(type.toLowerCase()) {
            case 'text/xml':
            case 'application/vnd.ogc.gml':{
              let features = new ol.format.GML().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
              break;
            }
            case 'application/geojson':
            case 'application/json': {
              let features = new ol.format.GeoJSON().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
              break;
            }
            case 'text/plain':
              let fakeFeature = new ol.Feature({
                 geometry:new ol.geom.Point(args.coordinate)
              });
              fakeFeature.setProperties({
                text: data
              });
              this.featureInformationCallback([fakeFeature], this.getLayer());
              break;
            default:
              console.log("Unsupported response type:", type, data);
              break;
          }
        }
      });
      request.error(args.error);
    }

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
  },

  /**
   * Parse response and trigger registred feature information callback.
   * @param {XMLDocument} respose
   * @instance
   */
  getFeatureInformationReponse: function (response) {
    try {
        var features = new ol.format.GeoJSON().readFeatures(response);
      this.featureInformationCallback(features, this.getLayer());
      } catch (e) {
        console.error(e);
    }
  }
};

/**
 * WmsLayer module.<br>
 * Use <code>require('layer/wmslayer')</code> for instantiation.
 * @module WmsLayer-module
 * @returns {WmsLayer}
 */
module.exports = LayerModel.extend(WmsLayer);
