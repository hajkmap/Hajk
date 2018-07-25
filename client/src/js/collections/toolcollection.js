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

var Tool = require('tools/tool'),
  LayerSwitcher = require('tools/layerswitcher'),
  InfoClick = require('tools/infoclick'),
  Bookmark = require('tools/bookmark'),
  Search = require('tools/search'),
  Coordinates = require('tools/coordinates'),
  Export = require('tools/export'),
  Draw = require('tools/draw'),
  Edit = require('tools/edit'),
  Anchor = require('tools/anchor'),
  Buffer = require('tools/buffer'),
  StreetView = require('tools/streetview'),
  Information = require('tools/information'),
  Location = require('tools/location'),
  Routing = require('tools/routing'),
  Preset = require('tools/preset'),
  Measure = require('tools/measure'),
  MailExport = require('tools/mailexport');

/**
 * @description
 *
 *   Prototype for a tool collection object.
 *   The tool collection holds references to the tool modules used by the application.
 *   Any communication between tools must occur through this model.
 *
 * @class
 * @augments external:"Backbone.Collection"
 * @param {object} options
 * @param {object} args
 */
var ToolCollection = {
  /**
   * Generates a model for this tool.
   * @instance
   * @param {object} args - arguments
   * @return {Tool} tool
   */
  model: function (args) {
    switch (args.type) {
      case 'layerswitcher':
        return new LayerSwitcher(args.options);
      case 'infoclick':
        return new InfoClick(args.options);
      case 'bookmark':
        return new Bookmark(args.options);
      case 'search':
        return new Search(args.options);
      case 'coordinates':
        return new Coordinates(args.options);
      case 'export':
        return new Export(args.options);
      case 'draw':
        return new Draw(args.options);
      case 'edit':
        return new Edit(args.options);
      case 'anchor':
        return new Anchor(args.options);
      case 'buffer':
        return new Buffer(args.options);
      case 'routing':
        return new Routing(args.options);
      case 'streetview':
        return new StreetView(args.options);
      case 'information':
        return new Information(args.options);
      case 'selection':
        return new Selection(args.options);
      case 'location':
        return new Location(args.options);
      case 'preset':
        return new Preset(args.options);
      case 'measure':
        return new Measure(args.options);
      case 'mailexport':
        return new MailExport(args.options);
      default:
        throw 'Tool not supported ' + args.type;
    }
  },

  initialize: function (tools, args) {
    this.shell = args.shell;
    setTimeout(() => {
      this.configure();
    }, 0);
  },

  configure: function () {
    this.forEach(tool => {
      tool.set('shell', this.shell);
    });
  },

  /**
   * Get the objects data state as json-friendly representation.
   * @instance
   * @return {object} state
   */
  toJSON: function () {
    var json = Backbone.Collection.prototype.toJSON.call(this);
    delete json.shell;
    _.each(this.models, (tool, i) => {
      json[i] = tool.toJSON();
    });
    return json;
  }
};

/**
 * Tool collection module.<br>
 * Use <code>require('collections/toolcollection')</code> for instantiation.
 * @module ToolCollection-module
 * @returns {ToolCollection}
 */
module.exports = Backbone.Collection.extend(ToolCollection);
