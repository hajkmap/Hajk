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

const ToolModel = require('tools/tool');
const SelectionModel = require('models/selection');

/**
 * @typedef {Object} BufferModel~BufferModelProperties
 * @property {string} type -Default: Buffer
 * @property {string} panel -Default: Bufferpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 */
var BufferModelProperties = {
  type: 'buffer',
  panel: 'bufferpanel',
  toolbar: 'bottom',
  icon: 'fa fa-bullseye icon',
  title: 'Skapa buffertzon',
  visible: false,
  shell: undefined,
  bufferDist: 10
}

/**
 * @description
 *
 *  Prototype for creating an Buffer model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {BufferModel~BufferModelProperties} options - Default options
 */
var BufferModel = {
  /**
   * @instance
   * @property {BufferModel~BufferModelProperties} defaults - Default settings
   */
  defaults: BufferModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  getDefaultStyle: function () {
    const color = 'rgba(255, 255, 0, 0.6)';
    const fill = 'rgba(255, 255, 255, 0.5)';
    return [
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: fill
        }),
        stroke: new ol.style.Stroke({
          color: color,
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: fill
          }),
          stroke: new ol.style.Stroke({
            color: color,
            width: 2
          })
        })
      })
    ];
  },

  configure: function (shell) {

    this.set('map', shell.getMap());
    this.set('olMap', shell.getMap().getMap());
    this.set('layers', shell.getLayerCollection());

    this.set('bufferLayer', new ol.layer.Vector({
      source: new ol.source.Vector(),
      name: 'buffer-layer',
      style: this.getDefaultStyle()
    }));

    this.get('olMap').addLayer(this.get('bufferLayer'));

    this.set('selectionModel', new SelectionModel({
      map: this.get('olMap'),
      layerCollection: shell.getLayerCollection()
    }));

  },
  /**
   * @instance
   */
  getActiveTool: function () {
    return this.get('selectionModel').get('activeTool');
  },
  /**
   * @instance
   * @property {string} name
   */
  setActiveTool: function (name) {
    if (this.get('selectionModel').get('activeTool') === name) {
      this.get('selectionModel').setActiveTool(undefined);
    } else {
      this.get('selectionModel').setActiveTool(name);
    }
  },

  isNumber: function (obj) {

    if (typeof obj === "number") {
      return true;
    }

    if (typeof obj !== "string") {
      return false;
    }

    if (obj.trim() === "") {
      return false;
    }

    if (!isNaN(Number(obj))) {
      return true;
    }

    return false;
  },

  /**
   * @instance
   */
  buffer: function() {

    const parser = new jsts.io.OL3Parser();
    const features = this.get('selectionModel').features
    const dist = this.get('bufferDist');

    if (!this.isNumber(dist)) {
      return false;
    }

    var buffered = Object.keys(features).map(key => {

      var feature = features[key]
      ,   geom    = parser.read(feature.getGeometry())
      ,   olf     = new ol.Feature()
      ,   buff = geom.buffer(dist);

      olf.setGeometry(parser.write(buff));
      return olf;
    });

    this.get('bufferLayer').getSource().addFeatures(buffered);

    return true;
  },

  clearSelection: function() {
    this.get('selectionModel').clearSelection();
  },

  clearBuffer: function() {
    this.get('bufferLayer').getSource().clear();
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function () {
    this.set('visible', true);
  }
};

/**
 * Buffer model module.<br>
 * Use <code>require('models/Buffer')</code> for instantiation.
 * @module BufferModel-module
 * @returns {BufferModel}
 */
module.exports = ToolModel.extend(BufferModel);
