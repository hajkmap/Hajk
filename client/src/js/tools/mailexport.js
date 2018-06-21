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

"use strict";

var ToolModel = require('tools/tool');
var transform = require('models/transform');

String.prototype.toHex = function() {
  if (/^#/.test(this)) return this;
  var hex = (
  "#" +
  this.match(/\d+(\.\d+)?/g)
    .splice(0, 3)
    .map(i => {
    var v =  parseInt(i, 10).toString(16);
  if (parseInt(i) < 16) {
    v = "0" + v;
  }
  return v;
})
  .join("")
  );
  return hex;
}

String.prototype.toOpacity = function() {
  return parseFloat(this.match(/\d+(\.\d+)?/g).splice(3, 1)[0]);
}

/**
 * @typedef {Object} MailExportModel~MailExportModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Mail & utskrift
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-file-pdf-o icon
 * @property {string} exportUrl - Default: /mapservice/export/pdf
 * @property {string} exportTiffUrl - Default: /mapservice/export/tiff
 * @property {string} exportMailUrl - Default: /mapservice/export/email
 * @property {string} copyright - Default: © Lantmäteriverket i2009/00858
 */
var MailExportModelProperties = {
  type: 'mailexport',
  panel: 'mailexportpanel',
  title: 'Mail & utskrift',
  toolbar: 'bottom',
  icon: 'fa fa-file-pdf-o icon',
  exportUrl: '/mapservice/export/pdf',
  exportTiffUrl: '/mapservice/export/tiff',
  exportMailUrl: '/mapservice/export/email',
  pdfActive: true,
  copyright: "© Lantmäteriverket i2009/00858",
  activeTool: '',
  base64Encode: false,
  autoScale: false,
  instruction: "",
  scales: [250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000]
};

/**
 * Prototype for creating an draw model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {MailExportModel~MailExportModelProperties} options - Default options
 */
var MailExportModel = {
  /**
   * @instance
   * @property {MailExportModel~MailExportModelProperties} defaults - Default settings
   */
  defaults: MailExportModelProperties,

  configure: function (shell) {

    const formats = [];

    if (this.get('pdfActive')) {
      formats.push('pdf');
    }
    if (formats.length > 0) {
      this.setActiveTool(formats[0]);
    }

    // change scale on the map here?
    this.set('olMap', shell.getMap().getMap());
    this.addPreviewLayer();
  },

  setActiveTool: function (tool) {
    this.set('activeTool', tool);
  },

  /**
   * Add preview layer to map.
   * @instance
   */
  addPreviewLayer: function () {
    this.previewLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      name: "preview-layer",
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 145, 20, 0.4)'
        })
      })
    });
    this.get('olMap').addLayer(this.previewLayer);
  },

  /**
   * Remove preview layer from map.
   * @instance
   */
  removePreview: function () {
    this.set('previewFeature', undefined);
    this.previewLayer.getSource().clear();
  },

  /**
   * Get the preview feature.
   * @instance
   * @return {external:"ol.feature"} preview feature
   */
  getPreviewFeature: function () {
    return this.get('previewFeature')
  },

  /**
   * Get center coordinate of the preview feature.
   * @return {external:"ol.coordinate"} center coordinate
   */
  getPreviewCenter: function () {
    var extent = this.getPreviewFeature().getGeometry().getExtent();
    return ol.extent.getCenter(extent);
  },

  /**
   * Add the preview feature to the export layer source.
   * @instance
   * @param {number} scale
   * @param {object} paper
   * @param {number[]} center
   */
  addPreview: function (scale, paper, center) {

    var dpi = 25.4 / 0.28
      ,   ipu = 39.37
      ,   sf  = 1
      ,   w   = (paper.width / dpi / ipu * scale / 2) * sf
      ,   y   = (paper.height / dpi  / ipu * scale / 2) * sf
      ,   coords = [
        [
          [center[0] - w, center[1] - y],
          [center[0] - w, center[1] + y],
          [center[0] + w, center[1] + y],
          [center[0] + w, center[1] - y],
          [center[0] - w, center[1] - y]
        ]
      ]
      ,   feature = new ol.Feature({
        geometry: new ol.geom.Polygon(coords)
      })
    ;

    this.removePreview();
    this.set('previewFeature', feature);
    this.previewLayer.getSource().addFeature(feature);
  },

  /**
   * Clone map draw canvas.
   * @instance
   * @param {HTMLElement} old canvas
   * @param {number} size
   */
  cloneCanvas: function (oldCanvas, size) {
    var newCanvas = document.createElement('canvas')
      ,   context = newCanvas.getContext('2d');

    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    context.drawImage(oldCanvas, 0, 0);
    return newCanvas;
  },

  /**
   * Generate scale bar
   * @instance
   * @return {string} svg image as string
   */
  generateScaleBar: function() {

    var elem  = document.querySelector('.ol-scale-line').outerHTML
      ,   clone = $(elem)
      ,   html  = ''
      ,   data;

    clone.css({
      "width": $('.ol-scale-line-inner').width() + 4,
      "border-radius": "0px",
      "padding": "4px",
      "background": "white"
    });

    clone.find('.ol-scale-line-inner').css({
      "border-right-width": "1px",
      "border-bottom-width": "1px",
      "border-left-width": "1px",
      "border-style": "none solid solid",
      "border-right-color": "rgb(0, 0, 0)",
      "border-bottom-color": "rgb(0, 0, 0)",
      "border-left-color": "rgb(0, 0, 0)",
      "color": "rgb(0, 0, 0)",
      "font-size": "10px",
      "text-align": "center",
      "margin": "1px"
    });

    elem = clone.get(0).outerHTML;

    html = `<div xmlns='http://www.w3.org/1999/xhtml'>
          ${elem}
        </div>`;

    data = `data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='50'>
          <foreignObject width='100%' height='100%'>
            ${html}
          </foreignObject>
        </svg>`;

    return data;
  },

  /**
   * Find WMS layer to export in the map.
   * @instance
   * @return {object[]} wms layers
   */
  findWMS: function () {

    var exportable = layer =>
    (layer instanceof ol.layer.Tile || layer instanceof ol.layer.Image) && (
    layer.getSource() instanceof ol.source.TileWMS ||
    layer.getSource() instanceof ol.source.ImageWMS) &&
    layer.getVisible();

    var formatUrl = url =>
    /^\//.test(url) ?
    (window.location.protocol + "//" + window.location.host + url) :
    url;

    return this.get('olMap')
        .getLayers()
        .getArray()
        .filter(exportable)
        .map((layer, i) => {
        return {
          url: layer.getSource().get('url'),
          layers: layer.getSource().getParams()["LAYERS"].split(','),
          zIndex: i,
          workspacePrefix: null,
          coordinateSystemId: this.get('olMap').getView().getProjection().getCode().split(':')[1]
        }
      });
  },

  /**
   * Find vector layer to export in the map.
   * @instance
   * @return {object[]} vector layers
   */
  findVector: function () {

    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(rgbString) {
      const matches = /rgb(a)?\((\d+), (\d+), (\d+)(, [\d\.]+)?\)/.exec(rgbString);
      if (matches !== null) {
        let r = parseInt(matches[2]);
        let g = parseInt(matches[3]);
        let b = parseInt(matches[4]);
        let a = parseInt(matches[5]);
        return a
        ? null
        : ("#" + componentToHex(r) + componentToHex(g) + componentToHex(b));
      } else {
        return null;
      }
    }

    function asObject(style) {

      function olColorToHex(olColor) {
        var colorString = olColor.join(', ');
        var hex = rgbToHex(`rgba(${colorString})`);
        return hex;
      }

      if (!style) return null;

      if (Array.isArray(style)) {
        if (style.length === 2) {
          style = style[1];
        }
        if (style.length === 1) {
          style = style[0];
        }
      }

      var fillColor = "#FC345C"
      ,   fillOpacity = 0.5
      ,   strokeColor = "#FC345C"
      ,   strokeOpacity = 1
      ,   strokeWidth = 3
      ,   strokeLinecap = "round"
      ,   strokeDashstyle = "solid"
      ,   pointRadius = 10
      ,   pointFillColor = "#FC345C"
      ,   pointSrc = ""
      ,   labelAlign = "cm"
      ,   labelOutlineColor = "white"
      ,   labelOutlineWidth = 3
      ,   fontSize = "16"
      ,   fontColor = "#FFFFFF"
      ,   fontBackColor = "#000000";

      if (style.getText && style.getText() && style.getText().getFont && style.getText().getFont()) {
        fontSize = style.getText().getFont().match(/\d+/)[0];
      }

      if (style.getText && style.getText() && style.getText().getFill && style.getText().getFill()) {
        if (typeof style.getText().getFill().getColor() === "string") {
          fontColor = style.getText().getFill().getColor();
        } else if (Array.isArray(style.getText().getFill().getColor())) {
          fontColor = olColorToHex(style.getText().getFill().getColor());
        }
      }

      if (style.getText && style.getText() && style.getText().getStroke && style.getText().getStroke()) {
        if (typeof style.getText().getFill().getColor() === "string") {
          fontBackColor = style.getText().getStroke().getColor();
        } else if (Array.isArray(style.getText().getStroke().getColor())) {
          fontBackColor = olColorToHex(style.getText().getStroke().getColor());
        }
      }

      if (fontColor && /^rgb/.test(fontColor)) {
        fontColor = rgbToHex(fontColor);
      }

      if (fontBackColor) {
        if (/^rgb\(/.test(fontBackColor)) {
          fontBackColor = rgbToHex(fontBackColor);
        } else {
          fontBackColor = null;
        }
      }

      if (style.getFill && style.getFill() && style.getFill().getColor()) {

        if (style.getFill().getColor().toHex) {
          fillColor = style.getFill().getColor().toHex();
          fillOpacity = style.getFill().getColor().toOpacity();
        } else if (Array.isArray(style.getFill().getColor())) {
          fillColor = olColorToHex(style.getFill().getColor());
          fillOpacity = style.getFill().getColor()[style.getFill().getColor().length - 1];
        }
      }

      if (style.getFill && style.getStroke()) {

        if (style.getStroke().getColor().toHex) {
          strokeColor = style.getStroke().getColor().toHex();
        } else if (Array.isArray(style.getStroke().getColor())) {
          strokeColor = olColorToHex(style.getStroke().getColor())
        }

        strokeWidth = style.getStroke().getWidth() || 3;
        strokeLinecap = style.getStroke().getLineCap() || "round";
        strokeDashstyle = style.getStroke().getLineDash() ?
          style.getStroke().getLineDash()[0] === 12 ?
            "dash" : "dot": "solid";
      }

      if (style.getImage && style.getImage()) {
        if (style.getImage() instanceof ol.style.Icon) {
          pointSrc = style.getImage().getSrc();
        }
        if (style.getImage() instanceof ol.style.Circle) {
          pointRadius = style.getImage().getRadius();
          pointFillColor = style.getImage().getFill().getColor().toHex();
        }
      }

      return {
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWidth: strokeWidth,
        strokeLinecap: strokeLinecap,
        strokeDashstyle: strokeDashstyle,
        pointRadius: pointRadius,
        pointFillColor: pointFillColor,
        pointSrc: pointSrc,
        labelAlign: labelAlign,
        labelOutlineColor: labelOutlineColor,
        labelOutlineWidth: labelOutlineWidth,
        fontSize: fontSize,
        fontColor: fontColor,
        fontBackColor: fontBackColor
      }
    }

    function as2DPairs(coordinates, type) {
      switch (type) {
        case "Point":
          return [coordinates];
        case "LineString":
          return coordinates;
        case "Polygon":
          return coordinates[0];
        case "MultiPolygon":
          return coordinates[0][0];
        case "Circle":
          return [coordinates[0], coordinates[1]];
      }
    }

    function translateVector(features, layer) {

      function getText(feature) {

        var text = "";

        if (feature.getProperties() &&
          feature.getProperties().type === "Text") {
          if (feature.getProperties().description)
            text = feature.getProperties().description
          else if (feature.getProperties().name)
            text = feature.getProperties().name
          else
            text = ''
          return text
        }

        if (feature.getStyle &&
          Array.isArray(feature.getStyle()) &&
          feature.getStyle()[1] &&
          feature.getStyle()[1].getText() &&
          feature.getStyle()[1].getText().getText()) {
          text = feature.getStyle()[1].getText().getText();
        }

        if (feature.getStyle &&
            feature.getStyle() &&
            feature.getStyle().getText &&
            feature.getStyle().getText()) {
          text = feature.getStyle().getText().getText();
        }

        return text;
      }

      return {
        features: features.map(feature => {

          var type = feature.getGeometry().getType()
          ,   geom = feature.getGeometry()
          ,   holes = null
          ,   coords;

          if (!feature.getStyle() && layer) {
            let sourceStyle = layer.getSource().getStyle()(feature)[0];
            feature.setStyle(sourceStyle)
          }

          coords = type === "Circle"
          ? as2DPairs([geom.getCenter(), [geom.getRadius(), 0]], "Circle")
          : as2DPairs(geom.getCoordinates(), type);

          if (type === "MultiPolygon") {
            holes = geom.getCoordinates()[0].slice(1, geom.getCoordinates()[0].length);
          }

      return {
        type: type,
        attributes: {
          text: getText(feature),
          style: asObject(feature.getStyle())
        },
        coordinates: coords,
        holes: holes
      }
    })
    }
    }

    var layers
      ,   vectorLayers
      ,   imageVectorLayers
      ,   extent = this.previewLayer.getSource().getFeatures()[0].getGeometry().getExtent()
    ;

    layers = this.get('olMap').getLayers().getArray();

    vectorLayers = layers.filter(layer =>
      layer instanceof ol.layer.Vector &&
      layer.getVisible() &&
      layer.get('name') !== 'preview-layer' &&
      layer.get('name') !== 'search-selection-layer'
    );

    imageVectorLayers = layers.filter(layer =>
      layer instanceof ol.layer.Image &&
      layer.getSource() instanceof ol.source.ImageVector &&
      layer.getVisible()
    );

    vectorLayers = vectorLayers.map(layer =>
      translateVector(layer.getSource().getFeaturesInExtent(extent))
    ).filter(layer => layer.features.length > 0);

    imageVectorLayers = imageVectorLayers.map(layer => {

      return translateVector(layer.getSource().getSource().getFeaturesInExtent(extent), layer)

    }).filter(layer => layer.features.length > 0);

    return vectorLayers.concat(imageVectorLayers);
  },

  /**
   * Find WMTS layer to export in the map.
   * @instance
   * @return {object[]} wmts layers
   */
  findWMTS: function() {
    var layers = this.get('olMap').getLayers().getArray();
    return layers
        .filter(layer =>
      layer.getSource() instanceof ol.source.WMTS && layer.getVisible()
    )
    .map(layer => {
      var s = layer.getSource();
    return {
      url: s.get("url"),
      axisMode: s.get('axisMode')
    }
  });
  },

  /**
   * Find ArcGIS layer to export in the map.
   * @instance
   * @return {object[]} wmts layers
   */
  findArcGIS: function() {

    function getArcGISLayerContract(layer) {

      var url = layer.getSource().get('url')
        ,   extent = layer.get('extent') || []
        ,   layers = []
        ,   projection = layer.get('projection');

      if (typeof layer.getSource().getParams('params')['LAYERS'] === 'string') {
        layers = layer.getSource().getParams('params')['LAYERS'].replace('show:', '').split(',');
      }

      if (typeof projection === 'string') {
        projection = projection.replace('EPSG:', '');
      }

      return {
        url: url,
        layers: layers,
        spatialReference: projection,
        extent: {
          left: extent[0],
          bottom: extent[1],
          right: extent[2],
          top: extent[3]
        }
      }
    }

    function visibleArcGISLayer(layer) {
      return layer.getSource() instanceof ol.source.TileArcGISRest && layer.getVisible()
    }

    return this.get('olMap').getLayers().getArray()
      .filter(visibleArcGISLayer)
      .map(getArcGISLayerContract);
  },

  /**
   * Export the map
   * @instance
   * @param {function} callback
   * @param {object} size
   */
  mailExportMap: function(callback, size) {
    var map = this.get('olMap');
    map.once('postcompose', (event) => {
      var href
      ,   anchor
      ,   canvas
      ,   context
      ,   mailExportImage
    ;
    canvas = this.cloneCanvas(event.context.canvas, size);
    context = canvas.getContext('2d');
    context.textBaseline = 'bottom';
    context.font = '12px sans-serif';
    if (!size.x) {
      context.fillText(this.get('copyright'), 10, 25);
    }
    var img = new Image();
    img.src = this.generateScaleBar();
    img.onload = function() {
      context.drawImage(img, (size.x + 10) || 10, (size.y + size.height - 30) || (canvas.height - 30));
      href = canvas.toDataURL('image/png');
      href = href.split(';')[1].replace('base64,','');
      callback(href);
    }
  });
    map.renderSync();
  },

  /**
   * Export the map
   * @instance
   * @param {function} callback
   */
  mailExportImage: function(callback) {
    this.exportMap((href) => {
      $.ajax({
        url: this.get('url'),
        type: 'post',
        contentType: 'text/plain',
        data: 'image;' + encodeURIComponent(href),
        success: response => {
        var anchor = $('<a>Hämta</a>').attr({
          href: response,
          target: '_blank',
          download: 'karta.png'
        });
    callback(anchor);
  }
  });
  }, {});
  },

  exportHitsFormId: 13245,

  /**
   * Export the map as a PDF-file
   * @instance
   * @param {object} options
   * @param {function} callback
   */
  exportPDF: function(options, callback) {

    var extent = this.previewLayer.getSource().getFeatures()[0].getGeometry().getExtent()
      ,   left   = extent[0]
      ,   right  = extent[2]
      ,   bottom = extent[1]
      ,   top    = extent[3]
      ,   scale  = options.scale
      ,   dpi    = options.resolution
      ,   form   = document.createElement('form')
      ,   input  = document.createElement('input')
      ,   curr   = document.getElementById(this.exportHitsFormId)
      ,   url    = this.get('exportUrl')
      ,   data   = {
      wmsLayers: [],
      vectorLayers: [],
      size: null,
      resolution: options.resolution,
      bbox: null
    };

    data.vectorLayers = this.findVector() || [];
    data.wmsLayers = this.findWMS() || [];
    data.wmtsLayers = this.findWMTS() || [];
    data.arcgisLayers = this.findArcGIS() || [];

    dx = Math.abs(left - right);
    dy = Math.abs(bottom - top);

    data.size = [
      parseInt(options.size.width * dpi),
      parseInt(options.size.height * dpi)
    ];

    data.bbox = [left, right, bottom, top];
    data.orientation = options.orientation;
    data.format = options.format;
    data.scale = options.scale;
    data.proxyUrl = this.get('proxyUrl');

    this.set("downloadingPdf", true);
    var dataString = '';
    if (this.get('base64Encode')){ // base64 here
      dataString = btoa(JSON.stringify(data));
    } else {
      dataString = JSON.stringify(data);
    }
    $.ajax({
        url: url,
        method: "post",
        data: {
          json: dataString
        },
        format: "json",
        success: (url) => {
        this.set("downloadingPdf", false);
        this.set("urlPdf", url);
      },
      error: (err) => {
        this.set("downloadingPdf", false);
        alert("Ett eller flera av lagren du försöker skriva ut klarar inte de angivna inställningarna. Prova med en mindre pappersstorlek eller lägre upplösning.");
      }
    });

    callback();
  },

  resolutionToScale: function(dpi, resolution) {
    var inchesPerMeter = 39.37;
    return resolution * dpi * inchesPerMeter;
  },

    /**
     * Send the map as a PDF-file by email
     * @instance
     * @param {object} options
     * @param {function} callback
     */
    sendPDF: function(options, callback) {

      var extent = this.previewLayer.getSource().getFeatures()[0].getGeometry().getExtent()
      ,   left   = extent[0]
      ,   right  = extent[2]
      ,   bottom = extent[1]
      ,   top    = extent[3]
      ,   scale  = options.scale
      ,   dpi    = options.resolution
      ,   form   = document.createElement('form')
      ,   input  = document.createElement('input')
      ,   curr   = document.getElementById(this.exportHitsFormId)
      ,   url    = this.get('exportMailUrl') ///mapservice/export/email
      ,   data   = {
        wmsLayers: [],
        vectorLayers: [],
        size: null,
        resolution: options.resolution,
        bbox: null
      };

      data.vectorLayers = this.findVector() || [];
      data.wmsLayers = this.findWMS() || [];
      data.wmtsLayers = this.findWMTS() || [];
      data.arcgisLayers = this.findArcGIS() || [];

      dx = Math.abs(left - right);
      dy = Math.abs(bottom - top);

      data.size = [
        parseInt(options.size.width * dpi),
        parseInt(options.size.height * dpi)
      ];

      data.bbox = [left, right, bottom, top];
      data.orientation = options.orientation;
      data.format = options.format;
      data.scale = options.scale;
      data.proxyUrl = this.get('proxyUrl');
      data.documentUrl = options.documentUrl;
      data.emailAddress = options.emailAddress;

      this.set("sendingMessage", true);

      $.ajax({
        url: url,
        method: "post",
        data: {
          documentUrl: data.documentUrl,
          paperSize: data.format,
          emailAddress: data.emailAddress
        },
        format: "json",
        success: (url) => {
          this.set("sendingMessage", false);
          this.set("messageSent", url);
        },
        error: (err) => {
          this.set("sendingMessage", false);
          alert("Ett eller flera av lagren du försöker skriva ut klarar inte de angivna inställningarna. Prova med en mindre pappersstorlek eller lägre upplösning.");
        }
      });

      callback();
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
 * Eport model module.<br>
 * Use <code>require('models/export')</code> for instantiation.
 * @module MailExportModel-module
 * @returns {MailExportModel}
 */
module.exports = ToolModel.extend(MailExportModel);
