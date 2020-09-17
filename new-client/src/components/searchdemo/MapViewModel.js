import Draw from "ol/interaction/Draw";
import { Stroke, Style, Circle, Fill } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { boundingExtent } from "ol/extent";

var fill = new Fill({
  color: "rgba(255,255,255,0.4)",
});
var stroke = new Stroke({
  color: "#3399CC",
  width: 1.25,
});

const defaultStyles = [
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

const highlightedStyle = new Style({
  stroke: new Stroke({
    color: [200, 0, 0, 0.7],
    width: 4,
  }),
  fill: new Fill({
    color: [255, 0, 0, 0.1],
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: [200, 0, 0, 0.7],
      width: 4,
    }),
  }),
});

const drawStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 214, 91, 0.6)",
    width: 4,
  }),
  fill: new Fill({
    color: "rgba(255, 214, 91, 0.2)",
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: "rgba(255, 214, 91, 0.6)",
      width: 2,
    }),
  }),
});

class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;
    this.initMapLayers();
    this.bindSubscriptions();
  }

  initMapLayers = () => {
    this.resultSource = new VectorSource({ wrapX: false });
    this.resultsLayer = new VectorLayer({
      source: this.resultSource,
      style: this.options.showInMapOnSearchResult ? defaultStyles : null,
    });
    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: drawStyle,
    });

    this.map.addLayer(this.drawLayer);
    this.map.addLayer(this.resultsLayer);
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("clear-search-results", this.clearMap);
    this.localObserver.subscribe(
      "add-features-to-results-layer",
      this.addFeaturesToResultsLayer
    );
    this.localObserver.subscribe(
      "highlight-features",
      this.highlightFeaturesInMap
    );
    this.localObserver.subscribe("zoom-to-features", this.zoomToSelectedItems);
    this.app.globalObserver.subscribe("spatial-search", (options) => {
      this.toggleDraw(true, options.type);
    });
  };

  fitMapToSearchResult = () => {
    //Zoom to fit all features
    const currentExtent = this.resultSource.getExtent();

    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      this.map.getView().fit(currentExtent, {
        size: this.map.getSize(),
        maxZoom: 7,
      });
    }
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

  highlightFeaturesInMap = (featureIds) => {
    // First unset style on ALL features (user might have UNCHECKED a feature)
    this.resultSource.getFeatures().map((f) => f.setStyle(null));
    console.log(highlightedStyle, "highlightedStyle");
    console.log(featureIds, "featureIds");
    // Now, set the style only on currently selected features
    featureIds.map((fid) =>
      this.resultSource.getFeatureById(fid).setStyle(highlightedStyle)
    );
  };

  zoomToSelectedItems = (items) => {
    console.log(items, "item");

    const extentsFromSelectedItems = items.map((fid) =>
      this.resultSource.getFeatureById(fid).getGeometry().getExtent()
    );

    const extentToZoomTo =
      extentsFromSelectedItems.length < 1
        ? this.resultSource.getExtent()
        : boundingExtent(extentsFromSelectedItems);

    this.map.getView().fit(extentToZoomTo, {
      size: this.map.getSize(),
      maxZoom: 7,
    });
  };

  clearMap = () => {
    if (this.drawSource) {
      this.drawSource.clear();
    }
    if (this.resultSource) {
      this.resultSource.clear();
    }
    this.removeDrawInteraction();
  };

  removeDrawInteraction = () => {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
  };

  toggleDraw = (active, type, freehand = false) => {
    this.localObserver.publish("on-draw-start");
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: drawStyle,
      });

      this.map.clicklock = true;
      this.map.addInteraction(this.draw);
      this.drawSource.clear();

      this.drawSource.on("addfeature", (e) => {
        this.map.removeInteraction(this.draw);
        this.localObserver.publish("on-draw-end", e.feature);
      });
    } else {
      this.map.removeInteraction(this.draw);
      this.map.clicklock = false;
      this.drawSource.clear();
    }
  };
}

export default MapViewModel;
