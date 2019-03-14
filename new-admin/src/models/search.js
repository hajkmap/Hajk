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

import X2JS from "x2js";
import { Model } from "backbone";
import $ from "jquery";
import { prepareProxyUrl } from "../utils/ProxyHelper";

var search = Model.extend({
  defaults: {
    layers: []
  },

  getConfig: function(url) {
    $.ajax(url, {
      success: data => {
        data.wfslayers.sort((a, b) => {
          var d1 = parseInt(a.date, 10),
            d2 = parseInt(b.date, 10);
          return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
        });
        this.set("layers", data.wfslayers);
      }
    });
  },

  addLayer: function(layer, callback) {
    $.ajax({
      url: this.get("config").url_layer_settings,
      method: "POST",
      contentType: "application/json",
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
    $.ajax({
      url: this.get("config").url_layer_settings,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  removeLayer: function(layer, callback) {
    $.ajax({
      url: this.get("config").url_layer_settings + "/" + layer.id,
      method: "DELETE",
      contentType: "application/json",
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      }
    });
  },

  getArcGISLayerDescription: function(url, layer, callback) {
    url = prepareProxyUrl(url, this.get("config").url_proxy);
    url += "/" + layer.id;

    console.log("Layer", layer);

    $.ajax(url, {
      dataType: "json",
      data: {
        f: "json"
      },
      success: data => {
        callback(data);
      }
    });
  },

  getLayerDescription: function(url, layer, arcgis, callback) {
    url = prepareProxyUrl(url, this.get("config").url_proxy);
    if (arcgis) {
      this.getArcGISLayerDescription(url, layer, callback);
    } else {
      $.ajax(url, {
        data: {
          request: "describeFeatureType",
          typename: layer.name
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
                  localType: a._type
                    ? a._type.replace(a.__prefix + ":", "")
                    : ""
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
    }
  },

  parseWFSCapabilitesTypes: function(data) {
    var types = [],
      typeElements = $(data).find("FeatureType");

    if (typeElements.length === 0) {
      typeElements = $(data).find("wfs\\:FeatureType");
    }

    typeElements.each((i, featureType) => {
      var projection = "",
        name = "",
        title = "",
        crs = "";

      if ($(featureType).find("DefaultCRS").length > 0) {
        crs = $(featureType)
          .find("DefaultCRS")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("DefaultSRS").length > 0) {
        crs = $(featureType)
          .find("DefaultSRS")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("wfs\\:DefaultCRS").length > 0) {
        crs = $(featureType)
          .find("wfs\\:DefaultCRS")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("wfs\\:DefaultSRS").length > 0) {
        crs = $(featureType)
          .find("wfs\\:DefaultSRS")
          .first()
          .get(0).textContent;
      }
      if (crs && typeof crs === "string") {
        crs = crs.split(":");
      }

      if (Array.isArray(crs)) {
        crs.forEach(part => {
          if (/EPSG/.test(part)) {
            projection += part + ":";
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

      if ($(featureType).find("Name").length > 0) {
        name = $(featureType)
          .find("Name")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("wfs\\:Name").length > 0) {
        name = $(featureType)
          .find("wfs\\:Name")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("Title").length > 0) {
        title = $(featureType)
          .find("Title")
          .first()
          .get(0).textContent;
      }
      if ($(featureType).find("wfs\\:Title").length > 0) {
        title = $(featureType)
          .find("wfs\\:Title")
          .first()
          .get(0).textContent;
      }

      types.push({
        name: name,
        title: title,
        projection: projection
      });
    });
    return types;
  },

  getWMSCapabilities: function(url, callback) {
    $.ajax(prepareProxyUrl(url, this.get("config").url_proxy), {
      data: {
        service: "WFS",
        request: "GetCapabilities"
      },
      success: data => {
        var response = this.parseWFSCapabilitesTypes(data);
        callback(response);
      },
      error: data => {
        callback(false);
      }
    });
  }

  /**
   * Hämtar sökbara lager från backend
   */
  // getWFSLayers: function (url, callback) {
  //   $.ajax(url), {
  //     data:
  //   }
  // }
});

export default search;
