import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import TileGrid from "ol/tilegrid/TileGrid";
import VectorSource from "ol/source/Vector";
import { Vector as VectorLayer } from "ol/layer";
import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON.js";
import { transform } from "ol/proj";
import { Fill, Text, Stroke, Icon, Circle, Style } from "ol/style";
import { all as strategyAll } from "ol/loadingstrategy";
import "ol/ol.css";
import CoordinateSystemLoader from "./CoordinateSystemLoader.js";
import { register } from "ol/proj/proj4";
import { hfetch } from "utils/FetchWrapper";

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

const KML_SIMPLE_TYPES = {
  Point: "point",
  MultiPoint: "point",
  LineString: "line",
  MultiLineString: "line",
  Polygon: "polygon",
  MultiPolygon: "polygon",
};

function kmlGeometryType(geometry) {
  if (!geometry) return null;
  const simple = KML_SIMPLE_TYPES[geometry.getType()];
  if (simple) return simple;
  if (geometry.getType() !== "GeometryCollection") return "collection";
  const kinds = new Set();
  const visit = (part) => {
    if (part.getType() === "GeometryCollection") {
      part.getGeometries().forEach(visit);
      return;
    }
    const kind = KML_SIMPLE_TYPES[part.getType()];
    if (kind) kinds.add(kind);
  };
  visit(geometry);
  return kinds.size === 1 ? [...kinds][0] : "collection";
}

