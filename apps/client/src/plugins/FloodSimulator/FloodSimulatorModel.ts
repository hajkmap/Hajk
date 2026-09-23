import ImageTile from "ol/source/ImageTile";
import WebGLTileLayer from "ol/layer/WebGLTile";
import { unByKey } from "ol/Observable";
import { equivalent } from "ol/proj";

import type { EventsKey } from "ol/events";
import type { Options as WebGLTileOptions } from "ol/layer/WebGLTile";
import type { SourceType } from "ol/layer/WebGLTile";
import type { Pixel } from "ol/pixel";
import type { UrlLike } from "ol/source/ImageTile";
import type OlMap from "ol/Map";
import type { HajkApp } from "../../types/hajk";
import type {
  ElevationSample,
  FloodSimulatorModelSettings,
  FloodSimulatorResolvedOptions,
} from "./types";

import { LAYER_NAME, LAYER_Z_INDEX, UI_STRINGS } from "./constants";
import {
  createLookupTileGrid,
  parseExtent,
  type LookupTileGrid,
} from "./elevationTileGrid";
import { colorChannels } from "./utils/color";
import { decodeElevationFromPixelData } from "./utils/elevation";
import { createFloodLayerStyle } from "./utils/floodStyle";
import { resolveFloodSimulatorOptions } from "./utils/resolveOptions";
import { xyzUrl } from "./utils/xyzUrl";

export default class FloodSimulatorModel {
  #app: HajkApp;
  #map: OlMap;
  #options: FloodSimulatorResolvedOptions;
  #source: SourceType | null = null;
  #layer: WebGLTileLayer | null = null;
  #visible = false;
  #generation = 0;
  #level: number;
  #depthShading: boolean;
  #useDepthColors: boolean;
  #smoothDepthColors: boolean;
  #isobaths = false;
  #projectionWarningShown = false;
  #sourceErrorShown = false;
  #tileLoadErrors = 0;
  #sourceListeners: EventsKey[] = [];

  constructor(settings: FloodSimulatorModelSettings) {
    this.#app = settings.app;
    this.#map = settings.map;
    this.#visible = settings.visibleAtStart === true;
    this.#options = resolveFloodSimulatorOptions(settings);
    this.#level = this.#options.defaultLevel;
    this.#depthShading = this.#options.enableDepthShading;
    this.#useDepthColors = this.#options.depthColors.length > 0;
    this.#smoothDepthColors = this.#options.smoothDepthColors;
  }

  getOptions = (): FloodSimulatorResolvedOptions => this.#options;

  isHiddenByZoom = (): boolean => {
    const view = this.#map.getView();
    const zoom = view.getZoom();
    const resolution = view.getResolution();
    if (zoom === undefined || resolution === undefined) {
      return false;
    }

    const hideAtMinZoom = this.#options.hideAtMinZoom;
    if (hideAtMinZoom !== undefined && zoom <= hideAtMinZoom) {
      return true;
    }

    const maxResolution = this.#options.maxResolution;
    if (maxResolution !== undefined && resolution >= maxResolution) {
      return true;
    }

    return false;
  };

  init = (): void => {
    const generation = ++this.#generation;
    this.#clearLayer();

    const source = this.#createSource();
    if (!source || generation !== this.#generation) {
      return;
    }

    this.#source = source;
    this.#layer = this.#createLayer();
    this.#map.addLayer(this.#layer);
    this.#watchSource(source, generation);
    this.#validateProjection();
  };

  dispose = (): void => {
    this.#generation++;
    this.#clearLayer();
    this.#projectionWarningShown = false;
    this.#sourceErrorShown = false;
    this.#tileLoadErrors = 0;
  };

  setLevel = (level: number): void => {
    this.#level = level;
    this.#layer?.updateStyleVariables({ level });
  };

  setOpacity = (opacity: number): void => {
    this.#layer?.setOpacity(opacity);
  };

