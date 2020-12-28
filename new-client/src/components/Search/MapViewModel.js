import Draw from "ol/interaction/Draw";
import { Stroke, Style, Circle, Fill, Text } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { extend, createEmpty, isEmpty } from "ol/extent";

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

class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.showLabelOnHighlight = settings.options.showLabelOnHighlight ?? true;
    this.drawStrokeColor =
      settings.options.drawStrokeColor || "rgba(255, 214, 91, 0.6)";
    this.drawFillColor =
      settings.options.drawFillColor || "rgba(255, 214, 91, 0.2)";
    this.highlightStrokeColor =
      settings.options.highlightStrokeColor || "rgba(200, 0, 0, 0.7)";
    this.highlightFillColor =
      settings.options.highlightFillColor || "rgba(255, 0, 0, 0.1)";
    this.highlightTextFill =
      settings.options.highlightTextFill || "rgba(255, 255, 255, 1)";
    this.highlightTextStroke =
      settings.options.highlightTextStroke || "rgba(0, 0, 0, 0.5)";
    this.localObserver = settings.localObserver;
    this.initMapLayers();
    this.bindSubscriptions();
  }

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
      this.options.showInMapOnSearchResult ? defaultStyles : null
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

    // Global subscriptions
    this.app.globalObserver.subscribe(
      "search.spatialSearchActivated",
      (options) => {
        this.toggleDraw(true, options.type);
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

  getFeatureTitle = (feature, displayFields) => {
    return displayFields.reduce((featureTitleString, df) => {
      let displayField = feature.get(df);
      if (Array.isArray(displayField)) {
        displayField = displayField.join(", ");
      }

      if (displayField) {
        if (featureTitleString.length > 0) {
          featureTitleString = featureTitleString.concat(` | ${displayField}`);
        } else {
          featureTitleString = displayField;
        }
      }

      return featureTitleString;
    }, "");
  };

  getHighlightLabelValueFromFeature = (feature, displayFields) => {
    if (this.showLabelOnHighlight) {
      if (!displayFields || displayFields.length < 1) {
        return `Visningsfält saknas`;
      } else {
        return this.getFeatureTitle(feature, displayFields);
      }
    }
  };

  getHighlightedStyle = (feature, displayFields) => {
    return new Style({
      fill: new Fill({
        color: this.highlightFillColor,
      }),
      stroke: new Stroke({
        color: this.highlightStrokeColor,
        width: 4,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.highlightStrokeColor,
          width: 4,
        }),
      }),
      text: new Text({
        textAlign: "center",
        textBaseline: "middle",
        font: "12pt sans-serif",
        fill: new Fill({ color: this.highlightTextFill }),
        text: this.getHighlightLabelValueFromFeature(feature, displayFields),
        overflow: true,
        stroke: new Stroke({
          color: this.highlightTextStroke,
          width: 3,
        }),
        offsetX: 0,
        offsetY: -10,
        rotation: 0,
        scale: 1,
      }),
    });
  };

  getDrawStyle = () => {
    return new Style({
      stroke: new Stroke({
        color: this.drawStrokeColor,
        width: 4,
      }),
      fill: new Fill({
        color: this.drawFillColor,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.drawStrokeColor,
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
        this.getHighlightedStyle(feature, featureInfo.displayFields)
      );
    });
  };

  addAndHighlightFeatureInSearchResultLayer = (featureInfo) => {
    const feature = new GeoJSON().readFeature(featureInfo.feature);
    feature.setStyle(
      this.getHighlightedStyle(feature, featureInfo.displayFields)
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
}

export default MapViewModel;
