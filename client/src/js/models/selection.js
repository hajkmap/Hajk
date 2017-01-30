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

/**
 * @typedef {Object} SelectionModel~SelectionModelProperties
 * @property {string} type -Default: anchor
 * @property {string} panel -Default: anchorpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 * @property {string} anchor - Default: ''
 */
var SelectionModelProperties = {
  activeTool: ''
};

/**
 * @description
 *
 *  Prototype for creating an anchor model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SelectionModel~SelectionModelProperties} options - Default options
 */
var SelectionModel = {
  /**
   * @instance
   * @property {SelectionModel~SelectionModelProperties} defaults - Default settings
   */
  defaults: SelectionModelProperties,

  initialize: function (options) {

    this.set('olMap', options.map);
    this.set('source', new ol.source.Vector({ wrapX: false }));

    this.set('drawLayer', new ol.layer.Vector({
      source: this.get('source'),
      queryable: false,
      name: this.get('drawLayerName'),
      style: (feature) => this.getScetchStyle(feature)
    }));

    this.get('olMap').addLayer(this.get('drawLayer'));

    this.set('drawTool', new ol.interaction.Draw({
      source: this.get('source'),
      style: this.getScetchStyle(),
      type: 'Polygon'
    }));

    this.get('drawTool').on('drawend', () => {
      this.get('source').clear();
    });

  },

  getScetchStyle: function () {
    const color = 'rgba(0, 0, 0, 0.5)';
    return [
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: color,
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.5)'
          }),
          stroke: new ol.style.Stroke({
            color: color,
            width: 2
          })
        })
      })
    ];
  },

  hasFeatures: function () {
    return this.get('source').getFeatures().length > 0;
  },

  setActiveTool: function(tool) {
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.set('activeTool', tool);
    if (tool === 'drawSelection') {
      this.get('olMap').addInteraction(this.get('drawTool'));
    }
  },

  abort: function() {
    this.setActiveTool('');
    this.get('source').clear();
  }

};

/**
 * Selection model module.<br>
 * Use <code>require('models/selectionmodel')</code> for instantiation.
 * @module SelectionModel-module
 * @returns {SelectionModel}
 */
module.exports = Backbone.Model.extend(SelectionModel);
