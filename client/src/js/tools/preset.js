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

var ToolModel = require('tools/tool');

/**
 * @typedef {Object} PresetModel~PresetModelProperties
 * @property {string} type -Default: preset
 * @property {string} panel -Default: presetpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 * @property {string} anchor - Default: ''
 * @property {string} preset - Default: ''
 */
var PresetModelProperties = {
  type: 'preset',
  panel: 'presetpanel',
  toolbar: 'bottom',
  icon: 'fa fa-bookmark icon',
  title: 'Snabbval',
  visible: false,
  shell: undefined,
  anchor: "",
  presetValue: "",
  instruction: ""
}

/**
 * @description
 *
 *  Prototype for creating an preset model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {PresetModel~PresetModelProperties} options - Default options
 */
var PresetModel = {
  /**
   * @instance
   * @property {PresetModel~PresetModelProperties} defaults - Default settings
   */
  defaults: PresetModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {

    this.set('map', shell.getMap());
    this.set('layers', shell.getLayerCollection());
    this.set(
      'layerswitcher',
      shell.getToolCollection()
           .find(tool =>
              tool.get('type') === 'layerswitcher'
            )
    );
  },

  /**
   * Generate an anchor string which represents the current state of the map.
   * @instance
   * @return {string} anchor
   */
  generate: function () {

    var a = document.location.protocol + "//" + document.location.host + document.location.pathname
    ,   map = this.get("map")
    ,   olMap = map.getMap()
    ,   layers = this.get("layers")

    ,   c = olMap.getView().getCenter()
    ,   z = olMap.getView().getZoom()
    ,   x = c[0]
    ,   y = c[1]
    ,   l = layers.filter(layer => layer.getVisible() === true)
                  .map(layer => encodeURIComponent(layer.getName())).join(',');

    a += `?m=${HAJK2.configFile}&x=${x}&y=${y}&z=${z}&l=${l}`;
    this.set("anchor", a);
    this.set("presetName", this.get('presetList')[0].name);
    this.set("presetUrl", this.get('presetList')[0].presetUrl);

    return a;
  },

  /**
   * Add and save a new preset.
   * @instance
   * @param {string} name - Name of the preset.
   * @param {function} callback - Fn to be called when the save is complete.
   */
  addPreset: function (name, callback) {

    var preset = this.generate();

    this.set("presetValue", preset);

    this.updatePreset(preset);
  },

  /**
   * Update preset.
   *
   *
   *
   */
  updatePreset: function(preset, callback) {
    $.ajax({
      url: `${this.get('config').url_layermenu_settings}?mapFile=${this.get('mapFile')}.json`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(preset),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  /**
   * Get URL.
   *
   *
   *
   */
  getUrl: function () {
    var a = document.location.protocol + "//" + document.location.host + document.location.pathname;
    
    return a;
  },

  /**
   * Get presets from config.
   * @instance
   * @return {object[]} presets
   */
  getPresets: function () {
    return this.get('presetList');
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
    this.set('toggled', !this.get('toggled'));
  }
};

/**
 * Preset model module.<br>
 * Use <code>require('models/preset')</code> for instantiation.
 * @module PresetModel-module
 * @returns {PresetModel}
 */
module.exports = ToolModel.extend(PresetModel);
