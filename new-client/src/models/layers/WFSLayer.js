import VectorSource from "ol/source/Vector";
import { Vector } from "ol/layer";
import { WFS, GeoJSON, WKT } from "ol/format";
import GML2 from "ol/format/GML";
import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll } from "ol/loadingstrategy";
import { transform } from "ol/proj";
import { toContext } from "ol/render";
import { Point, Polygon, LineString } from "ol/geom";
import Feature from "ol/Feature";
import LayerInfo from "./LayerInfo.js";

const fetchConfig = {
  credentials: "same-origin",
};

let WFSLayerProperties = {
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
    bbox: "",
  },
  showLabels: true,
};

function createStyle(feature, forcedPointRadius) {
  const icon = this.config.icon;
  const fillColor = this.config.fillColor;
  const lineColor = this.config.lineColor;
  const lineStyle = this.config.lineStyle;
  const lineWidth = this.config.lineWidth;
  const symbolXOffset = this.config.symbolXOffset;
  const symbolYOffset = this.config.symbolYOffset;
  const rotation = 0.0;
  const align = this.config.labelAlign;
  const baseline = this.config.labelBaseline;
  const size = this.config.labelSize;
  const offsetX = this.config.labelOffsetX;
  const offsetY = this.config.labelOffsetY;
  const weight = this.config.labelWeight;
  const font = weight + " " + size + " " + this.config.labelFont;
  const labelFillColor = this.config.labelFillColor;
  const outlineColor = this.config.labelOutlineColor;
  const outlineWidth = this.config.labelOutlineWidth;
  const labelAttribute = this.config.labelAttribute;
  const showLabels = this.config.showLabels;
  const pointSize = forcedPointRadius || this.config.pointSize;

  feature = arguments[1] instanceof Feature ? arguments[1] : undefined;

  function getLineDash() {
    var scale = (a, f) => a.map((b) => f * b),
      width = lineWidth,
      style = lineStyle,
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
    return new Fill({
      color: fillColor,
    });
  }

  function getText() {
    return new Text({
      textAlign: align,
      textBaseline: baseline,
      font: font,
      text: feature ? feature.getProperties()[labelAttribute] : "",
      fill: new Fill({
        color: labelFillColor,
      }),
      stroke: new Stroke({
        color: outlineColor,
        width: outlineWidth,
      }),
      offsetX: offsetX,
      offsetY: offsetY,
      rotation: rotation,
    });
  }

  function getImage() {
    return icon === "" ? getPoint() : getIcon();
  }

  function getIcon() {
    return new Icon({
      src: icon,
      scale: 0.5,
      anchorXUnits: "pixels",
      anchorYUnits: "pixels",
      anchor: [symbolXOffset, symbolYOffset],
    });
  }

  function getPoint() {
    return new Circle({
      fill: getFill(),
      stroke: getStroke(),
      radius: parseInt(pointSize, 10) || 4,
    });
  }

  function getStroke() {
    return new Stroke({
      color: lineColor,
      width: lineWidth,
      lineDash: getLineDash(),
    });
  }

  function getStyleObj() {
    var obj = {
      fill: getFill(),
      image: getImage(),
      stroke: getStroke(),
    };
    if (showLabels) {
      obj.text = getText();
    }

    return obj;
  }

  return [new Style(getStyleObj())];
}
class WFSLayer {
  constructor(config, proxyUrl, map) {
    config = {
      ...WFSLayerProperties,
      ...config,
    };
    this.config = config;
    this.proxyUrl = proxyUrl;
    this.map = map;
    this.style = createStyle.apply(this);
    this.filterAttribute = config.filterAttribute;
    this.filterValue = config.filterValue;
    this.filterComparer = config.filterComparer;
    this.features = [];

    this.vectorSource = new VectorSource({
      loader: (extent) => {
        if (config.dataFormat === "GeoJSON") {
          this.loadData(config.url, config.dataFormat.toLowerCase());
        } else if (config.dataFormat === "wkt") {
          this.loadData(config.url, config.dataFormat.toLowerCase()); // TODO Load wkt instead
        } else {
          if (config.loadType === "ajax") {
            this.loadData(this.createUrl(extent, true));
          }
        }
      },
      strategy: strategyAll,
    });

    /*
    if (config.legend[0].url === "") {
      this.generateLegend(imageData => {
        config.legend[0].url = imageData;
      });
    }
    */
    this.layer = new Vector({
      information: config.information,
      caption: config.caption,
      name: config.name,
      visible: config.visible,
      opacity: config.opacity,
      queryable: config.queryable,
      filterable: config.filterable,
      layerInfo: new LayerInfo(config),
      renderMode: "image",
      style: this.getStyle.bind(this),
      source: this.vectorSource,
      url: config.url,
    });
    if (config.dataFormat === "GeoJSON" || config.dataFormat === "wkt") {
      this.layer.featureType = "";
    } else {
      this.layer.featureType = config.params.typename.split(":")[1];
    }
    this.type = "wkt";
  }

  getStyle(forcedPointRadius) {
    if (forcedPointRadius) {
      return createStyle.call(this, undefined, forcedPointRadius);
    }
    return this.style;
  }

  reprojectFeatures(features, from, to) {
    if (Array.isArray(features)) {
      features.forEach((feature) => {
        if (feature.getGeometry() && feature.getGeometry().getCoordinates) {
          let coords = feature.getGeometry().getCoordinates();
          try {
            switch (feature.getGeometry().getType()) {
              case "Point":
                feature
                  .getGeometry()
                  .setCoordinates(transform(coords, from, to));
                break;
              case "LineString":
                feature
                  .getGeometry()
                  .setCoordinates(
                    coords.map((coord) => transform(coord, from, to))
                  );
                break;
              case "Polygon":
                feature
                  .getGeometry()
                  .setCoordinates([
                    coords[0].map((coord) => transform(coord, from, to)),
                  ]);
                break;
              default:
                throw new Error("Unknown geometry type.");
            }
          } catch (e) {
            console.error("Coordinate transformation error.", e);
          }
        }
      });
    }
  }

