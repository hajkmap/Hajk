import VectorSource from "ol/source/Vector";
import { Vector as VectorLayer } from "ol/layer";
import { WFS, GeoJSON } from "ol/format";
import GML2 from "ol/format/GML";
// import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll, bbox as bboxStrategy } from "ol/loadingstrategy";

import { transform } from "ol/proj";
// import { toContext } from "ol/render";
// import { Point, Polygon, LineString } from "ol/geom";
// import Feature from "ol/Feature";
import LayerInfo from "./LayerInfo.js";

import { getPointResolution } from "ol/proj";
import * as SLDReader from "@nieuwlandgeo/sldreader";

const fetchConfig = {
  credentials: "same-origin",
};

const vectorLayerProperties = {
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

// function createStyle(feature, forcedPointRadius) {
//   const icon = this.config.icon;
//   const fillColor = this.config.fillColor;
//   const lineColor = this.config.lineColor;
//   const lineStyle = this.config.lineStyle;
//   const lineWidth = this.config.lineWidth;
//   const symbolXOffset = this.config.symbolXOffset;
//   const symbolYOffset = this.config.symbolYOffset;
//   const rotation = 0.0;
//   const align = this.config.labelAlign;
//   const baseline = this.config.labelBaseline;
//   const size = this.config.labelSize;
//   const offsetX = this.config.labelOffsetX;
//   const offsetY = this.config.labelOffsetY;
//   const weight = this.config.labelWeight;
//   const font = weight + " " + size + " " + this.config.labelFont;
//   const labelFillColor = this.config.labelFillColor;
//   const outlineColor = this.config.labelOutlineColor;
//   const outlineWidth = this.config.labelOutlineWidth;
//   const labelAttribute = this.config.labelAttribute;
//   const showLabels = this.config.showLabels;
//   const pointSize = forcedPointRadius || this.config.pointSize;

//   feature = arguments[1] instanceof Feature ? arguments[1] : undefined;

//   function getLineDash() {
//     var scale = (a, f) => a.map((b) => f * b),
//       width = lineWidth,
//       style = lineStyle,
//       dash = [12, 7],
//       dot = [2, 7];
//     switch (style) {
//       case "dash":
//         return width > 3 ? scale(dash, 2) : dash;
//       case "dot":
//         return width > 3 ? scale(dot, 2) : dot;
//       default:
//         return undefined;
//     }
//   }

//   function getFill() {
//     return new Fill({
//       color: fillColor,
//     });
//   }

//   function getText() {
//     return new Text({
//       textAlign: align,
//       textBaseline: baseline,
//       font: font,
//       text: feature ? feature.getProperties()[labelAttribute] : "",
//       fill: new Fill({
//         color: labelFillColor,
//       }),
//       stroke: new Stroke({
//         color: outlineColor,
//         width: outlineWidth,
//       }),
//       offsetX: offsetX,
//       offsetY: offsetY,
//       rotation: rotation,
//     });
//   }

//   function getImage() {
//     return icon === "" ? getPoint() : getIcon();
//   }

//   function getIcon() {
//     return new Icon({
//       src: icon,
//       scale: 1,
//       anchorXUnits: "pixels",
//       anchorYUnits: "pixels",
//       anchor: [symbolXOffset, symbolYOffset],
//     });
//   }

//   function getPoint() {
//     return new Circle({
//       fill: getFill(),
//       stroke: getStroke(),
//       radius: parseInt(pointSize, 10) || 4,
//     });
//   }

//   function getStroke() {
//     return new Stroke({
//       color: lineColor,
//       width: lineWidth,
//       lineDash: getLineDash(),
//     });
//   }

//   function getStyleObj() {
//     var obj = {
//       fill: getFill(),
//       image: getImage(),
//       stroke: getStroke(),
//     };
//     if (showLabels) {
//       obj.text = getText();
//     }

//     return obj;
//   }

//   return [new Style(getStyleObj())];
// }

class WFSVectorLayer {
  constructor(config, proxyUrl, map) {
    config = {
      ...vectorLayerProperties,
      ...config,
    };
    this.config = config;
    this.proxyUrl = proxyUrl;
    this.map = map;
    // this.style = createStyle.apply(this);
    this.filterAttribute = config.filterAttribute;
    this.filterValue = config.filterValue;
    this.filterComparer = config.filterComparer;

    this.vectorSource = new VectorSource({
      loader: (extent, resolution, projection) => {
        if (config.dataFormat === "GeoJSON") {
          this.loadData(config.url, config.dataFormat.toLowerCase());
        } else {
          this.loadData(this.createUrl(extent, projection.getCode()));
        }
      },
      strategy:
        this.config?.loadStrategy === "all" ? strategyAll : bboxStrategy,
    });

    // if (config.legend[0].url === "") {
    //   this.generateLegend((imageData) => {
    //     config.legend[0].url = imageData;
    //   });
    // }

    this.layer = new VectorLayer({
      information: config.information,
      caption: config.caption,
      name: config.name,
      visible: config.visible,
      opacity: config.opacity,
      queryable: config.queryable,
      filterable: config.filterable,
      layerInfo: new LayerInfo(config),
      renderMode: "image",
      // style: this.getStyle.bind(this),
      source: this.vectorSource,
      url: config.url,
      minZoom: config?.minZoom >= 0 ? config.minZoom : undefined,
      maxZoom: config?.maxZoom >= 0 ? config.maxZoom : undefined,
    });

    this.sldUrl = config?.sldUrl;
    this.sldText = config?.sldText;
    this.sldStyle = config?.sldStyle ?? "Default Styler";

    if (typeof this.sldUrl === "string" && this.sldUrl.trim().length > 0) {
      fetch(this.sldUrl)
        .then((response) => response.text())
        .then((text) => this.applySldTextOnLayer(text));
    } else if (
      typeof this.sldText === "string" &&
      this.sldText.trim().length > 10
    ) {
      this.applySldTextOnLayer(this.sldText);
    }

    if (config.dataFormat === "GeoJSON") {
      this.layer.featureType = "";
    } else {
      this.layer.featureType = config.params.typename.split(":")[1];
    }
    this.type = "vector";
  }

  applySldTextOnLayer = (text) => {
    const sldObject = SLDReader.Reader(text);
    const sldLayer = SLDReader.getLayer(sldObject);
    const style = SLDReader.getStyle(sldLayer, this.sldStyle);
    const featureTypeStyle = style.featuretypestyles[0];

    const viewProjection = this.map.getView().getProjection();
    const olFunction = SLDReader.createOlStyleFunction(featureTypeStyle, {
      // Use the convertResolution option to calculate a more accurate resolution.
      convertResolution: (viewResolution) => {
        const viewCenter = this.map.getView().getCenter();
        return getPointResolution(viewProjection, viewResolution, viewCenter);
      },
      // If you use point icons with an ExternalGraphic, you have to use imageLoadCallback to
      // to update the vector layer when an image finishes loading.
      // If you do not do this, the image will only become visible after the next pan/zoom of the layer.
      imageLoadedCallback: () => {
        this.layer.changed();
      },
    });
    this.layer.setStyle(olFunction);
  };

  // getStyle(forcedPointRadius) {
  //   if (forcedPointRadius) {
  //     return createStyle.call(this, undefined, forcedPointRadius);
  //   }
  //   return this.style;
  // }

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
      parser = new GeoJSON();
    }

    if (parser) {
      features = parser.readFeatures(data);
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

    this.vectorSource.addFeatures(features);
  }

  createUrl(extent = [], projection = "") {
    // Grab params needed for URL creation
    const props = this.config.params;

    // Get rid of bbox that comes from config
    delete props.bbox;

    // Turn params into URLSearchParams string
    const usp = new URLSearchParams(props).toString();

    // If extent doesn't contain Infinity values, append it to the URL
    const bbox =
      extent.length === 4 && extent.includes(Infinity) === false
        ? `&bbox=${extent.join(",")},${projection}`
        : "";

    const url = this.config.url + "?" + usp + bbox;
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

  loadData(url, format = "wfs") {
    url = this.proxyUrl + url;

    fetch(url, fetchConfig).then((response) => {
      response.text().then((features) => {
        this.addFeatures(features, format);
      });
    });
  }

  // generateLegend(callback) {
  //   var url = this.proxyUrl + this.createUrl();
  //   fetch(url, fetchConfig).then((response) => {
  //     response.text().then((gmlText) => {
  //       const parser = new GML2();
  //       const features = parser.readFeatures(gmlText);
  //       const canvas = document.createElement("canvas");

  //       const scale = 120;
  //       const padding = 1 / 5;
  //       const pointRadius = 15;

  //       const vectorContext = toContext(canvas.getContext("2d"), {
  //         size: [scale, scale],
  //       });
  //       const style = this.getStyle(pointRadius)[0];
  //       vectorContext.setStyle(style);

  //       var featureType = "Point";
  //       if (features.length > 0) {
  //         featureType = features[0].getGeometry().getType();
  //       }

  //       switch (featureType) {
  //         case "Point":
  //         case "MultiPoint":
  //           vectorContext.drawGeometry(new Point([scale / 2, scale / 2]));
  //           break;
  //         case "Polygon":
  //         case "MultiPolygon":
  //           vectorContext.drawGeometry(
  //             new Polygon([
  //               [
  //                 [scale * padding, scale * padding],
  //                 [scale * padding, scale - scale * padding],
  //                 [scale - scale * padding, scale - scale * padding],
  //                 [scale - scale * padding, scale * padding],
  //                 [scale * padding, scale * padding],
  //               ],
  //             ])
  //           );
  //           break;
  //         case "LineString":
  //         case "MultiLineString":
  //           vectorContext.drawGeometry(
  //             new LineString([
  //               [scale * padding, scale - scale * padding],
  //               [scale - scale * padding, scale * padding],
  //             ])
  //           );
  //           break;
  //         default:
  //           break;
  //       }
  //       callback(canvas.toDataURL());
  //     });
  //   });
  // }
}

export default WFSVectorLayer;
