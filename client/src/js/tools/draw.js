var ToolModel = require('tools/tool');

var source;
var olMap;

var Draw = module.exports = ToolModel.extend({
  /*
   * Property: default settings
   *
   */
  defaults: {
    type: 'draw',
    panel: 'DrawPanel',
    title: 'Ritverktyg',
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
    markerImg: "http://localhost/gbg/assets/icons/marker.png",
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
    })
  ]
  },
  /**
   * Removes the selected feature from source.
   * @params {ol.event} event
   *
   */
  removeSelected: function (event) {
    olMap.forEachFeatureAtPixel(event.pixel, (feature) => {
      if (feature.getProperties().user === true) {
        source.removeFeature(feature);
      }
    });
  },
  /**
   * Create select interaction and add to map.
   * Remove any draw interaction from map.
   * @params:
   * @returns: undefined
   *
   */
  activateRemovalTool: function () {
    this.get('olMap').removeInteraction(this.get("drawTool"));
    this.get('olMap').set('clickLock', true);
    this.get('olMap').on('singleclick', this.removeSelected);
  },
  /*
   * Event handler to excecute after features are drawn.
   *
   * @params: {ol.feature} type
   * @returns: undefined
   *
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
  },
  /*
   * Create draw interaction and add to map.
   *
   * @params: {string} <ol.geom.GeometryType>} type
   * @returns: undefined
   *
   */
  activateDrawTool: function (type) {
    var style = undefined
    ,   drawTool = undefined
    ,   geometryType = undefined;

    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').removeInteraction(this.get("drawTool"));

    geometryType = type !== "Text" ? type : "Point";

    drawTool = new ol.interaction.Draw({
      source: this.get('source'),
      style: this.get('scetchStyle'),
      type: geometryType
    });

    drawTool.on('drawend', (event) => {
      this.handleDrawEnd(event.feature, type)
    });

    this.set('drawTool', drawTool);
    this.get('olMap').addInteraction(this.get('drawTool'));
    this.get('olMap').set('clickLock', true);
  },
  /*
   * Remove all interactions from the map.
   *
   * @params:
   * @returns: undefined
   *
   */
  abort: function () {
    this.get('olMap').un('singleclick', this.removeSelected);
    this.get('olMap').removeInteraction(this.get('drawTool'));
    this.get('olMap').set('clickLock', false);
  },
  /**
   * Clear the source from features.
   */
  clear: function () {
    this.get('source').clear();
  },
  /**
   * Create KML string from features.
   * @param {[OpenLayers.Features]} features
   * @param {string} name name of layer
   * @return {string} xml-document
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

          //var str = f.getGeometry().toString()
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

      //var header = '<?xml version="1.0" encoding="UTF-8"?>'
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

      _.each(features, function (feature, i) {
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

      _.each(features, function (feature, i) {

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
   * Extract style info from {ol.style.Style} object.
   * @param {ol.style.Style} style
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
   * Exprort draw layer.
   */
  export: function () {

    var features = this.get('drawLayer').getSource().getFeatures()
    ,   transformed = []
    ,   xml;

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

    $.post(this.get('exportUrl'), xml, (rsp) => {
      this.set({
        'kmlExportUrl': rsp
      });
    });
  },
  /**
   *
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
   * Import draw layer.
   */
  importDrawLayer: function (xmlDoc) {

    var kml_string = xmlDoc.documentElement.childNodes[0].data
    ,   parser     = new ol.format.KML()
    ,   features   = parser.readFeatures(kml_string);

    features.forEach((feature) => {
      feature.getGeometry().transform(
        "EPSG:4326",
        this.get('olMap').getView().getProjection()
      );

      this.setStyleFromProperties(feature);

    });

    this.get('drawLayer').getSource().addFeatures(features);
  },
  /**
   *
   */
  import: function () {
    this.set("kmlImport", true);
  },
  /**
   * Get styles array.
   * @param {ol.Feature} feature
   * @return {[ol.Style]} style
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

      var icon = new ol.style.Icon({
        anchor: [0.5, 32],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: forcedProperties ? forcedProperties.image : this.get('markerImg'),
        imgSize: [32, 32]
      });

      var dot = new ol.style.Circle({
        radius: type === 'Text' ? 0 : this.get('pointRadius'),
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
      return new ol.style.Text({
        textAlign: 'center',
        textBaseline: 'middle',
        font: 'Arial',
        text: forcedProperties ? forcedProperties.text : this.getLabelText(feature),
        fill: new ol.style.Fill({color: '#fff'}),
        stroke: new ol.style.Stroke({color: '#555', width: 3}),
        size: '14px',
        offsetX: type === "Text" ? 0 : 10,
        offsetY: type === "Text" ? 0 : -15,
        rotation: 0,
        scale: 1.4
      });
    }

    var type = feature.getProperties().type;

    return [new ol.style.Style({
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
    })]
  },
  /**
   * Generate feature label text from properties.
   * @param {ol.Feature} feature
   * @return {string} label
   *
   */
  getLabelText: function (feature) {

    var show  = this.get('showLabels')
    ,   props = feature.getProperties()
    ,   type  = feature.getProperties().type;

    switch (type) {
      case "Point": return show ? "Nord: " + props.position.n + " Öst: " + props.position.e : "";
      case "LineString": return show ? props.length + " m" : "";
      case "Polygon": return show ? props.area + " m²" : "";
      case "Text": return props.description;
      default: return "";
    }
  },
  /**
   * Set the property wich will show/hide labels and update the source.
   */
  toggleLabels: function () {
    this.set('showLabels', !this.get('showLabels'));
    this.get('source').changed();

    source.forEachFeature(feature => {

      if (feature.getProperties().type !== "Text") {
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
   * Constructor method.
   * @param {object} options
   *
   */
  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },
  /**
   * Update any feature with property to identify feature as text feature.
   * @params {ol.Feature} feature
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
   * @param {ol.Feature} feature
   */
  setFeaturePropertiesFromGeometry: function (feature) {
    if (!feature) return;
    var geom
    ,   type = ""
    ,   lenght = 0
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
      default:
        break;
    }
    feature.setProperties({
      type: type,
      user: true,
      length: length,
      area: area,
      position: position
    });
  },
  /**
   * Configure the tool before first use.
   * @params {Backbone.Model} shell
   */
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
  },
  /**
   * Handle click event on toolbar button.
   * This handler sets the property visible,
   * wich in turn will trigger the change event of navigation model.
   * In pracice this will activate corresponding panel as
   * "active panel" in the navigation panel.
   */
  clicked: function () {
    this.set('visible', true);
  },

  setPointColor: function (color) {
    this.set("pointColor", color);
  },

  setPointRadius: function (radius) {
    this.set("pointRadius", radius);
  },

  setLineWidth: function (width) {
    this.set("lineWidth", width);
  },

  setLineColor: function (color) {
    this.set("lineColor", color);
  },

  setLineStyle: function (style) {
    this.set("lineStyle", style);
  },

  setPolygonLineStyle: function (style) {
    this.set("polygonLineStyle", style);
  },

  setPolygonFillOpacity: function (opacity) {
    this.set("polygonFillOpacity", opacity);
  },

  setPolygonLineWidth: function (width) {
    this.set("polygonLineWidth", width);
  },

  setPolygonLineColor: function (color) {
    this.set("polygonLineColor", color);
  },

  setPolygonFillColor: function (color) {
    this.set("polygonFillColor", color);
  },

  setPointSymbol: function(value) {
    this.set('pointSymbol', value);
  },

  setPointText: function(text) {
    var feature = this.get('drawFeature');
    this.set('pointText', text);
    this.setFeaturePropertiesFromText(feature, text || "");
    feature.setStyle(this.getStyle(feature));
  }

});
