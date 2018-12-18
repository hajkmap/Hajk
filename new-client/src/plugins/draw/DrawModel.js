import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
  Icon
} from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { LineString, Polygon, Circle } from "ol/geom.js";
import { fromCircle } from "ol/geom/Polygon.js";
import Collection from "ol/Collection.js";
import Draw, { createBox } from "ol/interaction/Draw.js";
import { Modify, Select, Translate } from "ol/interaction.js";
import Overlay from "ol/Overlay.js";
import KML from "ol/format/KML.js";
import { createXML } from "../../utils/KMLWriter.js";

class DrawModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: feature => this.getStyle(feature)
    });

    this.map.addLayer(this.vector);
    this.type = "LineString";
    this.displayText = false;
    this.createDrawTooltip();

    this.fontSize = "10";
    this.fontTextColor = "#000000";
    this.fontBackColor = "#FFFFFF";
    this.fontStroke = false;

    this.pointText = "Text";
    this.pointColor = "#009CE0";
    this.pointRadius = 7;

    this.lineColor = "#009CE0";
    this.lineWidth = 3;
    this.lineStyle = "solid";

    this.circleFillColor = "#FFF";
    this.circleLineColor = "#009CE0";
    this.circleFillOpacity = 0.5;
    this.circleLineStyle = "solid";
    this.circleLineWidth = 3;
    this.circleRadius = 0;

    this.polygonLineColor = "#009CE0";
    this.polygonLineWidth = 3;
    this.polygonLineStyle = "solid";
    this.polygonFillColor = "#FFF";
    this.polygonFillOpacity = 0.5;

    this.squareFillColor = "#FFF";
    this.squareLineColor = "#009CE0";
    this.squareFillOpacity = 0.5;
    this.squareLineStyle = "solid";
    this.squareLineWidth = 3;

    this.drawMethod = "add";
    this.pointSettings = "point";

    this.markerImg =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAADpElEQVR4Ae3aA9DsSBQF4DNa2+ZvZNL3lNa2d0tr24W1bdu2bdu2beO5l8/InX/6JpmqfKdcgz4dA4VCoVAohNQ7mSwrB8k5cjOf4gcyiL/zA3lcbpZzeIAsyxpyrMLV5Ab+Tj+J/C7XcTVUkDcLTCG7yWf0ushnsnvb5MiNqtuZX9I3mC+5A6rIHtfme/QDzHtuTWSqIifSNxc5IbMtgtPLffTNR+7j9EhffW6+TR8ob0XzIF2cTz6nDxf5nPMhPV0z8336wHm/a2akgzU+TW+Qp1M6TvMieqNcBHvcgN4wG8BW2+TyuWUB+dz4FEP2obeN7Gt76PrNvMBvhoc1OZbePnKM2e5TfqVPIb8Y7U5lHf0gZJBc5TaJ43iGvxO7TeQqGUT9t9eBBblKPYR73PwYh5ufd6sLXA0DJf6kHMCRmLCSHE6vyk8oIbR4MeXsHY5JcEfQaxIvhtDcnrqVJ2HuSryHXpG9EJqcr9l0k8/r++ZVbc7nITR5RFHgMijIZYpfegSh8YNQp2Ka00H5EKHxe/qkRJ1QiDoVU/E9QpMR9EnpnBYKndMqlsBwhMY/6JPSNh0U2qajT8wfCI2f0CfF9UDB9SgKfILQ+EKaGzFfQGiqA9AVUOAVqgNiaHK66kC2IBJEC2oOZHI6QpPNdLcJk04ldLcjZTOEVu9Vn4tOAo+i16Tei+DK/KPJ89GSHEavyh8oIzy5o5kLmv6FeI/2+3InLHCrRi8pXT2egdO7uttEruIQenW2MrqlKyPo7SMjemeCDT5An0IegBW3XSoFtoeVaGoZZD18GcSpYEcuNC9wISzFi1oXiBeFLb5tOv/vwppsZlpgM5irykdmBT5GFfbcFlYF3BYwYr8M7OfffjuQzZGaMt8MXuAtlJEet17oAm49pEteClrgFaTNLR/0+LsC0sdrgxW4FlnonSPMU0v5tW92ZIPb257/2yvJ403P/xMoITtRJ4c1VWBY1IlsydFNzf/RyNo8U/KTARf4dJ4pkb14rQHv/ddCPvCKARW4AnnRNh2/aHj4X7RNh/yIl260gFsK+dLYW9RyEvKGNXlOXeB51pA/9bn5nWr437u5kE/x0jI8+RG2WxL5JQcmFjgQuVbmU5Ms8DTKyLe+eeWHic7+j9E8yD+uOOEtQYZzRbQG2W2CBXaDHfsX1OR8tJSKPDnW8J9EBa0lmk2+HjX8r6PZ0Hoo/z8bHkJBa5Kt6ella7QuHsWjYKZQKBQKhb8AaFXSW3c/idsAAAAASUVORK5CYII=";

    this.importUrl = this.options.importUrl;
    this.exportUrl = this.options.exportUrl;

    this.sketchStyle = [
      new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 4
        }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)"
          }),
          stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.5)",
            width: 2
          })
        })
      })
    ];

    this.localObserver.on("update", () => {
      this.redraw();
    });
  }

  redraw() {
    this.vector.changed();
    this.source.getFeatures().forEach(feature => {
      feature.setStyle(this.getStyle(feature));
    });
  }

  getStyle = (feature, forcedProperties) => {
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
      function hexToRgb(hex) {
        let c = hex.replace("#", "");
        if (c.length === 3) {
          let s = [...c];
          c = s.reduce((r, i) => {
            let n = i + i;
            return r + n;
          }, "");
        }
        const n = parseInt(c, 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        var rgb = `rgb(${r}, ${g}, ${b})`;
        return rgb;
      }

      function rgba() {
        switch (geometryName) {
          case "Circle":
            return hexToRgb(this.circleFillColor)
              .replace("rgb", "rgba")
              .replace(")", `, ${this.circleFillOpacity})`);

          case "Polygon":
            return hexToRgb(this.polygonFillColor)
              .replace("rgb", "rgba")
              .replace(")", `, ${this.polygonFillOpacity})`);

          case "Square":
            return hexToRgb(this.squareFillColor)
              .replace("rgb", "rgba")
              .replace(")", `, ${this.squareFillOpacity})`);
          default:
            return;
        }
      }

      var color = forcedProperties
        ? forcedProperties.fillColor
        : rgba.call(this);

      var fill = new Fill({
        color: color
      });

      return fill;
    }

    function lookupStyle() {
      switch (geometryName) {
        case "Polygon":
          return this.polygonLineStyle;
        case "Circle":
          return this.circleLineStyle;
        case "Square":
          return this.squareLineStyle;
        default:
          return this.lineStyle;
      }
    }

    function lookupWidth() {
      switch (geometryName) {
        case "Polygon":
          return this.polygonLineWidth;
        case "Circle":
          return this.circleLineWidth;
        case "Square":
          return this.squareLineWidth;
        default:
          return this.lineWidth;
      }
    }

    function lookupColor() {
      if (forcedProperties) {
        return forcedProperties.strokeColor;
      }
      switch (geometryName) {
        case "Polygon":
          return this.polygonLineColor;
        case "Circle":
          return this.circleLineColor;
        case "Square":
          return this.squareLineColor;
        default:
          return this.lineColor;
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

      var stroke = new Stroke({
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
          : this.pointRadius;
      var iconSrc = forcedProperties
        ? forcedProperties.image || this.markerImg
        : this.markerImg;

      var icon = new Icon({
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        src: iconSrc
      });

      var dot = new CircleStyle({
        radius: radius,
        fill: new Fill({
          color: forcedProperties
            ? forcedProperties.pointColor
            : this.pointColor
        }),
        stroke: new Stroke({
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

      if (this.pointSymbol && type !== "Text") {
        return icon;
      } else {
        return dot;
      }
    }

    function getText() {
      var offsetY = () => {
        var offset = -15;

        if (this.pointSymbol) {
          offset = -40;
        }

        if (type === "Text") {
          offset = 0;
        }

        return offset;
      };

      var labelText = forcedProperties
        ? forcedProperties.text
        : this.getLabelText(feature);

      return new Text({
        textAlign: "center",
        textBaseline: "middle",
        font: `${this.fontSize}px sans-serif`,
        text: labelText,
        fill: new Fill({ color: this.fontTextColor }),
        stroke: !this.fontStroke
          ? new Stroke({
              color: this.fontBackColor,
              width: 1
            })
          : null,
        offsetX: type === "Text" ? 0 : 10,
        offsetY: offsetY(),
        rotation: 0,
        scale: 1.4
      });
    }

    const type = feature.getGeometryName();

    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(255, 255, 255, 0.5)",
          width:
            type === "Polygon" ? this.polygonLineWidth + 2 : this.lineWidth + 2
        })
      }),
      new Style({
        fill: getFill.call(this),
        stroke: getStroke.call(this),
        image: getImage.call(this),
        text: getText.call(this)
      })
    ];
  };

  createStyle = (feature, resolution) => {
    const displayLabel = feature && feature.getProperties().type === "Text";
    return [
      new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.3)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 3
        }),
        image: displayLabel
          ? null
          : new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)"
              }),
              fill: new Fill({
                color: "rgba(255, 255, 255, 0.2)"
              })
            }),
        text: new Text({
          textAlign: "center",
          textBaseline: "middle",
          font: "12pt sans-serif",
          fill: new Fill({ color: "#FFF" }),
          text: feature && this.getLabelText(feature),
          overflow: true,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            width: 3
          }),
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          scale: 1
        })
      })
    ];
  };

  clear = () => {
    this.source.clear();
    this.drawTooltip.setPosition(undefined);
  };

  handleDrawStart = e => {
    if (this.circleRadius > 0 && e.feature.getGeometryName() === "Circle") {
      this.draw.finishDrawing();
      e.feature.getGeometry().setRadius(this.circleRadius);
    }

    e.feature.getGeometry().on("change", e => {
      var toolTip = "",
        coord = undefined,
        pointerCoord;

      if (this.displayText) {
        if (this.pointerPosition) {
          pointerCoord = this.pointerPosition.coordinate;
        }

        if (e.target instanceof LineString) {
          toolTip = this.formatLabel("length", e.target.getLength());
          coord = e.target.getLastCoordinate();
        }

        if (e.target instanceof Polygon) {
          toolTip = this.formatLabel("area", e.target.getArea());
          coord = pointerCoord || e.target.getFirstCoordinate();
        }

        this.drawTooltipElement.innerHTML = toolTip;
        this.drawTooltip.setPosition(coord);
      }
    });
  };

  handleDrawEnd = e => {
    if (this.text) {
      this.localObserver.emit("dialog", e.feature);
    }
    this.setFeaturePropertiesFromGeometry(e.feature);
    this.drawTooltip.setPosition(undefined);
    e.feature.setStyle(this.getStyle(e.feature));
  };

  removeSelected = e => {
    var first = true;
    this.map.forEachFeatureAtPixel(e.pixel, feature => {
      if (feature.getProperties().user === true && first) {
        this.source.removeFeature(feature);
      }
      first = false;
    });
  };

  import = kmlString => {
    var parser = new KML(),
      features = parser.readFeatures(kmlString),
      extent = false;

    features.forEach(feature => {
      var coordinates = feature.getGeometry().getCoordinates(),
        type = feature.getGeometry().getType(),
        newCoordinates = [];
      feature.setProperties({
        user: true
      });
      if (type === "LineString") {
        coordinates.forEach((c, i) => {
          var pairs = [];
          c.forEach(digit => {
            if (digit !== 0) {
              pairs.push(digit);
            }
          });
          newCoordinates.push(pairs);
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      } else if (type === "Polygon") {
        newCoordinates[0] = [];
        coordinates.forEach((polygon, i) => {
          polygon.forEach((vertex, j) => {
            var pairs = [];
            vertex.forEach(digit => {
              if (digit !== 0) {
                pairs.push(digit);
              }
            });
            newCoordinates[0].push(pairs);
          });
        });
        feature.getGeometry().setCoordinates(newCoordinates);
      }

      feature
        .getGeometry()
        .transform("EPSG:4326", this.map.getView().getProjection());
      this.setStyleFromProperties(feature);
    });

    this.source.addFeatures(features);
    extent = this.calculateExtent(features);

    if (extent) {
      let size = this.map.getSize();
      this.map.getView().fit(extent, size);
    }
  };

  export = callback => {
    var features = this.source.getFeatures(),
      transformed = [],
      postData;

    features.forEach(feature => {
      var c = feature.clone();
      if (c.getGeometry() instanceof Circle) {
        let geom = fromCircle(feature.getGeometry(), 96);
        c.setGeometry(geom);
      }
      c.getGeometry().transform(
        this.map.getView().getProjection(),
        "EPSG:4326"
      );

      if (c.getStyle()[1]) {
        c.setProperties({
          style: JSON.stringify(
            this.extractStyle(c.getStyle()[1] || c.getStyle()[0])
          )
        });
      }

      transformed.push(c);
    });
    if (features.length > 0) {
      postData = createXML(transformed, "ritobjekt");
      fetch(this.exportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: postData
        })
      }).then(response => {
        response.text().then(fileUrl => {
          if (callback) {
            callback(fileUrl);
          }
        });
      });
    }
  };

  extractStyle(style) {
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
      style.getImage() instanceof Icon ? style.getImage().getSrc() : "";
    obj.pointRadius =
      style.getImage() instanceof Circle ? style.getImage().getRadius() : "";
    obj.pointColor =
      style.getImage() instanceof Circle
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
  }

  setType(type) {
    this.type = type;
    this.removeInteraction();
    this.addInteraction(type);
  }

  setEditActive() {
    let features = new Collection();
    this.source.getFeatures().forEach(feature => {
      features.push(feature);
    });
    this.edit = new Modify({ features: features });
    this.map.addInteraction(this.edit);
  }

  setMoveActive() {
    this.select = new Select({
      layers: [this.vector]
    });
    this.move = new Translate({
      features: this.select.getFeatures()
    });
    this.map.addInteraction(this.select);
    this.map.addInteraction(this.move);
  }

  setDrawMethod(method) {
    this.drawMethod = method;
    this.removeInteraction();

    if (this.drawMethod === "remove") {
      this.map.on("singleclick", this.removeSelected);
    }

    if (this.drawMethod === "add") {
      if (this.text) {
        this.type = "Text";
      }
      this.setType(this.type);
    }

    if (this.drawMethod === "edit") {
      this.setEditActive();
    }

    if (this.drawMethod === "move") {
      this.setMoveActive();
    }
  }

  removeInteraction() {
    this.drawTooltip.setPosition(undefined);
    this.map.un("singleclick", this.removeSelected);
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
    if (this.edit) {
      this.map.removeInteraction(this.edit);
    }
    if (this.move) {
      this.map.removeInteraction(this.move);
    }
    if (this.select) {
      this.map.removeInteraction(this.select);
    }
  }

  setFeaturePropertiesFromGeometry(feature) {
    if (!feature) return;
    var geom,
      type = "",
      length = 0,
      radius = 0,
      area = 0,
      position = {
        n: 0,
        e: 0
      };
    geom = feature.getGeometry();
    type = geom.getType();

    switch (type) {
      case "Point":
        position = {
          n: Math.round(geom.getCoordinates()[1]),
          e: Math.round(geom.getCoordinates()[0])
        };
        break;
      case "LineString":
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
  }

  formatLabel(type, value) {
    var label;
    if (type === "text") {
      label = value;
    }

    if (type === "point") {
      label = "Nord: " + value.n + " Öst: " + value.e;
    }

    if (typeof value === "number") {
      value = Math.round(value);
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
      label = value + prefix;
    }

    return label;
  }

  createDrawTooltip() {
    if (this.drawTooltipElement) {
      this.drawTooltipElement.parentNode.removeChild(this.drawTooltipElement);
    }
    this.drawTooltipElement = document.createElement("div");
    this.drawTooltipElement.className = "tooltip-draw tooltip-Draw";
    this.drawTooltip = new Overlay({
      element: this.drawTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center"
    });
    this.map.addOverlay(this.drawTooltip);
  }

  getLabelText(feature) {
    const props = feature.getProperties();
    const type = feature.getGeometryName();
    switch (type) {
      case "LineString":
        return this.displayText
          ? this.formatLabel("length", props.length)
          : null;
      case "Polygon":
      case "Square":
        return this.displayText ? this.formatLabel("area", props.area) : null;
      case "Circle":
        return this.displayText
          ? this.formatLabel("circle", props.radius)
          : null;
      case "Point":
        return this.displayText
          ? this.formatLabel("point", props.position)
          : null;
      case "Text":
        return this.formatLabel("text", props.text);
      default:
        return "";
    }
  }

  setStyleFromProperties(feature) {
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
        let style = func.call(feature, this.map.getView().getResolution());
        if (style[0] && style[0].getFill && style[0].getFill() === null) {
          style[0].setFill(
            new Fill({
              color: [0, 0, 0, 0]
            })
          );
        }
        feature.setStyle(style);
      }
    }
  }

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
  }

  addInteraction() {
    var geometryFunction;
    var geometryName = this.type.toString();
    this.text = false;
    if (this.type === "Text") {
      this.type = "Point";
      this.text = true;
    }
    if (this.type === "Square") {
      this.type = "Circle";
      geometryFunction = createBox();
    }
    this.draw = new Draw({
      source: this.source,
      type: this.type,
      style: this.createStyle(),
      geometryFunction: geometryFunction,
      geometryName: geometryName
    });
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);
  }

  setActive(active) {
    if (active && !this.active) {
      this.addInteraction();
    }
    if (active === false) {
      this.removeInteraction();
    }
    this.active = active;
  }

  getMap() {
    return this.map;
  }
}

export default DrawModel;
