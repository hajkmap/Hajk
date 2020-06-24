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

import { Model } from "backbone";
import { prepareProxyUrl } from "../utils/ProxyHelper";
import X2JS from "x2js";

const $ = require("jquery");
const jQuery = $;
global.window.jQuery = jQuery;
require("jquery-sortable");

var menu = Model.extend({
  defaults: {
    layers: [],
    addedLayers: []
  },

  loadMaps: function(callback) {
    var url = prepareProxyUrl(
      this.get("config").url_map_list,
      this.get("config").url_proxy
    );
    fetch(url).then(response => {
      response.json().then(data => {
        var name = data[0];
        if (name === undefined) {
          name = "";
        }
        this.set({
          urlMapConfig: prepareProxyUrl(
            this.get("config").url_map + "/" + name,
            this.get("config").url_proxy
          ),
          mapFile: name
        });
        callback(data);
      });
    });
  },

  createMap: function(name, callback) {
    $.ajax({
      url: this.get("config").url_map_create + "/" + name,
      method: "GET",
      contentType: "application/json",
      success: data => {
        callback(data);
      },
      error: message => {
        callback(message);
      }
    });
  },

  deleteMap: function(callback) {
    $.ajax({
      url: this.get("config").url_map_delete + "/" + this.get("mapFile"),
      method: "GET",
      contentType: "application/json",
      success: () => {
        callback();
      },
      error: message => {
        callback("Kartan kunde inte tas bort. Försök igen senare.");
      }
    });
  },

  updateToolConfig: function(config, callback) {
    $.ajax({
      url: `${this.get("config").url_tool_settings}?mapFile=${this.get(
        "mapFile"
      )}.json`,
      method: "PUT",
      contentType: "application/json",
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
      url: `${this.get("config").url_map_settings}?mapFile=${this.get(
        "mapFile"
      )}.json`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  getDocumentList(url, callback) {
    $.ajax({
      url: url,
      success: callback
    });
  },

  /**
   * Hämtar sträng med tillgängliga ad-grupper och konverterar till string[]
   */
  fetchADGroups: function(callback) {
    if (this.get("config").authentication_active) {
      $.ajax({
        url: "/mapservice/config/getusergroups",
        method: "GET",
        success: data => {
          let g = data.split(",");
          let array = g.map(Function.prototype.call, String.prototype.trim);

          callback(array);
        },
        error: err => {
          console.log("Fel: ", err);
        }
      });
    } else {
      return [];
    }
  },

  updateConfig: function(config, callback) {
    $.ajax({
      url: `${this.get("config").url_layermenu_settings}?mapFile=${this.get(
        "mapFile"
      )}.json`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(config),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  findLayerInConfig: function(id) {
    var layer = false;

    function findInGroups(groups, layerId) {
      groups.forEach(group => {
        var found = group.layers.find(l => l.id === layerId);
        if (found) {
          layer = found;
        }
        if (group.hasOwnProperty("groups")) {
          findInGroups(group.groups, layerId);
        }
      });
    }

    findInGroups(this.get("layerMenuConfig").groups, id);

    return layer;
  },

  /**
   * Tittar i config.json på attributet authentication_active om autentisering skall vara aktiverat eller ej
   */
  getAuthSetting: function(callback) {
    callback(this.get("config").authentication_active);
  },

  getEditServices: function(callback) {
    $.ajax(this.get("config").url_layers, {
      success: data => {
        callback(data.wfstlayers);
      }
    });
  },

  getWFSLayerDescription: function(url, layer, callback) {
    url = prepareProxyUrl(url, this.get("config").url_proxy);
    $.ajax(url, {
      data: {
        request: "describeFeatureType",
        typename: layer
      },
      success: data => {
        var parser = new X2JS(),
          xmlstr = data.xml
            ? data.xml
            : new XMLSerializer().serializeToString(data),
          apa = parser.xml2js(xmlstr);
        try {
          var props = apa.schema.complexType.complexContent.extension.sequence.element.map(
            a => {
              return {
                name: a._name,
                localType: a._type ? a._type.replace(a.__prefix + ":", "") : ""
              };
            }
          );
          if (props) {
            callback(props);
          } else {
            callback(false);
          }
        } catch (e) {
          callback(false);
        }
      }
    });
  },

  getConfig: function(url, callback) {
    $.ajax(url, {
      success: data => {
        callback(data);
      }
    });
  }
});

export default menu;
