import GeoJSON from "ol/format/GeoJSON.js";

function query(map, layer, evt) {
  let coordinate = evt.coordinate;
  let resolution = map.getView().getResolution();
  let referenceSystem = map
    .getView()
    .getProjection()
    .getCode();
  let params = {
    INFO_FORMAT: "application/json"
  };
  let url = layer
    .getSource()
    .getGetFeatureInfoUrl(coordinate, resolution, referenceSystem, params);
  return fetch(url);
}

/**
 * Query the map for features when the user clicks the map.
 * The approach is to stack all the queryable WMS-requests and return a promise with a pointer to the reffering layer.
 * When the requests are done the features are parsed and given the original layer reference.
 * Vector layers are added with the features at pixel method and given the original layer reference as well.
 */
function handleClick(evt, map, callback) {
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
    return false;
  }

  document.querySelector("body").style.cursor = "progress";
  var promises = [];
  map
    .getLayers()
    .getArray()
    .filter(layer => {
      return (
        (layer.type === "TILE" || layer.type === "IMAGE") &&
        layer.get("visible") === true &&
        layer.get("queryable") === true
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
    var jsonPromises = [];
    responses.forEach(response => {
      jsonPromises.push(
        response.requestResponse.json().then(jsonData => {
          return {
            layer: response.layer,
            jsonData: jsonData
          };
        })
      );
    });

    Promise.all(jsonPromises).then(jsonPromisesData => {
      var features = [];

      map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => {
          if (layer.getProperties().name) {
            feature.layer = layer;
            features.push(feature);
          }
        },
        {
          hitTolerance: 10
        }
      );

      jsonPromisesData.forEach(jsonPromiseData => {
        if (jsonPromiseData.jsonData.features.length > 0) {
          let parsed = new GeoJSON().readFeatures(jsonPromiseData.jsonData);
          parsed.forEach(f => {
            f.layer = jsonPromiseData.layer;
          });
          features = [...features, ...parsed];
        }
      });
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
    handleClick(evt, map, callback);
  });
}
