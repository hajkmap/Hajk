import GeoJSON from "ol/format/GeoJSON.js";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
//import GML from "ol/format/GML";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";

const fetchConfig = {
  credentials: "same-origin"
};

function query(map, layer, evt) {
  let coordinate = evt.coordinate;

  let resolution = map.getView().getResolution();

  let subLayersToQuery = [];
  let referenceSystem = map
    .getView()
    .getProjection()
    .getCode();

  if (layer.layersInfo) {
    let subLayers = Object.values(layer.layersInfo);
    let visibleSubLayers = layer.getSource().getParams()["LAYERS"];
    subLayersToQuery = subLayers
      .filter(
        subLayer =>
          subLayer.queryable === true && visibleSubLayers.includes(subLayer.id)
      ) // QUERY_LAYERS must not include anything that's not in LAYERS, see https://github.com/hajkmap/Hajk/issues/211
      .map(queryableSubLayer => {
        return queryableSubLayer.id;
      });
  }

  if (subLayersToQuery.length > 0) {
    let params = {
      FEATURE_COUNT: 100,
      INFO_FORMAT: layer.getSource().getParams().INFO_FORMAT,
      QUERY_LAYERS: subLayersToQuery.join(",")
    };

    let url = layer
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
    parsed.forEach(f => {
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
    parsed.forEach(f => {
      f.layer = response.layer;
    });
    return parsed;
  } else {
    return [];
  }
}

/**
 * Query the map for features when the user clicks the map.
 * The approach is to stack all the queryable WMS-requests and return a promise with a pointer to the reffering layer.
 * When the requests are done the features are parsed and given the original layer reference.
 * Vector layers are added with the features at pixel method and given the original layer reference as well.
 */
export function handleClick(evt, map, callback) {
  // TODO: Remove this temporary fix for OL6 beta when no longer necessary
  // if (evt.originalEvent.target.className !== "ol-unselectable") {
  //   return;
  // }

  document.querySelector("body").style.cursor = "progress";
  var promises = [];
  map
    .getLayers()
    .getArray()
    .filter(layer => {
      return (
        (layer instanceof TileLayer || layer instanceof ImageLayer) &&
        layer.get("visible") === true
      );
    })
    .forEach(layer => {
      var promise = query(map, layer, evt);
      if (promise) {
        promises.push(
          promise.then(response => {
            return {
              layer: layer,
              requestResponse: response
            };
          })
        );
      }
    });

  Promise.all(promises).then(responses => {
    var featurePromises = [];
    var features = [];
    responses.forEach(response => {
      var type = response.requestResponse.headers
        .get("Content-Type")
        .split(";")[0];
      switch (type) {
        case "application/geojson":
        case "application/json":
          featurePromises.push(
            response.requestResponse
              .json()
              .then(jsonData => {
                if (
                  jsonData !== undefined &&
                  jsonData &&
                  jsonData.features &&
                  jsonData.features.length > 0
                ) {
                  features.push(...getFeaturesFromJson(response, jsonData));
                }
              })
              .catch(err => {
                console.error(
                  "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                );
              })
          );
          break;
        case "text/xml":
        case "application/vnd.ogc.gml": {
          featurePromises.push(
            response.requestResponse
              .text()
              .then(text => {
                features.push(...getFeaturesFromGml(response, text));
              })
              .catch(err => {
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
            layer.get("queryable") === true ||
            layer.get("type") === "searchResultLayer"
          ) {
            feature.layer = layer;
            features.push(feature);
          }
        },
        {
          hitTolerance: 10
        }
      );

      document.querySelector("body").style.cursor = "initial";
      callback({
        features: features,
        evt: evt
      });
    });
  });
}

export function bindMapClickEvent(map, callback) {
  map.on("singleclick", evt => {
    // If Draw, Modify or Snap interaction are currently active, ignore clicks
    if (
      map.clicklock ||
      map
        .getInteractions()
        .getArray()
        .filter(interaction =>
          ["Draw", "Snap", "Modify", "Select", "Translate"].includes(
            interaction.constructor.name
          )
        ).length > 0
    ) {
      return;
    } else {
      handleClick(evt, map, callback);
    }
  });
}
