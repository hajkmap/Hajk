import GeoJSON from "ol/format/GeoJSON.js";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
//import GML from "ol/format/GML";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";

const fetchConfig = {
  credentials: "same-origin",
};

function query(map, layer, evt) {
  const coordinate = evt.coordinate;
  const resolution = map.getView().getResolution();
  const referenceSystem = map.getView().getProjection().getCode();
  let subLayersToQuery = [];

  if (layer.layersInfo) {
    const subLayers = Object.values(layer.layersInfo);
    const visibleSubLayers = layer.getSource().getParams()["LAYERS"];
    subLayersToQuery = subLayers
      .filter(
        (subLayer) =>
          subLayer.queryable === true && visibleSubLayers.includes(subLayer.id)
      ) // QUERY_LAYERS must not include anything that's not in LAYERS, see https://github.com/hajkmap/Hajk/issues/211
      .map((queryableSubLayer) => {
        return queryableSubLayer.id;
      });
  }

  if (subLayersToQuery.length > 0) {
    const params = {
      FEATURE_COUNT: 100,
      INFO_FORMAT: layer.getSource().getParams().INFO_FORMAT,
      QUERY_LAYERS: subLayersToQuery.join(","),
    };

    const url = layer
      .getSource()
      .getFeatureInfoUrl(coordinate, resolution, referenceSystem, params);
    return fetch(url, fetchConfig);
  } else {
    return false;
  }
}

function getFeaturesFromJson(response, jsonData) {
  let parsed = new GeoJSON().readFeatures(jsonData);
  if (parsed.length > 0) {
    parsed.forEach((f) => {
      f.layer = response.layer;
    });
    return parsed;
  } else {
    return [];
  }
}

function getFeaturesFromGml(response, text) {
  let wmsGetFeatureInfo = new WMSGetFeatureInfo();
  //let doc = new DOMParser().parseFromString(text, "text/xml");
  let parsed = wmsGetFeatureInfo.readFeatures(text);
  if (parsed.length > 0) {
    parsed.forEach((f) => {
      f.layer = response.layer;
    });
    return parsed;
  } else {
    return [];
  }
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
            };
          })
        );
      }
    });

  Promise.all(promises).then((responses) => {
    const featurePromises = [];
    const features = [];
    responses.forEach((response) => {
      const type = response.requestResponse.headers
        .get("Content-Type")
        .split(";")[0];
      switch (type) {
        case "application/geojson":
        case "application/json":
          featurePromises.push(
            response.requestResponse
              .json()
              .then((jsonData) => {
                if (
                  jsonData !== undefined &&
                  jsonData &&
                  jsonData.features &&
                  jsonData.features.length > 0
                ) {
                  features.push(...getFeaturesFromJson(response, jsonData));
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
        case "application/vnd.ogc.gml": {
          featurePromises.push(
            response.requestResponse
              .text()
              .then((text) => {
                features.push(...getFeaturesFromGml(response, text));
              })
              .catch((err) => {
                console.error(
                  "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                );
              })
          );
          break;
        }
        default:
          break;
      }
    });

    Promise.all(featurePromises).then(() => {
      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          if (
            layer?.get("queryable") === true ||
            layer?.get("type") === "searchResultLayer"
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
    });
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
