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

var ToolModel = require('tools/tool');

/**
 * @typedef {Object} LayerSwitcherModel~LayerSwitcherModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Skriv ut
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-bars icon
 * @property {string} title - Default: Kartlager
 * @property {boolean} visible - Default: false
 * @property {LayerCollection} layerCollection - Default: undefined
 * @property {boolean} backgroundSwitcherMode - Default: hidden
 * @property {boolean} active - Default: false
 * @property {boolean} visibleAtStart - Default: true
 * @property {boolean} backgroundSwitcherBlack - Default: true
 * @property {boolean} backgroundSwitcherWhite - Default: true
 * @property {boolean} toggleAllButton - Default: false
 */
var LayerSwitcherModelProperties = {
  type: 'layerswitcher',
  panel: 'LayerPanel',
  toolbar: 'bottom',
  icon: 'fa fa-bars icon',
  title: 'Lagerhanterare',
  visible: false,
  layerCollection: undefined,
  backgroundSwitcherMode: 'hidden',
  active: true,
  visibleAtStart: true,
  backgroundSwitcherBlack: true,
  backgroundSwitcherWhite: true,
  toggleAllButton: true,
  dropdownThemeMaps: false,
  themeMapHeaderCaption: 'Temakarta'
};

/**
 * Prototype for creating a layerswitcher model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LayerSwitcherModel~LayerSwitcherModelProperties} options - Default options
 */
var LayerSwitcherModel = {
  /**
   * @instance
   * @property {LayerSwitcherModel~LayerSwitcherModelProperties} defaults - Default settings
   */
  defaults: LayerSwitcherModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {
    this.set('layerCollection', shell.getLayerCollection());
    if (this.get('visibleAtStart') && document.body.scrollWidth >= 600) {
      this.set('visible', true);
    }
  },

  /**
   * Set checked group toggles property based on the layers visibility.
   * @instance
   * @param {object[]} groups
   */
  setExpanded: function recursive (groups) {
    groups.forEach(group => {
      if (!this.get('group_' + group.id)) {
        this.set('group_' + group.id, group.expanded ? 'visible' : 'hidden');
        if (group.hasOwnProperty('groups')) {
          recursive.call(this, group.groups);
        }
      }
    });
  },

  setThemeMap: function (configurationName, configurationTitle) {
    HAJK2.configFile = configurationName;
    HAJK2.configTitle = configurationTitle;
    HAJK2.start({
      configPath: HAJK2.servicePath + '/config/' + configurationName,
      layersPath: HAJK2.servicePath + '/config/layers'
    }, function (status, message) {
      if (!status) {
        document.write(message);
      }
    });
  },

  loadThemeMaps: function (callback) {
    $.ajax({
      url: HAJK2.servicePath + '/config/userspecificmaps',
      method: 'GET',
      contentType: 'application/json',
      success: (data) => {
        callback(data);
      },
      error: (message) => {
        callback(message);
      }
    });
  },

  /**
   * Set visibility for all layers to false.
   * @instance
   */
  toggleAllOff () {
    var baseLayers = this.getBaseLayers();
    this.get('layerCollection').forEach(layer => {
      var isBaseLayer = baseLayers.find(l => l.id === layer.id);
      if (!isBaseLayer) {
        layer.setVisible(false);
      }
    });
  },

  /**
   * Get base layers.
   * @instance
   * @return {Layer[]} base layers
   */
  getBaseLayers: function () {
    var baseLayers = [];
    this.get('baselayers').forEach(baseLayer => {
      var layer = this.get('layerCollection').find(layer => layer.id === baseLayer.id);
      if (layer) {
        baseLayers.push(layer);
      }
    });
    return baseLayers;
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
  clicked: function (arg) {
    this.set('visible', true);
    this.set('toggled', !this.get('toggled'));
  }
};

/**
 * Layer switcher model module.<br>
 * Use <code>require('models/layerswitcher')</code> for instantiation.
 * @module LayerSwitcherModel-module
 * @returns {LayerSwitcher}
 */
module.exports = ToolModel.extend(LayerSwitcherModel);