  addFeatures(data, format) {
    var features = [],
      parser,
      to = this.map.getView().getProjection().getCode(),
      from = this.config.projection;

    if (format === "wfs") {
      parser = new WFS({
        gmlFormat:
          this.config.params.version === "1.0.0" ? new GML2() : undefined,
      });
    }

    if (format === "geojson") {
      // geojson taken from vectorlayer, this code was written with the WKT from Collector in mind
      parser = new GeoJSON();
      features = parser.readFeatures(data);
    } else if (format === "wkt") {
      parser = new WKT();
      // The name of the fields where WKT strings are stored can ba anything, so attempt to parse all fields
      data.forEach((entry) => {
        Object.values(entry.properties).forEach(function (key, index) {
          try {
            var parsedFeatures = parser.readFeatures(key);
            parsedFeatures.forEach((feature) => {
              features.push(feature);
            });
          } catch (e) {
            //console.log("Error when parsing", key, e); // We will get errors on the parsing of all non-wkt fields in the db
          }
        });
      });
    }

    // compare if we got the same number of features, we don't need to update in that case
    if (features.length === this.features.length) {
      return;
    }

    if (to !== from) {
      this.reprojectFeatures(features, from, to);
    }

    if (
      (this.filterAttribute && this.filterValue) ||
      (this.layer.get("filterValue") && this.layer.get("filterAttribute"))
    ) {
      features = features.filter((feature) => this.filter(feature));
    }

    this.features = features;
    this.vectorSource.addFeatures(features);
  }

  createUrl() {
    var props = Object.keys(this.config.params);
    var url = this.config.url + "?";
    for (let i = 0; i < props.length; i++) {
      let key = props[i];
      let value = "";

      if (key !== "bbox") {
        value = this.config.params[key];
        url += key + "=" + value;
      }
      if (i !== props.length - 1) {
        url += "&";
      }
    }
    return url;
  }

  filterAttribute = "";

  filterComparer = "not";

  filterValue = "";

  filter(feature) {
    var filterAttribute =
      this.layer.get("filterAttribute") || this.filterAttribute;
    var filterValue = this.layer.get("filterValue") || this.filterValue;
    var filterComparer =
      this.layer.get("filterComparer") || this.filterComparer;

    switch (filterComparer) {
      case "gt":
        return (
          Number(feature.getProperties()[filterAttribute]) > Number(filterValue)
        );
      case "lt":
        return (
          Number(feature.getProperties()[filterAttribute]) < Number(filterValue)
        );
      case "eq":
        if (!Number.isNaN(Number(filterValue))) {
          return (
            Number(feature.getProperties()[filterAttribute]) ===
            Number(filterValue)
          );
        }
        return feature.getProperties()[filterAttribute] === filterValue;
      case "not":
        if (!Number.isNaN(Number(filterValue))) {
          return (
            Number(feature.getProperties()[filterAttribute]) !==
            Number(filterValue)
          );
        }
        return feature.getProperties()[filterAttribute] !== filterValue;
      default:
        return false;
    }
  }

  loadData(url, format) {
    url = this.proxyUrl + url;

    var colonIdx = this.config.params.typename.indexOf(":");
    var featureNS = this.config.params.typename.substring(0, colonIdx);
    var featureTypes = this.config.params.typename.substring(colonIdx + 1);
    // generate a GetFeature request
    var featureRequest = new WFS().writeGetFeature({
      srsName: this.config.srsname,
      featureNS: featureNS,
      featureTypes: [featureTypes],
      outputFormat: "application/json",
    });

    // then post the request and add the received features to a layer
    fetch(url, {
      method: "POST",
      body: new XMLSerializer().serializeToString(featureRequest),
    })
      .then(function (response) {
        return response.json();
      })
      .then((json) => {
        this.addFeatures(json.features, format || "wfs");
      });
  }

  generateLegend(callback) {
    var url = this.proxyUrl + this.createUrl();
    fetch(url, fetchConfig).then((response) => {
      response.text().then((gmlText) => {
        const parser = new GML2();
        const features = parser.readFeatures(gmlText);
        const canvas = document.createElement("canvas");

        const scale = 120;
        const padding = 1 / 5;
        const pointRadius = 15;

        const vectorContext = toContext(canvas.getContext("2d"), {
          size: [scale, scale],
        });
        const style = this.getStyle(pointRadius)[0];
        vectorContext.setStyle(style);

        var featureType = "Point";
        if (features.length > 0) {
          featureType = features[0].getGeometry().getType();
        }

        switch (featureType) {
          case "Point":
          case "MultiPoint":
            vectorContext.drawGeometry(new Point([scale / 2, scale / 2]));
            break;
          case "Polygon":
          case "MultiPolygon":
            vectorContext.drawGeometry(
              new Polygon([
                [
                  [scale * padding, scale * padding],
                  [scale * padding, scale - scale * padding],
                  [scale - scale * padding, scale - scale * padding],
                  [scale - scale * padding, scale * padding],
                  [scale * padding, scale * padding],
                ],
              ])
            );
            break;
          case "LineString":
          case "MultiLineString":
            vectorContext.drawGeometry(
              new LineString([
                [scale * padding, scale - scale * padding],
                [scale - scale * padding, scale * padding],
              ])
            );
            break;
          default:
            break;
        }
        callback(canvas.toDataURL());
      });
    });
  }
}

export default WFSLayer;
