import Observer from "react-event-observer";
import { WFS, GeoJSON } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import Or from "ol/format/filter/Or";
import Intersects from "ol/format/filter/Intersects";
import GeometryType from "ol/geom/GeometryType";
import { fromCircle } from "ol/geom/Polygon";
import Draw from "ol/interaction/Draw.js";
import {
  Tile as TileLayer,
  Image as ImageLayer,
  Vector as VectorLayer
} from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill, Icon } from "ol/style";

import { deepMerge } from "../utils/DeepMerge";
import { arraySort } from "../utils/ArraySort";
import { handleClick } from "./Click";

class SearchModel {
  // Public field declarations (why? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#Defining_classes)
  modelOptions;
  localObserver = new Observer();

  // Private fields (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_fields)
  #options = {
    limit: 100,
    extentLimit: null
  };
  #sources = null;
  #map;
  #app;
  #layerList = [];
  #controllers = [];
  #timeout = -1;
  #wfsParser = new WFS();
  #vectorLayer;
  #drawSource;
  #drawLayer;
  #drawStyle = new Style({
    stroke: new Stroke({
      color: "rgba(255, 214, 91, 0.6)",
      width: 4
    }),
    fill: new Fill({
      color: "rgba(255, 214, 91, 0.2)"
    }),
    image: new Circle({
      radius: 6,
      stroke: new Stroke({
        color: "rgba(255, 214, 91, 0.6)",
        width: 2
      })
    })
  });

  constructor(searchPluginOptions, map, app) {
    // Validate
    if (!searchPluginOptions || !map || !app) {
      throw new Error(
        "One of the required parameters for SearchModel is missing."
      );
    }

    // FIXME: Currently this is public as it's used outside this class - but should it? I mean, these options are internal, right?
    this.modelOptions = searchPluginOptions; // FIXME: Options, currently from search plugin
    this.#map = map; // The OpenLayers map instance
    this.#app = app; // Supplies appConfig and globalObserver

    this.#vectorLayer = new VectorLayer({
      source: new VectorSource({}),
      style: this.#getVectorLayerStyle()
    });
    this.#vectorLayer.set("type", "searchResultLayer");
    this.#vectorLayer.setZIndex(1);

    this.#drawSource = new VectorSource({ wrapX: false });
    this.#drawLayer = new VectorLayer({
      source: this.#drawSource,
      style: this.#drawStyle
    });

    // Add layer that will hold highlighted search results
    this.#map.addLayer(this.#vectorLayer);

    // Add layer that will be used to allow user draw on map - used for spatial search
    this.#map.addLayer(this.#drawLayer);
    console.log(this);
  }

  /**
   * Below follows a classification of methods. I've organized them the following way:
   * 1. Most probably part of future public API
   * 2. Not yet decided
   * 3. Candidates for consolidation (merging many current public methods into one and making it part of the public API)
   * 4. Candidates for refactoring (perhaps they shouldn't be part of core model, perhaps they are just too similar and should be consolidated?)
   * 5. Private methods (used only in this class)
   */

  #sleep = (delay = 0) => {
    return new Promise(resolve => {
      setTimeout(resolve, delay);
    });
  };

  // 0. NEW PUBLIC API
  getAutocomplete = async (searchString, options = null) => {
    // Just a demo that autocompletes the same, no matter value of searchString.
    console.log("getAutocomplete for string:", searchString);
    const response = await fetch(
      "https://country.register.gov.uk/records.json?page-size=5000"
    );
    const countries = await response.json();
    await this.#sleep(1e3); // For demo purposes.

    return countries;
  };

  getResults = async (searchString, options = null) => {
    console.log("getResults for string: ", searchString);
    return [{ id: 0, value: searchString }];
  };

  abort = () => {
    return true;
  };

  getOptions = () => {
    return this.#options;
  };

  setOptions = options => {
    this.#options = deepMerge(this.#options, options);
  };

  getSources = () => {
    return this.#sources;
  };

  setSources = (sources = null) => {
    return sources === null
      ? (this.#sources = this.modelOptions.layers)
      : sources;
  };

  // 1. PUBLIC API
  search = (searchInput, force, callback) => {
    clearTimeout(this.#timeout);

    this.clearRecentSpatialSearch();

    if (force === true) {
      this.abortSearches();
      this.#timeout = setTimeout(() => {
        this.localObserver.publish("searchStarted");
        const promises = [];

        this.#controllers.splice(0, this.#controllers.length);

        this.modelOptions.sources.forEach(source => {
          const { promise, controller } = this.#lookup(source, searchInput);
          promises.push(promise);
          this.#controllers.push(controller);
        });

        const timeout = this.#timeout;

        Promise.all(promises)
          .then(responses => {
            Promise.all(responses.map(result => result.json()))
              .then(jsonResults => {
                if (this.#timeout !== timeout) {
                  return this.localObserver.publish("searchComplete");
                }
                jsonResults.forEach((jsonResult, i) => {
                  if (jsonResult.features.length > 0) {
                    arraySort({
                      array: jsonResult.features,
                      index: this.modelOptions.sources[i].searchFields[0]
                    });
                  }
                  jsonResult.source = this.modelOptions.sources[i];
                });
                setTimeout(() => {
                  this.localObserver.publish("searchComplete");
                }, 500);
                if (callback) callback(jsonResults);
              })
              .catch(parseErrors => {});
          })
          .catch(responseErrors => {});
      }, 200);
    } else {
      this.#timeout = -1;
      this.#clear();
      callback(false);
    }
  };

  abortSearches() {
    if (this.#controllers.length > 0) {
      this.#controllers.forEach(controller => {
        controller.abort();
        this.localObserver.publish("searchComplete");
      });
    }
    this.#controllers.splice(0, this.#controllers.length);
  }

  // 2. UNSURE ABOUT THE FOLLOWING (PUBLIC OR NOT?)
  highlightFeatures(features) {
    this.#vectorLayer.getSource().addFeatures(features);
    this.#map.getView().fit(this.#vectorLayer.getSource().getExtent(), {
      size: this.#map.getSize(),
      maxZoom: 7
    });
  }

  highlightImpact(feature) {
    this.#clear();
    this.#vectorLayer.getSource().addFeature(feature);
    this.#map.getView().fit(feature.getGeometry(), this.#map.getSize());
    this.#searchWithinArea(feature, true, featureCollections => {
      var layerIds = featureCollections.map(featureCollection => {
        return featureCollection.source.layerId;
      });
      this.#layerList = layerIds.reduce(this.#getLayerAsSource, []);
      this.#layerList.forEach(layer => {
        layer.setVisible(true);
      });
    });
  }

  // 3. FIXME: PROBABLY CANDIDATES FOR REFACTORING - CONSIDER CREATING ONE clear() METHOD INSTEAD
  clearRecentSpatialSearch = () => {
    this.#toggleDraw(false);
    this.#toggleSelectGeometriesForSpatialSearch(false);
    this.clearHighlight();
    this.#clear();
  };

  clearLayerList() {
    this.#layerList.forEach(layer => {
      layer.setVisible(false);
    });
    this.#hideVisibleLayers();
  }

  clearFeatureHighlight(feature) {
    this.#vectorLayer
      .getSource()
      .removeFeature(
        this.#vectorLayer.getSource().getFeatureById(feature.getId())
      );
  }

  clearHighlight() {
    this.#vectorLayer.getSource().clear();
  }

  // 4. FIXME: CANDIDATES FOR REFACTORING

  selectionSearch = (selectionDone, searchDone) => {
    // FIXME: Used only in SearchWithSelectionInput
    this.#toggleSelectGeometriesForSpatialSearch(
      true,
      selectionDone,
      searchDone
    );
  };

  withinSearch = (radiusDrawn, searchDone) => {
    // FIXME: Used only in SearchWithRadiusInput
    this.#toggleDraw(true, "Circle", true, e => {
      radiusDrawn();
      // TODO: Change second parameter to FALSE in order to use global defined WFS search sources
      this.#searchWithinArea(e.feature, true, featureCollections => {
        let layerIds = featureCollections.map(featureCollection => {
          return featureCollection.source.layerId;
        });

        this.#showLayers(layerIds);
        searchDone(layerIds);
      });
    });
  };

  polygonSearch = (polygonDrawn, searchDone) => {
    // FIXME: Used only in SpatialSearchMenu
    this.#toggleDraw(true, "Polygon", false, e => {
      polygonDrawn();
      this.#searchWithinArea(e.feature, false, featureCollections => {
        searchDone(featureCollections);
      });
    });
  };

  // 5. PRIVATE METHODS
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Private_Methods

  #clear = () => {
    this.clearHighlight();
    this.#drawSource.clear();
  };

  /**
   * @summary Takes a RGBA Object as input and returns it as an Array
   * formatted according to ol.Color. If no value is provided, the defaults
   * are used.
   *
   * @param {Object} obj
   * @param {Array} [def={ r: 100, g: 100, b: 100, a: 0.7 }]
   * @returns {Array} RGBA values formatted as an ol.Color Array
   */
  #convertRgbaColorObjectToArray = (
    obj = {},
    def = { r: 100, g: 100, b: 100, a: 0.7 }
  ) => {
    const mergedObject = { ...def, ...obj };
    return [mergedObject.r, mergedObject.g, mergedObject.b, mergedObject.a];
  };

  /**
   * @summary Prepares and returns an ol.Style object, used to
   * style the search results layer.
   *
   * @returns {Object} ol.Style
   */
  #getVectorLayerStyle = () => {
    const {
      anchor,
      scale,
      src,
      strokeColor,
      strokeWidth,
      fillColor
    } = this.modelOptions;

    const style = new Style({
      // Polygons stroke color and width
      stroke: new Stroke({
        color: this.#convertRgbaColorObjectToArray(strokeColor, {
          r: 244,
          g: 83,
          b: 63,
          a: 1
        }),
        width: strokeWidth || 4
      }),
      // Polygons fill color
      fill: new Fill({
        color: this.#convertRgbaColorObjectToArray(fillColor, {
          r: 244,
          g: 83,
          b: 63,
          a: 0.2
        })
      })
    });

    // Point style (either a marker image or fallback to a Circle)

    if (src?.length > 0) {
      // If marker image is provided, use it
      style.setImage(
        new Icon({
          anchor: [anchor[0] || 0.5, anchor[1] || 1],
          scale: scale || 0.15,
          src: src
        })
      );
    } else {
      // Else just draw a simple Circle as marker
      style.setImage(
        new Circle({
          radius: 6,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.6)",
            width: 2
          })
        })
      );
    }

    return style;
  };

  #mapSourceAsWFSPromise = (feature, projCode, source) => {
    let geometry = feature.getGeometry();
    if (geometry.getType() === "Circle") {
      geometry = fromCircle(geometry);
    }

    /**
     * This is really confusing, but depending on whether we
     * searching using global WFS sources or by transforming
     * mapconfig's WMS layers to search sources, we call the
     * geom differently. So here's a hopefully bullet-proof
     * way of ensuring we respect the geom from admin (if any)
     * or fall back to default 'geom'
     */
    const finalGeom = source.geometryField || source.geometryName || "geom";

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      maxFeatures: this.modelOptions.maxFeatures || 100,
      geometryName: finalGeom,
      filter: new Intersects(finalGeom, geometry, projCode)
    };

    const node = this.#wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);
    const controller = new AbortController();
    const signal = controller.signal;

    const request = {
      credentials: "same-origin",
      signal: signal,
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    // source.url for layers CONTAINS proxy (if defined). If we don't remove
    // it, our URL will have duplicate proxies, (searchProxy + proxy + url).
    // TODO: Rewrite, maybe ensure that searchProxy is not needed (if we replace
    // current util/proxy with something that works with POST, we can use just one
    // proxy for all types of requests).
    let urlWithoutProxy = source.url.replace(
      this.#app.config.appConfig.proxy,
      ""
    );

    const promise = fetch(
      this.#app.config.appConfig.searchProxy + urlWithoutProxy,
      request
    );
    return { promise, controller };
  };

  #getLayerAsSource = (sourceList, layerId) => {
    var mapLayer = this.#map
      .getLayers()
      .getArray()
      .find(l => l.get("name") === layerId);

    if (mapLayer) {
      mapLayer.layerId = layerId;
      sourceList = [mapLayer, ...sourceList];
    }
    return sourceList;
  };

  #onSelectFeatures = (evt, selectionDone, callback) => {
    //Only handles single select and is restricted to polygon and multipolygon atm
    handleClick(evt, evt.map, response => {
      if (response.features.length > 0) {
        var geometryType = response.features[0].getGeometry().getType();

        if (
          geometryType === GeometryType.POLYGON ||
          geometryType === GeometryType.MULTI_POLYGON
        ) {
          this.#drawLayer.getSource().addFeatures(response.features);
          if (response.features.length > 0) {
            selectionDone();
            this.#searchWithinArea(
              response.features[0],
              false,
              featureCollections => {
                callback(featureCollections);
              }
            );
          }
        } else {
          this.#activateSelectionClick(selectionDone, callback);
        }
      } else {
        this.#activateSelectionClick(selectionDone, callback);
      }
    });
  };

  #activateSelectionClick = (selectionDone, callback) => {
    this.#map.clicklock = true;
    this.#map.once("singleclick", e => {
      this.#onSelectFeatures(e, selectionDone, callback);
    });
  };

  #toggleSelectGeometriesForSpatialSearch = (
    active,
    selectionDone,
    callback
  ) => {
    if (active) {
      this.#activateSelectionClick(selectionDone, callback);
    } else {
      this.#map.clicklock = false;
      this.clearHighlight();
    }
  };

  /**
   *
   *
   * @param {*} feature
   * @param {boolean} useTransformedWmsSource If true, uses sources specified in Admin->Tools->Search in admin->"Visningstjänster för sök inom", instead of the global WFS sources (Admin->Söktjänster).
   * @param {*} callback Function to call when search is completed
   */
  #searchWithinArea = (feature, useTransformedWmsSource, callback) => {
    const projCode = this.#map
      .getView()
      .getProjection()
      .getCode();

    var search = () => {
      let promises = [];
      let searchSources = this.modelOptions.sources;
      this.abortSearches();

      if (useTransformedWmsSource) {
        const searchLayers = this.modelOptions.selectedSources.reduce(
          this.#getLayerAsSource,
          []
        );

        searchSources = searchLayers
          .map(this.#mapDisplayLayerAsSearchLayer)
          .filter(source => source.layers);
      }
      this.#controllers.splice(0, this.#controllers.length);
      searchSources.forEach(source => {
        const { promise, controller } = this.#mapSourceAsWFSPromise(
          feature,
          projCode,
          source
        );
        promises.push(promise);
        this.#controllers.push(controller);
      });

      this.localObserver.publish("spatialSearchStarted");
      Promise.all(promises)
        .then(responses => {
          Promise.all(responses.map(result => result.json())).then(
            jsonResults => {
              var result = [];
              jsonResults.forEach((jsonResult, i) => {
                if (jsonResult.totalFeatures > 0) {
                  jsonResult.source = searchSources[i];
                  result.push(jsonResult);
                }
              });
              setTimeout(() => {
                this.localObserver.publish("searchComplete");
              }, 500);
              if (callback) {
                callback(result);
              }
            }
          );
        })
        .catch(() => {}); //Need to have a catch method to not get error in console when aborting through signal
    };

    if (feature.getGeometry().getType() === "Point") {
      this.modelOptions.sources.forEach(source => {
        if (source.caption.toLowerCase() === "fastighet") {
          this.#lookupEstate(source, feature, estates => {
            var olEstate = new GeoJSON().readFeatures(estates)[0];
            feature = olEstate;
            search();
          });
        }
      });
    } else {
      search();
    }
  };

  #getHiddenLayers = layerIds => {
    return this.#map
      .getLayers()
      .getArray()
      .filter(layer => {
        var hidden = true;
        var props = layer.getProperties();
        if (layerIds.some(id => id === props.name)) {
          hidden = false;
        }
        if (
          (props.layerInfo && props.layerInfo.layerType === "base") ||
          !props.layerInfo
        ) {
          hidden = false;
        }
        return hidden;
      });
  };

  #showLayers = layerIds => {
    this.visibleLayers = layerIds.reduce(this.#getLayerAsSource, []);
    this.hiddenLayers = this.#getHiddenLayers(layerIds);

    this.hiddenLayers.forEach(layer => {
      if (layer.layerType === "group") {
        this.#app.globalObserver.publish("layerswitcher.hideLayer", layer);
      } else {
        layer.setVisible(false);
      }
    });
    this.visibleLayers.forEach(layer => {
      if (layer.layerType === "group") {
        this.#app.globalObserver.publish("layerswitcher.showLayer", layer);
      } else {
        layer.setVisible(true);
      }
    });
  };

  #toggleDraw = (active, type, freehand, drawEndCallback) => {
    if (active) {
      this.draw = new Draw({
        source: this.#drawSource,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: this.#drawStyle
      });
      this.draw.on("drawend", e => {
        //this.clear();
        this.#map.removeInteraction(this.draw);
        setTimeout(() => {
          this.#map.clicklock = false;
        }, 1000);
        if (drawEndCallback) {
          drawEndCallback(e);
        }
      });
      this.#map.clicklock = true;
      this.#map.addInteraction(this.draw);
    } else {
      if (this.draw) {
        this.#clear();
        this.#map.removeInteraction(this.draw);
      }
      this.#map.clicklock = false;
    }
  };

  #hideVisibleLayers = () => {
    this.#map
      .getLayers()
      .getArray()
      .forEach(layer => {
        const props = layer.getProperties();
        if (props.layerInfo && props.layerInfo.layerType !== "base") {
          layer.setVisible(false);
        }
      });
  };

  #mapDisplayLayerAsSearchLayer = searchLayer => {
    // Admin has the possibility to set some search options for WMS layers,
    // one of them is name of geometry field. If it exists, use it.
    const layerInfo = searchLayer.get("layerInfo");
    const geomNameFromWmsConfig =
      typeof layerInfo === "object" &&
      layerInfo !== null &&
      layerInfo.hasOwnProperty("searchGeometryField")
        ? layerInfo.searchGeometryField
        : "geom";

    const type =
      searchLayer instanceof VectorLayer
        ? "VECTOR"
        : searchLayer instanceof TileLayer || searchLayer instanceof ImageLayer
        ? "TILE"
        : undefined;
    let source = {};
    let layers;
    const layerSource = searchLayer.getSource();
    if (type === "TILE") {
      if (searchLayer.layerType === "group") {
        layers = searchLayer.subLayers;
      } else {
        layers = layerSource.getParams()["LAYERS"].split(",");
      }
    }

    switch (type) {
      case "VECTOR":
        source = {
          type: type,
          url: searchLayer.get("url"),
          layers: [searchLayer.get("featureType")],
          geometryName: geomNameFromWmsConfig,
          layerId: searchLayer.layerId
        };
        break;
      case "TILE":
        source = {
          type: type,
          url: searchLayer.get("url").replace("wms", "wfs"),
          layers: layers,
          geometryName: geomNameFromWmsConfig,
          layerId: searchLayer.layerId
        };
        break;
      default:
        break;
    }
    return source;
  };

  #lookupEstate = (source, feature, callback) => {
    const projCode = this.#map
      .getView()
      .getProjection()
      .getCode();

    const geometry = feature.getGeometry();

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      filter: new Intersects(source.geometryField, geometry, projCode)
    };

    const node = this.#wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    fetch(this.#app.config.appConfig.searchProxy + source.url, request).then(
      response => {
        response.json().then(estate => {
          callback(estate);
        });
      }
    );
  };

  #lookup = (source, searchInput) => {
    const projCode = this.#map
      .getView()
      .getProjection()
      .getCode();

    var isLikeFilters = source.searchFields.map(searchField => {
      return new IsLike(
        searchField,
        searchInput + "*",
        "*", // wild card
        ".", // single char
        "!", // escape char
        false // match case
      );
    });

    var filter =
      isLikeFilters.length > 1 ? new Or(...isLikeFilters) : isLikeFilters[0];

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      maxFeatures: this.modelOptions.maxFeatures || 100,
      filter: filter
    };

    const node = this.#wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);
    const controller = new AbortController();
    const signal = controller.signal;

    const request = {
      credentials: "same-origin",
      signal: signal,
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };
    const promise = fetch(
      this.#app.config.appConfig.searchProxy + source.url,
      request
    );

    return { promise, controller };
  };
}

export default SearchModel;
