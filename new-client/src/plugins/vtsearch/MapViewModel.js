import PropTypes from "prop-types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

/**
 * @summary ViewModel to handle interactions with map
 * @description Functionality used to interact with map.
 * This functionality does not fit in either the searchModel or the actual view.
 * @class MapViewModel
 */
export default class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.bindSubscriptions();
    this.addSearchResultLayerToMap();
    this.addHighlightLayerToMap();
  }
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired
  };
  //TODO Add comments
  highlightFeature = olFeature => {
    this.highlightLayer.getSource().addFeature(olFeature);
  };
  //TODO Add comments
  addFeatureToSearchResultLayer = olFeatures => {
    this.searchResultLayer.getSource().addFeatures(olFeatures);
  };

  //TODO Add comments
  bindSubscriptions = () => {
    this.localObserver.subscribe(
      "highlight-search-result-feature",
      olFeatureId => {
        var olFeature = this.searchResultLayer
          .getSource()
          .getFeatureById(olFeatureId);
        this.highlightFeature(olFeature);
      }
    );

    this.map.on("singleclick", e => {
      this.localObserver.publish(
        "features-clicked-in-map",
        this.getFeaturesAtClickedPixel(e)
      );
    });

    this.localObserver.subscribe("add-search-result", olFeatures => {
      this.addFeatureToSearchResultLayer(olFeatures);
    });

    this.localObserver.subscribe("clear-search-result", () => {
      this.searchResultLayer.getSource().clear();
    });
    this.localObserver.subscribe("clear-highlight", () => {
      this.highlightLayer.getSource().clear();
    });
  };

  getFeaturesAtClickedPixel = evt => {
    var features = [];
    this.map.forEachFeatureAtPixel(
      evt.pixel,
      (feature, layer) => {
        if (layer.get("type") === "vt-search-result-layer") {
          features.push(feature);
        }
      },
      {
        hitTolerance: 10
      }
    );
    return features;
  };

  //TODO Add comments and add better styling to handle more geometry types
  addSearchResultLayerToMap = () => {
    this.searchResultLayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.searchResultLayer.set("type", "vt-search-result-layer");
    this.searchResultLayer.set("queryable", false);

    this.map.addLayer(this.searchResultLayer);
  };

  //TODO Add comments and add better styling to handle more geometry types
  addHighlightLayerToMap = () => {
    var fill = new Fill({
      color: "rgba(0,0,0,0.4)"
    });
    var stroke = new Stroke({
      color: "#e83317",
      width: 5
    });

    this.highlightLayer = new VectorLayer({
      style: new Style({
        fill: fill,
        stroke: stroke
      }),
      source: new VectorSource({})
    });
    this.highlightLayer.set("type", "vt-highlight-layer");
    this.map.addLayer(this.highlightLayer);
  };
}
