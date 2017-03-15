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

var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

  defaults: {
    url: "",
    featureId: "FID",
    serverType: "geoserver",
    dataFormat: "WFS",
    params: {
      service: "",
      version: "",
      request: "",
      typename: "",
      outputFormat: "",
      srsname: "",
      bbox: ""
    }
  },

  featureMap: {},

  reprojectFeatures: function(features, from, to) {
    if (Array.isArray(features)) {
      features.forEach(feature => {
        if (feature.getGeometry().getCoordinates) {
          let coords = feature.getGeometry().getCoordinates();
          try {
            switch (feature.getGeometry().getType()) {
              case 'Point':
                feature.getGeometry().setCoordinates(ol.proj.transform(coords, from, to));
                break;
              case 'LineString':
                feature.getGeometry().setCoordinates(coords.map(coord => ol.proj.transform(coord, from, to)));
                break;
              case 'Polygon':
                feature.getGeometry().setCoordinates([coords[0].map(coord => ol.proj.transform(coord, from, to))]);
                break;
            }
          } catch (e) {
            console.error("Coordinate transformation error.", e);
          }
        }
      });
    }
  },

  addFeatures: function (data, format) {
    var features = []
    ,   parser
    ,   to = this.get('olMap').getView().getProjection().getCode()
    ,   from = this.get('projection');

    if (format === "wfs") {
      parser = new ol.format.WFS({
        gmlFormat: this.get('params').version === "1.0.0" ? new ol.format.GML2() : undefined
      });
    }

    if (format === "geojson") {
      parser = new ol.format.GeoJSON();
    }

    if (parser) {
      features = parser.readFeatures(data);
    }

    if (to !== from) {
      this.reprojectFeatures(features, from, to);
    }

    this.get("source").addFeatures(features);
  },

  loadAJAX: function (url, format) {
    url = HAJK2.wfsProxy + url;
    $.get(url, (features) => {
      this.addFeatures(features, format || "wfs");
    });
  },

  getStyle: function (feature) {

    const icon = this.get("icon");
    const fillColor = this.get("fillColor");
    const lineColor = this.get("lineColor");
    const lineStyle = this.get("lineStyle");
    const lineWidth = this.get("lineWidth");
    const symbolXOffset = this.get("symbolXOffset");
    const symbolYOffset = this.get("symbolYOffset");

    function getLineDash() {
        var scale = (a, f) => a.map(b => f * b)
        ,   width = lineWidth
        ,   style = lineStyle
        ,   dash  = [12, 7]
        ,   dot   = [2, 7]
        ;
        switch (style) {
          case "dash":
            return width > 3 ? scale(dash, 2) : dash;
          case "dot":
            return width > 3 ? scale(dot, 2) : dot;
          default :
            return undefined;
        }
    }

    function getFill() {
      return new ol.style.Fill({
        color: fillColor
      });
    }

    function getImage() {
      return icon === ""
      ? getPoint()
      : getIcon();
    }

    function getIcon() {
      return new ol.style.Icon({
        src: icon,
        scale: 1,
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        anchor: [
          symbolXOffset,
          symbolYOffset
        ]
      });
    }

    function getPoint() {
      return new ol.style.Circle({
        fill: getFill(),
        stroke: getStroke(),
        radius: 4
      });
    }

    function getStroke() {
      return new ol.style.Stroke({
        color: lineColor,
        width: lineWidth,
        lineDash: getLineDash()
      })
    }

    function getStyleObj() {
      return {
        fill: getFill(),
        image: getImage(),
        stroke: getStroke()
      };
    }

    return [new ol.style.Style(getStyleObj())];
  },

  initialize: function () {

    var source
    ,   layer;

    source = new ol.source.Vector({
      loader: (extent) => {
        if (this.get('dataFormat') === "GeoJSON") {
          this.loadAJAX(this.get('url'), this.get('dataFormat').toLowerCase());
        } else {
          if (this.get('loadType') === 'jsonp') {
            this.loadJSON(this.createUrl(extent));
          }
          if (this.get('loadType') === 'ajax') {
            this.loadAJAX(this.createUrl(extent, true));
          }
        }
      },
      strategy: ol.loadingstrategy.all
    });

    layer = new ol.layer.Image({
      information: this.get('information'),
      caption: this.get('caption'),
      name: this.get('name'),
      visible: this.get("visible"),
      opacity: this.get("opacity"),
      queryable: this.get('queryable'),
      source: new ol.source.ImageVector({
        source: source,
        style: this.getStyle.bind(this)
      })
    });

    if (this.get('loadType') === "jsonp") {
      global.window[this.get('callbackFunction')] = (response) => {
        this.addFeatures(response, "geojson");
      };
    }

    //this.set("queryable", true);
    this.set("source", source);
    this.set("layer", layer);
    this.set("type", "wfs");

    LayerModel.prototype.initialize.call(this);
  },

  createUrl: function (extent, ll) {
    var props = Object.keys(this.get("params"))
    ,   url = this.get("url") + "?"
    ,   version = this.get('params')['version'];

    for (let i = 0; i < props.length; i++) {
      let key   = props[i];
      let value = "";

      if (key !== "bbox") {
        value = this.get("params")[key];
        url += key + '=' + value;
      } else {
        // value = extent.join(',');
        // if (version !== "1.0.0") {
        //    value += "," + this.get("params")['srsname'];
        // }
      }

      if (i !== props.length - 1) {
        url += "&";
      }
    }

    return url;
  }
});
