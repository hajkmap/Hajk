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
 * @property {string} pointText - Default: "Text"
 * @property {string} pointColor - Default: "rgb(15, 175, 255)"
 * @property {number} pointRadius - Default: 7
 * @property {boolean} pointSymbol - Default: false
 * @property {string} markerImg - Default: "http://localhost/gbg/assets/icons/marker.png"
 * @property {string} lineColor - Default: "rgb(15, 175, 255)"
 * @property {number} lineWidth - Default: 3
 * @property {string} lineStyle - Default: "solid"
 * @property {string} polygonLineColor - Default: "rgb(15, 175, 255)"
 * @property {number} polygonLineWidth - Default: 3
 * @property {string} polygonLineStyle - Default: "solid"
 * @property {string} polygonFillColor - Default: "rgb(255, 255, 255)"
 * @property {number} polygonFillOpacity - Default: 0.5
 * @property {Array<{external:"ol.Style"}>} scetchStyle
 */
var DrawModelProperties = {
  type: 'draw',
  panel: 'DrawPanel',
  title: 'Rita och måttsätt',
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
  pointText: "Text",
  pointColor: "rgb(15, 175, 255)",
  pointRadius: 7,
  pointSymbol: false,
  markerImg: "http://localhost/hajk/assets/icons/marker.png",
  lineColor: "rgb(15, 175, 255)",
  lineWidth: 3,
  lineStyle: "solid",
  polygonLineColor: "rgb(15, 175, 255)",
  polygonLineWidth: 3,
  polygonLineStyle: "solid",
  polygonFillColor: "rgb(255, 255, 255)",
  polygonFillOpacity: 0.5,
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
}

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
    this.createMeasureTooltip();
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
   * Create select interaction and add to map.
   * Remove any draw interaction from map.
   * @instance
   */
  activateRemovalTool: function () {
    this.get('olMap').removeInteraction(this.get("drawTool"));
    this.get('olMap').set('clickLock', true);
    this.get('olMap').on('singleclick', this.removeSelected);
  },

  /**
   * Remove the last edited feature from soruce.
   * @instance
   */
  removeEditFeature() {
    this.get('source').removeFeature(this.get('drawFeature'));
  },

  /**
   * Event handler to excecute after features are drawn.
   * @params: {external:"ol.feature"} type
   * @params: {string} type
   * @instance
   */
  handleDrawEnd: function (feature, type) {
    if (type === "Text") {
      feature.setStyle(this.get('scetchStyle'));
      this.set('dialog', true);
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
  handleDrawStart: function(e, geometryType) {

    var circleRadius = parseFloat(this.get('circleRadius'));

    if (!isNaN(circleRadius) && geometryType === "Circle") {
      this.get("drawTool").finishDrawing();
      let f = new ol.Feature({
        geometry: new ol.geom.Circle(e.feature.getGeometry().getCenter(), circleRadius)
      });
      this.get('source').removeFeature(e.feature);
      this.get('source').addFeature(f);
      this.handleDrawEnd(f);
    }

    e.feature.getGeometry().on('change', e => {

      var toolTip = ""
      ,   coord = undefined;

      if (e.target instanceof ol.geom.LineString) {
        toolTip = this.formatLabel("length", e.target.getLength());
        coord = e.target.getLastCoordinate()
      }
      if (e.target instanceof ol.geom.Polygon) {
        toolTip = this.formatLabel("area", e.target.getArea());
        coord = this.get('pointerPosition').coordinate;
      }
      if (e.target instanceof ol.geom.Circle) {
        toolTip = this.formatLabel("length", e.target.getRadius());
        coord = this.get('pointerPosition').coordinate;
      }
      this.measureTooltipElement.innerHTML = toolTip;
      if (this.get('showLabels')) {
        this.measureTooltip.setPosition(coord);
      }
    });

  },

  /**
   * Create draw interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  createMeasureTooltip: function() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'tooltip tooltip-measure';
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
  formatLabel: function(type, value) {

    if (type === "point") {
      label ="Nord: " + value[0] + " Öst: " + value[1];
    }

    if (typeof value === "number") {
      value = Math.round(value);
    }

    if (type === "area") {
      let prefix = " m²";
      if (value >= 1E6) {
        prefix = " km²";
        value = Math.round((value / 1E6) * 1E3) / 1E3;
      }
      label = value + prefix;
    }

    if (type === "length") {
      let prefix = " m";
      if (value >= 1E3) {
        prefix = " km";
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
    var style = undefined
    ,   drawTool = undefined
    ,   geometryType = undefined
    ,   olMap = this.get('olMap');

    olMap.un('singleclick', this.removeSelected);
    olMap.removeInteraction(this.get("drawTool"));

    geometryType = type !== "Text" ? type : "Point";

    drawTool = new ol.interaction.Draw({
      source: this.get('source'),
      style: this.get('scetchStyle'),
      type: geometryType
    });

    olMap.on('pointermove', this.setPointerPosition.bind(this));      

    drawTool.on('drawstart', e => {
      this.handleDrawStart(e, geometryType);
    });

    drawTool.on('drawend', (event) => {
      this.handleDrawEnd(event.feature, type)
    });

    this.set('drawTool', drawTool);
    olMap.addInteraction(this.get('drawTool'));
    olMap.set('clickLock', true);
  },

  /**
   * Remove all interactions from the map.
   * @instance
   */
  abort: function () {
    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').un('pointermove', this.setPointerPosition);
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').set('clickLock', false);
  },

  /**
   * Clear the source from features.
   * @instance
   */
  clear: function () {
    this.get('source').clear();
  },

  /**
   * Create KML string from features.
   * @instance
   * @param {Array<{external:"ol.feature"}> features
   * @param {string} name - name of layer
   * @return {string} xml
   */
  writeKml: function (features, name) {

      function componentToHex(c) {
          var hex = c.toString(16);
          return hex.length == 1 ? "0" + hex : hex;
      }

      function rgbToHex(r, g, b) {
          return componentToHex(r) + componentToHex(g) + componentToHex(b);
      }

      function colorToArray(color, type) {
          var res = []
          var reg = type === "rgb" ? /rgb\((.+)\)/ :
                                     /rgba\((.+)\)/;

          res = reg.exec(color)[1].split(',').map(a => parseFloat(a));

          if (type === "rgb") {
            res.push(1);
          }

          return res;
      }

      function toKmlColor(color) {
          var s, r, g, b, o;
          var res = /^rgba/.test(color) ? colorToArray(color, 'rgba') : colorToArray(color, 'rgb');
          s = rgbToHex(res[0], res[1], res[2]);
          r = s.substr(0, 2);
          g = s.substr(2, 2);
          b = s.substr(4, 2);
          o = (Math.floor(res[3] * 255)).toString(16);
          return o + b + g + r;
      }

      function toKmlString(str, type) {

          var strs = []
          ,   a
          ,   b;

          switch (type) {
              case 'point':
                  str = str.replace(/^POINT\(/, '').replace(/\)$/, '');
                  break;
              case 'line':
                  str = str.replace(/^LINESTRING\(/, '').replace(/\)$/, '');
                  break;
              case 'polygon':
                  strs = str.split('),(');
                  str = "";
                  _.each(strs, function (coords, i) {
                      if (i === 0) {
                          coords = coords.replace(/^POLYGON\(\(/, '').replace(/\)$/, '');
                          str +=   '<outerBoundaryIs>';
                          str +=     '<LinearRing>';
                          str +=       '<coordinates>' + coords + '</coordinates>';
                          str +=     '</LinearRing>';
                          str +=   '</outerBoundaryIs>';
                      } else {
                          coords = coords.replace(/\)/g, '');
                          str +=   '<innerBoundaryIs>';
                          str +=     '<LinearRing>';
                          str +=       '<coordinates>' + coords + '</coordinates>';
                          str +=     '</LinearRing>';
                          str +=   '</innerBoundaryIs>';
                      }
                  });
                  break;

              case 'multiPolygon':
                  a = str.split(')),((');
                  str = "";
                  _.each(a, function (coords, t) {

                      if (t === 0) {
                          coords = coords.replace(/^MULTIPOLYGON\(\(/, '').replace(/\)$/, '');
                      }

                      b = coords.split('),(');

                      str += '<Polygon>';
                          _.each(b, function (coordinates, i) {
                              coordinates = coordinates.replace(/\)/g, '');
                              if (i === 0) {
                                  str +=   '<outerBoundaryIs>';
                                  str +=     '<LinearRing>';
                                  str +=       '<coordinates>' + coordinates + '</coordinates>';
                                  str +=     '</LinearRing>';
                                  str +=   '</outerBoundaryIs>';
                              } else {
                                  str +=   '<innerBoundaryIs>';
                                  str +=     '<LinearRing>';
                                  str +=       '<coordinates>' + coordinates + '</coordinates>';
                                  str +=     '</LinearRing>';
                                  str +=   '</innerBoundaryIs>';
                              }
                          });
                      str += '</Polygon>';
                  });

                  break;
          }

          return str.replace(/ /g, '_')
                    .replace(/,/g, ' ')
                    .replace(/_/g, ',')
                    .replace(/\(/g, '')
                    .replace(/\)/g, '')
      }

      function point(f) {
          var str = "";
          str += '<Point>';
          str +=   '<coordinates>' + toKmlString(f, "point") + '</coordinates>';
          str += '</Point>';
          return str;
      }

      function line(f) {
          var str = "";
          str += '<LineString>';
          str +=    '<coordinates>' + toKmlString(f, "line") + '</coordinates>';
          str += '</LineString>';
          return str;
      }

      function polygon(f) {
          var str = "";
          str += '<Polygon>';
              str += toKmlString(f, "polygon");
          str += '</Polygon>';
          return str;
      }

      function multiPolygon(f) {
          var str = "";
          str += '<MultiGeometry>';
          str += toKmlString(f, "multiPolygon");
          str += '</MultiGeometry>';
          return str;
      }

      function safeInject(string) {
          return string.replace(/<\/?[^>]+(>|$)|&/g, "");
      }

      var header = ''
      ,   parser = new ol.format.WKT()
      ,   doc = ''
      ;

      header += '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">';
      doc += '<Document>';
      doc += '<name>' + name + '</name>';

      doc += "<Folder>";
      doc += "<name>" + name + "</name>";
      doc += "<open>0</open>";

      features.forEach((feature, i) => {
          var style = feature.getStyle()[1];
          doc += '<Style id="' + i + '">';
              if (style.getImage() instanceof ol.style.Icon) {
                  doc += '<IconStyle>';
                  doc +=   '<scale>' + (style.getImage().getSize()[0] / 32) + '</scale>';
                  doc +=     '<Icon>';
                  doc +=       '<href>' + style.getImage().getSrc() + '</href>';
                  doc +=     '</Icon>';
                  doc += '</IconStyle>';
              }

              if (style.getStroke() instanceof ol.style.Stroke) {
                  doc += '<LineStyle>';
                  doc +=   '<color>' + toKmlColor(style.getStroke().getColor()) + '</color>';
                  doc +=   '<width>' + style.getStroke().getWidth() + '</width>';
                  doc += '</LineStyle>';
              }

              if (style.getFill() instanceof ol.style.Fill) {
                  doc += '<PolyStyle>';
                  doc +=    '<color>' + toKmlColor(style.getFill().getColor()) + '</color>';
                  doc += '</PolyStyle>';
              }

          doc += '</Style>';
      });

      features.forEach((feature, i) => {

          var description = feature.getProperties().description || ""
          ,   name = feature.getProperties().name || feature.getStyle()[1].getText().getText() || ""
          ;

          if (!description && feature.getProperties()) {
              description = "<table>";
              _.each(feature.getProperties(), function (value, attribute) {
                  if (typeof value === "string") {
                      description += "<tr>";
                          description += "<td>" + attribute + "</td>";
                          description += "<td>" + safeInject(value) + "</td>";
                      description += "</tr>";
                  }
              });
              description += "</table>";
          }

          doc += '<Placemark>';
          doc += '<name>' + (name || ('Ritobjekt ' + (i + 1))) + '</name>';
          doc += '<description>' + (description || ('Ritobjekt ' + (i + 1))) + '</description>';
          doc += '<styleUrl>#' + i + '</styleUrl>';

          if (feature.getGeometry() instanceof ol.geom.Point) {
              doc += point(parser.writeFeature(feature));
          }
          if (feature.getGeometry() instanceof ol.geom.LineString) {
              doc += line(parser.writeFeature(feature));
          }
          if (feature.getGeometry() instanceof ol.geom.Polygon) {
              doc += polygon(parser.writeFeature(feature));
          }

          if (feature.getProperties().style) {
              doc += '<ExtendedData>';
              doc +=    '<Data name="style">';
              doc +=       '<value>' + feature.getProperties().style + '</value>';
              doc +=    '</Data>';
              doc += '</ExtendedData>';
          }
          doc += '</Placemark>';
      });

      doc += "</Folder>";
      doc += '</Document>';
      header += doc;
      header += '</kml>';
      return header
  },

  /**
   * Extract style info from ol Style object.
   * @instance
   * @param {external:"ol.style.Style"} style
   * @return {object} style
   */
  extractStyle: function (style) {

    var obj = {
      text: "",
      image: "",
      pointRadius: 0,
      pointColor: "",
      fillColor: "",
      strokeColor: "",
      strokeWidth: "",
      strokeDash: ""
    };

    obj.text = style.getText().getText();
    obj.image = style.getImage() instanceof ol.style.Icon ? style.getImage().getSrc() : "";
    obj.pointRadius = style.getImage() instanceof ol.style.Circle ? style.getImage().getRadius() : "";
    obj.pointColor = style.getImage() instanceof ol.style.Circle ? style.getImage().getFill().getColor() : "";
    obj.fillColor = style.getFill().getColor();
    obj.strokeColor = style.getStroke().getColor();
    obj.strokeWidth = style.getStroke().getWidth();
    obj.strokeDash = style.getStroke().getLineDash();

    return obj;
  },

  /**
   * Export draw layer.
   * @instance
   */
  export: function () {

    var features = this.get('drawLayer').getSource().getFeatures()
    ,   transformed = []
    ,   xml
    ,   form = document.createElement('form')
    ,   input = document.createElement('input')
    ,   curr = document.getElementById(this.exportHitsFormId);

    if (features.length === 0) {
      this.set({
        'kmlExportUrl': "NO_FEATURES"
      });
      return false;
    }

    features.forEach((feature) => {
      var c = feature.clone();
      c.getGeometry().transform(this.get('olMap').getView().getProjection(), "EPSG:4326");
      c.setProperties({
        style: JSON.stringify(this.extractStyle(c.getStyle()[1]))
      });
      transformed.push(c);
    });

    xml = this.writeKml(transformed, "ritobjekt");

    form.id = this.exportHitsFormId;
    form.method = "post";
    form.action = this.get('exportUrl');
    input.value = xml;
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
   * Set the features style from based upon its properties.
   * @param {external:"ol.feature"}
   * @instance
   */
  setStyleFromProperties: function(feature) {
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
        console.error("Style attribute could not be parsed.", ex)
      }
    }
  },

  /**
   * Calculate extent of given features
   * @instance
   * @param {array} features
   * @return {external:ol.Extent} extent
   */
  calculateExtent(features) {
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

    var kml_string = $(xmlDoc).find('kml')[0].outerHTML;
    if (typeof kml_string === "string") {
      kml_string = kml_string.replace('<script/>', '');
    }

    var parser = new ol.format.KML()
    ,   features = parser.readFeatures(kml_string)
    ,   extent = false;

    features.forEach((feature) => {
      coordinates = feature.getGeometry().getCoordinates();
      type = feature.getGeometry().getType()
      newCoordinates = [];
      feature.setProperties({
        user: true
      });
      if (type == 'LineString') {
        coordinates.forEach((c, i) => {
          pairs = [];
          c.forEach((digit) => {
            if (digit!=0)
              pairs.push(digit)
          });
         newCoordinates.push(pairs)
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      } else if (type == 'Polygon') {
        newCoordinates[0] = [];
        coordinates.forEach((polygon, i) => {
          polygon.forEach((vertex, j) => {
            pairs = []
            vertex.forEach((digit) => {
            if (digit!=0)
              pairs.push(digit)
            });
            newCoordinates[0].push(pairs);
          });
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      }

      feature.getGeometry().transform(
        "EPSG:4326",
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
    this.set("kmlImport", true);
  },

  /**
   * Get styles array.
   * @instance
   * @param {external:"ol.feature"} feature
   * @param {boolean} forcedProperties - Force certain properties to be taken directy from the feature.
   * @return {Array<{external:"ol.style"}>} style
   *
   */
  getStyle: function(feature, forcedProperties) {

    function getLineDash() {
        var scale = (a, f) => a.map(b => f * b)
        ,   width = type === 'Polygon' ?
                    this.get('polygonLineWidth') : this.get('lineWidth')
        ,   style = type === 'Polygon' ?
                    this.get('polygonLineStyle') : this.get('lineStyle')
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

      function rgba() {
        return this.get('polygonFillColor')
                   .replace('rgb', 'rgba')
                   .replace(')', `, ${this.get('polygonFillOpacity')})`)
      }

      var color = forcedProperties ? forcedProperties.fillColor : rgba.call(this);
      var fill = new ol.style.Fill({
        color: color
      });

      return fill;
    }

    function getStroke() {
      var color = forcedProperties ?
                  forcedProperties.strokeColor :
                  type === 'Polygon' ?
                    this.get('polygonLineColor') :
                    this.get('lineColor')

      var width = forcedProperties ?
                  forcedProperties.strokeWidth :
                  type === 'Polygon' ?
                    this.get('polygonLineWidth') :
                    this.get('lineWidth')

      var lineDash = forcedProperties ?
                     forcedProperties.strokeDash :
                     getLineDash.call(this);

      var stroke =  new ol.style.Stroke({
        color: color,
        width: width,
        lineDash: lineDash
      })

      return stroke;
    }

    function getImage() {

      var iconSrc = forcedProperties ? (forcedProperties.image || this.get('markerImg')) : this.get('markerImg');

      var icon = new ol.style.Icon({
        anchor: [0.5, 32],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: iconSrc,
        imgSize: [32, 32]
      });

      var dot = new ol.style.Circle({
        radius: type === "Text" ? 0 : forcedProperties ? forcedProperties.pointRadius : this.get('pointRadius'),
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

    function getText() {

      var offsetY = () => {
        var offset = -15;

        if (this.get('pointSymbol'))
          offset = -40;

        if (type === "Text")
          offset = 0;

        return offset;
      }

      return new ol.style.Text({
        textAlign: 'center',
        textBaseline: 'middle',
        font: 'Arial',
        text: forcedProperties ? forcedProperties.text : this.getLabelText(feature),
        fill: new ol.style.Fill({color: '#fff'}),
        stroke: new ol.style.Stroke({color: '#555', width: 3}),
        size: '14px',
        offsetX: type === "Text" ? 0 : 10,
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
          width: type === 'Polygon' ?
                   this.get('polygonLineWidth') + 2 :
                   this.get('lineWidth') + 2
        })
      }),
      new ol.style.Style({
        fill: getFill.call(this),
        stroke: getStroke.call(this),
        image: getImage.call(this),
        text: getText.call(this)
      })
    ]
  },

  /**
   * Generate feature label text from properties.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {string} label
   *
   */
  getLabelText: function (feature) {

    var show  = this.get('showLabels')
    ,   props = feature.getProperties()
    ,   type  = feature.getProperties().type;

    switch (type) {
      case "Point": return show ? this.formatLabel("point", [props.position.n, props.position.e]) : "";
      case "LineString": return show ? this.formatLabel("length", props.length): "";
      case "Polygon": return show ? this.formatLabel("area", props.area) : "";
      case "Circle": return show ? this.formatLabel("length", props.radius): "";
      case "Text": return props.description;
      default: return "";
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
      if (feature.getProperties().type !== "Text" && feature.getStyle()) {
        let style = feature.getStyle();
        if (this.get('showLabels')) {
          style[1].getText().setText(this.getLabelText(feature));
        } else {
          style[1].getText().setText("");
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
      type: "Text",
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
    var geom
    ,   type = ""
    ,   lenght = 0
    ,   radius = 0
    ,   area = 0
    ,   position = {
          n: 0,
          e: 0
        }
    ;
    geom = feature.getGeometry();
    type = geom.getType();
    switch (type) {
      case "Point":
        position = {
          n: Math.round(geom.getCoordinates()[1]),
          e: Math.round(geom.getCoordinates()[0])
        };
        break;
      case "LineString" :
        length = Math.round(geom.getLength());
        break;
      case "Polygon":
        area = Math.round(geom.getArea());
        break;
      case "Circle":
        radius = Math.round(geom.getRadius());
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
  clicked: function () {
    this.set('visible', true);
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setCircleRadius: function (radius) {
    this.set("circleRadius", radius);
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setPointColor: function (color) {
    this.set("pointColor", color);
  },
  /**
   * Set the property pointRadius
   * @param {number} radius
   * @instance
   */
  setPointRadius: function (radius) {
    this.set("pointRadius", radius);
  },

  /**
   * Set the property lineWidth
   * @param {number} width
   * @instance
   */
  setLineWidth: function (width) {
    this.set("lineWidth", width);
  },

  /**
   * Set the property lineColor
   * @param {string} color
   * @instance
   */
  setLineColor: function (color) {
    this.set("lineColor", color);
  },

  /**
   * Set the property lineStyle
   * @param {string} style
   * @instance
   */
  setLineStyle: function (style) {
    this.set("lineStyle", style);
  },

  /**
   * Set the property polygonLineStyle
   * @param {string} style
   * @instance
   */
  setPolygonLineStyle: function (style) {
    this.set("polygonLineStyle", style);
  },

  /**
   * Set the property polygonFillOpacity
   * @param {number} opacity
   * @instance
   */
  setPolygonFillOpacity: function (opacity) {
    this.set("polygonFillOpacity", opacity);
  },

  /**
   * Set the property polygonLineWidth
   * @param {number} width
   * @instance
   */
  setPolygonLineWidth: function (width) {
    this.set("polygonLineWidth", width);
  },

  /**
   * Set the property polygonLineColor
   * @param {string} color
   * @instance
   */
  setPolygonLineColor: function (color) {
    this.set("polygonLineColor", color);
  },

  /**
   * Set the property polygonFillColor
   * @param {string} color
   * @instance
   */
  setPolygonFillColor: function (color) {
    this.set("polygonFillColor", color);
  },

  /**
   * Set the property pointSymbol
   * @param {string} value
   * @instance
   */
  setPointSymbol: function(value) {
    this.set('pointSymbol', value);
  },

  /**
   * Set the point text
   * @param {string} text
   * @instance
   */
  setPointText: function(text) {
    var feature = this.get('drawFeature');
    this.set('pointText', text);
    this.setFeaturePropertiesFromText(feature, text || "");
    feature.setStyle(this.getStyle(feature));
  },

  /**
   * Set pointer position
   * @param {object} event
   * @instance
   */
  setPointerPosition: function(e) {
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
