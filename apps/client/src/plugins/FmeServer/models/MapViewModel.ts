import Draw, { createBox, createRegularPolygon } from "ol/interaction/Draw";
import { Circle as CircleGeometry } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill, Text } from "ol/style";
import Overlay from "ol/Overlay";
import GeoJSON from "ol/format/GeoJSON";
import type { MapBrowserEvent } from "ol";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";
import type SimpleGeometry from "ol/geom/SimpleGeometry";
import type Polygon from "ol/geom/Polygon";
import type { EventObserver } from "react-event-observer";
import { handleClick } from "../../../models/Click";
import type { HajkMap } from "../../../types/hajk";
import type { FmeProduct, MapViewModelSettings } from "../types";

interface ClickResponse {
  features: Feature<Geometry>[];
}

/** Hajk extends OpenLayers with custom map events such as "singleclick". */
type HajkMapWithEvents = HajkMap & {
  on(
    type: string,
    listener: (event: MapBrowserEvent<PointerEvent>) => void
  ): void;
  un(
    type: string,
    listener: (event: MapBrowserEvent<PointerEvent>) => void
  ): void;
};

type OlDrawType = ConstructorParameters<typeof Draw>[0]["type"];

function toDrawType(drawMethod: string): OlDrawType {
  return drawMethod === "Rectangle" ? "Circle" : (drawMethod as OlDrawType);
}

class MapViewModel {
  #map: HajkMapWithEvents;
  #localObserver: EventObserver;
  #options: MapViewModelSettings["options"];
  #drawStyleSettings: { strokeColor: string; fillColor: string };
  #draw: Draw | null;
  #drawSource: VectorSource;
  #drawLayer: VectorLayer<VectorSource>;
  #drawTooltipElement: HTMLDivElement | null;
  #drawTooltipElementStyle: string;
  #drawTooltip: Overlay | null;
  #currentPointerCoordinate: number[] | null;
  #activeProduct: FmeProduct | null;

