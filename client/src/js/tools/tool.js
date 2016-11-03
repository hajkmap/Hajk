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
 * @typedef {Object} ToolModel~ToolModelProperties
 * @property {string} type
 * @property {string} toolbar
 * @property {string} panel
 * @property {string} title
 * @property {string} icon
 * @property {ToolCollection} collection
 * @property {NavigationModel} navigation
 */
var ToolModelProperties = {
  type: 'tool',
  toolbar: undefined,
  panel: undefined,
  title: '',
  icon: '',
  collection: undefined,
  navigation: undefined
};

/**
 * Base prototype for creating a tool
 * @class
 * @augments {Backbone.Model}
 */
var ToolModel = {
  /**
   * @instance
   * @property {ToolModel~ToolModelProperties} defaults - Default settings
   */
  defaults: ToolModelProperties,

  initialize: function () {
    this.initialState =  _.clone(this.attributes);
    this.on("change:shell", (sender, shell) => {
      this.set('navigation', shell.get('navigation'));
      this.configure(shell);
    });
  },

  configure: function (shell) {
  },

  /**
   * Not implemented by base prototype.
   * @instance
   */
  clicked: function (arg) { },
  /**
   * Get JSON-representation of this instance.
   * @instance
   */
  toJSON: function () {
    var json = this.initialState;
    return json;
  }
};

/**
 * Search model module.<br>
 * Use <code>require('models/tool')</code> for instantiation.
 * @module ToolModel-module
 * @returns {ToolModel}
 */
module.exports = Backbone.Model.extend(ToolModel);