function kmlColorWithOpacity(color, opacity) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
  const alpha = Number(opacity);
  if (!match || !Number.isFinite(alpha)) return color;
  const hex = match[1];
  return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${alpha})`;
}

function kmlHasStyle(config, fields) {
  return fields.every((key) => config[key] != null && config[key] !== "");
}

function kmlOverrideStyles(config) {
  const styles = {};
  if (kmlHasStyle(config, ["pointColor", "pointRadius"]))
    styles.point = new Style({
      zIndex: 1,
      image: new Circle({
        radius: config.pointRadius,
        fill: new Fill({ color: config.pointColor }),
      }),
    });
  if (kmlHasStyle(config, ["lineColor", "lineWidth"]))
    styles.line = new Style({
      stroke: new Stroke({ color: config.lineColor, width: config.lineWidth }),
    });
  if (
    kmlHasStyle(config, [
      "polygonStrokeColor",
      "polygonStrokeWidth",
      "polygonFillColor",
      "polygonFillOpacity",
    ])
  )
    styles.polygon = new Style({
      stroke: new Stroke({
        color: config.polygonStrokeColor,
        width: config.polygonStrokeWidth,
      }),
      fill: new Fill({
        color: kmlColorWithOpacity(
          config.polygonFillColor,
          config.polygonFillOpacity,
        ),
      }),
    });
  return styles;
}

class OpenLayersMap {
  constructor(settings) {
    var center = [0, 0],
      zoom = 0;

    this.mapSettings = settings.mapSettings;

    if (settings.config.center) {
      center = settings.config.center;
    } else {
      center = this.mapSettings.center;
    }
    if (settings.config.zoom) {
      zoom = settings.config.zoom;
    } else {
      zoom = this.mapSettings.zoom;
    }

    this.coordinateSystemLoader = new CoordinateSystemLoader();

    register(this.coordinateSystemLoader.getProj4());
    this.definitions = this.coordinateSystemLoader.getDefinitions();

    var definition = this.definitions.find(
      (definition) => definition.code === this.mapSettings.projection,
    );

    if (definition) {
      this.projection = definition.code;
    }
    this.extent = this.mapSettings.extent;
    this.layers = [];
    var source = {
      url: settings.wmsUrl,
      params: {
        LAYERS: settings.wmsLayers,
        FORMAT: "image/png",
        VERSION: "1.1.0",
        SRS: this.projection,
      },
      serverType: "geoserver",
      imageFormat: "image/png",
    };
    source.tileGrid = new TileGrid({
      resolutions: this.mapSettings.resolutions,
      origin: this.mapSettings.origin,
    });
    source.extent = this.mapSettings.extent;

    this.map = new Map({
      layers: [
        new TileLayer({
          visible: true,
          opacity: 1,
          source: new TileWMS(source),
          id: -1,
        }),
      ],
      target: settings.target,
      view: new View({
        zoom: zoom,
        units: "m",
        resolutions: this.mapSettings.resolutions,
        center: center,
        projection: this.projection,
        extent: this.mapSettings.extent,
      }),
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
      zoom: Math.round(this.map.getView().getZoom()),
      extent: this.map.getView().calculateExtent(this.map.getSize()),
    };
  }

  getMap() {
    return this.map;
  }

  getCoordinateSystems() {
    return this.definitions;
  }

  setLayersConfig(layersConfig) {
    this.layersConfig = layersConfig;
    this.addWmsLayers(this.layersConfig.wmslayers);
    this.addVectorLayers(this.layersConfig.vectorlayers);
    this.addGPXLayers(this.layersConfig.gpxlayers || []);
    this.addKMLLayers(this.layersConfig.kmllayers || []);
  }

  addKMLLayers(layers) {
    layers.forEach((config) => {
      let loaded = false;
      let pending = false;
      const source = new VectorSource({ attributions: config.attribution });
      const overrides = kmlOverrideStyles(config);
      const layer = new VectorLayer({
        id: config.id,
        visible: false,
        source,
        opacity: config.opacity == null ? 1 : config.opacity,
        maxResolution:
          config.minZoom >= 0
            ? this.map.getView().getResolutionForZoom(config.minZoom)
            : undefined,
        minResolution:
          config.maxZoom >= 0
            ? this.map.getView().getResolutionForZoom(config.maxZoom)
            : undefined,
        zIndex: config.drawOrder,
        style: (feature, resolution) => {
          const override = overrides[kmlGeometryType(feature.getGeometry())];
          if (override) return override;
          const featureStyle = feature.getStyle();
          return typeof featureStyle === "function"
            ? featureStyle(feature, resolution)
            : featureStyle;
        },
      });
      layer.on("change:visible", async () => {
        if (!layer.getVisible() || loaded || pending) return;
        pending = true;
        try {
          const response = await hfetch(config.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          source.addFeatures(
            new KML({ extractStyles: true, showPointNames: true })
              .readFeatures(await response.text(), {
                featureProjection: this.map.getView().getProjection(),
              })
              .filter((feature) => feature.getGeometry())
              .map((feature) => {
                const override =
                  overrides[kmlGeometryType(feature.getGeometry())];
                if (override) feature.setStyle(override);
                return feature;
              }),
          );
          loaded = true;
        } catch (error) {
          console.error(`Could not preview KML layer ${config.caption}`, error);
        } finally {
          pending = false;
        }
      });
      this.map.addLayer(layer);
    });
  }

  addGPXLayers(layers) {
    layers.forEach((config) => {
      let loaded = false;
      let pending = false;
      const source = new VectorSource({ attributions: config.attribution });
      const styles = {
        Point: new Style({
          zIndex: 1,
          image: new Circle({
            radius: config.waypointRadius || 6,
            fill: new Fill({ color: config.waypointColor || "#008000" }),
          }),
        }),
        LineString: new Style({
          stroke: new Stroke({
            color: config.routeColor || "#ffa500",
            width: config.routeWidth || 3,
          }),
        }),
        MultiLineString: new Style({
          stroke: new Stroke({
            color: config.trackColor || "#0000ff",
            width: config.trackWidth || 3,
          }),
        }),
      };
      const layer = new VectorLayer({
        id: config.id,
        visible: false,
        source,
        opacity: config.opacity == null ? 1 : config.opacity,
        maxResolution:
          config.minZoom >= 0
            ? this.map.getView().getResolutionForZoom(config.minZoom)
            : undefined,
        minResolution:
          config.maxZoom >= 0
            ? this.map.getView().getResolutionForZoom(config.maxZoom)
            : undefined,
        zIndex: config.drawOrder,
        style: (feature) => styles[feature.getGeometry().getType()],
      });
      layer.on("change:visible", async () => {
        if (!layer.getVisible() || loaded || pending) return;
        pending = true;
        try {
          const response = await hfetch(config.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          source.addFeatures(
            new GPX().readFeatures(await response.text(), {
              featureProjection: this.map.getView().getProjection(),
            }),
          );
          loaded = true;
        } catch (error) {
          console.error(`Could not preview GPX layer ${config.caption}`, error);
        } finally {
          pending = false;
        }
      });
      this.map.addLayer(layer);
    });
  }

  addWmsLayers(layers) {
    layers.forEach((layer) => {
      var source = {
        url: layer.url,
        params: {
          LAYERS: layer.layers.join(","),
          FORMAT: "image/png",
          VERSION: "1.1.0",
          SRS: this.projection,
        },
        serverType: "geoserver",
        imageFormat: "image/png",
      };

      var mapLayer = new TileLayer({
        visible: false,
        opacity: 1,
        id: layer.id,
        source: new TileWMS(source),
        url: layer.url,
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
                    coords.map((coord) => transform(coord, from, to)),
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

  loadData(layer, url, source) {
    hfetch(url).then((response) => {
      response.text().then((features) => {
        this.addFeatures(layer, features, source);
      });
    });
  }

  addFeatures(layer, data, source) {
    var features = [],
      parser = new GeoJSON(),
      to = this.map.getView().getProjection().getCode(),
      from = layer.projection;
    features = parser.readFeatures(data);

    if (to !== from) {
      this.reprojectFeatures(features, from, to);
    }

    source.addFeatures(features);
  }

  addVectorLayers(layers) {
    layers.forEach((layer) => {
      layer.params = {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typename: layer.layer,
        srsname: layer.projection,
        outputFormat: "application/json",
        bbox: "",
      };

      var vectorSource = new VectorSource({
        format: new GeoJSON(),
        loader: (extent) => {
          var url = this.createUrl(layer, extent);
          this.loadData(layer, url, vectorSource);
        },
        strategy: strategyAll,
      });

      var vectorLayer = new VectorLayer({
        id: layer.id,
        visible: false,
        source: vectorSource,
        style: createStyle.bind(this, layer),
      });

      this.map.addLayer(vectorLayer);
    });
  }

  setLayers(layers = []) {
    var mapLayers = this.map.getLayers().getArray();

    var hiddenLayers = mapLayers.filter((mapLayer) => {
      if (mapLayer.get("id") === -1) {
        return false;
      } else {
        return !layers.some((layer) => layer === mapLayer.get("id"));
      }
    });
    var visibleLayers = mapLayers.filter((mapLayer) => {
      if (mapLayer.get("id") === -1) {
        return true;
      } else {
        return layers.some((layer) => layer === mapLayer.get("id"));
      }
    });
    hiddenLayers.forEach((layer) => {
      layer.setVisible(false);
    });
    visibleLayers.forEach((layer) => {
      layer.setVisible(true);
    });
  }
}

export default OpenLayersMap;
