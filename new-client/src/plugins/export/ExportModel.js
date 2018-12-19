import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Style, Stroke, Fill, Icon, Circle } from "ol/style.js";
import { getCenter } from "ol/extent.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import Tile from "ol/layer/Tile";
import Image from "ol/layer/Image";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";
//import ImageVector from "ol/source/ImageVector";
import { Translate } from "ol/interaction.js";
import WMTS from "ol/source/WMTS";
import TileArcGISRest from "ol/source/TileArcGISRest";
import Collection from "ol/Collection";

var toHex = function(str) {
  if (/^#/.test(str)) return str;
  var hex =
    "#" +
    str
      .match(/\d+(\.\d+)?/g)
      .splice(0, 3)
      .map(i => {
        var v = parseInt(i, 10).toString(16);
        if (parseInt(i) < 16) {
          v = "0" + v;
        }
        return v;
      })
      .join("");
  return hex;
};

var toOpacity = function(str) {
  return parseFloat(str.match(/\d+(\.\d+)?/g).splice(3, 1)[0]);
};

class ExportModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.exportUrl = settings.options.exportUrl;
    this.copyright = "© Lantmäteriverket i2009/00858";
    this.autoScale = false;
    this.instruction = "";
    this.scales = [
      250,
      500,
      1000,
      2500,
      5000,
      10000,
      25000,
      50000,
      100000,
      250000
    ];
    this.addPreviewLayer();
  }

  addPreviewLayer() {
    this.previewLayer = new Vector({
      source: new VectorSource(),
      name: "preview-layer",
      style: new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.7)",
          width: 2
        }),
        fill: new Fill({
          color: "rgba(255, 145, 20, 0.4)"
        })
      })
    });
    this.map.addLayer(this.previewLayer);
  }

  removePreview() {
    this.previewFeature = undefined;
    this.previewLayer.getSource().clear();
    this.map.removeInteraction(this.translate);
  }

  getPreviewFeature() {
    return this.previewFeature;
  }

  getPreviewCenter() {
    var extent = this.getPreviewFeature()
      .getGeometry()
      .getExtent();
    return getCenter(extent);
  }

  addPreview(scale, paper, center) {
    var dpi = 25.4 / 0.28,
      ipu = 39.37,
      sf = 1,
      w = (((paper.width / dpi / ipu) * scale) / 2) * sf,
      y = (((paper.height / dpi / ipu) * scale) / 2) * sf,
      coords = [
        [
          [center[0] - w, center[1] - y],
          [center[0] - w, center[1] + y],
          [center[0] + w, center[1] + y],
          [center[0] + w, center[1] - y],
          [center[0] - w, center[1] - y]
        ]
      ],
      feature = new Feature({
        geometry: new Polygon(coords)
      });

    this.removePreview();
    this.previewFeature = feature;
    this.previewLayer.getSource().addFeature(feature);
    this.translate = new Translate({
      features: new Collection([feature])
    });
    this.map.addInteraction(this.translate);
  }

  findWMS() {
    var exportable = layer =>
      (layer instanceof Tile || layer instanceof Image) &&
      (layer.getSource() instanceof TileWMS ||
        layer.getSource() instanceof ImageWMS) &&
      layer.getVisible();

    return this.map
      .getLayers()
      .getArray()
      .filter(exportable)
      .map((layer, i) => {
        return {
          url: layer.getSource().get("url"),
          layers: layer
            .getSource()
            .getParams()
            .LAYERS.split(","),
          zIndex: i,
          workspacePrefix: null,
          coordinateSystemId: this.map
            .getView()
            .getProjection()
            .getCode()
            .split(":")[1]
        };
      });
  }

  findVector() {
    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }

    function rgbToHex(rgbString) {
      const matches = /rgb(a)?\((\d+), (\d+), (\d+)(, [\d.]+)?\)/.exec(
        rgbString
      );
      if (matches !== null) {
        let r = parseInt(matches[2]);
        let g = parseInt(matches[3]);
        let b = parseInt(matches[4]);
        let a = parseInt(matches[5]);
        return a
          ? null
          : "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      } else {
        return null;
      }
    }

    function asObject(style) {
      function olColorToHex(olColor) {
        var colorString = olColor.join(", ");
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

      var fillColor = "#FC345C",
        fillOpacity = 0.5,
        strokeColor = "#FC345C",
        strokeOpacity = 1,
        strokeWidth = 3,
        strokeLinecap = "round",
        strokeDashstyle = "solid",
        pointRadius = 10,
        pointFillColor = "#FC345C",
        pointSrc = "",
        labelAlign = "cm",
        labelOutlineColor = "white",
        labelOutlineWidth = 3,
        fontSize = "16",
        fontColor = "#FFFFFF",
        fontBackColor = "#000000";

      if (
        style.getText &&
        style.getText() &&
        style.getText().getFont &&
        style.getText().getFont()
      ) {
        fontSize = style
          .getText()
          .getFont()
          .match(/\d+/)[0];
      }

      if (
        style.getText &&
        style.getText() &&
        style.getText().getFill &&
        style.getText().getFill()
      ) {
        if (
          typeof style
            .getText()
            .getFill()
            .getColor() === "string"
        ) {
          fontColor = style
            .getText()
            .getFill()
            .getColor();
        } else if (
          Array.isArray(
            style
              .getText()
              .getFill()
              .getColor()
          )
        ) {
          fontColor = olColorToHex(
            style
              .getText()
              .getFill()
              .getColor()
          );
        }
      }

      if (
        style.getText &&
        style.getText() &&
        style.getText().getStroke &&
        style.getText().getStroke()
      ) {
        if (
          typeof style
            .getText()
            .getFill()
            .getColor() === "string"
        ) {
          fontBackColor = style
            .getText()
            .getStroke()
            .getColor();
        } else if (
          Array.isArray(
            style
              .getText()
              .getStroke()
              .getColor()
          )
        ) {
          fontBackColor = olColorToHex(
            style
              .getText()
              .getStroke()
              .getColor()
          );
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
        if (toHex(style.getFill().getColor())) {
          fillColor = toHex(style.getFill().getColor());
          fillOpacity = toOpacity(style.getFill().getColor());
        } else if (Array.isArray(style.getFill().getColor())) {
          fillColor = olColorToHex(style.getFill().getColor());
          fillOpacity = style.getFill().getColor()[
            style.getFill().getColor().length - 1
          ];
        }
      }

      if (style.getFill && style.getStroke()) {
        if (toHex(style.getStroke().getColor())) {
          strokeColor = toHex(style.getStroke().getColor());
        } else if (Array.isArray(style.getStroke().getColor())) {
          strokeColor = olColorToHex(style.getStroke().getColor());
        }

        strokeWidth = style.getStroke().getWidth() || 3;
        strokeLinecap = style.getStroke().getLineCap() || "round";
        strokeDashstyle = style.getStroke().getLineDash()
          ? style.getStroke().getLineDash()[0] === 12
            ? "dash"
            : "dot"
          : "solid";
      }

      if (style.getImage && style.getImage()) {
        if (style.getImage() instanceof Icon) {
          pointSrc = style.getImage().getSrc();
        }
        if (style.getImage() instanceof Circle) {
          pointRadius = style.getImage().getRadius();
          pointFillColor = toHex(
            style
              .getImage()
              .getFill()
              .getColor()
          );
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
      };
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
        default:
          break;
      }
    }

    function translateVector(features, layer) {
      function getText(feature) {
        var text = "";

        if (
          feature.getProperties() &&
          feature.getProperties().type === "Text"
        ) {
          if (feature.getProperties().description) {
            text = feature.getProperties().description;
          } else if (feature.getProperties().name) {
            text = feature.getProperties().name;
          } else {
            text = "";
          }
          return text;
        }

        if (
          feature.getStyle &&
          Array.isArray(feature.getStyle()) &&
          feature.getStyle()[1] &&
          feature.getStyle()[1].getText() &&
          feature
            .getStyle()[1]
            .getText()
            .getText()
        ) {
          text = feature
            .getStyle()[1]
            .getText()
            .getText();
        }

        if (
          feature.getStyle &&
          feature.getStyle() &&
          feature.getStyle().getText &&
          feature.getStyle().getText()
        ) {
          text = feature
            .getStyle()
            .getText()
            .getText();
        }

        return text;
      }

      return {
        features: features.map(feature => {
          var type = feature.getGeometry().getType(),
            geom = feature.getGeometry(),
            holes = null,
            coords;

          if (!feature.getStyle() && layer) {
            let layerStyle = layer.getStyle()(feature)[0];
            feature.setStyle(layerStyle);
          }

          coords =
            type === "Circle"
              ? as2DPairs([geom.getCenter(), [geom.getRadius(), 0]], "Circle")
              : as2DPairs(geom.getCoordinates(), type);

          if (type === "MultiPolygon") {
            holes = geom
              .getCoordinates()[0]
              .slice(1, geom.getCoordinates()[0].length);
          }

          return {
            type: type,
            attributes: {
              text: getText(feature),
              style: asObject(feature.getStyle())
            },
            coordinates: coords,
            holes: holes
          };
        })
      };
    }

    var layers,
      vectorLayers,
      //imageVectorLayers,
      extent = this.previewLayer
        .getSource()
        .getFeatures()[0]
        .getGeometry()
        .getExtent();

    layers = this.map.getLayers().getArray();

    vectorLayers = layers.filter(
      layer =>
        layer instanceof Vector &&
        layer.getVisible() &&
        layer.get("name") !== "preview-layer"
    );

    vectorLayers = vectorLayers
      .map(layer =>
        translateVector(layer.getSource().getFeaturesInExtent(extent), layer)
      )
      .filter(layer => layer.features.length > 0);
    return vectorLayers;
  }

  findWMTS() {
    var layers = this.map.getLayers().getArray();
    return layers
      .filter(layer => layer.getSource() instanceof WMTS && layer.getVisible())
      .map(layer => {
        var s = layer.getSource();
        return {
          url: Array.isArray(s.getUrls()) ? s.getUrls()[0] : s.get("url"),
          axisMode: "natural"
        };
      });
  }

  findArcGIS() {
    function getArcGISLayerContract(layer) {
      var url = layer.getSource().get("url"),
        extent = layer.get("extent") || [],
        layers = [],
        projection = layer.get("projection");

      if (typeof layer.getSource().getParams("params")["LAYERS"] === "string") {
        layers = layer
          .getSource()
          .getParams("params")
          .LAYERS.replace("show:", "")
          .split(",");
      }

      if (typeof projection === "string") {
        projection = projection.replace("EPSG:", "");
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
      };
    }

    function visibleArcGISLayer(layer) {
      return layer.getSource() instanceof TileArcGISRest && layer.getVisible();
    }

    return this.map
      .getLayers()
      .getArray()
      .filter(visibleArcGISLayer)
      .map(getArcGISLayerContract);
  }

  exportPDF(options, callback) {
    var extent = this.previewLayer
        .getSource()
        .getFeatures()[0]
        .getGeometry()
        .getExtent(),
      left = extent[0],
      right = extent[2],
      bottom = extent[1],
      top = extent[3],
      url = this.exportUrl,
      data = {
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

    data.size = [
      parseInt(options.size.width * options.resolution),
      parseInt(options.size.height * options.resolution)
    ];

    data.bbox = [left, right, bottom, top];
    data.orientation = options.orientation;
    data.format = options.format;
    data.scale = options.scale;

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: JSON.stringify(data)
      })
    })
      .then(response => {
        response.text().then(fileUrl => {
          if (callback) {
            callback(fileUrl);
          }
        });
      })
      .catch(error => {
        alert("Det gick inte att exportera kartan. " + error);
        console.error(error);
      });
  }

  resolutionToScale(dpi, resolution) {
    var inchesPerMeter = 39.37;
    return resolution * dpi * inchesPerMeter;
  }

  getMap() {
    return this.map;
  }
}

export default ExportModel;
