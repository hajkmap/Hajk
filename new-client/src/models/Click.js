import GeoJSON from "ol/format/GeoJSON.js";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import GML from "ol/format/GML";

const fetchConfig = {
  credentials: "same-origin"
};

function query(map, layer, evt) {
  let coordinate = evt.coordinate;
  let resolution = map.getView().getResolution();
  let referenceSystem = map
    .getView()
    .getProjection()
    .getCode();

  let subLayers = Object.values(layer.layersInfo);
  let layersToQuery = subLayers
    .filter(subLayer => {
      return subLayer.queryable === true;
    })
    .map(queryableSubLayer => {
      return queryableSubLayer.id;
    })
    .join(",");

  let params = {
    FEATURE_COUNT: 100,
    INFO_FORMAT: layer.getSource().getParams().INFO_FORMAT,
    QUERY_LAYERS: layersToQuery
  };
  let url = layer
    .getSource()
    .getGetFeatureInfoUrl(coordinate, resolution, referenceSystem, params);
  return fetch(url, fetchConfig);
}

/**
 * Query the map for features when the user clicks the map.
 * The approach is to stack all the queryable WMS-requests and return a promise with a pointer to the reffering layer.
 * When the requests are done the features are parsed and given the original layer reference.
 * Vector layers are added with the features at pixel method and given the original layer reference as well.
 */
function handleClick(evt, map, callback) {
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
        layer.get("visible") === true &&
        layer.get("queryable") === true //WIP - Tobias - Should not be used anymore, need to check this
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
                  let parsed = new GeoJSON().readFeatures(jsonData);
                  if (parsed.length > 0) {
                    parsed.forEach(f => {
                      f.layer = response.layer;
                    });
                    features.push(parsed);
                  }
                }
              })
              .catch(err => {
                console.error(
                  "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                );
                console.error(err);
              })
          );
          break;
        case "text/xml": {
          featurePromises.push(
            response.requestResponse
              .text()
              .then(text => {
                let gml = new GML();
                let doc = new DOMParser().parseFromString(text, "text/xml");
                let parsed = gml.readFeatures(doc);
                if (parsed.length > 0) {
                  parsed.forEach(f => {
                    f.layer = response.layer;
                  });
                  features.push(parsed);
                }
              })
              .catch(err => {
                console.error(
                  "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                );
                console.error(err);
              })
          );
          break;
        }
        default:
          console.log("Unsupported response type:", type);
          break;
      }
    });

    Promise.all(featurePromises).then(() => {
      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          if (layer.get("queryable") === true && layer.getProperties().name) {
            feature.layer = layer;
            features.push(feature);
          }
        },
        {
          hitTolerance: 10
        }
      );

      document.querySelector("body").style.cursor = "initial";
      var result = [].concat(...features);
      callback({
        features: result,
        evt: evt
      });
    });
  });
}

export function bindMapClickEvent(map, callback) {
  map.on("singleclick", evt => {
    // If Draw, Modify or Snap interaction are currently active, ignore clicks
    if (
      map
        .getInteractions()
        .getArray()
        .filter(
          interaction =>
            ["Draw", "Snap", "Modify", "Select", "Translate"].indexOf(
              interaction.constructor.name
            ) !== -1
        ).length > 0 ||
      map.clicklock
    ) {
      return;
    } else {
      handleClick(evt, map, callback);
    }
  });
}
