import PropTypes from "prop-types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Circle } from "ol/style";
import "ol/ol.css";
import Draw from "ol/interaction/Draw.js";
import WKT from "ol/format/WKT";
import { createBox } from "ol/interaction/Draw";

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
    this.model = settings.model;
    this.localObserver = settings.localObserver;

    this.bindSubscriptions();
    this.addSearchResultLayerToMap();
    this.addHighlightLayerToMap();
    this.addDrawSearch();
  }
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired
  };

  //TOODO Add Comments
  addDrawLayer = olFeature => {
    this.drawlayer.getSource().addFeature(olFeature);
  };

  /**
   * Init method to listen for events from other parts of plugin
   *
   * @returns {null}
   * @memberof MapViewModel
   */
  bindSubscriptions = () => {
    this.localObserver.subscribe(
      "highlight-search-result-feature",
      olFeatureId => {
        var olFeature = this.searchResultLayer
          .getSource()
          .getFeatureById(olFeatureId);
        this.highlightAndZoomToFeature(olFeature);
      }
    );

    this.map.on("singleclick", this.onFeaturesClickedInMap);

    this.localObserver.subscribe("add-search-result", olFeatures => {
      this.addFeatureToSearchResultLayer(olFeatures);
    });

    this.localObserver.subscribe("clear-search-result", () => {
      this.searchResultLayer.getSource().clear();
    });
    this.localObserver.subscribe("clear-highlight", () => {
      this.highlightLayer.getSource().clear();
    });

    this.localObserver.subscribe(
      "activate-search-by-draw",
      ({ selectedFromDate, selectedEndDate, selectedFormType }) => {
        this.activateSearchByDraw({
          selectedFromDate,
          selectedEndDate,
          selectedFormType
        });
        this.drawlayer.getSource().clear();
      }
    );
  };

  activateSearchByDraw = ({
    selectedFromDate,
    selectedEndDate,
    selectedFormType
  }) => {
    var value = selectedFormType;
    var geometryFunction = undefined;
    if (selectedFormType === "Box") {
      value = "Circle";
      geometryFunction = createBox();
    }
    this.draw = new Draw({
      source: this.drawlayer.getSource(),
      type: value,
      stopClick: true,
      geometryFunction: geometryFunction
    });

    this.draw.on("drawend", e => {
      this.map.removeInteraction(this.draw);
      var format = new WKT();
      var wktFeatureGeom = format.writeGeometry(e.feature.getGeometry());
      if (wktFeatureGeom != null) {
        this.model.getJourneys(
          selectedFromDate,
          selectedEndDate,
          wktFeatureGeom
        );
      }
    });
    this.map.addInteraction(this.draw);
  };

  addDrawSearch = () => {
    this.drawlayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.map.addLayer(this.drawlayer);
  };

  /**
   * Init method to add a searchresult layer in the map
   * to use for temporary storing of search results
   *
   * @returns {null}
   * @memberof MapViewModel
   */
  addSearchResultLayerToMap = () => {
    this.searchResultLayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.searchResultLayer.set("type", "vt-search-result-layer");
    this.searchResultLayer.set("queryable", false);
    this.map.addLayer(this.searchResultLayer);
  };

  /**
   * Init method to add a highlight layer in the map
   * to use for temporary storing of features that are highlighted
   *
   * @returns {null}
   * @memberof MapViewModel
   */
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
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      }),
      source: new VectorSource({})
    });
    this.highlightLayer.set("type", "vt-highlight-layer");
    this.map.addLayer(this.highlightLayer);
  };

  /**
   * Highlights a openlayers feature and zooms to it
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {external:"ol.Feature"}
   */
  highlightAndZoomToFeature = olFeature => {
    this.highlightLayer.getSource().clear();
    this.highlightLayer.getSource().addFeature(olFeature);
    this.zoomToExtent(this.highlightLayer.getSource().getExtent());
  };
  /**
   * Adds openlayers feature to search result layer
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {Array<{external:"ol.feature"}>}
   */
  addFeatureToSearchResultLayer = olFeatures => {
    this.searchResultLayer.getSource().addFeatures(olFeatures);
    this.zoomToExtent(this.searchResultLayer.getSource().getExtent());
  };

  /**
   * Zooms map to extent
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {Array<{external:"ol/interaction/Extent"}>}
   */
  zoomToExtent = extent => {
    this.map.getView().fit(extent, {
      size: this.map.getSize(),
      padding: [10, 10, 10, 10]
    });
  };

  /**
   * Zooms map to extent
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {*} event
   */

  onFeaturesClickedInMap = e => {
    var featuresClicked = this.getFeaturesAtClickedPixel(e);
    this.highlightAndZoomToFeature(featuresClicked[0]);
    this.localObserver.publish("features-clicked-in-map", featuresClicked);
  };

  /**
   * Returns all features "below" clicked pixel in map
   *
   * @returns {Array<{external:"ol.feature"}>}
   * @memberof MapViewModel
   * @param {*} event
   */
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
}