  setInterpolate = (enabled: boolean): void => {
    if (this.#options.interpolate === enabled) {
      return;
    }
    this.#options.interpolate = enabled;
    // Nothing is torn down until a replacement source exists: if there is
    // none (or no layer to swap it into), the current state is left intact.
    const source = this.#createSource();
    if (!source || !this.#layer) {
      return;
    }
    unByKey(this.#sourceListeners);
    this.#sourceListeners = [];
    const generation = ++this.#generation;
    this.#sourceErrorShown = false;
    this.#tileLoadErrors = 0;
    const previousSource = this.#source;
    this.#source = source;
    this.#layer.setSource(source);
    previousSource?.dispose();
    this.#watchSource(source, generation);
  };

  setDepthShading = (enabled: boolean): void => {
    this.#depthShading = enabled;
    this.#layer?.updateStyleVariables({ depthShading: enabled ? 1 : 0 });
  };

  setUseDepthColors = (enabled: boolean): void => {
    this.#useDepthColors = enabled;
    this.#layer?.updateStyleVariables({ useDepthColors: enabled ? 1 : 0 });
  };

  setSmoothDepthColors = (enabled: boolean): void => {
    this.#smoothDepthColors = enabled;
    this.#layer?.updateStyleVariables({ smoothDepthColors: enabled ? 1 : 0 });
  };

  setIsobaths = (enabled: boolean): void => {
    this.#isobaths = enabled;
    this.#layer?.updateStyleVariables({ isobaths: enabled ? 1 : 0 });
  };

  setWaterColor = (hex: string): void => {
    if (this.#options.waterColor === hex) {
      return;
    }
    this.#options.waterColor = hex;
    this.#layer?.updateStyleVariables(colorChannels(hex, "water"));
  };

  setDeepWaterColor = (hex: string): void => {
    if (this.#options.deepWaterColor === hex) {
      return;
    }
    this.#options.deepWaterColor = hex;
    this.#layer?.updateStyleVariables(colorChannels(hex, "deep"));
  };

  setMaxShadingDepth = (depth: number): void => {
    if (this.#options.maxShadingDepth === depth) {
      return;
    }
    this.#options.maxShadingDepth = depth;
    this.#layer?.updateStyleVariables({ maxShadingDepth: depth });
  };

  setVisible = (visible: boolean): void => {
    this.#visible = visible;
    this.#layer?.setVisible(visible);
  };

  getElevationAtPixel = (pixel: Pixel): ElevationSample => {
    if (!this.#layer) {
      return { kind: "unloaded" };
    }
    const data = this.#layer.getData(pixel);
    if (!data) {
      return { kind: "unloaded" };
    }
    const elevation = decodeElevationFromPixelData(
      data,
      this.#options.elevationEncoding,
      this.#options.minElevation,
      this.#options.maxElevation
    );
    if (elevation === null) {
      return { kind: "nodata" };
    }
    return { kind: "value", elevation };
  };

  #clearLayer(): void {
    unByKey(this.#sourceListeners);
    this.#sourceListeners = [];
    if (this.#layer) {
      this.#map.removeLayer(this.#layer);
      this.#layer.dispose();
    }
    this.#source?.dispose();
    this.#layer = null;
    this.#source = null;
  }

  #createSource(): SourceType | null {
    const {
      elevationUrl,
      crossOrigin,
      tileSize,
      minZoom,
      maxZoom,
      attributions,
      terrainZoomLookup,
      elevationTileGrid,
      interpolate,
    } = this.#options;

    if (!elevationUrl) {
      console.warn(UI_STRINGS.noElevationUrl);
      return null;
    }

    const lookupGrid = createLookupTileGrid({
      lookup: terrainZoomLookup,
      resolutions: elevationTileGrid.resolutions,
      origin: elevationTileGrid.origin,
      originExtent: elevationTileGrid.originExtent,
      extent: elevationTileGrid.extent,
      tileSize,
    });

    if (!lookupGrid) {
      console.warn(UI_STRINGS.tileGridMissing);
    }

    return new ImageTile({
      url: createElevationUrlGetter(elevationUrl, lookupGrid),
      tileSize,
      // minZoom/maxZoom are unused when tileGrid is set; only applied in the
      // fallback EPSG:3857 XYZ grid that OpenLayers builds without a tileGrid.
      ...(lookupGrid ? { tileGrid: lookupGrid.grid } : { minZoom, maxZoom }),
      // Linear resampling (default) smooths tile edges. Nearest-neighbour
      // keeps Terrain-RGB / Terrarium encodings exact when the view is
      // coarser than the tile.
      interpolate,
      // ImageTile's CrossOriginAttribute does not include null.
      ...(crossOrigin != null ? { crossOrigin } : {}),
      wrapX: false,
      transition: 100,
      attributions,
      projection: this.#map.getView().getProjection(),
    }) as SourceType;
  }

