import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import GML2 from "ol/format/GML2";
import GML3 from "ol/format/GML3";
import WFS from "ol/format/WFS";
import Feature from "ol/Feature";
import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll, bbox as bboxStrategy } from "ol/loadingstrategy";
import { getPointResolution, transform } from "ol/proj";

import * as SLDReader from "@nieuwlandgeo/sldreader";

import LayerInfo from "./LayerInfo.js";
import { hfetch } from "utils/FetchWrapper";

const vectorLayerProperties = {
  url: "",
  params: {
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typename: "",
    outputFormat: "GML3",
    srsname: "",
    bbox: "",
  },
  showLabels: true,
};
class WFSVectorLayer {
  constructor(config, proxyUrl, map) {
    this.config = {
      ...vectorLayerProperties,
      ...config,
    };
    this.proxyUrl = proxyUrl;
    this.map = map;
    this.type = "vector"; // We're dealing with a vector layer
    this.allFeatures = [];

    // Read the three filter properties from config to allow filter on load
    this.filterAttribute = config.filterAttribute;
    this.filterComparer = config.filterComparer;
    this.filterValue = config.filterValue;

    this.vectorSource = new VectorSource({
      // Ensure we display copyright attributions
      attributions: config.attribution,
      // Loader function makes "url" and "format" parameters ignored as it
      // provides an own loading procedure. "strategy" is still respected, see below.
      loader: (extent, resolution, projection) => {
        this.loadData(this.createUrl(extent, projection.getCode()));
      },
      // The loading strategy to use. By default the BBox strategy is used,
      // loading features based on the view's extent and resolution.
      strategy:
        this.config?.loadingStrategy === "all" ? strategyAll : bboxStrategy,
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
      filterAttribute: config.filterAttribute,
      filterComparer: config.filterComparer,
      filterValue: config.filterValue,
      layerInfo: new LayerInfo(config),
      renderMode: "image",
      source: this.vectorSource,
      url: config.url,
      featureType: config.params.typename.split(":")[1],
      minZoom: config?.minZoom >= 0 ? config.minZoom : undefined,
      maxZoom: config?.maxZoom >= 0 ? config.maxZoom : undefined,
      timeSliderStart: config?.timeSliderStart,
      timeSliderEnd: config?.timeSliderEnd,
    });

    // Styling section starts here.
    // First read some values from config
    this.sldUrl = config?.sldUrl;
    this.sldText = config?.sldText;
    this.sldStyle = config?.sldStyle ?? "Default Styler";

    //Try fetching the URL, if specified, and style with the resulting SLD
    if (typeof this.sldUrl === "string" && this.sldUrl.trim().length > 0) {
      hfetch(this.sldUrl)
        .then((response) => response.text())
        .then((text) => this.applySldTextOnLayer(text));
    }
    // …else use supplied SLD text to style
    else if (
      typeof this.sldText === "string" &&
      this.sldText.trim().length > 10
    ) {
      this.applySldTextOnLayer(this.sldText);
    }
    // ...else use OpenLayer's style if specified in config
    else if (
      config.icon ||
      config.lineColor ||
      config.lineWidth ||
      config.fillColor ||
      config.lineStyle
    ) {
      this.style = this.createStyle.apply(this);
      this.layer.setStyle(this.getStyle());
    }
    // …or just fall back to OpenLayer's default styling if no SLD/SLD URL or OpenLayers style was specified.
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

  getAllFeatures(data) {
    let features = [];
    let parser = null;
    const to = this.map.getView().getProjection().getCode();
    const from = this.config.projection;
    const outputFormat = this.config.params.outputFormat;

    if (outputFormat.startsWith("GML")) {
      // If output format starts with GML, create a GML parser.
      // For WFS version 1.0.0 the GML2 parser should be used,
      // else GML3.
      parser = new WFS({
        gmlFormat:
          this.config.params.version === "1.0.0" ? new GML2() : new GML3(),
      });
    }

    if (outputFormat === "application/json") {
      parser = new GeoJSON();
    }

    if (parser) {
      features = parser.readFeatures(data);
    }

    if (to !== from) {
      this.reprojectFeatures(features, from, to);
    }

    return features;
  }

  /**
   * @summary If filtering is activated, filter feature collection, f. Else return all features.
   *
   * @param {*} f Feature collection to be filtered.
   * @returns
   * @memberof WFSVectorLayer
   */
  getFilteredFeatures(f) {
    if (this.layer.get("filterAttribute") && this.layer.get("filterValue")) {
      return f.filter((feature) => this.filterMethod(feature));
    } else {
      return f;
    }
  }

  /**
   * @summary A predicate method (returns either true of false), used to determine
   * whether current feature should be included in the filtered result.
   *
   * @param {*} feature Feature to check.
   * @returns {boolean}
   * @memberof WFSVectorLayer
   */
  filterMethod(feature) {
    const filterAttribute = this.layer.get("filterAttribute");
    const filterValue = this.layer.get("filterValue");
    const filterComparer = this.layer.get("filterComparer");

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

  loadData(url) {
    url = this.proxyUrl + url;

    hfetch(url).then((response) => {
      response.text().then((features) => {
        // Load all features (no filter active - only bbox limitation)
        this.allFeatures = this.getAllFeatures(features);

        // See if filtering is needed and populate the source with resulting features
        this.vectorSource.addFeatures(
          this.getFilteredFeatures(this.allFeatures)
        );
      });
    });
  }

  getStyle(forcedPointRadius) {
    if (forcedPointRadius) {
      return this.createStyle.call(this, undefined, forcedPointRadius);
    }
    return this.style;
  }

  createStyle(feature, forcedPointRadius) {
    const icon = this.config.icon || "";
    const fillColor = this.config.fillColor || "";
    const lineColor = this.config.lineColor || "";
    const lineStyle = this.config.lineStyle || "";
    const lineWidth = this.config.lineWidth || "";
    const symbolXOffset = this.config.symbolXOffset || "";
    const symbolYOffset = this.config.symbolYOffset || "";
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
        scale: 1,
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

  // generateLegend(callback) {
  //   var url = this.proxyUrl + this.createUrl();
  //   fetch(url).then((response) => {
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
