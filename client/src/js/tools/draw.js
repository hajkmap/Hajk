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

var ToolModel = require('tools/tool');
var kmlWriter = require('utils/kmlwriter');
var source;
var olMap;

/**
 * @typedef {Object} DrawModel~DrawModelProperties
 * @property {string} type - Default: 'draw'
 * @property {string} panel - Default: 'DrawPanel'
 * @property {string} title - Default: 'Ritverktyg'
 * @property {string} toolbar - Default: 'bottom'
 * @property {string} visible - Default: false
 * @property {string} icon - Default: 'fa fa-pencil icon'
 * @property {string} drawLayerName - Default: 'draw-layer'
 * @property {external:"ol.layer"} drawLayer - Default: undefined
 * @property {object} drawTool - Default: undefined
 * @property {object} removeTool - Default: undefined
 * @property {external:"ol.map"} olMap - Default: undefined
 * @property {external:"ol.source"} source - Default: undefined
 * @property {boolean} showLabels - Default: false
 * @property {boolean} dialog - Default: false
 * @property {boolean} kmlImport - Default: false
 * @property {boolean} kmlExportUrl - Default: false
 * @property {string} fontSize - Default: 10px
 * @property {string} fontColor - Default: "rgb(255, 255, 255)"
 * @property {string} fontBackColor - Default: "rgb(0, 0, 0)"
 * @property {string} pointText - Default: "Text"
 * @property {string} pointColor - Default: "rgb(15, 175, 255)"
 * @property {number} pointRadius - Default: 7
 * @property {boolean} pointSymbol - Default: false
 * @property {string} markerImg - Default: "http://localhost/gbg/assets/icons/marker.png"
 * @property {string} lineColor - Default: "rgb(15, 175, 255)"
 * @property {number} lineWidth - Default: 3
 * @property {string} lineStyle - Default: "solid"
 * @property {string} circleFillColor - Default: "rgb(255, 255, 255)"
 * @property {number} circleFillOpacity - Default: 0.5
 * @property {string} circleLineColor - Default: "rgb(15, 175, 255)"
 * @property {string} polygonLineColor - Default: "rgb(15, 175, 255)"
 * @property {number} polygonLineWidth - Default: 3
 * @property {string} polygonLineStyle - Default: "solid"
 * @property {string} polygonFillColor - Default: "rgb(255, 255, 255)"
 * @property {number} polygonFillOpacity - Default: 0.5
 * @property {Array<{external:"ol.Style"}>} scetchStyle
 * @property {string} boxLineColor - Default: "rgb(15, 175, 255)"
 * @property {number} boxLineWidth - Default: 3
 * @property {string} boxLineStyle - Default: "solid"
 * @property {string} boxFillColor - Default: "rgb(255, 255, 255)"
 * @property {number} boxFillOpacity - Default: 0.5
 */
var DrawModelProperties = {
  type: 'draw',
  panel: 'DrawPanel',
  title: 'Rita och mäta',
  toolbar: 'bottom',
  visible: false,
  icon: 'fa fa-pencil icon',
  drawLayerName: 'draw-layer',
  drawLayer: undefined,
  drawTool: undefined,
  removeTool: undefined,
  olMap: undefined,
  source: undefined,
  showLabels: false,
  dialog: false,
  kmlImport: false,
  kmlExportUrl: false,
  fontSize: '10',
  fontColor: 'rgb(255, 255, 255)',
  fontBackColor: 'rgb(0, 0, 0)',
  pointText: 'Text',
  pointColor: 'rgb(15, 175, 255)',
  pointSettings: 'point',
  pointRadius: 7,
  pointSymbol: false,
  icons: '',
  instruction: '',
  markerImg: window.location.href + 'assets/icons/marker.png',
  lineColor: 'rgb(15, 175, 255)',
  lineWidth: 3,
  lineStyle: 'solid',
  circleFillColor: 'rgb(255, 255, 255)',
  circleLineColor: 'rgb(15, 175, 255)',
  circleFillOpacity: 0.5,
  circleLineStyle: 'solid',
  circleLineWidth: 3,
  polygonLineColor: 'rgb(15, 175, 255)',
  polygonLineWidth: 3,
  polygonLineStyle: 'solid',
  polygonFillColor: 'rgb(255, 255, 255)',
  polygonFillOpacity: 0.5,
  base64Encode: false,
  boxFillColor: 'rgb(255, 255, 255)',
  boxLineColor: 'rgb(15, 175, 255)',
  boxFillOpacity: 0.5,
  boxLineStyle: 'solid',
  boxLineWidth: 3,
  scetchStyle: [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        width: 4
      }),
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 0.5)',
          width: 2
        })
      })
    })]
};

