import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";

import { hfetch } from "utils/FetchWrapper";

function query(map, layer, evt) {
  const coordinate = evt.coordinate;
  const resolution = map.getView().getResolution();
  const currentZoom = map.getView().getZoom();
  const referenceSystem = map.getView().getProjection().getCode();
  let subLayersToQuery = [];

  // Query only those layers that a) have a layersInfo property, and
  // b) are currently displayed. Please note that checking for visibility
  // is not enough, we must also respect the min/max zoom level settings, #836.
  if (
    layer.layersInfo &&
    layer.getMinZoom() <= currentZoom &&
    currentZoom <= layer.getMaxZoom()
  ) {
    const subLayers = Object.values(layer.layersInfo);
    // First we must get the string containing the active sub-layers in this
    // group-layer.
    const visibleSubLayersString =
      layer.getSource().getParams()["LAYERS"] || "";
    // The string will contain the layers, separated with a comma. We'll split
    // the string to get an array.
    const visibleSubLayersArray = visibleSubLayersString.split(",");
    // Then we'll create a Set from the array. The Set will allow us to
    // check wether a sub-layer should be queried or not in a simple manner.
    const visibleSubLayersSet = new Set(visibleSubLayersArray);
    // Then we'll loop trough the subLayers that should be queried, and make sure
    // to remove layers that are 1. Not queryable, or 2. Not visible.
    subLayersToQuery = subLayers
      .filter(
        (subLayer) =>
          subLayer.queryable === true && visibleSubLayersSet.has(subLayer.id)
      ) // QUERY_LAYERS must not include anything that's not in LAYERS, see https://github.com/hajkmap/Hajk/issues/211
      .map((queryableSubLayer) => {
        return queryableSubLayer.id;
      });
  }

  if (subLayersToQuery.length > 0) {
    let params = {
      FEATURE_COUNT: 100,
      INFO_FORMAT: layer.getSource().getParams().INFO_FORMAT,
      QUERY_LAYERS: subLayersToQuery.join(","),
    };

    // See #852. Without this, it's almost impossible to get a result from QGIS Server.
    // TODO: This could be expanded and made an admin setting - I'm not sure that 50 px
    // will work for everyone.
    // The WITH_GEOMETRY is necessary to make QGIS Server send back the feature's geometry
    // in the response.
    // See: https://docs.qgis.org/3.16/en/docs/server_manual/services.html#wms-withgeometry.
    if (layer.getSource().serverType_ === "qgis") {
      params = {
        ...params,
        FI_POINT_TOLERANCE: 50,
        FI_LINE_TOLERANCE: 50,
        FI_POLYGON_TOLERANCE: 50,
        WITH_GEOMETRY: true,
      };
    }

    const url = layer
      .getSource()
      .getFeatureInfoUrl(coordinate, resolution, referenceSystem, params);
    return hfetch(url);
  } else {
    return false;
  }
}

function getSortParser(sortType) {
  if (sortType === "number") {
    return parseInt;
  } else if (sortType === "string") {
    return (a) => {
      return a ? a.trim() : "";
    };
  } else {
    return (a) => {
      return a;
    };
  }
}

function getSortMethod(options) {
  if (options.type === "number") {
    return (a, b) => {
      return (
        (options.desc ? -1 : 1) *
        (options.parser(a.getProperties()[options.prop]) -
          options.parser(b.getProperties()[options.prop]))
      );
    };
  } else {
    return (a, b) => {
      return (
        (options.desc ? -1 : 1) *
        options
          .parser(a.getProperties()[options.prop])
          .localeCompare(options.parser(b.getProperties()[options.prop]))
      );
    };
  }
}

function sortAndMutateFeaturesArray(layer, features) {
  if (!features || features.length <= 1) {
    return;
  }
  const layerInfo = layer.getProperties().layerInfo;
  if (!layerInfo.infoClickSortProperty) {
    return;
  }
  const sortType = layerInfo.infoClickSortType || "string";
  const sortOptions = {
    type: sortType,
    desc: layerInfo.infoClickSortDesc ?? true,
    prop: layerInfo.infoClickSortProperty.trim(),
    parser: getSortParser(sortType),
  };
  features.sort(getSortMethod(sortOptions));
}

