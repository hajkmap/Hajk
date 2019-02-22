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

  searchWithinArea = (feature, callback) => {
    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    var search = () => {
      const searchLayers = this.options.selectedSources.reduce(
        this.getLayerAsSource,
        []
      );
      const searchSources = searchLayers
        .map(this.mapDisplayLayerAsSearchLayer)
        .filter(source => source.layers);

      const promises = searchSources.map(
        this.mapSouceAsWFSPromise(feature, projCode)
      );
      Promise.all(promises).then(responses => {
        Promise.all(responses.map(result => result.json())).then(
          jsonResults => {
            var result = [];
            jsonResults.forEach((jsonResult, i) => {
              if (jsonResult.totalFeatures > 0) {
                result.push(searchLayers[i].layerId);
              }
            });
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

  search = (searchInput, callback) => {
    if (searchInput.length > 3) {
      var promises = this.options.sources.map(source =>
        this.lookup(source, searchInput)
      );
      Promise.all(promises).then(responses => {
        Promise.all(responses.map(result => result.json())).then(
          jsonResults => {
            jsonResults.forEach((jsonResult, i) => {
              if (jsonResult.features.length > 0) {
                arraySort({
                  array: jsonResult.features,
                  index: this.options.sources[i].searchFields[0]
                });
              }
              jsonResult.source = this.options.sources[i];
            });
            if (callback) callback(jsonResults);
          }
        );
      });
    } else {
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

  toggleDraw = (active, drawEndCallback) => {
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: "Circle",
        freehand: true
      });
      this.draw.on("drawend", e => {
        if (drawEndCallback) {
          drawEndCallback();
        }
        this.clear();
        this.olMap.removeInteraction(this.draw);
        setTimeout(() => {
          this.olMap.clicklock = false;
        }, 1000);

        this.searchWithinArea(e.feature, layerIds => {
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
        });
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

    const request = {
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    return fetch(this.app.config.appConfig.searchProxy + source.url, request);
  }
}

export default SearchModel;
