import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Circle, Fill, Stroke, Style } from "ol/style.js";
import { unByKey } from "ol/Observable.js";
import LayerInfo from "./LayerInfo.js";
import { hfetch } from "../../utils/FetchWrapper.js";
import { hasKmlStyle, readKML } from "./kml.js";

function colorWithOpacity(color, opacity) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
  const alpha = Number(opacity);
  if (!match || !Number.isFinite(alpha)) return color;
  const hex = match[1];
  return `rgba(${parseInt(hex.slice(0, 2), 16)},${parseInt(hex.slice(2, 4), 16)},${parseInt(hex.slice(4, 6), 16)},${alpha})`;
}

function legendSwatch(type, config) {
  const canvas = document.createElement("canvas");
  const symbolSize =
    type === "point"
      ? config.pointRadius * 2
      : type === "line"
        ? config.lineWidth
        : Math.max(16, config.polygonStrokeWidth);
  canvas.height = Math.max(24, Math.ceil(symbolSize) + 4);
  canvas.width = canvas.height + 100;
  const center = canvas.height / 2;
  const ctx = canvas.getContext("2d");
  if (type === "point") {
    ctx.fillStyle = config.pointColor;
    ctx.beginPath();
    ctx.arc(center, center, config.pointRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "line") {
    ctx.strokeStyle = config.lineColor;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();
    ctx.moveTo(2, center);
    ctx.lineTo(canvas.height - 2, center);
    ctx.stroke();
  } else {
    const inset = Math.max(2, config.polygonStrokeWidth);
    ctx.fillStyle = colorWithOpacity(
      config.polygonFillColor,
      config.polygonFillOpacity
    );
    ctx.strokeStyle = config.polygonStrokeColor;
    ctx.lineWidth = config.polygonStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(inset, inset);
    ctx.lineTo(canvas.height - inset, inset);
    ctx.lineTo(canvas.height - inset, canvas.height - inset);
    ctx.lineTo(inset, canvas.height - inset);
    ctx.lineTo(inset, inset);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#000";
  ctx.fillText(type, canvas.height + 6, center + 4);
  return { url: canvas.toDataURL(), description: type };
}

export default class KMLLayer {
  constructor(config, proxy, map, observer) {
    const overrides = {};
    if (hasKmlStyle(config, "point"))
      overrides.point = new Style({
        zIndex: 1,
        image: new Circle({
          radius: config.pointRadius,
          fill: new Fill({ color: config.pointColor }),
        }),
      });
    if (hasKmlStyle(config, "line"))
      overrides.line = new Style({
        stroke: new Stroke({
          color: config.lineColor,
          width: config.lineWidth,
        }),
      });
    if (hasKmlStyle(config, "polygon"))
      overrides.polygon = new Style({
        stroke: new Stroke({
          color: config.polygonStrokeColor,
          width: config.polygonStrokeWidth,
        }),
        fill: new Fill({
          color: colorWithOpacity(
            config.polygonFillColor,
            config.polygonFillOpacity
          ),
        }),
      });
    const legend = ["point", "line", "polygon"]
      .filter((type) => overrides[type])
      .map((type) => legendSwatch(type, config));
    this.layer = new VectorLayer({
      ...config,
      kml: true,
      source: new VectorSource({ attributions: config.attribution }),
      minZoom: config.minZoom >= 0 ? config.minZoom : undefined,
      maxZoom: config.maxZoom >= 0 ? config.maxZoom : undefined,
      layerInfo: new LayerInfo({ ...config, legend }),
      kmlTemplates: {
        point: config.pointInfobox,
        line: config.lineInfobox,
        polygon: config.polygonInfobox,
        collection: config.collectionInfobox,
      },
      // File styles stay on the feature. An override replaces that type entirely,
      // which also drops the point-name label OpenLayers would have drawn.
      style: (feature, resolution) => {
        const override = overrides[feature.get("kmlType")];
        if (override) return override;
        const featureStyle = feature.getStyle();
        return typeof featureStyle === "function"
          ? featureStyle(feature, resolution)
          : featureStyle;
      },
    });
    const status = (value) =>
      observer?.publish("layerswitcher.wmsLayerLoadStatus", {
        id: config.name,
        kml: true,
        status: value,
      });
    this.load = async () => {
      if (this.loaded || this.pending || this.disposed) return;
      this.pending = true;
      this.controller = new AbortController();
      status("loading");
      try {
        const response = await hfetch((proxy || "") + config.url, {
          signal: this.controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const features = readKML(
          await response.text(),
          config.name,
          map.getView().getProjection()
        );
        if (this.disposed) return;
        // OpenLayers gives feature styles precedence over the layer style.
        for (const feature of features) {
          const override = overrides[feature.get("kmlType")];
          if (override) feature.setStyle(override);
        }
        this.layer.getSource().addFeatures(features);
        this.loaded = true;
        this.layer.set("kmlLoadError", null);
        status("ok");
      } catch (error) {
        if (!this.disposed) {
          this.layer.set(
            "kmlLoadError",
            `Could not load ${config.caption}: ${error.message}`
          );
          status("loaderror");
          console.error(`Could not load KML layer ${config.caption}`, error);
        }
      } finally {
        this.pending = false;
      }
    };
    this.visibilityListener = this.layer.on("change:visible", () => {
      if (this.layer.getVisible()) this.load();
    });
    const dispose = this.layer.disposeInternal.bind(this.layer);
    this.layer.disposeInternal = () => {
      this.disposed = true;
      this.controller?.abort();
      unByKey(this.visibilityListener);
      dispose();
    };
    if (this.layer.getVisible()) this.load();
  }
}
