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
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE
//
// https://github.com/hajkmap/Hajk

var ToolModel = require("tools/tool");

/**
 * @typedef {Object} ElevregisterModel~ElevregisterModelProperties
 * @property {string} type - Default: 'elevregister'
 * @property {string} panel - Default: 'ElevregisterPanel'
 * @property {string} title - Default: 'Elevregister'
 * @property {string} toolbar - Default: 'bottom'
 * @property {string} visible - Default: false
 * @property {string} icon - Default: 'fa fa-building icon'
 * @property {string} elevregisterLayerName - Default: 'elevregister-layer'
 * @property {external:"ol.layer"} elevregisterLayer - Default: undefined
 * @property {object} elevregisterTool - Default: undefined
 * @property {object} removeTool - Default: undefined
 * @property {external:"ol.map"} olMap - Default: undefined
 * @property {external:"ol.source"} source - Default: undefined
 * @property {boolean} showLabels - Default: false
 * @property {boolean} dialog - Default: false
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
var ElevregisterModelProperties = {
  studentCount: 0,
  type: "elevregister",
  panel: "ElevregisterPanel",
  title: "Elevregister",
  toolbar: "bottom",
  visible: false,
  icon: "fa fa-building icon",
  schoolData: undefined,
  elevregisterLayerName: "elevregister-layer",
  elevregisterLayer: undefined,
  elevregisterTool: undefined,
  removeTool: undefined,
  olMap: undefined,
  source: undefined,
  showLabels: false,
  dialog: false,
  fontSize: "10",
  fontColor: "rgb(255, 255, 255)",
  fontBackColor: "rgb(0, 0, 0)",
  pointText: "Text",
  pointColor: "rgb(15, 175, 255)",
  pointSettings: "point",
  pointRadius: 7,
  pointSymbol: false,
  icons: "",
  instruction: "",
  markerImg: window.location.href + "assets/icons/marker.png",
  lineColor: "rgb(15, 175, 255)",
  lineWidth: 3,
  lineStyle: "solid",
  circleFillColor: "rgb(255, 255, 255)",
  circleLineColor: "rgb(15, 175, 255)",
  circleFillOpacity: 0.5,
  circleLineStyle: "solid",
  circleLineWidth: 3,
  polygonLineColor: "rgb(15, 175, 255)",
  polygonLineWidth: 3,
  polygonLineStyle: "solid",
  polygonFillColor: "rgb(255, 255, 255)",
  polygonFillOpacity: 0.5,
  base64Encode: false,
  boxFillColor: "rgb(255, 255, 255)",
  boxLineColor: "rgb(15, 175, 255)",
  boxFillOpacity: 0.5,
  boxLineStyle: "solid",
  boxLineWidth: 3,
  scetchStyle: [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(255, 255, 255, 0.5)"
      }),
      stroke: new ol.style.Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 4
      }),
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: "rgba(0, 0, 0, 0.5)"
        }),
        stroke: new ol.style.Stroke({
          color: "rgba(255, 255, 255, 0.5)",
          width: 2
        })
      })
    })
  ]
};

/**
 * Prototype for creating an elevregister model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {ElevregisterModel~ElevregisterModelProperties} options - Default options
 */