/**
 * Prototype for creating an draw model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {DrawModel~DrawModelProperties} options - Default options
 */
var DrawModel = {
  /**
   * @instance
   * @property {DrawModel~DrawModelProperties} defaults - Default settings
   */
  defaults: DrawModelProperties,

  /**
   * @instance
   * @property {object} measureTooltipElement
   */
  measureTooltipElement: undefined,

  /**
   * @instance
   * @property {object} measureTooltip
   */
  measureTooltip: undefined,

  /**
   * @instance
   * @property {number} exportHitsFormId
   */
  exportHitsFormId: 12345,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);

    this.set('editOpenDialogBinded', null);
  },

  configure: function (shell) {
    source = new ol.source.Vector({ wrapX: false });
    olMap = shell.getMap().getMap();
    this.set('source', source);

    this.set('drawLayer', new ol.layer.Vector({
      source: this.get('source'),
      queryable: false,
      name: this.get('drawLayerName'),
      style: (feature) => this.getStyle(feature)
    }));

    this.set('olMap', olMap);
    this.get('olMap').addLayer(this.get('drawLayer'));
    this.set('drawLayer', this.get('drawLayer'));
    if (this.get('icons') !== '') {
      let icon = this.get('icons').split(',')[0];
      this.set('markerImg', window.location.href + 'assets/icons/' + icon + '.png');
    }
    this.createMeasureTooltip();
  },

  editOpenDialog: function (event) {
    this.get('olMap').forEachFeatureAtPixel(event.pixel, (feature) => {
      if (typeof feature.getProperties().description !== 'undefined') {
        feature.setStyle(this.get('scetchStyle'));
        this.set('dialog', true);
        this.set('drawFeature', feature);
        this.set('editing', true);
      }
    });
  },

  /**
   * Removes the selected feature from source.
   * @instance
   * @params {external:"ol.event.Event"} event
   */
  removeSelected: function (event) {
    var first = true;
    olMap.forEachFeatureAtPixel(event.pixel, (feature) => {
      if (feature.getProperties().user === true && first) {
        source.removeFeature(feature);
      }
      first = false;
    });
  },

  /**
   * Activate tool for feature removal.
   * @instance
   */
  activateRemovalTool: function () {
    var dragInteraction = this.getDragInteraction();
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').removeInteraction(this.get('editTool'));
    this.get('olMap').set('clickLock', true);
    this.get('olMap').un('singleclick', this.get('editOpenDialogBinded'));
    this.get('olMap').on('singleclick', this.removeSelected);
    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer('draw-layer');
    }
  },

  /**
   * Activate tool for feature edit.
   * @instance
   */
  activateEditTool: function () {
    var dragInteraction = this.getDragInteraction(),
      revision = 1,
      features = new ol.Collection();

    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').un('singleclick', this.get('editOpenDialogBinded'));
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').removeInteraction(this.get('editTool'));
    this.get('olMap').set('clickLock', true);
    this.set('drawToolActive', true);

    this.set('editOpenDialogBinded', this.editOpenDialog.bind(this));

    this.get('olMap').on('singleclick', this.get('editOpenDialogBinded'));

    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer('draw-layer');
    }
    this.get('source').getFeatures().forEach(f => {
      features.push(f);
    });

    this.set('editTool', new ol.interaction.Modify({
      features: features
    }));

    this.get('olMap').addInteraction(this.get('editTool'));

    this.get('editTool').on('modifyend', e => {
      this.measureTooltip.setPosition(undefined);
      e.features.forEach(this.updateFeatureText.bind(this));
    });
  },

  /**
   * Update features text.
   * @instance
   */
  updateFeatureText: function (feature) {
    var labelText,
      style;
    this.setFeaturePropertiesFromGeometry(feature);

    labelText = this.getLabelText(feature);
    style = feature.getStyle()[1] || feature.getStyle()[0];

    if (style && style.getText() !== null) {
      style.getText().setText(labelText);
    }
  },

  /**
   * Get map´s first drag interaction, if any.
   * @instance
   */
  getDragInteraction: function () {
    return this.get('olMap')
      .getInteractions()
      .getArray()
      .filter(interaction =>
        interaction instanceof ol.interaction.Drag
      )[0];
  },

  /**
   * Activate drag intecation for draw layer.
   * @instance
   */
  activateMoveTool: function () {
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').removeInteraction(this.get('editTool'));
    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').un('singleclick', this.get('editOpenDialogBinded'));
    this.set('drawToolActive', false);
    var dragInteraction = this.getDragInteraction();
    if (dragInteraction) {
      dragInteraction.addAcceptedLayer('draw-layer');
    }
  },

  /**
   * Remove the last edited feature from soruce.
   * @instance
   */
  removeEditFeature: function () {
    if (!this.get('editing') && this.get('drawFeature') && (typeof this.get('drawFeature').getProperties().description === 'undefined' ||
    this.get('drawFeature').getProperties().description === '')) {
      this.get('source').removeFeature(this.get('drawFeature'));
    } else if (this.get('editing')) {
      var feature = this.get('drawFeature');
      this.set('pointText', feature.getProperties().description);
      this.setFeaturePropertiesFromText(feature, feature.getProperties().description || '');
      feature.setStyle(this.getStyle(feature));
    }
  },

  /**
   * Event handler to excecute after features are drawn.
   * @params: {external:"ol.feature"} type
   * @params: {string} type
   * @instance
   */
  handleDrawEnd: function (feature, type) {
    if (type === undefined) { return; }
    if (type === 'Text') {
      feature.setStyle(this.get('scetchStyle'));
      this.set('dialog', true);
      this.set('editing', false);
      this.set('drawFeature', feature);
    } else {
      this.setFeaturePropertiesFromGeometry(feature);
      feature.setStyle(this.getStyle(feature));
    }
    this.measureTooltip.setPosition(undefined);
  },

  /**
   * Event handler to excecute when the users starts to draw.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  handleDrawStart: function (e, geometryType) {
    var circleRadius = parseFloat(this.get('circleRadius'));

    if (!isNaN(circleRadius) && geometryType === 'Circle') {
      this.get('drawTool').finishDrawing();
      e.feature.getGeometry().setRadius(circleRadius);
    }

    e.feature.getGeometry().on('change', e => {
      var toolTip = '',
        coord = undefined,
        pointerCoord;

      if (this.get('drawToolActive')) {
        if (this.get('pointerPosition')) {
          pointerCoord = this.get('pointerPosition').coordinate;
        }

        if (e.target instanceof ol.geom.LineString) {
          toolTip = this.formatLabel('length', e.target.getLength());
          coord = e.target.getLastCoordinate();
        }

        if (e.target instanceof ol.geom.Polygon) {
          toolTip = this.formatLabel('area', e.target.getArea());
          coord = pointerCoord || e.target.getFirstCoordinate();
        }

        if (e.target instanceof ol.geom.Circle) {
          toolTip = this.formatLabel('length', e.target.getRadius());
          coord = pointerCoord;
        }

        this.measureTooltipElement.innerHTML = toolTip;
        if (this.get('showLabels') && coord) {
          this.measureTooltip.setPosition(coord);
        }
      }
    });
  },

  /**
   * Create draw interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  createMeasureTooltip: function () {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'tooltip-draw tooltip-measure';
    this.measureTooltip = new ol.Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center'
    });
    this.get('olMap').addOverlay(this.measureTooltip);
  },

  /**
   * Create draw interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  formatLabel: function (type, value) {
    if (type === 'point') {
      label = 'Nord: ' + value[0] + ' Öst: ' + value[1];
    }

    if (typeof value === 'number') {
      value = Math.round(value);
    }

    if (type === 'circle') {
      let prefix = ' m';
      let prefixSq = ' m²';
      if (value >= 1E3) {
        prefix = ' km';
        value = value / 1E3;
      }
      label = (
        'R = ' + value + prefix +
        ' \nA = ' + (Math.round((value * value * Math.PI) * 1E3) / 1E3) + prefixSq
      );
    }

    if (type === 'area') {
      let prefix = ' m²';
      if (value >= 1E6) {
        prefix = ' km²';
        value = Math.round((value / 1E6) * 1E3) / 1E3;
      }
      label = value + prefix;
    }

    if (type === 'length') {
      let prefix = ' m';
      if (value >= 1E3) {
        prefix = ' km';
        value = value / 1E3;
      }
      label = value + prefix;
    }

    return label;
  },

  /**
   * Create draw interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  activateDrawTool: function (type) {
    var style = undefined,
      drawTool = undefined,
      geometryType = undefined,
      dragInteraction = this.getDragInteraction(),
      olMap = this.get('olMap'),
      geometryFunction = undefined,
      geometryName = undefined;
    olMap.un('singleclick', this.removeSelected);
    olMap.un('singleclick', this.get('editOpenDialogBinded'));
    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer('draw-layer');
    }
    olMap.removeInteraction(this.get('drawTool'));
    olMap.removeInteraction(this.get('editTool'));
    this.measureTooltip.setPosition(undefined);

    if (type === 'Box') {
      type = 'Circle';
      geometryName = 'Box';
      geometryFunction = ol.interaction.Draw.createBox();
      this.set('circleRadius', undefined);
    } else {
      geometryName = type;
    }

    geometryType = type !== 'Text' ? type : 'Point';

    drawTool = new ol.interaction.Draw({
      source: this.get('source'),
      style: this.get('scetchStyle'),
      type: geometryType,
      geometryFunction: geometryFunction,
      geometryName: geometryName
    });

    olMap.on('pointermove', this.setPointerPosition.bind(this));

    drawTool.on('drawstart', e => {
      this.handleDrawStart(e, geometryType);
    });

    drawTool.on('drawend', (event) => {
      this.handleDrawEnd(event.feature, type);
    });

    this.set('drawTool', drawTool);
    olMap.addInteraction(this.get('drawTool'));
    olMap.set('clickLock', true);
    this.set('drawToolActive', true);
  },

  /**
   * Remove all interactions from the map.
   * @instance
   */
  abort: function () {
    var dragInteraction = this.getDragInteraction();
    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').un('singleclick', this.get('editOpenDialogBinded'));
    this.get('olMap').un('pointermove', this.setPointerPosition);
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').removeInteraction(this.get('editTool'));
    this.get('olMap').set('clickLock', false);
    this.set('drawToolActive', false);
    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer('draw-layer');
    }
  },

  /**
   * Clear the source from features.
   * @instance
   */
  clear: function () {
    this.get('source').clear();
  },

  /**
   * Extract style info from ol Style object.
   * @instance
   * @param {external:"ol.style.Style"} style
   * @return {object} style
   */
  extractStyle: function (style) {
    var obj = {
      text: '',
      image: '',
      pointRadius: 0,
      pointColor: '',
      fillColor: '',
      strokeColor: '',
      strokeWidth: '',
      strokeDash: ''
    };

    obj.text = style.getText() ? style.getText().getText() : '';
    obj.image = style.getImage() instanceof ol.style.Icon ? style.getImage().getSrc() : '';
    obj.pointRadius = style.getImage() instanceof ol.style.Circle ? style.getImage().getRadius() : '';
    obj.pointColor = style.getImage() instanceof ol.style.Circle ? style.getImage().getFill().getColor() : '';
    obj.fillColor = style.getFill().getColor();
    obj.strokeColor = style.getStroke().getColor();
    obj.strokeWidth = style.getStroke().getWidth();
    obj.strokeDash = style.getStroke().getLineDash();

    return obj;
  },

  /**
   * Checks if a proxy url is set.
   * @instance
   * @param {string} url
   * @return {string} url
   */
  validateProxyUrl: function (url) {
    if (this.get('proxyUrl')) {
      return this.get('proxyUrl') + url.substr(url.indexOf('/Temp/'));
    } else {
      return url;
    }
  },

  /**
   * Export draw layer.
   * @instance
   */
  export: function () {
    var features = this.get('drawLayer').getSource().getFeatures(),
      transformed = [],
      postData,
      form = document.createElement('form'),
      input = document.createElement('input'),
      curr = document.getElementById(this.exportHitsFormId);

    if (features.length === 0) {
      this.set({
        'kmlExportUrl': 'NO_FEATURES'
      });
      return false;
    }

    features.forEach((feature) => {
      var c = feature.clone();
      if (c.getGeometry() instanceof ol.geom.Circle) {
        let geom = ol.geom.Polygon.fromCircle(feature.getGeometry(), 96);
        c.setGeometry(geom);
      }
      c.getGeometry().transform(this.get('olMap').getView().getProjection(), 'EPSG:4326');

      if (c.getStyle()[1]) {
        c.setProperties({
          style: JSON.stringify(this.extractStyle(c.getStyle()[1] || c.getStyle()[0]))
        });
      }

      transformed.push(c);
    });

    postData = kmlWriter.createXML(transformed, 'ritobjekt');
    if (this.get('base64Encode')) {
      postData = btoa(postData);
    }

    this.set('downloadingDrawKml', true);
    $.ajax({
      url: this.get('exportUrl'),
      method: 'post',
      data: {
        json: postData
      },
      format: 'json',
      success: (url) => {
        this.set('downloadingDrawKml', false);
        this.set('kmlExportUrl', this.validateProxyUrl(url));
      },
      error: (err) => {
        this.set('downloadingDrawKml', false);
        alert('Något gick fel. Försök igen');
      }
    });
  },

  /**
   * Set the features style from based upon its properties.
   * @param {external:"ol.feature"}
   * @instance
   */
  setStyleFromProperties: function (feature) {
    if (feature.getProperties().style) {
      try {
        let style = JSON.parse(feature.getProperties().style);
        if (style.text) {
          this.setFeaturePropertiesFromText(feature);
          if (style.pointRadius > 0) {
            this.setFeaturePropertiesFromGeometry(feature);
          }
        } else {
          this.setFeaturePropertiesFromGeometry(feature);
        }
        feature.setStyle(this.getStyle(feature, style));
      } catch (ex) {
        console.error('Style attribute could not be parsed.', ex);
      }
    } else {
      // https://github.com/openlayers/openlayers/issues/3262
      let func = feature.getStyleFunction();
      if (func) {
        let style = func.call(feature, this.get('olMap').getView().getResolution());
        if (style[0] && style[0].getFill && style[0].getFill() === null) {
          style[0].setFill(new ol.style.Fill({
            color: [0, 0, 0, 0]
          }));
        }
        feature.setStyle(style);
      }
    }
  },

  /**
   * Calculate extent of given features
   * @instance
   * @param {array} features
   * @return {external:ol.Extent} extent
   */
  calculateExtent (features) {
    var x = [];
    features.forEach((feature, i) => {
      var e = feature.getGeometry().getExtent(); // l b r t
      if (i === 0) {
        x = e;
      } else {
        let t = 0;
        for (;t < 4; t++) {
          if (t < 2) {
            if (x[t] > e[t]) {
              x[t] = e[t];
            }
          } else {
            if (x[t] < e[t]) {
              x[t] = e[t];
            }
          }
        }
      }
    });
    return x.every(c => c) ? x : false;
  },

  /**
   * Import draw layer and add features to the map.
   * @instance
   * @param {XMLDocument} xmlDocument
   */
  importDrawLayer: function (xmlDoc) {
    var clonedNode = xmlDoc.childNodes[0].cloneNode(true),
      serializer = new XMLSerializer(),
      kml_string = serializer.serializeToString(clonedNode),
      parser = new ol.format.KML(),
      features = parser.readFeatures(kml_string),
      extent = false;

    features.forEach((feature) => {
      coordinates = feature.getGeometry().getCoordinates();
      type = feature.getGeometry().getType();
      newCoordinates = [];
      feature.setProperties({
        user: true
      });
      if (type == 'LineString') {
        coordinates.forEach((c, i) => {
          pairs = [];
          c.forEach((digit) => {
            if (digit != 0) { pairs.push(digit); }
          });
          newCoordinates.push(pairs);
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      } else if (type == 'Polygon') {
        newCoordinates[0] = [];
        coordinates.forEach((polygon, i) => {
          polygon.forEach((vertex, j) => {
            pairs = [];
            vertex.forEach((digit) => {
              if (digit != 0) { pairs.push(digit); }
            });
            newCoordinates[0].push(pairs);
          });
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      }

      feature.getGeometry().transform(
        'EPSG:4326',
        this.get('olMap').getView().getProjection()
      );
      this.setStyleFromProperties(feature);
    });

    this.get('drawLayer').getSource().addFeatures(features);
    extent = this.calculateExtent(features);

    if (extent) {
      let size = this.get('olMap').getSize();
      this.get('olMap').getView().fit(extent, size);
    }
  },

  /**
   * Trigger kml import
   * @instance
   */
  import: function () {
    this.set('kmlImport', true);
  },

  /**
   * Get styles array.
   * @instance
   * @param {external:"ol.feature"} feature
   * @param {boolean} forcedProperties - Force certain properties to be taken directly from the feature.
   * @return {Array<{external:"ol.style"}>} style
   *
   */
  getStyle: function (feature, forcedProperties) {
    var geometryName = feature.getGeometryName();
    function getLineDash () {
      var scale = (a, f) => a.map(b => f * b),
        width = lookupWidth.call(this),
        style = lookupStyle.call(this),
        dash = [12, 7],
        dot = [2, 7]
        ;
      switch (style) {
        case 'dash':
          return width > 3 ? scale(dash, 2) : dash;
        case 'dot':
          return width > 3 ? scale(dot, 2) : dot;
        default :
          return undefined;
      }
    }

    function getFill () {
      function rgba () {
        switch (geometryName) {
          case 'Circle':
            return this.get('circleFillColor')
              .replace('rgb', 'rgba')
              .replace(')', `, ${this.get('circleFillOpacity')})`);

          case 'Polygon':
            return this.get('polygonFillColor')
              .replace('rgb', 'rgba')
              .replace(')', `, ${this.get('polygonFillOpacity')})`);

          case 'Box':
            return this.get('boxFillColor')
              .replace('rgb', 'rgba')
              .replace(')', `, ${this.get('boxFillOpacity')})`);
        }
      }

      var color = forcedProperties ? forcedProperties.fillColor : rgba.call(this);
      var fill = new ol.style.Fill({
        color: color
      });

      return fill;
    }

    function lookupStyle () {
      switch (geometryName) {
        case 'Polygon':
          return this.get('polygonLineStyle');
        case 'Circle':
          return this.get('circleLineStyle');
        case 'Box':
          return this.get('boxLineStyle');
        default:
          return this.get('lineStyle');
      }
    }

    function lookupWidth () {
      switch (geometryName) {
        case 'Polygon':
          return this.get('polygonLineWidth');
        case 'Circle':
          return this.get('circleLineWidth');
        case 'Box':
          return this.get('boxLineWidth');
        default:
          return this.get('lineWidth');
      }
    }

    function lookupColor () {
      if (forcedProperties) {
        return forcedProperties.strokeColor;
      }
      switch (geometryName) {
        case 'Polygon':
          return this.get('polygonLineColor');
        case 'Circle':
          return this.get('circleLineColor');
        case 'Box':
          return this.get('boxLineColor');
        default:
          return this.get('lineColor');
      }
    }

    function getStroke () {
      var color = forcedProperties
        ? forcedProperties.strokeColor
        : lookupColor.call(this);

      var width = forcedProperties
        ? forcedProperties.strokeWidth
        : lookupWidth.call(this);

      var lineDash = forcedProperties
        ? forcedProperties.strokeDash
        : getLineDash.call(this);

      var stroke = new ol.style.Stroke({
        color: color,
        width: width,
        lineDash: lineDash
      });

      return stroke;
    }

    function getImage () {
      var radius = type === 'Text' ? 0 : forcedProperties ? forcedProperties.pointRadius : this.get('pointRadius');
      var iconSrc = forcedProperties ? (forcedProperties.image || this.get('markerImg')) : this.get('markerImg');

      var icon = new ol.style.Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: iconSrc
      });

      var dot = new ol.style.Circle({
        radius: radius,
        fill: new ol.style.Fill({
          color: forcedProperties ? forcedProperties.pointColor : this.get('pointColor')
        }),
        stroke: new ol.style.Stroke({
          color: 'rgb(255, 255, 255)',
          width: 2
        })
      });

      if (forcedProperties) {
        if (forcedProperties.image) {
          return icon;
        } else {
          return dot;
        }
      }

      if (this.get('pointSymbol') && type !== 'Text') {
        return icon;
      } else {
        return dot;
      }
    }

    function getText () {
      var offsetY = () => {
        var offset = -15;

        if (this.get('pointSymbol')) { offset = -40; }

        if (type === 'Text') { offset = 0; }

        return offset;
      };

      return new ol.style.Text({
        textAlign: 'center',
        textBaseline: 'middle',
        font: `${this.get('fontSize')}px sans-serif`,
        text: forcedProperties ? forcedProperties.text : this.getLabelText(feature),
        fill: new ol.style.Fill({color: this.get('fontColor')}),
        stroke: new ol.style.Stroke({color: this.get('fontBackColor'), width: 3}),
        offsetX: type === 'Text' ? 0 : 10,
        offsetY: offsetY(),
        rotation: 0,
        scale: 1.4
      });
    }

    var type = feature.getProperties().type;

    return [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 0.5)',
          width: type === 'Polygon'
            ? this.get('polygonLineWidth') + 2
            : this.get('lineWidth') + 2
        })
      }),
      new ol.style.Style({
        fill: getFill.call(this),
        stroke: getStroke.call(this),
        image: getImage.call(this),
        text: getText.call(this)
      })
    ];
  },

  /**
   * Generate feature label text from properties.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {string} label
   *
   */
  getLabelText: function (feature) {
    var show = this.get('showLabels'),
      props = feature.getProperties(),
      type = feature.getProperties().type;

    if (typeof props.description !== 'undefined') {
      type = 'Text';
    }

    switch (type) {
      case 'Point': return show ? this.formatLabel('point', [props.position.n, props.position.e]) : '';
      case 'LineString': return show ? this.formatLabel('length', props.length) : '';
      case 'Polygon': return show ? this.formatLabel('area', props.area) : '';
      case 'Circle': return show ? this.formatLabel('circle', props.radius) : '';
      case 'Text': return props.description;
      case 'Box': return show ? this.formatLabel('area', props.area) : '';
      default: return '';
    }
  },

  /**
   * Set the property wich will show/hide labels and update the source.
   * @instance
   * @return {boolean} showLabels
   */
  toggleLabels: function () {
    this.set('showLabels', !this.get('showLabels'));
    this.get('source').changed();

    source.forEachFeature(feature => {
      if (feature.getProperties().type !== 'Text' && typeof feature.getProperties().description === 'undefined' && feature.getStyle()) {
        let style = feature.getStyle();
        if (this.get('showLabels')) {
          if (style[1]) {
            style[1].getText().setText(this.getLabelText(feature));
          } else if (style[0]) {
            style[0].getText().setText(this.getLabelText(feature));
          }
        } else {
          if (style[1]) {
            style[1].getText().setText('');
          } else if (style[0]) {
            style[0].getText().setText('');
          }
        }
      } else if (feature.getProperties().type === 'Text' || typeof feature.getProperties().description !== 'undefined') {
        let style = feature.getStyle();
        if (style[1]) {
          style[1].getText().setText(this.getLabelText(feature));
        } else if (style[0]) {
          style[0].getText().setText(this.getLabelText(feature));
        }
      }
    });

    return this.get('showLabels');
  },

  /**
   * Update any feature with property to identify feature as text feature.
   * @instance
   * @params {external:"ol.feature"} feature
   * @params {string} text
   */
  setFeaturePropertiesFromText: function (feature, text) {
    if (!feature) return;
    feature.setProperties({
      type: 'Text',
      user: true,
      description: text
    });
  },

  /**
   * Update any feature with properties from its own geometry.
   * @instance
   * @params {external:"ol.feature"} feature
   */
  setFeaturePropertiesFromGeometry: function (feature) {
    if (!feature) return;
    var geom,
      type = '',
      lenght = 0,
      radius = 0,
      area = 0,
      position = {
        n: 0,
        e: 0
      }
    ;
    geom = feature.getGeometry();
    type = geom.getType();
    switch (type) {
      case 'Point':
        position = {
          n: Math.round(geom.getCoordinates()[1]),
          e: Math.round(geom.getCoordinates()[0])
        };
        break;
      case 'LineString' :
        length = Math.round(geom.getLength());
        break;
      case 'Polygon':
        area = Math.round(geom.getArea());
        break;
      case 'Circle':
        radius = Math.round(geom.getRadius());
        if (radius === 0) 
          radius = parseFloat(this.get('circleRadius'));
        break;
      default:
        break;
    }
    feature.setProperties({
      type: type,
      user: true,
      length: length,
      area: area,
      radius: radius,
      position: position
    });
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
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setCircleRadius: function (radius) {
    this.set('circleRadius', radius);
  },

  /**
   * Set the property pointSettings
   * @param {string} color
   * @instance
   */
  setPointSettings: function (value) {
    this.set('pointSettings', value);
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setPointColor: function (color) {
    this.set('pointColor', color);
  },
  /**
   * Set the property pointRadius
   * @param {number} radius
   * @instance
   */
  setPointRadius: function (radius) {
    this.set('pointRadius', radius);
  },

  /**
   * Set the property lineWidth
   * @param {number} width
   * @instance
   */
  setLineWidth: function (width) {
    this.set('lineWidth', width);
  },

  /**
   * Set the property lineColor
   * @param {string} color
   * @instance
   */
  setLineColor: function (color) {
    this.set('lineColor', color);
  },

  /**
   * Set the property lineStyle
   * @param {string} style
   * @instance
   */
  setLineStyle: function (style) {
    this.set('lineStyle', style);
  },

  /**
   * Set the property polygonLineStyle
   * @param {string} style
   * @instance
   */
  setPolygonLineStyle: function (style) {
    this.set('polygonLineStyle', style);
  },

  /**
   * Set the property polygonFillOpacity
   * @param {number} opacity
   * @instance
   */
  setPolygonFillOpacity: function (opacity) {
    this.set('polygonFillOpacity', opacity);
  },

  /**
   * Set the property polygonLineWidth
   * @param {number} width
   * @instance
   */
  setPolygonLineWidth: function (width) {
    this.set('polygonLineWidth', width);
  },

  /**
   * Set the property polygonLineColor
   * @param {string} color
   * @instance
   */
  setPolygonLineColor: function (color) {
    this.set('polygonLineColor', color);
  },

  /**
   * Set the property polygonFillColor
   * @param {string} color
   * @instance
   */
  setPolygonFillColor: function (color) {
    this.set('polygonFillColor', color);
  },

  /**
   * Set the property circleFillColor
   * @param {string} color
   * @instance
   */
  setCircleFillColor: function (color) {
    this.set('circleFillColor', color);
  },

  /**
   * Set the property circleFillOpacity
   * @param {number} opacity
   * @instance
   */
  setCircleFillOpacity: function (opacity) {
    this.set('circleFillOpacity', opacity);
  },

  /**
   * Set the property circleLineColor
   * @param {string} color
   * @instance
   */
  setCircleLineColor: function (color) {
    this.set('circleLineColor', color);
  },

  /**
   * Set the property circleLineStyle
   * @param {string} style
   * @instance
   */
  setCircleLineStyle: function (style) {
    this.set('circleLineStyle', style);
  },

  /**
   * Set the property circleLineWidth
   * @param {number} width
   * @instance
   */
  setCircleLineWidth: function (width) {
    this.set('circleLineWidth', width);
  },

  /**
   * Set the property boxFillColor
   * @param {string} color
   * @instance
   */
  setBoxFillColor: function (color) {
    this.set('boxFillColor', color);
  },

  /**
   * Set the property boxFillOpacity
   * @param {number} opacity
   * @instance
   */
  setBoxFillOpacity: function (opacity) {
    this.set('boxFillOpacity', opacity);
  },

  /**
   * Set the property boxLineColor
   * @param {string} color
   * @instance
   */
  setBoxLineColor: function (color) {
    this.set('boxLineColor', color);
  },

  /**
   * Set the property boxLineStyle
   * @param {string} style
   * @instance
   */
  setBoxLineStyle: function (style) {
    this.set('boxLineStyle', style);
  },

  /**
   * Set the property boxLineWidth
   * @param {number} width
   * @instance
   */
  setBoxLineWidth: function (width) {
    this.set('boxLineWidth', width);
  },

  /**
   * Set the property pointSymbol
   * @param {string} value
   * @instance
   */
  setPointSymbol: function (value) {
    this.set('pointSymbol', value);
  },

  /**
   * Set the property pointSymbol
   * @param {string} value
   * @instance
   */
  setFontSize: function (value) {
    this.set('fontSize', value);
  },

  /**
   * Set the property fontColor
   * @param {string} value
   * @instance
   */
  setFontColor: function (value) {
    this.set('fontColor', value);
  },

  /**
   * Set the property fontBackColor
   * @param {string} value
   * @instance
   */
  setFontBackColor: function (value) {
    this.set('fontBackColor', value);
  },

  /**
   * Set the point text
   * @param {string} text
   * @instance
   */
  setPointText: function (text) {
    var feature = this.get('drawFeature');
    this.set('pointText', text);
    this.setFeaturePropertiesFromText(feature, text || '');
    feature.setStyle(this.getStyle(feature));
  },

  /**
   * Set pointer position
   * @param {object} event
   * @instance
   */
  setPointerPosition: function (e) {
    this.set('pointerPosition', e);
  }
};

/**
 * Draw model module.<br>
 * Use <code>require('models/draw')</code> for instantiation.
 * @module DrawModel-module
 * @returns {DrawModel}
 */
module.exports = ToolModel.extend(DrawModel);
