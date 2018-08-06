// Unused modules
// import TileGrid from "ol/tilegrid/TileGrid";
// import TileWMSSource from "ol/source/TileWMS";
// import TileLayer from "ol/layer/Tile";

// Depracated module
// import ImageVectorSource from "ol/source/ImageVector";
// ^^ Deprecated. Use an ol.layer.Vector with renderMode: 'image' and an ol.source.Vector instead.
// https://openlayers.org/en/latest/apidoc/ol.source.ImageVector.html

import VectorSource from "ol/source/Vector";
import { Image as ImageLayer, Vector as VectorLayer } from "ol/layer";
import { WFS, GeoJSON } from "ol/format";
import GML2 from "ol/format/GML2";
import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll } from "ol/loadingstrategy";
import { transform } from "ol/proj";

import LayerInfo from "./LayerInfo.js";

let vectorLayerProperties = {
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
    bbox: ""
  },
  showLabels: true
};

var featureMap = {};

class WFSVectorLayer {
  constructor(config, proxyUrl, map) {
    config = {
      ...vectorLayerProperties,
      ...config
    };
    this.config = config;
    this.proxyUrl = proxyUrl;
    this.map = map;

    this.vectorSource = new VectorSource({
      loader: extent => {
        console.log("vectorSource.loader(extent): ", extent);
        if (config.dataFormat === "GeoJSON") {
          this.loadData(config.url, config.dataFormat.toLowerCase());
        } else {
          if (config.loadType === "ajax") {
            this.loadData(this.createUrl(extent, true));
          }
        }
      },
      strategy: strategyAll
    });

    this.layer = new ImageLayer({
      information: config.information,
      caption: config.caption,
      name: config.name,
      visible: config.visible,
      opacity: config.opacity,
      queryable: config.queryable,
      layerInfo: new LayerInfo(config),
      source: new VectorLayer({
        source: this.vectorSource,
        renderMode: "image", // "image" || "vector"
        style: this.getStyle.bind(this)
      })
    });
    // console.log("constructor(), this.layer: ", this.layer);
    this.type = "vector";
  }

