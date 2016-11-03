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
 * @typedef {Object} WmtsLayer~WmtsLayerProperties
 * @property {string} url
 * @property {string} projection - Default: EPSG:3007
 * @property {string} layer
 * @property {number} opacity - Default: 1
 * @property {string} matrixSet - Default: '3006'
 * @property {string} style - Default: 'default'
 * @property {string} axisMode - Used by export engine: natural | crs | geographic. Default: natural (X and Y are flipped in comparison with cartesian).
 * @property {array} origin - Origin of tileset. Default: [-1200000, 8500000]
 */
var WmtsLayerProperties = {
  url: '',
  projection: 'EPSG:3006',
  layer: '',
  opacity: 1,
  matrixSet: '3006',
  style: 'default',
  axisMode: 'natural',
  origin: [-1200000, 8500000],
  resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
  matrixIds: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
};

/**
 * @description
 *
 *   Layer to be used as a background layer wich loads its content form a WMTS tile source.
 *
 * @class WmtsLayer
 * @param {WmsLayer~WmsLayerProperties} options
 * @param {string} type
 */
var WmtsLayer = {

  /**
   * @property {WmtsLayer~WmtsLayerProperties} defaults - Default properties
   * @instance
   */
  defaults: WmtsLayerProperties,

  /**
   * Update the map view when the shell changes.
   * @instance
   */
  updateMapViewResolutions: function () {
    var map  = this.get('shell').getMap().getMap()
    ,   view = map.getView();
    map.setView(new ol.View({
      zoom: view.getZoom(),
      center: view.getCenter(),
      resolutions: this.get('resolutions'),
      projection: ol.proj.get(this.get('projection'))
    }));
  },

  initialize: function () {
    LayerModel.prototype.initialize.call(this);
    this.set('resolutions', this.get('resolutions').map(r => Number(r)));
    this.set('origin', this.get('origin').map(o => Number(o)));
    this.layer = new ol.layer.Tile({
      name: this.get('name'),
      caption: this.get('caption'),
      visible: this.get('visible'),
      queryable: this.get('queryable'),
      opacity: this.get('opacity'),
      source: new ol.source.WMTS({
        format: 'image/png',
        wrapX: false,
        url: this.get('url'),
        axisMode: this.get('axisMode'),
        layer: this.get('layer'),
        matrixSet: this.get('matrixSet'),
        style: this.get('style'),
        projection: this.get('projection'),
        tileGrid: new ol.tilegrid.WMTS({
          origin: this.get('origin'),
          resolutions: this.get('resolutions'),
          matrixIds: this.get('matrixIds')
        })
      })
    });

    this.layer.getSource().set('url', this.get('url'));
    this.layer.getSource().set('axisMode', this.get('axisMode'));

    this.on('change:shell', function (sender, shell) {
      this.updateMapViewResolutions();
    }, this);

    this.set("type", "wmts");
  },
};

/**
 * WmtsLayer module.<br>
 * Use <code>require('layer/wmtslayer')</code> for instantiation.
 * @module WmtsLayer-module
 * @returns {WmtsLayer}
 */
module.exports = LayerModel.extend(WmtsLayer);