import { WFS } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import Intersects from "ol/format/filter/Intersects";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { arraySort } from "./../../utils/ArraySort.js";

class SearchModel {

  layerList = [];

  mapSouceAsWFSPromise = (feature, projCode) => source => {

    var geom = feature.getGeometry();
    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryName,
      filter: new Intersects(
        "geom",   // geometryName
        geom,     // geometry
        projCode  // projCode
      )
    };

    const node = this.wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    return fetch(source.url, request);
  };

  getLayerAsSource = (sourceList, layerId) => {
    var mapLayer = this.olMap
      .getLayers()
      .getArray()
      .find(l =>
        l.get('name') === layerId
      );

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

    const searchLayers = this.options.selectedSources.reduce(this.getLayerAsSource, [])
    const promises = searchLayers
      .map(this.mapDisplayLayerAsSearchLayer)
      .map(this.mapSouceAsWFSPromise(feature, projCode));

    Promise.all(promises).then(responses => {
      Promise.all(responses.map(result => result.json())).then(
        jsonResults => {
          var result = [];
          jsonResults.forEach((jsonResult, i) => {
            if (jsonResult.totalFeatures > 0) {
              result.push(searchLayers[i].layerId)
            }
          });
          callback(result);
        }
      )
    });
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
    this.clearLayerList();
  };

  constructor(settings, map) {
    this.options = settings;
    this.olMap = map;
    this.wfsParser = new WFS();
    this.vectorLayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.olMap.addLayer(this.vectorLayer);
  }

  clearLayerList() {
    this.layerList.forEach(layer => {
      layer.setVisible(false);
    });
  }

  clearHighlight() {
    this.vectorLayer.getSource().clear();
  }

  highlight(feature) {
    this.clear();
    this.vectorLayer.getSource().addFeature(feature);
    this.olMap.getView().fit(
      feature.getGeometry(),
      this.olMap.getSize()
    );
    this.searchWithinArea(feature, (layerIds) => {
      this.layerList = layerIds.reduce(this.getLayerAsSource, []);
      this.layerList.forEach(layer => {
        layer.setVisible(true);
      });
    });
  }

  mapDisplayLayerAsSearchLayer(searchLayer) {
    var type = searchLayer.getType();
    var source = {};
    switch (type) {
      case "VECTOR":
        source = {
          type: type,
          url: searchLayer.get("url"),
          layers: [searchLayer.get("featureType")],
          geometryName: "geom",
          layerId: searchLayer.layerId
        }
        break;
      case "TILE":
      case "IMAGE":
        source = {
          type: type,
          url: searchLayer.get("url").replace('wms', 'wfs'),
          layers: searchLayer.getSource().getParams()["LAYERS"].split(','),
          geometryName: "geom",
          layerId: searchLayer.layerId
        }
        break;
      default:
        break;
    }
    return source;
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
        "*",  // wild card
        ".",  // single char
        "!",  // escape char
        false // match case
      )
    };

    const node = this.wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    return fetch(source.url, request);
  }

}

export default SearchModel;
