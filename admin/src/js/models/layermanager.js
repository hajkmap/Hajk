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

import X2JS from 'x2js';
import { Model } from 'backbone';
import { format } from 'openlayers';
import $ from 'jquery';

var manager = Model.extend({

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
      case "ExtendedWMS":
        return this.get('config').url_layer_settings_extended
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

        data.extendedwmslayers.forEach(l => { l.type = "ExtendedWMS"});
        data.wmslayers.forEach(l => { l.type = "WMS" });
        data.wmtslayers.forEach(l => { l.type = "WMTS" });
        data.arcgislayers.forEach(l => { l.type = "ArcGIS" });
        data.vectorlayers.forEach(l => { l.type = "Vector" });

        layers = data.wmslayers
          .concat(data.extendedwmslayers)
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
    var types = [],
        typeElements = $(data).find('FeatureType');

    if (typeElements.length === 0) {
      typeElements = $(data).find('wfs\\:FeatureType');      
    }

    typeElements.each((i, featureType) => {
      
      var projection = '',
          name = "",
          title = "",
          crs = '';
      
      if ($(featureType).find('DefaultCRS').length > 0) {
        crs = $(featureType).find('DefaultCRS').first().get(0).textContent;
      }
      if ($(featureType).find('DefaultSRS').length > 0) {
        crs = $(featureType).find('DefaultSRS').first().get(0).textContent;
      }
      if ($(featureType).find('wfs\\:DefaultCRS').length > 0) {
        crs = $(featureType).find('wfs\\:DefaultCRS').first().get(0).textContent;
      }
      if ($(featureType).find('wfs\\:DefaultSRS').length > 0) {
        crs = $(featureType).find('wfs\\:DefaultSRS').first().get(0).textContent;
      }
      if (crs && typeof crs === 'string') {
        crs = crs.split(':');
      }

      if (Array.isArray(crs)) {
        crs.forEach(part => {
          if (/EPSG/.test(part)) {
            projection += part + ':';
          }
          if (/^\d+$/.test(Number(part))) {
            projection += part;
          }
        });
      }
      if (!/^[A-Z]+:\d+$/.test(projection)) {        
        if (crs.length === 7) {
          projection = crs[4] + ":" + crs[6];
        } else {
          projection = "";
        }
      }
      
      if ($(featureType).find('Name').length > 0) {
        name = $(featureType).find('Name').first().get(0).textContent
      }
      if ($(featureType).find('wfs\\:Name').length > 0) {
        name = $(featureType).find('wfs\\:Name').first().get(0).textContent
      }      
      if ($(featureType).find('Title').length > 0) {
        title = $(featureType).find('Title').first().get(0).textContent
      }
      if ($(featureType).find('wfs\\:Title').length > 0) {
        title = $(featureType).find('wfs\\:Title').first().get(0).textContent
      }    

      types.push({
        name: name,
        title: title,
        projection: projection
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
        if (/MapServer\/WFSServer$/.test(url)) {
          url = url.replace('/services/', '/rest/services/').replace('WFSServer', 'legend?f=pjson');
          $.ajax(this.prepareProxyUrl(url), {
            dataType: "json",
            success: (legend) => {
              if (legend && legend.layers && legend.layers[0]) {
                if (legend.layers[0].legend[0]) {
                  response.legend = "data:image/png;base64," +
                    legend.layers[0].legend[0].imageData;
                }
              }
              callback(response);
            },
            error: () => {
              callback(false);
            }
          });
        } else {
          callback(response);
        }
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
        var response = (new format.WMSCapabilities()).read(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  }

});

export default manager;