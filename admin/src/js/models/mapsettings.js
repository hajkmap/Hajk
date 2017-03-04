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

import { Model } from 'backbone';
const $ = require('jquery');
const jQuery = $;
global.window.jQuery = jQuery;
require('jquery-sortable');

var menu = Model.extend({

  defaults: {
    layers: [],
    addedLayers: []
  },

  loadMaps: function (callback) {
    $.ajax({
      url: this.get('config').url_map_list,
      method: 'GET',
      contentType: 'application/json',
      success: (data) => {
        var name = data[0];
        if (name === undefined) {
          name = "";
        }
        this.set({
          urlMapConfig: this.get('config').url_map + "/" + name,
          mapFile: name
        });
        callback(data);
      },
      error: (message) => {
        callback(message);
      }
    });
  },

  createMap: function(name, callback) {
    $.ajax({
      url: this.get('config').url_map_create + "/" + name,
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

  deleteMap: function(callback) {
    $.ajax({
      url: this.get('config').url_map_delete + "/" + this.get('mapFile'),
      method: 'GET',
      contentType: 'application/json',
      success: () => {
        callback();
      },
      error: (message) => {
        callback("Kartan kunde inte tas bort. Försök igen senare.");
      }
    });
  },

  updateToolConfig: function(config, callback) {
    $.ajax({
      url: `${this.get('config').url_tool_settings}?mapFile=${this.get('mapFile')}.json`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  updateMapConfig: function(config, callback) {
    $.ajax({
      url: `${this.get('config').url_map_settings}?mapFile=${this.get('mapFile')}.json`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  updateConfig: function(config, callback) {
    $.ajax({
      url: `${this.get('config').url_layermenu_settings}?mapFile=${this.get('mapFile')}.json`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  findLayerInConfig: function (id) {

    var layer = false;

    function findInGroups(groups, layerId) {
      groups.forEach(group => {
        var found = group.layers.find(l => l.id === layerId);
        if (found) {
          layer = found;
        }
        if (group.hasOwnProperty('groups')) {
          findInGroups(group.groups, layerId)
        }
      });
    }

    findInGroups(this.get('layerMenuConfig').groups, id);

    return layer;
  },

  getConfig: function (url, callback) {
    $.ajax(url, {
      success: data => {
        callback(data);
      }
    });
  }

});

export default menu;
