import Draw from "ol/interaction/Draw";
import { Stroke, Style, Circle, Fill } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { extend, createEmpty, isEmpty } from "ol/extent";
import Feature from "ol/Feature";
import FeatureStyle from "./utils/FeatureStyle";
import { fromExtent } from "ol/geom/Polygon";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import { handleClick } from "../../models/Click";
import { deepMerge } from "utils/DeepMerge";
import { isValidLayerId } from "../../utils/Validator";

class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.drawStyleSettings = this.getDrawStyleSettings();
    this.featureStyle = new FeatureStyle(settings.options);
    this.localObserver = settings.localObserver;
    this.initMapLayers();
    this.bindSubscriptions();
  }

  ctrlKeyPressed = false;

  // An object holding the last highlightInformation.
  // We use this to restore highlight after filter changes.
  lastFeaturesInfo = [];

  refreshFeatureStyle = (options) => {
    this.featureStyle = new FeatureStyle(deepMerge(this.options, options));
    // Make sure to set the new style on the results layer. This way
    // we'll get correct labels (if user wants to show them).
    this.resultsLayer.setStyle(this.featureStyle.getDefaultSearchResultStyle);
  };

  getDrawStyleSettings = () => {
    const strokeColor = this.options.drawStrokeColor ?? "rgba(74,74,74,0.5)";
    const fillColor = this.options.drawFillColor ?? "rgba(255,255,255,0.07)";

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

  getVisibleLayers = () => {
    return this.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          (layer instanceof TileLayer || layer instanceof ImageLayer) &&
          layer.layersInfo !== undefined &&
          // We consider a layer to be visible only if…
          layer.getVisible() && // …it's visible…
          layer.getSource().getParams()["LAYERS"] &&
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name) // …has a specified name property…
        );
      })
      .map((layer) => layer.getSource().getParams()["LAYERS"])
      .join(",")
      .split(",");
  };

  getVisibleSearchLayers = () => {
    const searchSources = this.options.sources;
    const visibleLayers = this.getVisibleLayers();
    const visibleSearchLayers = searchSources.filter((s) => {
      return visibleLayers.find((l_id) => l_id === s.id);
    });
    return visibleSearchLayers;
  };

  initMapLayers = () => {
    this.resultSource = this.getNewVectorSource();
    this.resultsLayer = this.getNewVectorLayer(
      this.resultSource,
      this.options.showResultFeaturesInMap ?? true
        ? this.featureStyle.getDefaultSearchResultStyle
        : null
    );
    // FIXME: Remove "type", use only "name" throughout
    // the application. Should be done as part of #883.
    this.resultsLayer.set("type", "searchResultLayer");
    this.resultsLayer.set("name", "pluginSearchResults");
    this.drawSource = this.getNewVectorSource();
    this.drawLayer = this.getNewVectorLayer(
      this.drawSource,
      this.getDrawStyle()
    );
    this.drawLayer.set("name", "pluginSearchDraw");
    this.map.addLayer(this.drawLayer);
    this.map.addLayer(this.resultsLayer);
  };

  bindSubscriptions = () => {
    // Local subscriptions
    this.localObserver.subscribe("clearMapView", this.clearMap);
    this.localObserver.subscribe("map.zoomToFeatures", this.zoomToFeatures);
    this.localObserver.subscribe(
      "map.addFeaturesToResultsLayer",
      this.addFeaturesToResultsLayer
    );
    this.localObserver.subscribe("map.setSelectedStyle", this.setSelectedStyle);

    // Odd naming here, but we can't call it "setSelectedStyleForFeature"
    // because of the way react-observer works: it would fire even
    // when "setSelectedStyle" is published (it fires when begging of event
    // name matches!).
    this.localObserver.subscribe(
      "map.setSelectedFeatureStyle",
      this.setSelectedStyleForFeature
    );
    this.localObserver.subscribe(
      "map.addAndHighlightFeatureInSearchResultLayer",
      this.addAndHighlightFeatureInSearchResultLayer
    );
    this.localObserver.subscribe(
      "map.updateFeaturesAfterFilterChange",
      this.updateFeaturesAfterFilterChange
    );
    this.localObserver.subscribe(
      "map.setHighLightedStyle",
      this.setHighLightedStyle
    );
    this.localObserver.subscribe("map.zoomToFeature", this.zoomToFeature);
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

        // Tell the analytics model about which spatial search
        // modes are most important for our users by sending the
        // type of search performed.
        this.app.globalObserver.publish("analytics.trackEvent", {
          eventName: "spatialSearchPerformed",
          type: options.type?.toLowerCase(),
          activeMap: this.app.props.config.activeMap,
        });

        // At this stage, the Search input field could be in focus. On
        // mobile devices the on-screen keyboard will show up. We don't
        // need it here (as these search options are purely click/touch-based)
        // so we ensure that it's hidden by blurring the focus.
        document.activeElement.blur();
      }
    );
  };

  updateFeaturesAfterFilterChange = (featureInfo) => {
    const { features, featureIds } = featureInfo;
    this.resultSource.forEachFeature((feature) => {
      if (featureIds.indexOf(feature.getId()) === -1) {
        this.resultSource.removeFeature(feature);
      }
    });
    features.forEach((feature) => {
      if (!this.resultSource.getFeatureById(feature.getId())) {
        this.resultSource.addFeature(feature);
      }
    });
    this.setSelectedStyle(this.lastFeaturesInfo);
    this.zoomToFeatures(this.lastFeaturesInfo);
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
    this.resultSource.addFeatures(features);

    if (this.options.showResultFeaturesInMap) {
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

  setHighLightedStyle = (feature) => {
    if (!feature) {
      return;
    }
    const mapFeature = this.getFeatureFromResultSourceById(feature.getId());
    return mapFeature?.setStyle(
      this.featureStyle.getFeatureStyle(mapFeature, "highlight")
    );
  };

  setSelectedStyleForFeature = (f) => {
    return f?.setStyle(this.featureStyle.getFeatureStyle(f, "selection"));
  };

  zoomToFeature = (feature) => {
    if (!feature) {
      return;
    }
    const extent = createEmpty();
    const mapFeature = this.getFeatureFromResultSourceById(feature.getId());
    extend(extent, mapFeature?.getGeometry().getExtent());
    const extentToZoomTo = isEmpty(extent)
      ? this.resultSource.getExtent()
      : extent;
    this.fitMapToExtent(extentToZoomTo);
  };

  setSelectedStyle = (featuresInfo) => {
    this.lastFeaturesInfo = featuresInfo;
    this.resetStyleForFeaturesInResultSource();
    featuresInfo.map((featureInfo) => {
      const feature = this.getFeatureFromResultSourceById(
        featureInfo.feature.getId()
      );
      return feature?.setStyle(
        this.featureStyle.getFeatureStyle(feature, "selection")
      );
    });
  };

  addAndHighlightFeatureInSearchResultLayer = (featureInfo) => {
    const feature = featureInfo.feature;
    feature.setStyle(this.featureStyle.getFeatureStyle(feature, "highlight"));
    this.resultSource.addFeature(feature);
    this.fitMapToSearchResult();
  };

  getFeatureFromResultSourceById = (fid) => {
    return this.resultSource.getFeatureById(fid);
  };

  zoomToFeatures = (featuresInfo) => {
    let extent = createEmpty();

    //BoundingExtent-function gave wrong coordinates for some
    featuresInfo.forEach((featureInfo) => {
      const feature = this.getFeatureFromResultSourceById(
        featureInfo.feature.getId()
      );
      if (feature) {
        extend(
          extent,
          this.getFeatureFromResultSourceById(featureInfo.feature.getId())
            .getGeometry()
            .getExtent()
        );
      }
    });
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
    this.lastFeaturesInfo = [];
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
      this.drawSource.on("addfeature", this.handleDrawFeatureAdded);
    } else {
      this.map.removeInteraction(this.draw);
      this.map.clickLock.delete("search");

      this.drawSource.clear();
    }
  };

  handleDrawFeatureAdded = (e) => {
    // OpenLayers seems to have a problem stopping the clicks if
    // the draw interaction is removed too early. This fix is not pretty,
    // but it gets the job done. It seems to be enough to remove the draw
    // interaction after one cpu-cycle.
    // If this is not added, the user will get a zoom-event when closing
    // a polygon drawing.
    setTimeout(() => {
      this.map.removeInteraction(this.draw);
      this.map.clickLock.delete("search");
    }, 1);
    this.localObserver.publish("on-draw-end", e.feature);
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
      this.drawSource.addFeature(feature);
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
    this.drawSource.un("addfeature", this.handleDrawFeatureAdded);
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
