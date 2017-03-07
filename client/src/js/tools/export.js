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
 * @typedef {Object} ExportModel~ExportModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Skriv ut
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-print icon
 * @property {string} exportUrl - Default: /mapservice/export/pdf
 * @property {string} exportTiffUrl - Default: /mapservice/export/tiff
 * @property {string} copyright - Default: © Lantmäteriverket i2009/00858
 */
var ExportModelProperties = {
  type: 'export',
  panel: 'exportpanel',
  title: 'Skriv ut',
  toolbar: 'bottom',
  icon: 'fa fa-print icon',
  exportUrl: '/mapservice/export/pdf',
  exportTiffUrl: '/mapservice/export/tiff',
  copyright: "© Lantmäteriverket i2009/00858",
  activeTool: 'pdf',
  scales: [1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000]
};

/**
 * Prototype for creating an draw model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {ExportModel~ExportModelProperties} options - Default options
 */
var ExportModel = {
  /**
   * @instance
   * @property {ExportModel~ExportModelProperties} defaults - Default settings
   */
  defaults: ExportModelProperties,

  configure: function (shell) {
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

  removeTiffPreview: function() {
    this.get('transform').clear();
    this.get('olMap').removeInteraction(this.get('transform'));
    this.previewLayer.getSource().clear();
    this.set('previewFeature', undefined);
    this.get('olMap').set('clickLock', false);
  },

  /**
   * Get the preview feature.
   * @instance
   * @return {external:"ol.feature"} preview feature
   */
  getPreviewFeature: function () {
    return this.get('previewFeature')
  },

  addTiffPreview: function (center) {
    var dpi = 25.4 / 0.28
    ,   ipu = 39.37
    ,   sf  = 1
    ,   w   = (210 / dpi / ipu * 10000 / 2) * sf
    ,   y   = (297 / dpi  / ipu * 10000 / 2) * sf
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

    var features = new ol.Collection();
    features.push(feature);

    this.set('transform', new ol.interaction.Transform({
      translateFeature: true,
      scale: true,
      rotate: false,
      keepAspectRatio: false,
      translate: true,
      stretch: false,
      features: features
    }));
    this.get('olMap').addInteraction(this.get('transform'));
    this.get('olMap').set('clickLock', true);
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

    function asObject(style) {

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
      ,   fontColor = "#FFFFFF";

      if (style.getFill && style.getFill()) {
        fillColor = style.getFill().getColor().toHex();
        fillOpacity = style.getFill().getColor().toOpacity();
      }

      if (style.getFill && style.getStroke()) {

        strokeColor = style.getStroke().getColor().toHex();
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
        fontColor: fontColor
      }
    }

    function as2DPairs(coordinates) {
      return (
        coordinates
        .toString()
        .split(',')
        .map(i => parseFloat(i))
        .filter(i => i > 2500)
        .reduce((r, n, i, a) => {
          if (i % 2 !== 0) {
            r.push([a[i - 1], a[i]]);
          }
          return r;
        }, [])
      );
    }

    function translateVector(features, sourceStyle) {

      function getText(feature) {
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
          return feature.getStyle()[1].getText().getText();
        }
      }

      return {
        features: features.map(feature => {

          var type = feature.getGeometry().getType();

          if (!feature.getStyle() && sourceStyle) {
            feature.setStyle(sourceStyle)
          }

          return {
            type: type,
            attributes: {
              text: getText(feature),
              style: asObject(feature.getStyle())
            },
            coordinates: type === "Circle"
              ? as2DPairs(feature.getGeometry().getCenter()).concat([[feature.getGeometry().getRadius(), 0]]) 
              : as2DPairs(feature.getGeometry().getCoordinates())
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

    imageVectorLayers = imageVectorLayers.map(layer =>
      translateVector(layer.getSource().getSource().getFeaturesInExtent(extent), layer.getSource().getStyle()()[0])
    ).filter(layer => layer.features.length > 0);

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
  exportMap: function(callback, size) {
    var map = this.get('olMap');
    map.once('postcompose', (event) => {
      var href
      ,   anchor
      ,   canvas
      ,   context
      ,   exportImage
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
  exportImage: function(callback) {
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
      parseInt(49.65 * (dx / scale) * dpi),
      parseInt(49.65 * (dy / scale) * dpi)
    ];

    data.bbox = [left, right, bottom, top];
    data.orientation = options.orientation;
    data.format = options.format;
    data.scale = options.scale;

    form.id = this.exportHitsFormId;
    form.method = "post";
    form.action = this.get('exportUrl');
    input.value = JSON.stringify(data);
    input.name  = "json";
    input.type  = "hidden";
    form.appendChild(input);

    if (curr)
      document.body.replaceChild(form, curr);
    else
      document.body.appendChild(form);

    form.submit();

    callback();
  },

  resolutionToScale: function(dpi, resolution) {
    var inchesPerMeter = 39.37;
    return resolution * dpi * inchesPerMeter;
  },

  exportTIFF: function() {
    var extent = this.previewLayer.getSource().getFeatures()[0].getGeometry().getExtent()
    ,   left   = extent[0]
    ,   right  = extent[2]
    ,   bottom = extent[1]
    ,   top    = extent[3]
    ,   dpi    = (25.4 / 0.28)
    ,   scale  = this.resolutionToScale(dpi, this.get('olMap').getView().getResolution())
    ,   form   = document.createElement('form')
    ,   input  = document.createElement('input')
    ,   curr   = document.getElementById(this.exportHitsFormId)
    ,   data   = {
      wmsLayers: [],
      vectorLayers: [],
      size: null,
      bbox: null
    };

    data.vectorLayers = this.findVector() || [];
    data.wmsLayers = this.findWMS() || [];
    data.wmtsLayers = this.findWMTS() || [];
    data.arcgisLayers = this.findArcGIS() || [];

    dx = Math.abs(left - right);
    dy = Math.abs(bottom - top);

    data.size = [
      parseInt(49.65 * (dx / scale) * dpi),
      parseInt(49.65 * (dy / scale) * dpi)
    ];

    data.resolution = 96;
    data.bbox = [left, right, bottom, top];
    data.orientation = "";
    data.format = "";
    data.scale = scale;

    form.id = this.exportHitsFormId;
    form.method = "post";
    form.action = this.get('exportTiffUrl');
    input.value = JSON.stringify(data);
    input.name  = "json";
    input.type  = "hidden";
    form.appendChild(input);

    if (curr)
      document.body.replaceChild(form, curr);
    else
      document.body.appendChild(form);

    form.submit();
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
  clicked: function () {
    this.set('visible', true);
  }

};

/**
 * Eport model module.<br>
 * Use <code>require('models/export')</code> for instantiation.
 * @module ExportModel-module
 * @returns {ExportModel}
 */
module.exports = ToolModel.extend(ExportModel);