// Function similar to GeoJSON().readFeatures, with the subtle difference that we set an
// id if it is missing on the parsed feature. The missing id occurs when parsing features from
// arcGis for some reason.
function readJsonFeatures(jsonData, layerProjection, viewProjection) {
  const parser = new GeoJSON();

  // If the response from WMS service contains a CRS (GeoServer), the feature parser
  // will use it be default to determine the features' projection.
  // However, if it's empty (QGIS Server), we must tell the parser which projection
  // should be used for the features and which projection our View is in.
  const parserOptions = jsonData.crs
    ? {}
    : {
        dataProjection: layerProjection,
        featureProjection: viewProjection,
      };

  const parsedFeatures = [];
  // jsonData will always be a featureCollection, hence we must map over all
  // features in the collection.
  jsonData.features.map((jsonFeature) => {
    // Lets parse the feature...
    const parsedJsonFeature = parser.readFeature(jsonFeature, parserOptions);
    // And check if we have an id...
    if (!parsedJsonFeature.getId()) {
      // If we don't, we set the id to the layerName, and a random id
      // so that featureInfo knows when we clicked a new feature in
      // the same layer.
      parsedJsonFeature.setId(
        `${jsonFeature.layerName}.${parsedJsonFeature.ol_uid}`
      );
    }
    // Push the feature to the array of parsed features
    return parsedFeatures.push(parsedJsonFeature);
  });
  // And return it
  return parsedFeatures;
}

function getFeaturesFromJson(response, jsonData) {
  const layerProjection = response.layer.getSource().getProjection();
  const viewProjection = response.viewProjection;
  let features = readJsonFeatures(jsonData, layerProjection, viewProjection);
  if (features && features.length > 0) {
    features = features.map((f) => {
      f.layer = response.layer;
      return f;
    });
    sortAndMutateFeaturesArray(response.layer, features);
  }
  return features;
}

function getFeaturesFromGml(response, text) {
  const wmsGetFeatureInfo = new WMSGetFeatureInfo();
  let features = wmsGetFeatureInfo.readFeatures(text);
  if (features && features.length > 0) {
    features = features.map((f) => {
      f.layer = response.layer;
      return f;
    });
    sortAndMutateFeaturesArray(response.layer, features);
  }
  return features;
}

function getFeaturesFromXmlOrGml(response, text) {
  // In cases where the XML has no FIELDS element, the XML is assumed
  // not to come from Esri and can be parsed as GML.
  if (!text.includes("<FIELDS")) {
    return getFeaturesFromGml(response, text);
  }

  // If we got this far, it looks like an Esri response and we can't use
  // the standard GML parser. Instead we implement a custom solution.
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");
  let features = [];
  const fields = doc.getElementsByTagName("FIELDS");
  for (let i = 0; i < fields.length; i++) {
    const feature = new Feature();
    const attributes = fields[i].attributes;
    for (let j = 0; j < attributes.length; j++) {
      feature.set(attributes[j].name, attributes[j].value);
    }
    if (!feature.getId()) {
      feature.setId(
        `${response.layer.getProperties().layerInfo.name}.${feature.ol_uid}`
      );
    }
    feature.layer = response.layer;
    features.push(feature);
  }

  sortAndMutateFeaturesArray(response.layer, features);
  return features;
}

/**
 * Query the map for features when the user clicks the map.
 * The approach is to stack all the queryable WMS-requests and return a promise with a pointer to the referring layer.
 * When the requests are done the features are parsed and given the original layer reference.
 * Vector layers are added with the features at pixel method and given the original layer reference as well.
 */