  getStyle(feature, resolution) {
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

    function getLineDash() {
      var scale = (a, f) => a.map(b => f * b),
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
        color: fillColor
      });
    }

    function getText() {
      return new Text({
        textAlign: align,
        textBaseline: baseline,
        font: font,
        text: feature ? feature.get(labelAttribute) : "",
        fill: new Fill({
          color: labelFillColor
        }),
        stroke: new Stroke({
          color: outlineColor,
          width: outlineWidth
        }),
        offsetX: offsetX,
        offsetY: offsetY,
        rotation: rotation
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
        anchor: [symbolXOffset, symbolYOffset]
      });
    }

    function getPoint() {
      return new Circle({
        fill: getFill(),
        stroke: getStroke(),
        radius: 4
      });
    }

    function getStroke() {
      return new Stroke({
        color: lineColor,
        width: lineWidth,
        lineDash: getLineDash()
      });
    }

    function getStyleObj() {
      var obj = {
        fill: getFill(),
        image: getImage(),
        stroke: getStroke()
      };
      if (showLabels) {
        obj.text = getText();
      }

      return obj;
    }

    return [new Style(getStyleObj())];
  }

  reprojectFeatures(features, from, to) {
    if (Array.isArray(features)) {
      features.forEach(feature => {
        if (feature.getGeometry().getCoordinates) {
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
                    coords.map(coord => transform(coord, from, to))
                  );
                break;
              case "Polygon":
                feature
                  .getGeometry()
                  .setCoordinates([
                    coords[0].map(coord => transform(coord, from, to))
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
    console.log("addFeatures: ", data, format);
    var features = [],
      parser,
      to = this.map
        .getView()
        .getProjection()
        .getCode(),
      from = this.config.projection;

    if (format === "wfs") {
      parser = new WFS({
        gmlFormat:
          this.config.params.version === "1.0.0" ? new GML2() : undefined
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

    this.vectorSource.addFeatures(features);
  }

  createUrl(extent, ll) {
    var props = Object.keys(this.config.params);
    var url = this.config.url + "?";
    // version = this.config.params.version;

    for (let i = 0; i < props.length; i++) {
      let key = props[i];
      let value = "";

      if (key !== "bbox") {
        value = this.config.params[key];
        url += key + "=" + value;
      } else {
        // value = extent.join(',');
        // if (version !== "1.0.0") {
        //    value += "," + this.get("params")['srsname'];
        // }
      }

      if (i !== props.length - 1) {
        url += "&";
      }
    }

    return url;
  }

  loadData(url, format) {
    url = this.proxyUrl + url;
    fetch(url).then(response => {
      response.text().then(features => {
        this.addFeatures(features, format || "wfs");
      });
    });
  }
}

export default WFSVectorLayer;

// import ImageLayer from "ol/layer/Image";
// import VectorLayer from "ol/layer/Vector";

// import Vector from "ol/source/Vector";

// import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
// import { transform } from "ol/proj";
// import WFS from "ol/format/WFS";
// import GeoJSON from "ol/format/GeoJSON";
// import GML2 from "ol/format/GML2";

// import LayerInfo from "./LayerInfo.js";
// import { all as loadingStrategyAll } from "ol/loadingstrategy";

// let vectorLayerProperties = {
//   url: "",
//   featureId: "FID",
//   serverType: "geoserver",
//   dataFormat: "WFS",
//   params: {
//     service: "",
//     version: "",
//     request: "",
//     typename: "",
//     outputFormat: "",
//     srsname: "",
//     bbox: ""
//   },
//   showLabels: true
// };

// var featureMap = {};

// class WFSVectorLayer {
//   constructor(config, proxyUrl, map) {
//     config = {
//       ...vectorLayerProperties,
//       ...config
//     };
//     this.config = config;
//     this.proxyUrl = proxyUrl;
//     this.map = map;

//     this.vectorSource = new Vector({
//       loader: extent => {
//         if (config.dataFormat === "GeoJSON") {
//           this.loadData(config.url, config.dataFormat.toLowerCase());
//         } else {
//           if (config.loadType === "ajax") {
//             this.loadData(this.createUrl(extent, true));
//           }
//         }
//       },
//       strategy: loadingStrategyAll
//     });

//     this.layer = new ImageLayer({
//       information: config.information,
//       caption: config.caption,
//       name: config.name,
//       visible: config.visible,
//       opacity: config.opacity,
//       queryable: config.queryable,
//       layerInfo: new LayerInfo(config),
//       source: new VectorLayer({
//         source: this.vectorSource,
//         style: this.getStyle.bind(this)
//       })
//     });

//     this.type = "vector";
//   }

//   getStyle(feature, resolution) {
//     const icon = this.config.icon;
//     const fillColor = this.config.fillColor;
//     const lineColor = this.config.lineColor;
//     const lineStyle = this.config.lineStyle;
//     const lineWidth = this.config.lineWidth;
//     const symbolXOffset = this.config.symbolXOffset;
//     const symbolYOffset = this.config.symbolYOffset;
//     const rotation = 0.0;
//     const align = this.config.labelAlign;
//     const baseline = this.config.labelBaseline;
//     const size = this.config.labelSize;
//     const offsetX = this.config.labelOffsetX;
//     const offsetY = this.config.labelOffsetY;
//     const weight = this.config.labelWeight;
//     const font = weight + " " + size + " " + this.config.labelFont;
//     const labelFillColor = this.config.labelFillColor;
//     const outlineColor = this.config.labelOutlineColor;
//     const outlineWidth = this.config.labelOutlineWidth;
//     const labelAttribute = this.config.labelAttribute;
//     const showLabels = this.config.showLabels;

//     function getLineDash() {
//       var scale = (a, f) => a.map(b => f * b),
//         width = lineWidth,
//         style = lineStyle,
//         dash = [12, 7],
//         dot = [2, 7];
//       switch (style) {
//         case "dash":
//           return width > 3 ? scale(dash, 2) : dash;
//         case "dot":
//           return width > 3 ? scale(dot, 2) : dot;
//         default:
//           return undefined;
//       }
//     }

//     function getFill() {
//       return new Fill({
//         color: fillColor
//       });
//     }

//     function getText() {
//       return new Text({
//         textAlign: align,
//         textBaseline: baseline,
//         font: font,
//         text: feature ? feature.get(labelAttribute) : "",
//         fill: new Fill({
//           color: labelFillColor
//         }),
//         stroke: new Stroke({
//           color: outlineColor,
//           width: outlineWidth
//         }),
//         offsetX: offsetX,
//         offsetY: offsetY,
//         rotation: rotation
//       });
//     }

//     function getImage() {
//       return icon === "" ? getPoint() : getIcon();
//     }

//     function getIcon() {
//       return new Icon({
//         src: icon,
//         scale: 1,
//         anchorXUnits: "pixels",
//         anchorYUnits: "pixels",
//         anchor: [symbolXOffset, symbolYOffset]
//       });
//     }

//     function getPoint() {
//       return new Circle({
//         fill: getFill(),
//         stroke: getStroke(),
//         radius: 4
//       });
//     }

//     function getStroke() {
//       return new Stroke({
//         color: lineColor,
//         width: lineWidth,
//         lineDash: getLineDash()
//       });
//     }

//     function getStyleObj() {
//       var obj = {
//         fill: getFill(),
//         image: getImage(),
//         stroke: getStroke()
//       };
//       if (showLabels) {
//         obj.text = getText();
//       }

//       return obj;
//     }

//     return [new Style(getStyleObj())];
//   }

//   reprojectFeatures(features, from, to) {
//     if (Array.isArray(features)) {
//       features.forEach(feature => {
//         if (feature.getGeometry().getCoordinates) {
//           let coords = feature.getGeometry().getCoordinates();
//           try {
//             switch (feature.getGeometry().getType()) {
//               case "Point":
//                 feature
//                   .getGeometry()
//                   .setCoordinates(transform(coords, from, to));
//                 break;
//               case "LineString":
//                 feature
//                   .getGeometry()
//                   .setCoordinates(
//                     coords.map(coord => transform(coord, from, to))
//                   );
//                 break;
//               case "Polygon":
//                 feature
//                   .getGeometry()
//                   .setCoordinates([
//                     coords[0].map(coord => transform(coord, from, to))
//                   ]);
//                 break;
//             }
//           } catch (e) {
//             console.error("Coordinate transformation error.", e);
//           }
//         }
//       });
//     }
//   }

//   addFeatures(data, format) {
//     var features = [],
//       parser,
//       to = this.map
//         .getView()
//         .getProjection()
//         .getCode(),
//       from = this.config.projection;

//     if (format === "wfs") {
//       parser = new WFS({
//         gmlFormat:
//           this.config.params.version === "1.0.0" ? new GML2() : undefined
//       });
//     }

//     if (format === "geojson") {
//       parser = new GeoJSON();
//     }

//     if (parser) {
//       features = parser.readFeatures(data);
//     }

//     if (to !== from) {
//       this.reprojectFeatures(features, from, to);
//     }

//     this.vectorSource.addFeatures(features);
//   }

//   createUrl(extent, ll) {
//     var props = Object.keys(this.config.params),
//       url = this.config.url + "?",
//       version = this.config.params.version;

//     for (let i = 0; i < props.length; i++) {
//       let key = props[i];
//       let value = "";

//       if (key !== "bbox") {
//         value = this.config.params[key];
//         url += key + "=" + value;
//       } else {
//         // value = extent.join(',');
//         // if (version !== "1.0.0") {
//         //    value += "," + this.get("params")['srsname'];
//         // }
//       }

//       if (i !== props.length - 1) {
//         url += "&";
//       }
//     }

//     return url;
//   }

//   loadData(url, format) {
//     url = this.proxyUrl + url;
//     fetch(url).then(response => {
//       response.text().then(features => {
//         this.addFeatures(features, format || "wfs");
//       });
//     });
//   }
// }

// export default WFSVectorLayer;
