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

var MapModel = require('models/map');
var LayerCollection = require('collections/layers');
var ToolCollection = require('collections/tools');
var NavigationPanelModel = require("models/navigation");

/**
 * @description
 *
 *  Prototype for creating a shell model.
 *  The shell is used as a container for the application environment.
 *  This intermediate class holds references to other modules. (Map, Tools, Layers, Navigation)
 *  Any communication between models will be occur through this model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {object} options - Default options
 */
var ShellModel = {

  initialize: function (config) {
    this.initialConfig = config;
    this.cid += '_map';
    if (config) {
      config.map.target = this.cid;
      _.each(config.projections || [], function (proj) {
        proj4.defs(proj.code, proj.definition);
        ol.proj.addProjection(new ol.proj.Projection({
          code: proj.code,
          extent: proj.extent,
          units: proj.units
        }));
      });
      this.set('canStart', true);
    } else {
      this.set('canStart', false);
    }
  },

  configure: function () {
    var config = this.initialConfig;
    if (this.get('canStart')) {

      this.set('map', new MapModel(config.map));
      this.set('layerCollection', new LayerCollection(config.layers, { shell: this, mapConfig: config.map }));
      this.set('toolCollection', new ToolCollection(config.tools, { shell: this }));

      let tools = this.get('toolCollection').toArray();
      let panels = tools.filter(tool => tool.get('panel'))
        .map(panel => {
          return {
            type: panel.get('panel'),
            model: panel
          }
        });

      this.set('navigation', new NavigationPanelModel({ panels: panels }));
    }
  },

  /**
   * Get map property value
   * @instance
   * @return {MapModel} map model
   */
  getMap: function () {
    return this.get('map');
  },

  /**
   * Get layer collection property value
   * @instance
   * @return {LayerCollection} layer collection
   */
  getLayerCollection: function () {
    return this.get('layerCollection');
  },

  /**
   * Get tool collection property value
   * @instance
   * @return {ToolCollection} tool collection
   */
  getToolCollection: function () {
    return this.get('toolCollection');
  },

  /**
   * Get navigation property value
   * @instance
   * @return {NavigationModel} navigation model
   */
  getNavigation: function () {
    return this.get('navigation');
  },

  /**
   * Convert model to JSON-string
   * @instance
   * @return {string} JSON-string
   */
  toJSON: function () {
    var json = _.clone(this.initialConfig);
    json.layers = this.getLayerCollection().toJSON();
    json.map = this.getMap().toJSON();
    json.toolCollection = this.getToolCollection().toJSON();
    return JSON.stringify(json);
  },

  /**
   * Set bookmark property value
   * @instance
   * @param {Array<{object}>} bookmars
   */
  setBookmarks: function (bookmarks) {
    this.set('bookmarks', bookmarks);
  },

  /**
   * Get bookmarks property value
   * @instance
   * @return {object} bookmars
   */
  getBookmarks: function () {
    return this.get('bookmarks');
  },

  /**
   * Get configuration property value
   * @instance
   * @return {object} configuration
   */
  getConfig: function () {
    return this.get('config');
  },

  /**
   * Set configuration property value
   * @instance
   * @param {object} configuration
   */
  setConfig: function (config) {
    this.set('config', config);
    this.set('configUpdated', new Date().getTime());
  },

  /**
   * Set configuration property value
   * @instance
   * @param {object} configuration
   */
  updateConfig: function () {
    console.log("Set map state", this.getConfig());
  }
};

/**
 * Shell model module.<br>
 * Use <code>require('models/shell')</code> for instantiation.
 * @module ShellModel-module
 * @returns {ShellModel}
 */
module.exports = Backbone.Model.extend(ShellModel);
