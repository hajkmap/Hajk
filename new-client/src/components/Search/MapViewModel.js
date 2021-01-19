import Draw from "ol/interaction/Draw";
import { Stroke, Style, Circle, Fill } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { extend, createEmpty, isEmpty } from "ol/extent";
import Feature from "ol/Feature";
import FeatureStyle from "./utils/FeatureStyle";
import { fromExtent } from "ol/geom/Polygon";
import { handleClick } from "../../models/Click";

class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.defaultStyle = this.getDefaultStyle();
    this.drawStyleSettings = this.getDrawStyleSettings();
    this.featureStyle = new FeatureStyle(settings.options);
    this.localObserver = settings.localObserver;
    this.initMapLayers();
    this.bindSubscriptions();
  }

  ctrlKeyPressed = false;

  getDefaultStyle = () => {
    const fill = new Fill({
      color: "rgba(255,255,255,0.4)",
    });
    const stroke = new Stroke({
      color: "#3399CC",
      width: 1.25,
    });

    return [
      new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
        fill: fill,
        stroke: stroke,
      }),
    ];
  };

  getDrawStyleSettings = () => {
    const strokeColor =
      this.options.drawStrokeColor ?? "rgba(255, 214, 91, 0.6)";
    const fillColor = this.options.drawFillColor ?? "rgba(255, 214, 91, 0.2)";

    return { strokeColor: strokeColor, fillColor: fillColor };
  };

  getNewVectorSource = () => {
    return new VectorSource({ wrapX: false });
  };

  getNewVectorLayer = (source, style) => {
    return new VectorLayer({
      source: source,
      style: style,
    });
  };

  initMapLayers = () => {
    this.resultSource = this.getNewVectorSource();
    this.resultsLayer = this.getNewVectorLayer(
      this.resultSource,
      this.options.showInMapOnSearchResult ? this.defaultStyle : null
    );
    this.resultsLayer.set("type", "searchResultLayer");
    this.drawSource = this.getNewVectorSource();
    this.drawLayer = this.getNewVectorLayer(
      this.drawSource,
      this.getDrawStyle()
    );
    this.map.addLayer(this.drawLayer);
    this.map.addLayer(this.resultsLayer);
  };

  bindSubscriptions = () => {
    // Local subscriptions
    this.localObserver.subscribe("clearMapView", this.clearMap);
    this.localObserver.subscribe(
      "map.zoomToFeaturesByIds",
      this.zoomToFeatureIds
    );
    this.localObserver.subscribe(
      "map.addFeaturesToResultsLayer",
      this.addFeaturesToResultsLayer
    );
    this.localObserver.subscribe(
      "map.highlightFeaturesByIds",
      this.highlightFeaturesInMap
    );
    this.localObserver.subscribe(
      "map.addAndHighlightFeatureInSearchResultLayer",
      this.addAndHighlightFeatureInSearchResultLayer
    );
    this.localObserver.subscribe(
      "map.resetStyleForFeaturesInResultSource",
      this.resetStyleForFeaturesInResultSource
    );

    // Global subscriptions
    this.app.globalObserver.subscribe(
      "search.spatialSearchActivated",
      (options) => {
        if (options.type === "Extent") {
          this.searchInCurrentExtent();
        } else if (options.type === "Select") {
          this.enableSelectFeaturesSearch();
        } else {
          this.toggleDraw(true, options.type);
        }
      }
    );
  };

  fitMapToSearchResult = () => {
    const currentExtent = this.resultSource.getExtent();
    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      this.fitMapToExtent(currentExtent);
    }
  };

  fitMapToExtent = (extent) => {
    this.map.getView().fit(extent, {
      size: this.map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  addFeaturesToResultsLayer = (features) => {
    this.resultSource.clear();
    this.resultSource.addFeatures(
      features.map((f) => {
        return new GeoJSON().readFeature(f);
      })
    );

    if (this.options.showInMapOnSearchResult) {
      this.fitMapToSearchResult();
    }
  };

  resetStyleForFeaturesInResultSource = () => {
    this.resultSource.getFeatures().map((f) => f.setStyle(null));
  };

  drawSourceHasFeatures = () => {
    return this.drawSource.getFeatures().length > 0;
  };

  getDrawStyle = () => {
    return new Style({
      stroke: new Stroke({
        color: this.drawStyleSettings.strokeColor,
        width: 4,
      }),
      fill: new Fill({
        color: this.drawStyleSettings.fillColor,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.drawStyleSettings.strokeColor,
          width: 2,
        }),
      }),
    });
  };

  highlightFeaturesInMap = (featuresInfo) => {
    this.resetStyleForFeaturesInResultSource();
    featuresInfo.map((featureInfo) => {
      const feature = this.getFeatureFromResultSourceById(
        featureInfo.featureId
      );
      return feature.setStyle(
        this.featureStyle.getHighlightedStyle(
          feature,
          featureInfo.displayFields
        )
      );
    });
  };

  addAndHighlightFeatureInSearchResultLayer = (featureInfo) => {
    const feature = new GeoJSON().readFeature(featureInfo.feature);
    feature.setStyle(
      this.featureStyle.getHighlightedStyle(feature, featureInfo.displayFields)
    );
    this.resultSource.addFeature(feature);
    this.fitMapToSearchResult();
  };

  getFeatureFromResultSourceById = (fid) => {
    return this.resultSource.getFeatureById(fid);
  };

  zoomToFeatureIds = (featuresInfo) => {
    let extent = createEmpty();

    //BoundingExtent-function gave wrong coordinates for some
    featuresInfo.forEach((featureInfo) =>
      extend(
        extent,
        this.getFeatureFromResultSourceById(featureInfo.featureId)
          .getGeometry()
          .getExtent()
      )
    );
    const extentToZoomTo = isEmpty(extent)
      ? this.resultSource.getExtent()
      : extent;

    this.fitMapToExtent(extentToZoomTo);
  };

  clearMap = () => {
    if (this.drawSource) {
      this.drawSource.clear();
    }
    if (this.resultSource) {
      this.resultSource.clear();
    }
    this.removeDrawInteraction();
    this.removeSelectListeners();
  };

  removeDrawInteraction = () => {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
  };

  toggleDraw = (active, type, freehand = false) => {
    this.localObserver.publish("on-draw-start", type);
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: type === "Circle" ? true : freehand,
        stopClick: true,
        style: this.getDrawStyle(),
      });

      this.map.clickLock.add("search");
      this.map.addInteraction(this.draw);
      this.drawSource.clear();

      this.drawSource.on("addfeature", (e) => {
        this.map.removeInteraction(this.draw);
        this.map.clickLock.delete("search");
        this.localObserver.publish("on-draw-end", e.feature);
      });
    } else {
      this.map.removeInteraction(this.draw);
      this.map.clickLock.delete("search");

      this.drawSource.clear();
    }
  };

  searchInCurrentExtent = () => {
    try {
      const currentExtent = this.map
        .getView()
        .calculateExtent(this.map.getSize());

      if (!this.extentIsFinite(currentExtent)) {
        throw new Error("Current extent could not be calculated correctly.");
      }
      const feature = new Feature(fromExtent(currentExtent));
      this.localObserver.publish("search-within-extent", [feature]);
    } catch (error) {
      this.handleSearchInCurrentExtentError(error);
    }
  };

  extentIsFinite = (extent) => {
    return extent.map(Number.isFinite).includes(false) === false;
  };

  handleSearchInCurrentExtentError = (error) => {
    this.localObserver.publish("extent-search-failed");
    console.warn("Extent-search-failed: ", error);
  };

  enableSelectFeaturesSearch = () => {
    this.ctrlKeyPressed = false;
    this.localObserver.publish("on-select-search-start");
    this.addSelectListeners();
  };

  addSelectListeners = () => {
    this.map.clickLock.add("search");
    this.map.on("singleclick", this.handleSelectFeatureClick);
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  };

  removeSelectListeners = () => {
    this.map.clickLock.delete("search");
    this.map.un("singleclick", this.handleSelectFeatureClick);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  };

  handleSelectFeatureClick = (event) => {
    handleClick(event, event.map, (response) => {
      const features = response.features;
      if (features.length === 0) {
        return;
      }
      this.drawSource.addFeatures(response.features);
      if (!this.ctrlKeyPressed) {
        const allFeatures = this.drawSource.getFeatures();
        this.localObserver.publish("on-search-selection-done", allFeatures);
        this.removeSelectListeners();
      }
    });
  };

  handleKeyDown = (event) => {
    const { keyCode } = event;
    if (keyCode === 17 && !this.ctrlKeyPressed) {
      this.ctrlKeyPressed = true;
    }
  };

  handleKeyUp = (event) => {
    const { keyCode } = event;
    if (keyCode === 17) {
      this.ctrlKeyPressed = false;
      if (this.drawSourceHasFeatures()) {
        const features = this.drawSource.getFeatures();
        this.localObserver.publish("on-search-selection-done", features);
        this.removeSelectListeners();
      }
    }
  };
}

export default MapViewModel;