  #createLayer(): WebGLTileLayer {
    const source = this.#source;
    if (!source) {
      throw new Error("FloodSimulator: elevation source is missing");
    }

    const options: WebGLTileOptions & {
      layerType: string;
      ignoreInFeatureInfo: boolean;
      name: string;
      caption: string;
    } = {
      source,
      style: createFloodLayerStyle(this.#options, {
        level: this.#level,
        depthShading: this.#depthShading,
        useDepthColors: this.#useDepthColors,
        smoothDepthColors: this.#smoothDepthColors,
        isobaths: this.#isobaths,
      }),
      opacity: this.#options.layerOpacity,
      zIndex: LAYER_Z_INDEX,
      visible: this.#visible,
      layerType: "system",
      ignoreInFeatureInfo: true,
      name: LAYER_NAME,
      caption: "Flood simulator",
    };
    if (this.#options.maxResolution !== undefined) {
      options.maxResolution = this.#options.maxResolution;
    }
    if (this.#options.hideAtMinZoom !== undefined) {
      // OpenLayers minZoom is exclusive (`zoom > minZoom`), so this hides the
      // overlay at hideAtMinZoom and below and skips elevation tile loads.
      options.minZoom = this.#options.hideAtMinZoom;
    }
    const clipExtent = parseExtent(this.#options.elevationTileGrid.extent);
    if (clipExtent) {
      options.extent = clipExtent;
    }

    return new WebGLTileLayer(options);
  }

  #watchSource(source: SourceType, generation: number): void {
    this.#sourceListeners.push(
      source.on("change", () => {
        if (generation !== this.#generation) {
          return;
        }
        const state = source.getState();
        if (state === "ready") {
          this.#validateProjection();
        }
        if (state === "error" && !this.#sourceErrorShown) {
          this.#sourceErrorShown = true;
          console.error("FloodSimulator: elevation source failed to load");
        }
      }),
      source.on("tileloaderror", () => {
        if (generation !== this.#generation) {
          return;
        }
        this.#tileLoadErrors += 1;
        if (this.#sourceErrorShown) {
          return;
        }
        this.#sourceErrorShown = true;
        window.setTimeout(() => {
          if (generation !== this.#generation) {
            return;
          }
          console.error(
            `FloodSimulator: ${this.#tileLoadErrors} elevation tile(s) failed to load. Check elevationUrl, CORS (Access-Control-Allow-Origin), and that the pyramid exists. The source is loaded with crossOrigin: ${JSON.stringify(this.#options.crossOrigin)}; "anonymous" (the default) is needed so getData() can read elevation values.`
          );
        }, 500);
      })
    );
  }

  #validateProjection(): void {
    if (this.#projectionWarningShown || !this.#source) {
      return;
    }
    const sourceProjection = this.#source.getProjection();
    const viewProjection = this.#map.getView().getProjection();
    if (!sourceProjection || !viewProjection) {
      return;
    }
    if (equivalent(sourceProjection, viewProjection)) {
      return;
    }
    this.#projectionWarningShown = true;
    console.warn(
      `FloodSimulator: elevation source projection (${sourceProjection.getCode()}) does not match the map view (${viewProjection.getCode()}). WebGL tile layers cannot reproject; the flood overlay may be wrong.`
    );
    this.#app.globalObserver.publish("core.alert", UI_STRINGS.projectionAlert);
  }
}

/**
 * ImageTile has no `tileUrlFunction` option (it is not a `UrlTile`); its
 * public `url` option accepts a getter. The tile grid zoom is a lookup
 * index, not the terrain `{z}`, so the getter rewrites `{z}` to the mapped
 * level. `options.maxY` (the grid's highest `{y}` at that zoom) is supplied
 * by the source for `{-y}` templates. Without a lookup grid (fallback
 * path) the plain template string is returned as-is.
 */
function createElevationUrlGetter(
  elevationUrl: string,
  lookupGrid: LookupTileGrid | undefined
): UrlLike {
  if (!lookupGrid) {
    return elevationUrl;
  }
  const { levels } = lookupGrid;
  return (z, x, y, options) =>
    xyzUrl(elevationUrl, levels[z], x, y, options.maxY);
}
