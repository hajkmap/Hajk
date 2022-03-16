import { hfetch } from "utils/FetchWrapper";
import GeoJSON from "ol/format/GeoJSON";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";

import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";

export default class MapClickModel {
  constructor(map) {
    console.log("Creating new MapClickModel");
    this.map = map;

    // Setup the parsers once and for all
    this.geoJsonParser = new GeoJSON();
    this.wmsGetFeatureInfoParser = new WMSGetFeatureInfo();
  }

  /**
   * @summary Public method that handles the map click event and calls
   * the callback with the resulting features.
   *
   * @param {function} callback Function to be called when the response is ready
   * @memberof MapClickModel
   */
  async bindMapClick(callback) {
    console.log("Registering map.onSingleClick");
    this.map.on(
      "singleclick",
      (e) => this.map.clickLock.size === 0 && this.#handleClick(e, callback)
    );
  }
  /**
   * @summary Determine the sublayer's name by looking at the feature's id
   * @description We must know which of the queried sublayers a given feature comes
   * from and the best way to determine that is by looking at the feature ID (FID).
   * It looks like WMS services set the FID using this formula:
   * [<workspaceName>:]<layerName>.<numericFeatureId>
   * where the part inside "[" and "]" is optional (not used by GeoServer nor QGIS,
   * but other WMSes might use it).
   * @param {Feature} feature
   * @param {Layer} layer
   * @return {string} layerName
   */
  #getLayerNameFromFid = (feature, layer) => {
    return Object.keys(layer.layersInfo).find((id) => {
      const fid = feature.getId().split(".")[0];
      const layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
      return fid === layerId;
    });
  };

  /**
   * @summary Try to parse the retrieved features and supply them to the callback function.
   *
   * @param {Event} e
   * @param {function} callback Function to be called when the response is ready
   * @memberof MapClickModel
   */
  async #handleClick(e, callback) {
    document.querySelector("body").style.cursor = "progress";

    try {
      // When all features have settled (either fulfilled or rejected)…
      const responses = await Promise.allSettled(this.#getResponsePromises(e));
      const features = [];

      // …loop through the responses.
      for (const response of responses) {
        // If the response succeeded…
        if (response.status === "fulfilled") {
          // …try to read the Content-Type header. We need it for parsing.
          const responseContentType = response.value.requestResponse.headers
            .get("Content-Type")
            ?.split(";")[0];

          // Prepare an object to hold the features to be parsed.
          let olFeatures = null;

          // Depending on the response type, parse accordingly
          switch (responseContentType) {
            case "application/geojson":
            case "application/json": {
              olFeatures = this.#parseGeoJsonFeatures(
                await response.value.requestResponse.json()
              );
              break;
            }
            case "text/xml":
            case "application/vnd.ogc.gml": {
              // (See comments for GeoJSON parser - this is similar.)
              olFeatures = this.#parseGMLFeatures(
                await response.value.requestResponse.text()
              );
              break;
            }
            default:
              break;
          }

          // If parsing resulted in at least one feature, let's go on.
          if (olFeatures.length > 0) {
            // First we need the sublayer's name in order to grab
            // the relevant caption, infobox definition, etc.
            // The only way to get it now is by looking into
            // the feature id, because it includes the layer's
            // name as a part of the id itself.
            // We can use any returned feature we like, as all
            // come from the same sublayer - so let's grab the
            // first one.
            const layerName = this.#getLayerNameFromFid(
              olFeatures[0],
              response.value.layer
            );

            // Get caption for this dataset
            const displayName =
              response.value.layer?.layersInfo?.[layerName]?.caption ||
              response.value.layer?.get("caption") ||
              "Unnamed dataset";

            // Get infoclick definition for this dataset
            const infoclickDefinition =
              response.value.layer?.layersInfo?.[layerName]?.infobox || "";

            // Prepare the return object
            const r = {
              type: "GetFeatureInfoResult",
              features: olFeatures,
              numHits: olFeatures.length,
              displayName,
              infoclickDefinition,
            };

            // Push this response's features to our common return object
            // that will hold all datasets, if we have any features.
            r.features.length > 0 && features.push(r);
          }
        } else {
          // I'm adding this for pure readability. We don't want to throw any errors
          // here, even if one of the Promises was rejected. The reason is that throwing
          // an error here would abort the flow (by taking us straight to the catch() below).
          // In that case, we'd miss any successfully parsed responses, and we don't want that.
          // So we just go on, silently.
          console.error("Couldn't parse GetFeatureInfo.", response.reason);
        }
      }

      // In addition to WMS GetFeatureInfo, we must also query any local
      // layers, as we might get results from there too. One example is
      // the search layer, that will return its features.
      const searchResultFeatures = [];
      const otherQueryableFeatures = [];
      this.map.forEachFeatureAtPixel(
        e.pixel,
        (feature, layer) => {
          if (layer) {
            if (layer.get("type") === "searchResultLayer") {
              feature.layer = layer;
              searchResultFeatures.push(feature);
            } else if (layer.get("queryable") === true) {
              feature.layer = layer;
              otherQueryableFeatures.push(feature);
            }
          }
        },
        {
          hitTolerance: 10,
        }
      );

      if (searchResultFeatures.length > 0) {
        features.push({
          type: "searchResultsFeatures",
          features: searchResultFeatures,
        });
      }

      if (otherQueryableFeatures.length > 0) {
        features.push({
          type: "otherQueryableFeatures",
          features: otherQueryableFeatures,
        });
      }

      document.querySelector("body").style.cursor = "initial";

      // Invoke the callback, supply the results.
      callback(features);
    } catch (error) {
      console.error("Oops: ", error);
      document.querySelector("body").style.cursor = "initial";
    }
  }

  #getResponsePromises(e) {
    const r = [];
    const viewProjection = this.map.getView().getProjection().getCode();

    this.map
      .getLayers()
      .getArray()
      // Now we have an array with all layers added to our map, let's narrow down a bit
      .filter(
        (layer) =>
          // Only certain layer types are relevant
          (layer instanceof TileLayer ||
            layer instanceof ImageLayer ||
            layer instanceof VectorLayer) && // What about VectorLayer, shouldn't they be queried too?
          // And only if they're currently visible (no reason to query hidden layers)
          layer.get("visible") === true
      )
      // For each layer that's left in the array
      .forEach((layer) => {
        // Query the layer, will return a Promise (Fetch call)
        // or false, if there was no need to fetch.
        const fetchPromise = this.#query(layer, e);
        // If query() didn't return false, we have a real Promise
        if (fetchPromise !== false) {
          r.push(
            fetchPromise.then((response) => {
              // Rather than just returning the response, we want
              // to attach some more information to the returned object
              return {
                layer: layer,
                requestResponse: response,
                viewProjection: viewProjection,
              };
            })
          );
        }
      });
    return r;
  }

  #query(layer, e) {
    const coordinate = e.coordinate;
    const resolution = this.map.getView().getResolution();
    const currentZoom = this.map.getView().getZoom();
    const referenceSystem = this.map.getView().getProjection().getCode();
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
      return hfetch(url); // Return a Promise
    } else {
      return false;
    }
  }

  #parseGeoJsonFeatures(json) {
    return this.geoJsonParser.readFeatures(json);
  }

  #parseGMLFeatures(gml) {
    return this.wmsGetFeatureInfoParser.readFeatures(gml);
  }
}
