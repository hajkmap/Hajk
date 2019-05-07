import GeoJSON from "ol/format/GeoJSON.js";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import GML2 from "ol/format/GML2";

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
  let params = {
    FEATURE_COUNT: 100,
    INFO_FORMAT: "text/xml"
    //INFO_FORMAT: layer.getSource().getParams() || "application/json"
  };

  let url = layer
    .getSource()
    .getGetFeatureInfoUrl(coordinate, resolution, referenceSystem, params);
  return fetch(url, fetchConfig);
}

function parseAsJson() {}

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
    var featurePromises = [];
    responses.forEach(response => {
      console.log(response.requestResponse.headers.get("Content-Type"));
      switch (response.requestResponse.headers.get("Content-Type")) {
        case "application/json;charset=UTF-8":
          {
            console.log("??");
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
                    parsed.forEach(f => {
                      f.layer = response.layer;
                    });
                    return parsed;
                  }
                })
                .catch(err => {
                  console.error(
                    "GetFeatureInfo couldn't retrieve correct data for the clicked object. "
                  );
                  console.error(err);
                })
            );
          }
          break;
        case "text/xml": {
          featurePromises.push(
            response.requestResponse.text().then(text => {
              let gml = new GML2();
              new DOMParser().parseFromString(text, "text/xml");
              let parsed = gml.readFeatures(text);
              parsed.forEach(f => {
                f.layer = response.layer;
              });
              return parsed;
            })
          );
          break;
        }
        default:
          break;
      }
    });

    Promise.all(featurePromises).then(features => {
      console.log(features, "features");
      const features2 = [].concat(...features);

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

      //console.log(jsonPromisesData, "json");
      //var features = [];
      /*
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
      );*/
      /*
      jsonPromisesData.forEach(jsonPromiseData => {
        if (
          jsonPromiseData !== undefined &&
          jsonPromiseData.jsonData &&
          jsonPromiseData.jsonData.features &&
          jsonPromiseData.jsonData.features.length > 0
        ) {
          let parsed = new GeoJSON().readFeatures(jsonPromiseData.jsonData);
          parsed.forEach(f => {
            f.layer = jsonPromiseData.layer;
          });
          features = [...features, ...parsed];
        }
      });*/
      document.querySelector("body").style.cursor = "initial";
      callback({
        features: features2,
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
