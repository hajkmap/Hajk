import { WFS, GeoJSON } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import EqualTo from "ol/format/filter/EqualTo";
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

import { arraySort } from "../utils/ArraySort.js";
import { handleClick } from "./Click.js";

var drawStyle = new Style({
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

class SearchModel {
  layerList = [];
  controllers = [];

  constructor(settings, map, app, observer) {
    // Validate
    if (!settings || !map || !app || !observer) {
      throw new Error(
        "One of the required parameters for SearchModel is missing. Here are the values."
      );
    }

    this.options = settings;
    this.olMap = map;
    this.app = app;
    this.localObserver = observer;

    this.wfsParser = new WFS();
    this.globalObserver = app.globalObserver;

    this.vectorLayer = new VectorLayer({
      source: new VectorSource({}),
      style: this.getVectorLayerStyle()
    });
    this.vectorLayer.set("type", "searchResultLayer");

    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: drawStyle
    });

    this.olMap.addLayer(this.vectorLayer);
    this.olMap.addLayer(this.drawLayer);
  }

  /**
   * @summary Takes a RGBA Object as input and returns it as an Array
   * formatted according to ol.Color. If no value is provided, the defaults
   * are used.
   *
   * @param {Object} obj
   * @param {Array} [def={ r: 100, g: 100, b: 100, a: 0.7 }]
   * @returns {Array} RGBA values formatted as an ol.Color Array
   */
  convertRgbaColorObjectToArray = (
    obj = {},
    def = { r: 100, g: 100, b: 100, a: 0.7 }
  ) => {
    const mergedObject = { ...def, ...obj };
    return [mergedObject.r, mergedObject.g, mergedObject.b, mergedObject.a];
  };

  /**
   * @summary Prepares and returnes an ol.Style object, used to
   * style the search results layer.
   *
   * @returns {Object} ol.Style
   */
  getVectorLayerStyle = () => {
    const {
      anchor,
      scale,
      src,
      strokeColor,
      strokeWidth,
      fillColor
    } = this.options;

    const style = new Style({
      // Polygons stroke color and width
      stroke: new Stroke({
        color: this.convertRgbaColorObjectToArray(strokeColor, {
          r: 244,
          g: 83,
          b: 63,
          a: 1
        }),
        width: strokeWidth || 4
      }),
      // Polygons fill color
      fill: new Fill({
        color: this.convertRgbaColorObjectToArray(fillColor, {
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

  mapSourceAsWFSPromise = (feature, projCode, source) => {
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
      maxFeatures: this.options.maxFeatures || 100,
      geometryName: finalGeom,
      filter: new Intersects(finalGeom, geometry, projCode)
    };

    const node = this.wfsParser.writeGetFeature(options);
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
      this.app.config.appConfig.proxy,
      ""
    );

    const promise = fetch(
      this.app.config.appConfig.searchProxy + urlWithoutProxy,
      request
    );
    return { promise, controller };
  };

  getLayerAsSource = (sourceList, layerId) => {
    var mapLayer = this.olMap
      .getLayers()
      .getArray()
      .find(l => l.get("name") === layerId);

    if (mapLayer) {
      mapLayer.layerId = layerId;
      sourceList = [mapLayer, ...sourceList];
    }
    return sourceList;
  };

  //Only handles single select and is restricted to polygon and multipolygon atm
  onSelectFeatures = (evt, selectionDone, callback) => {
    handleClick(evt, evt.map, response => {
      if (response.features.length > 0) {
        var geometryType = response.features[0].getGeometry().getType();

        if (
          geometryType === GeometryType.POLYGON ||
          geometryType === GeometryType.MULTI_POLYGON
        ) {
          this.drawLayer.getSource().addFeatures(response.features);
          if (response.features.length > 0) {
            selectionDone();
            this.searchWithinArea(
              response.features[0],
              false,
              featureCollections => {
                callback(featureCollections);
              }
            );
          }
        } else {
          this.activateSelectionClick(selectionDone, callback);
        }
      } else {
        this.activateSelectionClick(selectionDone, callback);
      }
    });
  };

  activateSelectionClick = (selectionDone, callback) => {
    this.olMap.clicklock = true;
    this.olMap.once("singleclick", e => {
      this.onSelectFeatures(e, selectionDone, callback);
    });
  };

  toggleSelectGeometriesForSpatialSearch = (
    active,
    selectionDone,
    callback
  ) => {
    if (active) {
      this.activateSelectionClick(selectionDone, callback);
    } else {
      this.olMap.clicklock = false;
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
  searchWithinArea = (feature, useTransformedWmsSource, callback) => {
    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    var search = () => {
      let promises = [];
      let searchSources = this.options.sources;
      this.abortSearches();

      if (useTransformedWmsSource) {
        const searchLayers = this.options.selectedSources.reduce(
          this.getLayerAsSource,
          []
        );

        searchSources = searchLayers
          .map(this.mapDisplayLayerAsSearchLayer)
          .filter(source => source.layers);
      }
      this.controllers.splice(0, this.controllers.length);
      searchSources.forEach(source => {
        const { promise, controller } = this.mapSourceAsWFSPromise(
          feature,
          projCode,
          source
        );
        promises.push(promise);
        this.controllers.push(controller);
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
      this.options.sources.forEach(source => {
        if (source.caption.toLowerCase() === "fastighet") {
          this.lookupEstate(source, feature, estates => {
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

  timeout = -1;

  abortSearches() {
    if (this.controllers.length > 0) {
      this.controllers.forEach(controller => {
        controller.abort();
        this.localObserver.publish("searchComplete");
      });
    }
    this.controllers.splice(0, this.controllers.length);
  }

  search = (searchInput, force, callback) => {
    clearTimeout(this.timeout);

    this.clearRecentSpatialSearch();
    //var autoExecution = searchInput.length > 3;

    if (/*autoExecution ||*/ force === true) {
      this.abortSearches();
      this.timeout = setTimeout(() => {
        this.localObserver.publish("searchStarted");
        var promises = [];

        this.controllers.splice(0, this.controllers.length);

        this.options.sources.forEach(source => {
          const { promise, controller } = this.lookup(source, searchInput);
          promises.push(promise);
          this.controllers.push(controller);
        });

        var timeout = this.timeout;

        Promise.all(promises)
          .then(responses => {
            Promise.all(responses.map(result => result.json()))
              .then(jsonResults => {
                if (this.timeout !== timeout) {
                  return this.localObserver.publish("searchComplete");
                }
                jsonResults.forEach((jsonResult, i) => {
                  if (jsonResult.features.length > 0) {
                    arraySort({
                      array: jsonResult.features,
                      index: this.options.sources[i].searchFields[0]
                    });
                  }
                  jsonResult.source = this.options.sources[i];
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
      this.timeout = -1;
      this.clear();
      callback(false);
    }
  };

  clear = () => {
    this.clearHighlight();
    this.drawSource.clear();
  };

  getHiddenLayers(layerIds) {
    return this.olMap
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
  }

  showLayers = layerIds => {
    this.visibleLayers = layerIds.reduce(this.getLayerAsSource, []);
    this.hiddenLayers = this.getHiddenLayers(layerIds);

    this.hiddenLayers.forEach(layer => {
      if (layer.layerType === "group") {
        this.globalObserver.publish("layerswitcher.hideLayer", layer);
      } else {
        layer.setVisible(false);
      }
    });
    this.visibleLayers.forEach(layer => {
      if (layer.layerType === "group") {
        this.globalObserver.publish("layerswitcher.showLayer", layer);
      } else {
        layer.setVisible(true);
      }
    });
  };

  clearRecentSpatialSearch = () => {
    this.toggleDraw(false);
    this.toggleSelectGeometriesForSpatialSearch(false);
    this.clearHighlight();
    this.clear();
  };

  selectionSearch = (selectionDone, searchDone) => {
    this.toggleSelectGeometriesForSpatialSearch(
      true,
      selectionDone,
      searchDone
    );
  };

  withinSearch = (radiusDrawn, searchDone) => {
    this.toggleDraw(true, "Circle", true, e => {
      radiusDrawn();
      // TODO: Change second parameter to FALSE in order to use global defined WFS search sources
      this.searchWithinArea(e.feature, true, featureCollections => {
        let layerIds = featureCollections.map(featureCollection => {
          return featureCollection.source.layerId;
        });

        this.showLayers(layerIds);
        searchDone(layerIds);
      });
    });
  };

  polygonSearch = (polygonDrawn, searchDone) => {
    this.toggleDraw(true, "Polygon", false, e => {
      polygonDrawn();
      this.searchWithinArea(e.feature, false, featureCollections => {
        searchDone(featureCollections);
      });
    });
  };

  toggleDraw = (active, type, freehand, drawEndCallback) => {
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: drawStyle
      });
      this.draw.on("drawend", e => {
        //this.clear();
        this.olMap.removeInteraction(this.draw);
        setTimeout(() => {
          this.olMap.clicklock = false;
        }, 1000);
        if (drawEndCallback) {
          drawEndCallback(e);
        }
      });
      this.olMap.clicklock = true;
      this.olMap.addInteraction(this.draw);
    } else {
      if (this.draw) {
        this.clear();
        this.olMap.removeInteraction(this.draw);
      }
      this.olMap.clicklock = false;
    }
  };

  hideVisibleLayers() {
    this.olMap
      .getLayers()
      .getArray()
      .forEach(layer => {
        var props = layer.getProperties();
        if (props.layerInfo && props.layerInfo.layerType !== "base") {
          layer.setVisible(false);
        }
      });
  }

  clearLayerList() {
    this.layerList.forEach(layer => {
      layer.setVisible(false);
    });
    this.hideVisibleLayers();
  }

  clearFeatureHighlight(feature) {
    this.vectorLayer
      .getSource()
      .removeFeature(
        this.vectorLayer.getSource().getFeatureById(feature.getId())
      );
  }
  clearHighlight() {
    this.vectorLayer.getSource().clear();
  }

  highlightFeatures(features) {
    this.vectorLayer.getSource().addFeatures(features);
    this.olMap.getView().fit(this.vectorLayer.getSource().getExtent(), {
      size: this.olMap.getSize(),
      maxZoom: 7
    });
  }

  highlightImpact(feature) {
    this.clear();
    this.vectorLayer.getSource().addFeature(feature);
    this.olMap.getView().fit(feature.getGeometry(), this.olMap.getSize());
    this.searchWithinArea(feature, true, featureCollections => {
      var layerIds = featureCollections.map(featureCollection => {
        return featureCollection.source.layerId;
      });
      this.layerList = layerIds.reduce(this.getLayerAsSource, []);
      this.layerList.forEach(layer => {
        layer.setVisible(true);
      });
    });
  }

  mapDisplayLayerAsSearchLayer(searchLayer) {
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
  }

  lookupEstate(source, feature, callback) {
    const projCode = this.olMap
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

    const node = this.wfsParser.writeGetFeature(options);
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

    fetch(this.app.config.appConfig.searchProxy + source.url, request).then(
      response => {
        response.json().then(estate => {
          callback(estate);
        });
      }
    );
  }

  lookup(source, searchInput) {
    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    let isLikeFilters = null;

    // If search string contains only numbers, let's do an EqualTo search
    if (/^\d+$/.test(searchInput.trim())) {
      isLikeFilters = source.searchFields.map(searchField => {
        return new EqualTo(searchField, Number(searchInput));
      });
    }
    // Else, let's do a IsLike search
    else {
      isLikeFilters = source.searchFields.map(searchField => {
        return new IsLike(
          searchField,
          searchInput + "*",
          "*", // wild card
          ".", // single char
          "!", // escape char
          false // match case
        );
      });
    }

    var filter =
      isLikeFilters.length > 1 ? new Or(...isLikeFilters) : isLikeFilters[0];

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      maxFeatures: this.options.maxFeatures || 100,
      filter: filter
    };

    const node = this.wfsParser.writeGetFeature(options);
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
      this.app.config.appConfig.searchProxy + source.url,
      request
    );

    return { promise, controller };
  }
}

export default SearchModel;