export function handleClick(evt, map, callback) {
  document.querySelector("body").style.cursor = "progress";
  const promises = [];
  const viewProjection = map.getView().getProjection().getCode();
  map
    .getLayers()
    .getArray()
    // Now we have an array with all layers added to our map, let's narrow down a bit
    .filter(
      (layer) =>
        // Only certain layer types are relevant
        (layer instanceof TileLayer || layer instanceof ImageLayer) &&
        // And only if they're currently visible (no reason to query hidden layers)
        layer.get("visible") === true
    )
    // For each layer that's left in the array
    .forEach((layer) => {
      // Query the layer, will return a Promise (Fetch call)
      // or false, if there was no need to fetch.
      const promise = query(map, layer, evt);
      // If query() didn't return false, we have a real Promise
      if (promise !== false) {
        promises.push(
          promise.then((response) => {
            return {
              layer: layer,
              requestResponse: response,
              viewProjection: viewProjection,
            };
          })
        );
      }
    });

  Promise.allSettled(promises)
    .then((responses) => {
      const featurePromises = [];
      const features = [];
      responses.forEach((response) => {
        // Ensure that the Promise is fulfilled - if not, we won't have any
        // value to parse!
        if (response.status === "fulfilled") {
          const type = response.value.requestResponse.headers
            .get("Content-Type")
            ?.split(";")[0]; // If request failed, we might not have the Content-Type header
          switch (type) {
            case "application/geojson":
            case "application/json":
              featurePromises.push(
                response.value.requestResponse
                  .json()
                  .then((jsonData) => {
                    if (
                      jsonData !== undefined &&
                      jsonData &&
                      jsonData.features &&
                      jsonData.features.length > 0
                    ) {
                      features.push(
                        ...getFeaturesFromJson(response.value, jsonData)
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(
                      "GetFeatureInfo couldn't retrieve correct data for the clicked object.",
                      err
                    );
                  })
              );
              break;
            case "text/xml":
            case "application/vnd.ogc.gml":
              featurePromises.push(
                response.value.requestResponse
                  .text()
                  .then((text) => {
                    features.push(
                      ...getFeaturesFromXmlOrGml(response.value, text)
                    );
                  })
                  .catch((err) => {
                    console.error(
                      "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                    );
                  })
              );
              break;
            // For any other Content-Type, just ignore - we can't parse any
            // features if we don't know the data format (or if it's simply missing)
            default:
              break;
          }
        } else {
          // I'm adding this for pure readability. We don't want to throw any errors
          // here, even if one of the Promises was rejected. The reason is that throwing
          // an error here would abort the flow (by taking us straight to the catch() below).
          // In that case, we'd miss any successfully parsed responses, and we don't want that.
          // So we just go on, silently.
          console.error("Couldn't parse GetFeatureInfo.", response.reason);
        }
      });

      Promise.all(featurePromises)
        .then(() => {
          map.forEachFeatureAtPixel(
            evt.pixel,
            (feature, layer) => {
              if (
                layer &&
                ((layer?.get("queryable") === true &&
                  layer?.get("ignoreInFeatureInfo") !== true) ||
                  layer.get("name") === "pluginSearchResults")
              ) {
                feature.layer = layer;
                features.push(feature);
              }
            },
            {
              hitTolerance: 10,
            }
          );

          document.querySelector("body").style.cursor = "initial";
          callback({
            features: features,
            evt: evt,
          });
        })
        .catch((err) => {
          console.error("FeatureInfo failed:", err);
          document.querySelector("body").style.cursor = "initial";
        });
    })
    .catch((err) => {
      console.error("Parsing response failed:", err);
      document.querySelector("body").style.cursor = "initial";
    });
}

export function bindMapClickEvent(map, callback) {
  // We must use a custom "clickLock" mechanism, as opposed to the
  // previous attempts (map.getInteraction().getArray() and looking
  // for certain values in each Interaction's constructor.name).
  //
  // The previous method (checking prototype's name) was
  // unreliable as Webpack uglifies the class names,
  // hence the constructors we're comparing against
  // don't have their usual names.
  //
  // Please see issue #591 for more info.
  //
  // The 'clickLock' Set is added to Map in appModel.createMap(),
  // so by the time we bind this handler, we can be sure that
  // map.clickLock already exists.

  // Bind the "singleclick" event of OL Map
  map.on("singleclick", (evt) => {
    // Handle click only if there no plugin wants to lock
    // the click interaction currently
    map.clickLock.size === 0 && handleClick(evt, map, callback);
  });
}
