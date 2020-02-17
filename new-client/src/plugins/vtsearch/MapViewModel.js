import PropTypes from "prop-types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Circle } from "ol/style";
import "ol/ol.css";
import Draw from "ol/interaction/Draw.js";
import WKT from "ol/format/WKT";
import { createBox } from "ol/interaction/Draw";
import { isThisSecond } from "date-fns";
/**
 * @summary ViewModel to handle interactions with map
 * @description Functionality used to interact with map.
 * This functionality does not fit in either the searchModel or the actual view.
 * @class MapViewModel
 */

const mapContainer = document.getElementById("map");
const appContainer = document.getElementById("app-container");
export default class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.model = settings.model;
    this.localObserver = settings.localObserver;

    this.bindSubscriptions();
    this.addHighlightLayerToMap();
    this.addDrawSearch();
  }
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired
  };

  /**
   * Init method to listen for events from other parts of plugin
   *
   * @returns {null}
   * @memberof MapViewModel
   */
  bindSubscriptions = () => {
    this.localObserver.subscribe("highlight-search-result-feature", payload => {
      var olFeature = this.getSearchResultLayerFromId(payload.searchResultId)
        .getSource()
        .getFeatureById(payload.olFeatureId);
      this.highlightFeature(olFeature);
    });

    this.localObserver.subscribe(
      "add-search-result-to-map",
      ({ searchResultId, olFeatures }) => {
        var searchResultLayer = this.addSearchResultLayerToMap(searchResultId);
        this.addFeatureToSearchResultLayer(olFeatures, searchResultLayer);
      }
    );

    this.localObserver.subscribe("clear-search-result", searchResultId => {
      this.map.removeLayer(this.getSearchResultLayerFromId(searchResultId));
    });
    this.localObserver.subscribe("deactivate-search", this.deactivateSearch);

    this.localObserver.subscribe("hide-all-layers", () => {
      this.hideAllLayers();
    });
    this.localObserver.subscribe("toggle-visibility", searchResultID => {
      this.toggleLayerVisibility(searchResultID);
    });

    this.localObserver.subscribe("hide-current-layer", () => {
      this.hideCurrentLayer();
    });

    this.map.on("singleclick", this.onFeaturesClickedInMap);

    this.localObserver.subscribe("add-search-result", olFeatures => {
      this.addFeatureToSearchResultLayer(olFeatures);
    });

    this.localObserver.subscribe("clear-highlight", () => {
      this.highlightLayer.getSource().clear();
    });

    this.localObserver.subscribe("resize-map", height => {
      this.resizeMap(height);
    });

    this.localObserver.subscribe("journeys-search", this.journeySearch);

    this.localObserver.subscribe("stops-search", this.stopSearch);

    this.localObserver.subscribe("routes-search", this.routesSearch);
  };

  resizeMap = height => {
    //Not so "reacty" but no other solution possible because if we don't want to rewrite core functionality in Hajk3
    [appContainer, mapContainer].forEach(container => {
      container.style.bottom = `${height}px`;
    });

    this.app.getMap().updateSize();
  };

  getSearchResultLayerFromId = searchResultId => {
    return this.map
      .getLayers()
      .getArray()
      .filter(layer => {
        return (
          layer.get("type") === "vt-search-result-layer" &&
          layer.get("searchResultId") === searchResultId
        );
      })[0];
  };
  deactivateSearch = () => {
    this.map.removeInteraction(this.draw);
  };

  journeySearch = ({
    selectedFromDate,
    selectedEndDate,
    selectedFormType,
    drawCallback
  }) => {
    var value = selectedFormType;
    var geometryFunction = undefined;
    if (selectedFormType === "Box") {
      this.map.removeInteraction(this.draw);
      value = "Circle";
      geometryFunction = createBox();
    }
    if (selectedFormType === "Polygon") {
      this.map.removeInteraction(this.draw);
    }
    this.getWktFromUser(value, geometryFunction).then(wktFeatureGeom => {
      drawCallback();
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

  getWktFromUser = (value, geometryFunction) => {
    this.drawlayer.getSource().clear();
    this.draw = new Draw({
      source: this.drawlayer.getSource(),
      type: value,
      stopClick: true,
      geometryFunction: geometryFunction
    });

    this.map.addInteraction(this.draw);
    return new Promise(resolve => {
      this.draw.on("drawend", e => {
        this.map.removeInteraction(this.draw);
        var format = new WKT();
        var wktFeatureGeom = format.writeGeometry(e.feature.getGeometry());
        resolve(wktFeatureGeom);
      });
    });
  };

  stopSearch = ({
    busStopValue,
    stopNameOrNr,
    publicLine,
    municipality,
    selectedFormType,
    drawCallback
  }) => {
    var value = selectedFormType;
    var geometryFunction = undefined;
    if (selectedFormType === "Box") {
      value = "Circle";
      geometryFunction = createBox();
    }

    if (selectedFormType === "") {
      if (busStopValue === "stopAreas") {
        this.model.getStopAreas(stopNameOrNr, publicLine, municipality);
      } else {
        this.model.getStopPoints(stopNameOrNr, publicLine, municipality);
      }
    } else {
      this.getWktFromUser(value, geometryFunction).then(wktFeatureGeom => {
        drawCallback();
        if (busStopValue === "stopAreas") {
          this.model.getStopAreas(
            stopNameOrNr,
            publicLine,
            municipality,
            wktFeatureGeom
          );
        } else {
          this.model.getStopPoints(
            stopNameOrNr,
            publicLine,
            municipality,
            wktFeatureGeom
          );
        }
      });
    }
  };

  routesSearch = ({
    publicLineName,
    internalLineNumber,
    municipality,
    trafficTransportName,
    throughStopArea,
    selectedFormType,
    drawCallback
  }) => {
    var value = selectedFormType;
    var geometryFunction = undefined;
    if (selectedFormType === "Box") {
      value = "Circle";
      geometryFunction = createBox();
    }
    if (selectedFormType === "") {
      this.model.getRoutes(
        publicLineName,
        internalLineNumber,
        municipality,
        trafficTransportName,
        throughStopArea
      );
    } else {
      this.getWktFromUser(value, geometryFunction).then(wktFeatureGeom => {
        drawCallback();
        this.model.getRoutes(
          publicLineName,
          internalLineNumber,
          municipality,
          trafficTransportName,
          throughStopArea,
          wktFeatureGeom
        );
      });
    }
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
  addSearchResultLayerToMap = searchResultId => {
    var fill = new Fill({
      color: `rgba(${this.model.mapColors.searchColor.fillColorRed},
        ${this.model.mapColors.searchColor.fillColorGreen},
        ${this.model.mapColors.searchColor.fillColorBlue},
        ${this.model.mapColors.searchColor.fillColorOpacity})`
    });
    var stroke = new Stroke({
      color: `rgba(${this.model.mapColors.searchColor.strokeColorRed},
        ${this.model.mapColors.searchColor.strokeColorGreen},
        ${this.model.mapColors.searchColor.strokeColorBlue},
        ${this.model.mapColors.searchColor.strokeColorOpacity})`,
      width: this.model.mapColors.searchColor.strokeLineWidth
    });
    var searchResultLayer = new VectorLayer({
      style: new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: this.model.mapColors.searchColor.strokePointWidth
        }),
        fill: fill,
        stroke: stroke
      }),
      source: new VectorSource({})
    });
    console.log(this.map, "map");
    searchResultLayer.set("type", "vt-search-result-layer");
    searchResultLayer.set("searchResultId", searchResultId);
    searchResultLayer.set("queryable", false);
    searchResultLayer.set("visible", false);

    this.map.addLayer(searchResultLayer);
    return searchResultLayer;
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
      color: `rgba(${this.model.mapColors.highlightColor.fillColorRed},
        ${this.model.mapColors.highlightColor.fillColorGreen},
        ${this.model.mapColors.highlightColor.fillColorBlue},
        ${this.model.mapColors.highlightColor.fillColorOpacity})`
    });
    var stroke = new Stroke({
      color: `rgba(${this.model.mapColors.highlightColor.strokeColorRed},
        ${this.model.mapColors.highlightColor.strokeColorGreen},
        ${this.model.mapColors.highlightColor.strokeColorBlue},
        ${this.model.mapColors.highlightColor.strokeColorOpacity})`,
      width: this.model.mapColors.highlightColor.strokeLineWidth
    });

    this.highlightLayer = new VectorLayer({
      style: new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: this.model.mapColors.highlightColor.strokePointWidth
        }),
        fill: fill,
        stroke: stroke
      }),
      source: new VectorSource({})
    });
    this.highlightLayer.set("type", "vt-highlight-layer");
    this.highlightLayer.setZIndex(50);
    this.map.addLayer(this.highlightLayer);
  };

  /**
   * Highlights a openlayers feature and zooms to it
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {external:"ol.Feature"}
   */

  highlightFeature = olFeature => {
    if (olFeature != null) {
      this.highlightLayer.getSource().clear();
      this.highlightLayer.getSource().addFeature(olFeature);
    }
  };
  /**
   * Adds openlayers feature to search result layer
   *
   * @returns {null}
   * @memberof MapViewModel
   * @param {Array<{external:"ol.feature"}>}
   */
  addFeatureToSearchResultLayer = (olFeatures, searchResultLayer) => {
    searchResultLayer.getSource().addFeatures(olFeatures);
    this.zoomToExtent(searchResultLayer.getSource().getExtent());
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
   * Toggles visibility for layer in map with the specified id
   * @returns {null}
   * @param {integer : searchResultId}
   * @memberof MapViewModel
   */
  toggleLayerVisibility = searchResultId => {
    this.map.getLayers().forEach(layer => {
      if (layer.get("searchResultId") === searchResultId) {
        layer.set("visible", !layer.get("visible"));
      }
    });
  };
  hideCurrentLayer = searchResultId => {
    this.map.getLayers().forEach(layer => {
      if (layer.get("searchResultId") === searchResultId) {
        layer.set("visible", false);
      }
    });
  };

  /**
   * Sets visible to false for all layers in the map
   * @returns {null}
   * @memberof MapViewModel
   */
  hideAllLayers = () => {
    this.map.getLayers().forEach(layer => {
      if (layer.get("type") === "vt-search-result-layer") {
        layer.set("visible", false);
      }
    });
  };

  /**
   * Zooms map to extent
   * @returns {null}
   * @memberof MapViewModel
   * @param {*} event
   */

  onFeaturesClickedInMap = e => {
    var featuresClicked = this.getFeaturesAtClickedPixel(e);
    if (featuresClicked.length > 0) {
      this.highlightFeature(featuresClicked[0]);
      this.localObserver.publish("features-clicked-in-map", featuresClicked);
    }
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
