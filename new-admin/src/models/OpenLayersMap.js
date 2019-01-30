import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import WMTSTileGrid from "ol/tilegrid/WMTS.js";
import WMTS from "ol/source/WMTS.js";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import { Vector as VectorLayer } from "ol/layer";
import GeoJSON from "ol/format/GeoJSON.js";
import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll } from "ol/loadingstrategy";
import "ol/ol.css";
import CoordinateSystemLoader from "./CoordinateSystemLoader.js";
import { register } from "ol/proj/proj4";

function createStyle(layer, feature) {
  const icon = layer.icon || "";
  const fillColor = layer.fillColor;
  const lineColor = layer.lineColor;
  const lineStyle = layer.lineStyle;
  const lineWidth = layer.lineWidth;
  const symbolXOffset = layer.symbolXOffset;
  const symbolYOffset = layer.symbolYOffset;
  const rotation = 0.0;
  const align = layer.labelAlign;
  const baseline = layer.labelBaseline;
  const size = layer.labelSize;
  const offsetX = layer.labelOffsetX;
  const offsetY = layer.labelOffsetY;
  const weight = layer.labelWeight;
  const font = weight + " " + size + " " + layer.labelFont;
  const labelFillColor = layer.labelFillColor;
  const outlineColor = layer.labelOutlineColor;
  const outlineWidth = layer.labelOutlineWidth;
  const labelAttribute = layer.labelAttribute;
  const showLabels = layer.showLabels;
  const pointSize = layer.pointSize;

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
      text: feature ? feature.getProperties()[labelAttribute] : "",
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
      radius: parseInt(pointSize, 10) || 4
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

class OpenLayersMap {
  constructor(settings) {
    settings.config = settings.config || {
      center: [319268, 6471199],
      zoom: 6
    };

    this.coordinateSystemLoader = new CoordinateSystemLoader([
      {
        code: "EPSG:3006",
        definition:
          "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
        extent: [181896.33, 6101648.07, 864416.0, 7689478.3],
        units: null
      }
    ]);

    register(this.coordinateSystemLoader.getProj4());
    this.layers = [];
    this.map = new Map({
      layers: [
        new TileLayer({
          opacity: 1,
          id: -1,
          source: new WMTS({
            url: settings.wmtsUrl,
            layer: "topowebb",
            matrixSet: "3006",
            format: "image/png",
            projection: "EPGS:3006",
            tileGrid: new WMTSTileGrid({
              origin: [-1200000, 8500000],
              resolutions: [
                4096,
                2048,
                1024,
                512,
                256,
                128,
                64,
                32,
                16,
                8,
                4,
                2,
                1,
                0.5
              ],
              matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            }),
            style: "default",
            wrapX: false
          })
        })
      ],
      target: settings.target,
      view: new View({
        center: settings.config.center,
        zoom: settings.config.zoom,
        projection: "EPSG:3006",
        resolutions: [
          4096,
          2048,
          1024,
          512,
          256,
          128,
          64,
          32,
          16,
          8,
          4,
          2,
          1,
          0.5,
          0.25
        ],
        extent: [0, 6000000, 1000000, 9000000]
      })
    });
    this.onUpdate = settings.onUpdate;
    this.onUpdate(this.getState());
    this.bindEvents();
  }

  bindEvents() {
    this.map.getView().on("change:resolution", () => {
      this.onUpdate(this.getState());
    });
    this.map.getView().on("change:center", () => {
      this.onUpdate(this.getState());
    });
  }

  getState() {
    return {
      center: this.map.getView().getCenter(),
      zoom: Math.round(this.map.getView().getZoom())
    };
  }

  getMap() {
    return this.map;
  }

  setLayersConfig(layersConfig) {
    this.layersConfig = layersConfig;
    this.addWmsLayers(this.layersConfig.wmslayers);
    this.addVectorLayers(this.layersConfig.vectorlayers);
  }

  addWmsLayers(layers) {
    layers.forEach(layer => {
      var source = {
        url: layer.url,
        params: {
          LAYERS: layer.layers.join(","),
          FORMAT: "image/png",
          VERSION: "1.1.0",
          SRS: "EPSG:3006"
        },
        serverType: "geoserver",
        imageFormat: "image/png"
      };

      var mapLayer = new TileLayer({
        visible: false,
        opacity: 1,
        id: layer.id,
        source: new TileWMS(source),
        url: layer.url
      });

      this.map.addLayer(mapLayer);
    });
  }

  createUrl(layer, extent) {
    var props = Object.keys(layer.params);
    var url = layer.url + "?";
    for (let i = 0; i < props.length; i++) {
      let key = props[i];
      let value = "";

      if (key !== "bbox") {
        value = layer.params[key];
        url += key + "=" + value;
      }
      if (i !== props.length - 1) {
        url += "&";
      }
    }
    return url;
  }

  addVectorLayers(layers) {
    layers.forEach(layer => {
      layer.params = {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typename: layer.layer,
        srsname: layer.projection,
        outputFormat: "application/json",
        bbox: ""
      };

      var vectorSource = new VectorSource({
        format: new GeoJSON(),
        url: extent => {
          var url = this.createUrl(layer, extent);
          return url;
        },
        strategy: strategyAll
      });

      var vectorLayer = new VectorLayer({
        id: layer.id,
        visible: false,
        source: vectorSource,
        style: createStyle.bind(this, layer)
      });

      this.map.addLayer(vectorLayer);
    });
  }

  setLayers(layers = []) {
    var mapLayers = this.map.getLayers().getArray();

    var hiddenLayers = mapLayers.filter(mapLayer => {
      if (mapLayer.get("id") === -1) {
        return false;
      } else {
        return !layers.some(layer => layer === mapLayer.get("id"));
      }
    });
    var visibleLayers = mapLayers.filter(mapLayer => {
      if (mapLayer.get("id") === -1) {
        return true;
      } else {
        return layers.some(layer => layer === mapLayer.get("id"));
      }
    });
    hiddenLayers.forEach(layer => {
      layer.setVisible(false);
    });
    visibleLayers.forEach(layer => {
      layer.setVisible(true);
    });
  }
}

export default OpenLayersMap;
