import { WFS } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import Intersects from "ol/format/filter/Intersects";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromCircle } from "ol/geom/Polygon";
import Draw from "ol/interaction/Draw.js";
import { arraySort } from "./../../utils/ArraySort.js";
import { Stroke, Style, Circle } from "ol/style.js";
import { handleClick } from "../../models/Click.js";

var style = new Style({
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0.6)",
    width: 2
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.6)",
      width: 2
    })
  })
});

class SearchModel {
  layerList = [];

  mapSouceAsWFSPromise = (feature, projCode) => source => {
    var geom = feature.getGeometry();
    if (geom.getType() === "Circle") {
      geom = fromCircle(geom);
    }
    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryName,
      filter: new Intersects(
        "geom", // geometryName
        geom, // geometry
        projCode // projCode
      )
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

    // source.url for layers CONTAINS proxy (if defined). If we don't remove
    // it, our URL will have duplicate proxies, (searchProxy + proxy + url).
    // TODO: Rewrite, maybe ensure that searchProxy is not needed (if we replace
    // current util/proxy with something that works with POST, we can use just one
    // proxy for all types of requests).
    let urlWithoutProxy = source.url.replace(
      this.app.config.appConfig.proxy,
      ""
    );

    return fetch(
      this.app.config.appConfig.searchProxy + urlWithoutProxy,
      request
    );
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

  onSelectFeatures = evt => {
    handleClick(evt, evt.map, response => {
      console.log(evt, "evt");
      this.vectorLayer.getSource().addFeatures(response.features);
    });
  };

  doSearch = () => {
    var features = this.vectorLayer.getSource().getFeatures();
    console.log("GOING TO SEARCH");
    console.log(features, "feature");
    /* this.searchWithinArea(features, false, res => {
      console.log(res, "res");
    });*/
  };

  selectGeometriesForSpatialSearch = active => {
    if (active) {
      this.olMap.clicklock = true;
      this.olMap.on("singleclick", this.onSelectFeatures);
    } else {
      this.olMap.clicklock = false;
      this.clearHighlight();
      this.olMap.un("singleclick", this.onSelectFeatures);
    }
  };

  searchWithinArea = (feature, useTransformedWmsSource, callback) => {
    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    var search = () => {
      let searchSources = this.options.sources;

      if (useTransformedWmsSource) {
        const searchLayers = this.options.selectedSources.reduce(
          this.getLayerAsSource,
          []
        );
        searchSources = searchLayers
          .map(this.mapDisplayLayerAsSearchLayer)
          .filter(source => source.layers);
      }

      const promises = searchSources.map(
        this.mapSouceAsWFSPromise(feature, projCode)
      );

      this.observer.publish("searchStarted");
      Promise.all(promises).then(responses => {
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
              this.observer.publish("searchComplete");
            }, 500);
            callback(result);
          }
        );
      });
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

  controllers = [];

  search = (searchInput, callback) => {
    clearTimeout(this.timeout);
    if (searchInput.length > 3) {
      this.timeout = setTimeout(() => {
        this.observer.publish("searchStarted");
        var promises = [];

        if (this.controllers.length > 0) {
          this.controllers.forEach(controller => {
            controller.abort();
          });
        }

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
                  return this.observer.publish("searchComplete");
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
                  this.observer.publish("searchComplete");
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
        this.globalObserver.publish("hideLayer", layer);
      } else {
        layer.setVisible(false);
      }
    });
    this.visibleLayers.forEach(layer => {
      if (layer.layerType === "group") {
        this.globalObserver.publish("showLayer", layer);
      } else {
        layer.setVisible(true);
      }
    });
  };

  toggleDraw = (active, type, freehand, drawEndCallback) => {
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: freehand
      });
      this.draw.on("drawend", e => {
        this.clear();
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
        this.olMap.removeInteraction(this.draw);
      }
      this.olMap.clicklock = false;
    }
  };

  constructor(settings, map, app, observer) {
    this.options = settings;
    this.olMap = map;
    this.wfsParser = new WFS();
    this.vectorLayer = new VectorLayer({
      source: new VectorSource({}),
      style: () => style
    });
    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource
    });
    this.olMap.addLayer(this.vectorLayer);
    this.olMap.addLayer(this.drawLayer);
    this.observer = observer;
    this.globalObserver = app.globalObserver;
    this.app = app;
  }

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

  clearHighlight() {
    this.vectorLayer.getSource().clear();
  }

  highlightFeature(feature) {
    this.clearHighlight();
    this.vectorLayer.getSource().addFeature(feature);
    this.olMap.getView().fit(feature.getGeometry(), this.olMap.getSize());
  }

  highlight(feature) {
    this.clear();
    this.vectorLayer.getSource().addFeature(feature);
    this.olMap.getView().fit(feature.getGeometry(), this.olMap.getSize());
    this.searchWithinArea(feature, layerIds => {
      this.layerList = layerIds.reduce(this.getLayerAsSource, []);
      this.layerList.forEach(layer => {
        layer.setVisible(true);
      });
    });
  }

  mapDisplayLayerAsSearchLayer(searchLayer) {
    var type =
      searchLayer instanceof VectorLayer
        ? "VECTOR"
        : searchLayer instanceof TileLayer || searchLayer instanceof ImageLayer
        ? "TILE"
        : undefined;
    var source = {};
    var layers;
    var layerSource = searchLayer.getSource();
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
          geometryName: "geom",
          layerId: searchLayer.layerId
        };
        break;
      case "TILE":
        source = {
          type: type,
          url: searchLayer.get("url").replace("wms", "wfs"),
          layers: layers,
          geometryName: "geom",
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

    const geom = feature.getGeometry();

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryName,
      filter: new Intersects(
        "geom", // geometryName
        geom, // geometry
        projCode // projCode
      )
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

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      maxFeatures: 100,
      filter: new IsLike(
        source.searchFields[0],
        searchInput + "*",
        "*", // wild card
        ".", // single char
        "!", // escape char
        false // match case
      )
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