var ElevregisterModel = {
  /**
   * @instance
   * @property {ElevregisterModel~ElevregisterModelProperties} defaults - Default settings
   */
  defaults: ElevregisterModelProperties,

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

  initialize: function(options) {
    ToolModel.prototype.initialize.call(this);

    this.set("editOpenDialogBinded", null);
  },

  configure: function(shell) {
    source = new ol.source.Vector({ wrapX: false });
    olMap = shell.getMap().getMap();
    this.set("source", source);

    this.set(
      "elevregisterLayer",
      new ol.layer.Vector({
        source: this.get("source"),
        queryable: false,
        name: this.get("elevregisterLayerName"),
        style: feature => this.getStyle(feature)
      })
    );

    this.set("olMap", olMap);
    this.get("olMap").addLayer(this.get("elevregisterLayer"));
    this.set("elevregisterLayer", this.get("elevregisterLayer"));
    if (this.get("icons") !== "") {
      let icon = this.get("icons").split(",")[0];
      this.set(
        "markerImg",
        window.location.href + "assets/icons/" + icon + ".png"
      );
    }
    this.createMeasureTooltip();
  },

  getSchools: function() {
    return $.ajax({
      url: "GR.json",
      type: "GET",
      dataType: "JSON"
    }).done(this.handleSchools);
  },

  handleSchools: function(data /* , textStatus, jqXHR */) {
    //console.log(data);
    schoolData = data;
    for (s in data) {
      //console.log(s);
      $("#skolor").append('<option id="' + s + '">' + s + "</option>");
    }
  },

  getClasses: function() {
    var school = $("#skolor :selected").text();
    $("#klasser").empty();
    for (s in schoolData) {
      if (s === school) {
        var klasser = schoolData[s];
        for (k in klasser) {
          //console.log(klasser[k].klassNamn);
          $("#klasser").append(
            '<option value="' +
              klasser[k].klassId +
              '">' +
              klasser[k].klassNamn +
              "</option>"
          );
        }
      }
    }
  },

  showOnMap: function() {
    this.get("elevregisterLayer")
      .getSource()
      .clear();
    this.set("studentCount", 0);
    that = this;
    var classes = $("#klasser").val();
    var fetchNow = function() {
      //console.log("...fetchNow " + i);
      fetch(classes[i] + ".json")
        .then(function(response) {
          return response.json();
        })
        .then(function(myJson) {
          var features = new ol.format.GeoJSON().readFeatures(myJson);
          //console.log("features " + i);
          //console.log(features);
          that
            .get("elevregisterLayer")
            .getSource()
            .addFeatures(features);
        });
    };
    for (var i = 0; i < classes.length; i++) {
      fetchNow();
    }
  },

  editOpenDialog: function(event) {
    this.get("olMap").forEachFeatureAtPixel(event.pixel, feature => {
      if (typeof feature.getProperties().description !== "undefined") {
        feature.setStyle(this.get("scetchStyle"));
        this.set("dialog", true);
        this.set("elevregisterFeature", feature);
        this.set("editing", true);
      }
    });
  },

  /**
   * Removes the selected feature from source.
   * @instance
   * @params {external:"ol.event.Event"} event
   */
  removeSelected: function(event) {
    var first = true;
    olMap.forEachFeatureAtPixel(event.pixel, feature => {
      if (feature.getProperties().user === true && first) {
        source.removeFeature(feature);
      }
      first = false;
    });
  },

  /**
   * Get map´s first drag interaction, if any.
   * @instance
   */
  getDragInteraction: function() {
    return this.get("olMap")
      .getInteractions()
      .getArray()
      .filter(interaction => interaction instanceof ol.interaction.Drag)[0];
  },

  /**
   * Remove the last edited feature from soruce.
   * @instance
   */
  removeEditFeature: function() {
    if (
      !this.get("editing") &&
      this.get("elevregisterFeature") &&
      (typeof this.get("elevregisterFeature").getProperties().description ===
        "undefined" ||
        this.get("elevregisterFeature").getProperties().description === "")
    ) {
      this.get("source").removeFeature(this.get("elevregisterFeature"));
    } else if (this.get("editing")) {
      var feature = this.get("elevregisterFeature");
      this.set("pointText", feature.getProperties().description);
      this.setFeaturePropertiesFromText(
        feature,
        feature.getProperties().description || ""
      );
      feature.setStyle(this.getStyle(feature));
    }
  },

  /**
   * Create elevregister interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  createMeasureTooltip: function() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    this.measureTooltipElement = document.createElement("div");
    this.measureTooltipElement.className =
      "tooltip-elevregister tooltip-measure";
    this.measureTooltip = new ol.Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center"
    });
    this.get("olMap").addOverlay(this.measureTooltip);
  },

  /**
   * Create elevregister interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  formatLabel: function(type, value) {
    if (type === "point") {
      label = "Nord: " + value[0] + " Öst: " + value[1];
    }

    if (typeof value === "number") {
      //value = Math.round(value);
      value = Math.round(value * 10) / 10;
    }
    if (type === "circle") {
      let prefix = " m";
      let prefixSq = " m²";
      if (value >= 1e3) {
        prefix = " km";
        value = value / 1e3;
      }
      label =
        "R = " +
        value +
        prefix +
        " \nA = " +
        Math.round(value * value * Math.PI * 1e3) / 1e3 +
        prefixSq;
    }

    if (type === "area") {
      let prefix = " m²";
      if (value >= 1e6) {
        prefix = " km²";
        value = Math.round((value / 1e6) * 1e3) / 1e3;
      }
      label = value + prefix;
    }

    if (type === "length") {
      let prefix = " m";
      if (value >= 1e3) {
        prefix = " km";
        value = value / 1e3;
      }
      value = Math.round(value * 10) / 10;
      label = value + prefix;
    }

    return label;
  },

  /**
   * Create elevregister interaction and add to map.
   * @param {extern:"ol.geom.GeometryType"} type
   * @instance
   */
  activateElevregisterTool: function(type) {
    var style = undefined,
      elevregisterTool = undefined,
      geometryType = undefined,
      dragInteraction = this.getDragInteraction(),
      olMap = this.get("olMap"),
      geometryFunction = undefined,
      geometryName = undefined;
    olMap.un("singleclick", this.removeSelected);
    olMap.un("singleclick", this.get("editOpenDialogBinded"));
    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer("elevregister-layer");
    }
    olMap.removeInteraction(this.get("elevregisterTool"));
    olMap.removeInteraction(this.get("editTool"));
    this.measureTooltip.setPosition(undefined);

    geometryName = type;

    geometryType = type !== "Text" ? type : "Point";

    elevregisterTool = new ol.interaction.Draw({
      source: this.get("source"),
      style: this.get("scetchStyle"),
      type: geometryType,
      geometryFunction: geometryFunction,
      geometryName: geometryName
    });

    olMap.on("pointermove", this.setPointerPosition.bind(this));

    elevregisterTool.on("elevregisterstart", e => {
      this.handleElevregisterStart(e, geometryType);
    });

    elevregisterTool.on("elevregisterend", event => {
      this.handleElevregisterEnd(event.feature, type);
    });

    this.set("elevregisterTool", elevregisterTool);
    olMap.addInteraction(this.get("elevregisterTool"));
    olMap.set("clickLock", true);
    this.set("elevregisterToolActive", true);
  },

  /**
   * Remove all interactions from the map.
   * @instance
   */
  abort: function() {
    var dragInteraction = this.getDragInteraction();
    this.get("olMap").un("singleclick", this.removeSelected);
    this.get("olMap").un("singleclick", this.get("editOpenDialogBinded"));
    this.get("olMap").un("pointermove", this.setPointerPosition);
    this.get("olMap").removeInteraction(this.get("elevregisterTool"));
    this.get("olMap").removeInteraction(this.get("editTool"));
    this.get("olMap").set("clickLock", false);
    this.set("elevregisterToolActive", false);
    if (dragInteraction) {
      dragInteraction.removeAcceptedLayer("elevregister-layer");
    }
  },

  /**
   * Clear the source from features.
   * @instance
   */
  clear: function() {
    this.get("source").clear();
  },

  /**
   * Extract style info from ol Style object.
   * @instance
   * @param {external:"ol.style.Style"} style
   * @return {object} style
   */
  extractStyle: function(style) {
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

    obj.text = style.getText() ? style.getText().getText() : "";
    obj.image =
      style.getImage() instanceof ol.style.Icon
        ? style.getImage().getSrc()
        : "";
    obj.pointRadius =
      style.getImage() instanceof ol.style.Circle
        ? style.getImage().getRadius()
        : "";
    obj.pointColor =
      style.getImage() instanceof ol.style.Circle
        ? style
            .getImage()
            .getFill()
            .getColor()
        : "";
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
  validateProxyUrl: function(url) {
    if (this.get("proxyUrl")) {
      return this.get("proxyUrl") + url.substr(url.indexOf("/Temp/"));
    } else {
      return url;
    }
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
        console.error("Style attribute could not be parsed.", ex);
      }
    } else {
      // https://github.com/openlayers/openlayers/issues/3262
      let func = feature.getStyleFunction();
      if (func) {
        let style = func.call(
          feature,
          this.get("olMap")
            .getView()
            .getResolution()
        );
        if (style[0] && style[0].getFill && style[0].getFill() === null) {
          style[0].setFill(
            new ol.style.Fill({
              color: [0, 0, 0, 0]
            })
          );
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
  calculateExtent(features) {
    var x = [];
    features.forEach((feature, i) => {
      var e = feature.getGeometry().getExtent(); // l b r t
      if (i === 0) {
        x = e;
      } else {
        let t = 0;
        for (; t < 4; t++) {
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
   * Get styles array.
   * @instance
   * @param {external:"ol.feature"} feature
   * @param {boolean} forcedProperties - Force certain properties to be taken directly from the feature.
   * @return {Array<{external:"ol.style"}>} style
   *
   */
  getStyle: function(feature, forcedProperties) {
    var geometryName = feature.getGeometryName();
    function getLineDash() {
      var scale = (a, f) => a.map(b => f * b),
        width = lookupWidth.call(this),
        style = lookupStyle.call(this),
        dash = [12, 7],
        dot = [2, 7];
      switch (style) {
        case "dash":
          return width > 3 ? scale(dash, 2) : dash;
        case "dot":
          return width > 3 ? scale(dot, 2) : dot;
        default:
          return undefined;
      }
    }

    function getFill() {
      function rgba() {
        switch (geometryName) {
          case "Circle":
            return this.get("circleFillColor")
              .replace("rgb", "rgba")
              .replace(")", `, ${this.get("circleFillOpacity")})`);

          case "Polygon":
            return this.get("polygonFillColor")
              .replace("rgb", "rgba")
              .replace(")", `, ${this.get("polygonFillOpacity")})`);

          case "Box":
            return this.get("boxFillColor")
              .replace("rgb", "rgba")
              .replace(")", `, ${this.get("boxFillOpacity")})`);
        }
      }

      var color = forcedProperties
        ? forcedProperties.fillColor
        : rgba.call(this);
      var fill = new ol.style.Fill({
        color: color
      });

      return fill;
    }

    function lookupStyle() {
      switch (geometryName) {
        case "Polygon":
          return this.get("polygonLineStyle");
        case "Circle":
          return this.get("circleLineStyle");
        case "Box":
          return this.get("boxLineStyle");
        default:
          return this.get("lineStyle");
      }
    }

    function lookupWidth() {
      switch (geometryName) {
        case "Polygon":
          return this.get("polygonLineWidth");
        case "Circle":
          return this.get("circleLineWidth");
        case "Box":
          return this.get("boxLineWidth");
        default:
          return this.get("lineWidth");
      }
    }

    function lookupColor() {
      if (forcedProperties) {
        return forcedProperties.strokeColor;
      }
      switch (geometryName) {
        case "Polygon":
          return this.get("polygonLineColor");
        case "Circle":
          return this.get("circleLineColor");
        case "Box":
          return this.get("boxLineColor");
        default:
          return this.get("lineColor");
      }
    }

    function getStroke() {
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

    function getImage() {
      var radius =
        type === "Text"
          ? 0
          : forcedProperties
            ? forcedProperties.pointRadius
            : this.get("pointRadius");
      var iconSrc = forcedProperties
        ? forcedProperties.image || this.get("markerImg")
        : this.get("markerImg");

      var icon = new ol.style.Icon({
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        src: iconSrc
      });

      var dot = new ol.style.Circle({
        radius: radius,
        fill: new ol.style.Fill({
          color: forcedProperties
            ? forcedProperties.pointColor
            : this.get("pointColor")
        }),
        stroke: new ol.style.Stroke({
          color: "rgb(255, 255, 255)",
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

      if (this.get("pointSymbol") && type !== "Text") {
        return icon;
      } else {
        return dot;
      }
    }

    function getText() {
      var offsetY = () => {
        var offset = -15;

        if (this.get("pointSymbol")) {
          offset = -40;
        }

        if (type === "Text") {
          offset = 0;
        }

        return offset;
      };

      return new ol.style.Text({
        textAlign: "center",
        textBaseline: "middle",
        font: `${this.get("fontSize")}px sans-serif`,
        text: forcedProperties
          ? forcedProperties.text
          : this.getLabelText(feature),
        fill: new ol.style.Fill({ color: this.get("fontColor") }),
        stroke: new ol.style.Stroke({
          color: this.get("fontBackColor"),
          width: 3
        }),
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
          color: "rgba(255, 255, 255, 0.5)",
          width:
            type === "Polygon"
              ? this.get("polygonLineWidth") + 2
              : this.get("lineWidth") + 2
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
  getLabelText: function(feature) {
    var show = this.get("showLabels"),
      props = feature.getProperties(),
      type = feature.getProperties().type;

    if (typeof props.description !== "undefined") {
      type = "Text";
    }

    switch (type) {
      case "Point":
        return show
          ? this.formatLabel("point", [props.position.n, props.position.e])
          : "";
      case "LineString":
        return show ? this.formatLabel("length", props.length) : "";
      case "Polygon":
        return show ? this.formatLabel("area", props.area) : "";
      case "Circle":
        return show ? this.formatLabel("circle", props.radius) : "";
      case "Text":
        return props.description;
      case "Box":
        return show ? this.formatLabel("area", props.area) : "";
      default:
        return "";
    }
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
  clicked: function(arg) {
    this.set("visible", true);
    this.set("toggled", !this.get("toggled"));
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setCircleRadius: function(radius) {
    this.set("circleRadius", radius);
  },

  /**
   * Set the property pointSettings
   * @param {string} color
   * @instance
   */
  setPointSettings: function(value) {
    this.set("pointSettings", value);
  },

  /**
   * Set the property pointColor
   * @param {string} color
   * @instance
   */
  setPointColor: function(color) {
    this.set("pointColor", color);
  },
  /**
   * Set the property pointRadius
   * @param {number} radius
   * @instance
   */
  setPointRadius: function(radius) {
    this.set("pointRadius", radius);
  },

  /**
   * Set the property lineWidth
   * @param {number} width
   * @instance
   */
  setLineWidth: function(width) {
    this.set("lineWidth", width);
  },

  /**
   * Set the property lineColor
   * @param {string} color
   * @instance
   */
  setLineColor: function(color) {
    this.set("lineColor", color);
  },

  /**
   * Set the property lineStyle
   * @param {string} style
   * @instance
   */
  setLineStyle: function(style) {
    this.set("lineStyle", style);
  },

  /**
   * Set the property polygonLineStyle
   * @param {string} style
   * @instance
   */
  setPolygonLineStyle: function(style) {
    this.set("polygonLineStyle", style);
  },

  /**
   * Set the property polygonFillOpacity
   * @param {number} opacity
   * @instance
   */
  setPolygonFillOpacity: function(opacity) {
    this.set("polygonFillOpacity", opacity);
  },

  /**
   * Set the property polygonLineWidth
   * @param {number} width
   * @instance
   */
  setPolygonLineWidth: function(width) {
    this.set("polygonLineWidth", width);
  },

  /**
   * Set the property polygonLineColor
   * @param {string} color
   * @instance
   */
  setPolygonLineColor: function(color) {
    this.set("polygonLineColor", color);
  },

  /**
   * Set the property polygonFillColor
   * @param {string} color
   * @instance
   */
  setPolygonFillColor: function(color) {
    this.set("polygonFillColor", color);
  },

  /**
   * Set the property circleFillColor
   * @param {string} color
   * @instance
   */
  setCircleFillColor: function(color) {
    this.set("circleFillColor", color);
  },

  /**
   * Set the property circleFillOpacity
   * @param {number} opacity
   * @instance
   */
  setCircleFillOpacity: function(opacity) {
    this.set("circleFillOpacity", opacity);
  },

  /**
   * Set the property circleLineColor
   * @param {string} color
   * @instance
   */
  setCircleLineColor: function(color) {
    this.set("circleLineColor", color);
  },

  /**
   * Set the property circleLineStyle
   * @param {string} style
   * @instance
   */
  setCircleLineStyle: function(style) {
    this.set("circleLineStyle", style);
  },

  /**
   * Set the property circleLineWidth
   * @param {number} width
   * @instance
   */
  setCircleLineWidth: function(width) {
    this.set("circleLineWidth", width);
  },

  /**
   * Set the property boxFillColor
   * @param {string} color
   * @instance
   */
  setBoxFillColor: function(color) {
    this.set("boxFillColor", color);
  },

  /**
   * Set the property boxFillOpacity
   * @param {number} opacity
   * @instance
   */
  setBoxFillOpacity: function(opacity) {
    this.set("boxFillOpacity", opacity);
  },

  /**
   * Set the property boxLineColor
   * @param {string} color
   * @instance
   */
  setBoxLineColor: function(color) {
    this.set("boxLineColor", color);
  },

  /**
   * Set the property boxLineStyle
   * @param {string} style
   * @instance
   */
  setBoxLineStyle: function(style) {
    this.set("boxLineStyle", style);
  },

  /**
   * Set the property boxLineWidth
   * @param {number} width
   * @instance
   */
  setBoxLineWidth: function(width) {
    this.set("boxLineWidth", width);
  },

  /**
   * Set the property pointSymbol
   * @param {string} value
   * @instance
   */
  setPointSymbol: function(value) {
    this.set("pointSymbol", value);
  },

  /**
   * Set the property pointSymbol
   * @param {string} value
   * @instance
   */
  setFontSize: function(value) {
    this.set("fontSize", value);
  },

  /**
   * Set the property fontColor
   * @param {string} value
   * @instance
   */
  setFontColor: function(value) {
    this.set("fontColor", value);
  },

  /**
   * Set the property fontBackColor
   * @param {string} value
   * @instance
   */
  setFontBackColor: function(value) {
    this.set("fontBackColor", value);
  },

  /**
   * Set the point text
   * @param {string} text
   * @instance
   */
  setPointText: function(text) {
    var feature = this.get("elevregisterFeature");
    this.set("pointText", text);
    this.setFeaturePropertiesFromText(feature, text || "");
    feature.setStyle(this.getStyle(feature));
  },

  /**
   * Set pointer position
   * @param {object} event
   * @instance
   */
  setPointerPosition: function(e) {
    this.set("pointerPosition", e);
  }
};

/**
 * Elevregister model module.<br>
 * Use <code>require('models/elevregister')</code> for instantiation.
 * @module ElevregisterModel-module
 * @returns {ElevregisterModel}
 */
module.exports = ToolModel.extend(ElevregisterModel);
