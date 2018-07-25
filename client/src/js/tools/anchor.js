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
 * @typedef {Object} AnchorModel~AnchorModelProperties
 * @property {string} type -Default: anchor
 * @property {string} panel -Default: anchorpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 * @property {string} anchor - Default: ''
 */
var AnchorModelProperties = {
  type: 'anchor',
  panel: 'anchorpanel',
  toolbar: 'bottom',
  icon: 'fa fa-link icon fa-flip-horizontal',
  title: 'Länk till kartan',
  visible: false,
  shell: undefined,
  anchor: '',
  instruction: ''
};

/**
 * @description
 *
 *  Prototype for creating an anchor model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {AnchorModel~AnchorModelProperties} options - Default options
 */
var AnchorModel = {
  /**
   * @instance
   * @property {AnchorModel~AnchorModelProperties} defaults - Default settings
   */
  defaults: AnchorModelProperties,

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
    var a = document.location.protocol + '//' + document.location.host + document.location.pathname,
      map = this.get('map'),
      olMap = map.getMap(),
      layers = this.get('layers'),

      c = olMap.getView().getCenter(),
      z = olMap.getView().getZoom(),
      x = c[0],
      y = c[1],
      l = layers.filter(layer => layer.getVisible() === true)
        .map(layer => encodeURIComponent(layer.getName())).join(',');


    a += `?m=${HAJK2.configFile}&x=${x}&y=${y}&z=${z}&l=${l}`;
    this.set('anchor', a);

    return a;
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
 * Anchor model module.<br>
 * Use <code>require('models/anchor')</code> for instantiation.
 * @module AnchorModel-module
 * @returns {AnchorModel}
 */
module.exports = ToolModel.extend(AnchorModel);
