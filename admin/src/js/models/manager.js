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

var X2JS = require('x2js');

var manager = Backbone.Model.extend({

  defaults: {
    layers: []
  },

  parseDate(date) {
    var parsed = parseInt(date);
    return isNaN(parsed) ? date : (new Date(parsed)).toLocaleString();
  },

  getUrl: function (layer) {
    var t = layer['type'];
    delete layer['type'];

    switch(t) {
      case "WMS":
        return this.get('config').url_layer_settings
      case "WMTS":
        return this.get('config').url_wmtslayer_settings
      case "ArcGIS":
        return this.get('config').url_arcgislayer_settings
      case "Vector":
        return this.get('config').url_vectorlayer_settings
    }
  },

  getConfig: function (url) {
    $.ajax(url, {
      success: data => {
        var layers = [];

        data.wmslayers.forEach(l => { l.type = "WMS" });
        data.wmtslayers.forEach(l => { l.type = "WMTS" });
        data.arcgislayers.forEach(l => { l.type = "ArcGIS" });
        data.vectorlayers.forEach(l => { l.type = "Vector" });

        layers = data.wmslayers
          .concat(data.wmtslayers)
          .concat(data.arcgislayers)
          .concat(data.vectorlayers);

        layers.sort((a, b) => {
          var d1 = parseInt(a.date)
          ,   d2 = parseInt(b.date);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });

        this.set('layers', layers);
      }
    });
  },

  getLegend: function (state, callback) {
    $.ajax({
        url: state.url + '/legend',
        method: 'GET',
        dataType: 'json',
        data: {
          f: 'json'
        },
        success: (rsp) => {
          var legends = []
          ,   addedLayers = state.addedLayers.map(layer => layer.id);

          rsp.layers.forEach(legendLayer => {
            if (addedLayers.indexOf(legendLayer.layerId) !== -1) {
              legendLayer.legend.forEach(legend => {
                legends.push(`data:${legend.contentType};base64,${legend.imageData}&${legendLayer.layerName}`);
              });
            }
          });

          callback(legends.join('#'));
        },
        error: () => {
          callback(false);
        }
      });
  },

  addLayer: function (layer, callback) {
    var url = this.getUrl(layer);
    $.ajax({
      url: url,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  updateLayer: function(layer, callback) {

    var url = this.getUrl(layer);
    $.ajax({
      url: url,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });

  },

  removeLayer: function (layer, callback) {
    var url = this.getUrl(layer);
    $.ajax({
      url: url + "/" +layer.id,
      method: 'DELETE',
      contentType: 'application/json',
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  prepareProxyUrl: function (url) {
    return this.get('config').url_proxy ?
      this.get('config').url_proxy + "/" + url.replace(/http[s]?:\/\//, '') :
      url;
  },

  getWFSLayerDescription: function(url, layer, callback) {
    url = this.prepareProxyUrl(url);
    $.ajax(url, {
      data: {
        request: 'describeFeatureType',
        typename: layer
      },
      success: data => {
        var parser = new X2JS()
        ,   xmlstr = data.xml ? data.xml : (new XMLSerializer()).serializeToString(data)
        ,   apa = parser.xml2js(xmlstr);
        try {
          var props = apa.schema.complexType.complexContent.extension.sequence.element.map(a => {
            return {
              name: a._name,
              localType: a._type ? a._type.replace(a.__prefix + ':', '') : ''
            }
          });
          if (props)
            callback(props);
          else
            callback(false);
        } catch (e) {
          callback(false);
        }
      }
    });
  },

  parseWFSCapabilitesTypes: function (data) {
    var types = [];
    $(data).find('FeatureType').each((i, featureType) => {
      types.push({
        name: $(featureType).find('Name').first().get(0).textContent,
        title: $(featureType).find('Title').first().get(0).textContent
      });
    });
    return types;
  },

  getWFSCapabilities: function (url, callback) {
    $.ajax(this.prepareProxyUrl(url), {
      data: {
        service: 'WFS',
        request: 'GetCapabilities'
      },
      success: data => {
        var response = this.parseWFSCapabilitesTypes(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  },

  getArcGISLayerDescription: function(url, layer, callback) {

    url = this.prepareProxyUrl(url);
    url += "/" + layer.id;

    $.ajax(url, {
      dataType: 'json',
      data: {
        f: 'json'
      },
      success: data => {
        callback(data);
      }
    });
  },

  getArcGISCapabilities: function (url, callback) {

    $.ajax(this.prepareProxyUrl(url), {
      dataType: "json",
      data: {
        f: "json"
      },
      success: data => {
        callback(data);
      },
      error: data => {
        callback(false);
      }
    });

  },

  getWMSCapabilities: function (url, callback) {
    $.ajax(this.prepareProxyUrl(url), {
      data: {
        service: 'WMS',
        request: 'GetCapabilities'
      },
      success: data => {
        var response = (new ol.format.WMSCapabilities()).read(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  }

});

module.exports = new manager();
