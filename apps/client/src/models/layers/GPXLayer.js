import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Circle, Fill, Stroke, Style } from "ol/style.js";
import { unByKey } from "ol/Observable.js";
import LayerInfo from "./LayerInfo.js";
import { hfetch } from "../../utils/FetchWrapper.js";
import { GPX_DEFAULTS, readGPX } from "./gpx.js";

export default class GPXLayer {
  constructor(config, proxy, map, observer) {
    const settings = { ...GPX_DEFAULTS, ...config };
    const styles = {
      waypoint: new Style({
        zIndex: 1,
        image: new Circle({
          radius: settings.waypointRadius,
          fill: new Fill({ color: settings.waypointColor }),
        }),
      }),
      route: new Style({
        stroke: new Stroke({
          color: settings.routeColor,
          width: settings.routeWidth,
        }),
      }),
      track: new Style({
        stroke: new Stroke({
          color: settings.trackColor,
          width: settings.trackWidth,
        }),
      }),
    };
    const legend = ["waypoint", "route", "track"].map((type) => {
      const canvas = document.createElement("canvas");
      const symbolSize =
        type === "waypoint"
          ? settings.waypointRadius * 2
          : settings[`${type}Width`];
      canvas.height = Math.max(24, Math.ceil(symbolSize) + 4);
      canvas.width = canvas.height + 100;
      const center = canvas.height / 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = settings[`${type}Color`];
      ctx.strokeStyle = settings[`${type}Color`];
      if (type === "waypoint") {
        ctx.beginPath();
        ctx.arc(center, center, settings.waypointRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = settings[`${type}Width`];
        ctx.beginPath();
        ctx.moveTo(2, center);
        ctx.lineTo(canvas.height - 2, center);
        ctx.stroke();
      }
      ctx.fillStyle = "#000";
      ctx.fillText(type, canvas.height + 6, center + 4);
      return { url: canvas.toDataURL(), description: type };
    });
    this.layer = new VectorLayer({
      ...config,
      gpx: true,
      source: new VectorSource({ attributions: config.attribution }),
      minZoom: config.minZoom >= 0 ? config.minZoom : undefined,
      maxZoom: config.maxZoom >= 0 ? config.maxZoom : undefined,
      layerInfo: new LayerInfo({ ...config, legend }),
      gpxTemplates: {
        waypoint: config.waypointInfobox,
        route: config.routeInfobox,
        track: config.trackInfobox,
      },
      style: (feature) => styles[feature.get("gpxType")],
    });
    const status = (value) =>
      observer?.publish("layerswitcher.wmsLayerLoadStatus", {
        id: config.name,
        gpx: true,
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
        const features = readGPX(
          await response.text(),
          config.name,
          map.getView().getProjection()
        );
        if (this.disposed) return;
        this.layer.getSource().addFeatures(features);
        this.loaded = true;
        this.layer.set("gpxLoadError", null);
        status("ok");
      } catch (error) {
        if (!this.disposed) {
          this.layer.set(
            "gpxLoadError",
            `Could not load ${config.caption}: ${error.message}`
          );
          status("loaderror");
          console.error(`Could not load GPX layer ${config.caption}`, error);
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