  constructor(settings: MapViewModelSettings) {
    this.#map = settings.map as HajkMapWithEvents;
    this.#localObserver = settings.localObserver;
    this.#options = settings.options;
    this.#draw = null;
    this.#drawTooltipElement = null;
    this.#drawTooltip = null;
    this.#currentPointerCoordinate = null;
    this.#activeProduct = null;
    this.#drawTooltipElementStyle =
      "position: relative; background: rgba(0, 0, 0, 0.5); border-radius: 4px; color: white; padding: 4px 8px; opacity: 0.7; white-space: nowrap;";

    this.#drawStyleSettings = this.#getDrawStyleSettings();
    this.#drawSource = this.#getNewVectorSource();
    this.#drawLayer = this.#getNewVectorLayer(
      this.#drawSource,
      this.#getDrawStyle(),
      {
        layerType: "system",
        zIndex: 5000,
        name: "pluginFmeServer",
      }
    );
    this.#map.addLayer(this.#drawLayer);
    this.#bindSubscriptions();
    this.#createDrawTooltip();
  }

  #bindSubscriptions = (): void => {
    this.#localObserver.subscribe(
      "view.activeProductChange",
      (product: FmeProduct) => {
        this.#activeProduct = product;
      }
    );
    this.#localObserver.subscribe(
      "map.toggleDrawMethod",
      this.#toggleDrawMethod
    );
    this.#localObserver.subscribe("map.resetDrawing", this.#resetDrawing);
  };

  #createDrawTooltip = (): void => {
    this.#removeEventualDrawTooltipElement();
    this.#drawTooltipElement = document.createElement("div");
    this.#drawTooltipElement.setAttribute(
      "style",
      this.#drawTooltipElementStyle
    );
    this.#drawTooltip = new Overlay({
      element: this.#drawTooltipElement,
      offset: [30, -5],
      positioning: "bottom-center",
    });
    this.#map.addOverlay(this.#drawTooltip);
  };

  #removeEventualDrawTooltipElement = (): void => {
    if (this.#drawTooltipElement?.parentNode) {
      this.#drawTooltipElement.parentNode.removeChild(this.#drawTooltipElement);
      this.#drawTooltipElement = null;
    }
  };

  #removeEventualDrawTooltipOverlay = (): void => {
    if (this.#drawTooltip) {
      this.#map.removeOverlay(this.#drawTooltip);
      this.#drawTooltip = null;
    }
  };

  #cleanupMapOverlays = (): void => {
    this.#removeEventualDrawTooltipElement();
    this.#removeEventualDrawTooltipOverlay();
  };

  #getDrawStyleSettings = (): { strokeColor: string; fillColor: string } => ({
    strokeColor: this.#options.drawStrokeColor || "rgba(74,74,74,0.5)",
    fillColor: this.#options.drawFillColor || "rgba(255,255,255,0.07)",
  });

  #getDrawStyle = (): Style =>
    new Style({
      stroke: new Stroke({
        color: this.#drawStyleSettings.strokeColor,
        width: 4,
      }),
      fill: new Fill({
        color: this.#drawStyleSettings.fillColor,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.#drawStyleSettings.strokeColor,
          width: 2,
        }),
      }),
    });

  #getFeatureStyle = (feature: Feature<Geometry>): Style => {
    const baseLineStyle = this.#getDrawStyle();
    baseLineStyle.setText(this.#getFeatureTextStyle(feature));
    return baseLineStyle;
  };

  #getFeatureTextStyle = (feature: Feature<Geometry>): Text =>
    new Text({
      textAlign: "center",
      textBaseline: "middle",
      font: "12pt sans-serif",
      fill: new Fill({ color: "#FFF" }),
      text: this.#getTooltipText(feature),
      overflow: true,
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    });

  #getNewVectorSource = (): VectorSource => new VectorSource({ wrapX: false });

  #getNewVectorLayer = (
    source: VectorSource,
    style: Style,
    props: Record<string, unknown> = {}
  ): VectorLayer<VectorSource> =>
    new VectorLayer({
      source,
      style,
      ...props,
    });

  #removeDrawInteraction = (): void => {
    if (this.#draw) {
      this.#map.removeInteraction(this.#draw);
    }
  };

  #removeEventListeners = (): void => {
    this.#map.un("singleclick", this.#handleSelectFeatureClick);
    this.#drawSource.un("addfeature", this.#handleDrawFeatureAdded);
    if (this.#draw) {
      this.#draw.un("drawstart", this.#handleDrawStart);
      this.#draw.un("drawend", this.#handleDrawEnd);
      this.#map.un("pointermove", this.#handlePointerMove);
    }
  };

  #toggleDrawMethod = (drawMethod: string, freehand = false): void => {
    this.#removeDrawInteraction();
    this.#removeEventListeners();
    this.#map.clickLock.delete("fmeServer");

    if (drawMethod === "Select") {
      this.#enableSelectFeaturesSearch();
      return;
    }

    if (drawMethod && drawMethod !== "") {
      this.#draw = new Draw({
        source: this.#drawSource,
        type: toDrawType(drawMethod),
        freehand: ["Circle", "Rectangle"].includes(drawMethod)
          ? true
          : freehand,
        stopClick: true,
        geometryFunction:
          drawMethod === "Rectangle"
            ? createBox()
            : drawMethod === "Circle"
              ? createRegularPolygon()
              : undefined,
        style: this.#getDrawStyle(),
      });
      this.#map.clickLock.add("fmeServer");
      this.#draw.on("drawstart", this.#handleDrawStart);
      this.#draw.on("drawend", this.#handleDrawEnd);
      this.#map.on("pointermove", this.#handlePointerMove);
      this.#map.addInteraction(this.#draw);
      this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
    }
  };

  #enableSelectFeaturesSearch = (): void => {
    this.#map.clickLock.add("fmeServer");
    this.#map.on("singleclick", this.#handleSelectFeatureClick);
    this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
  };

  #handleSelectFeatureClick = (event: MapBrowserEvent<PointerEvent>): void => {
    handleClick(event, event.map, (response: ClickResponse) => {
      const features = response.features as Feature<Geometry>[];
      const featuresWithGeom = features.filter((feature) =>
        feature.getGeometry()
      );
      if (featuresWithGeom.length === 0) {
        return;
      }

      const clickedFeature = featuresWithGeom[0];
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const isMultiSelect = isMac
        ? event.originalEvent.metaKey
        : event.originalEvent.ctrlKey;

      if (isMultiSelect) {
        if (!this.#isFeaturePreviouslySelected(clickedFeature)) {
          this.#drawSource.addFeature(clickedFeature);
        }
      } else {
        this.#drawSource.clear();
        this.#drawSource.addFeature(clickedFeature);
      }
    });
  };

  #handleDrawFeatureAdded = (): void => {
    try {
      const features = this.#getDrawnFeatures();
      const totalArea = this.#getTotalArea(features);
      this.#localObserver.publish("map.featureAdded", {
        error: totalArea === 0,
        features,
        totalArea,
      });
    } catch {
      this.#localObserver.publish("map.featureAdded", {
        error: true,
        features: [],
        totalArea: 0,
      });
    }
  };

  #isFeaturePreviouslySelected = (
    clickedFeature: Feature<Geometry>
  ): boolean => {
    const clickedGeom = clickedFeature.getGeometry() as SimpleGeometry;
    const clickedCoords = JSON.stringify(clickedGeom.getCoordinates());
    for (const feature of this.#drawSource.getFeatures()) {
      const geom = feature.getGeometry() as SimpleGeometry;
      const geometry = JSON.stringify(geom.getCoordinates());
      if (geometry === clickedCoords) {
        this.#drawSource.removeFeature(feature);
        return true;
      }
    }
    return false;
  };

  #getTotalArea = (features: Feature<Geometry>[]): number =>
    features.reduce((acc, feature) => acc + this.#getFeatureArea(feature), 0);

  #handleDrawStart = (e: { feature: Feature<Geometry> }): void => {
    e.feature.on("change", this.#handleFeatureChange);
  };

  #handleDrawEnd = (e: { feature: Feature<Geometry> }): void => {
    this.#handlePotentialMultipleGeometriesException();
    const { feature } = e;
    if (this.#drawTooltipElement) {
      this.#drawTooltipElement.innerHTML = "";
    }
    this.#currentPointerCoordinate = null;
    this.#drawTooltip?.setPosition(undefined);
    feature.setStyle(this.#getFeatureStyle(feature));
  };

  #handlePotentialMultipleGeometriesException = (): void => {
    const multipleGeometriesAllowed =
      this.#activeProduct?.allowMultipleGeometries ?? false;
    const numFeaturesDrawn = this.#drawSource.getFeatures().length;

    if (!multipleGeometriesAllowed && numFeaturesDrawn !== 0) {
      this.#drawSource.clear();
      this.#localObserver.publish("map.maxFeaturesExceeded");
    }
  };

  #handlePointerMove = (e: MapBrowserEvent<PointerEvent>): void => {
    this.#currentPointerCoordinate = e.coordinate;
  };

  #handleFeatureChange = (e: { target: Feature<Geometry> }): void => {
    const feature = e.target;
    if (this.#drawTooltipElement) {
      this.#drawTooltipElement.innerHTML = this.#getTooltipText(feature);
    }
    this.#drawTooltip?.setPosition(this.#currentPointerCoordinate ?? undefined);
  };

  #getFeatureArea = (feature: Feature<Geometry>): number => {
    const geometry = feature.getGeometry()!;
    if (geometry instanceof CircleGeometry) {
      const radius = geometry.getRadius();
      return Math.round(Math.pow(radius, 2) * Math.PI);
    }
    // Points and lines (which can be picked with the select tool) have no area.
    if (!("getArea" in geometry)) {
      return 0;
    }
    return Math.round((geometry as Polygon).getArea());
  };

  #getTooltipText = (feature: Feature<Geometry>): string => {
    const featureArea = this.#getFeatureArea(feature);
    if (featureArea >= 1e6) {
      return `${(featureArea / 1e6).toFixed(3)} km²`;
    }
    return `${featureArea.toLocaleString()} m²`;
  };

  #resetDrawing = (): void => {
    this.#map.clickLock.delete("fmeServer");
    this.#drawSource.clear();
    this.#removeDrawInteraction();
    this.#removeEventListeners();
    this.#cleanupMapOverlays();
  };

  #getDrawnFeatures = (): Feature<Geometry>[] => this.#drawSource.getFeatures();

  getAllFeaturesAsGeoJson = (): string | null => {
    const features = this.#getDrawnFeatures();
    if (features.length === 0) {
      return null;
    }
    const geoJson = new GeoJSON();
    if (features.length === 1) {
      return geoJson.writeFeature(features[0]);
    }
    return geoJson.writeFeatures(features);
  };
}

export default MapViewModel;
