import { hfetch } from "utils/FetchWrapper";

import GeoJSON from "ol/format/GeoJSON";
import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon } from "ol/style";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

export default class MapClickModel {
  constructor(map, globalObserver) {
    this.map = map;
    this.globalObserver = globalObserver;

    // Setup the parsers once and for all
    this.geoJsonParser = new GeoJSON();
    this.wmsGetFeatureInfoParser = new WMSGetFeatureInfo();

    // Prepare a source and layer so that we can put
    // a marker in map when user clicks a coordinate
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      name: "MapClickModel", // #883, should we call the layers the same as models that create them?
      type: "system", // #883: "system" for the core system layers, to differentiate from "normal" WMS/Vector/etc layers?
      zIndex: "1000", // We want this to stay on top of other layers
    });
    this.map.addLayer(this.vector);

    // Register a listener for removing the clicked marker
    this.globalObserver.subscribe("mapClick.removeMarker", this.#removeMarker);
  }

  /**
   * @summary Public method that handles the map click event and calls
   * the callback with the resulting features.
   *
   * @param {function} callback Function to be called when the response is ready
   * @memberof MapClickModel
   */
  async bindMapClick(callback) {
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
  #getLayerNameFromFeatureAndLayer = (feature, layer) => {
    return Object.keys(layer.layersInfo).find((id) => {
      const fid = feature.getId().split(".")[0];
      const layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
      return fid === layerId;
    });
  };
  /**
   * @summary Get the name of a layer by taking a look at the first part of a feature's name.
   *
   * @param {Feature} feature
   * @return {string} layerName
   */
  #getLayerNameFromVectorFeature = (feature) => {
    return feature.getId().split(".")[0];
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

      // …prepare the Array that will hold our feature collections…
      const getFeatureInfoResults = [];

      // …and loop through the responses.
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

          // Next, loop through the features (if we managed to parse any).
          for (const feature of olFeatures) {
            // First we need the sublayer's name in order to grab
            // the relevant caption, infobox definition, etc.
            // The only way to get it now is by looking into
            // the feature id, because it includes the layer's
            // name as a part of the id itself.
            const layerName = this.#getLayerNameFromFeatureAndLayer(
              feature,
              response.value.layer
            );

            // Having just the layer's name as an ID is not safe - multiple
            // WFS's may use the same name for two totally different layers.
            // So we need something more. Luckily, we can use the UID property
            // of our OL layer.
            const layerId =
              layerName +
              (response.value.layer?.ol_uid &&
                "." + response.value.layer?.ol_uid);

            // Get caption for this dataset
            const displayName =
              response.value.layer?.layersInfo?.[layerName]?.caption ||
              response.value.layer?.get("caption") ||
              "Unnamed dataset";

            // Get infoclick definition for this dataset
            const infoclickDefinition =
              response.value.layer?.layersInfo?.[layerName]?.infobox || "";

            // Prepare the infoclick icon string
            const infoclickIcon =
              response.value.layer?.layersInfo?.[layerName]?.infoclickIcon ||
              "";

            // Prepare displayFields, shortDisplayFields and secondaryLabelFields.
            // We need them to determine what should be displayed
            // in the features list view.
            const displayFields =
              response.value.layer?.layersInfo?.[layerName]?.searchDisplayName
                ?.split(",")
                .map((df) => df.trim()) || [];
            const shortDisplayFields =
              response.value.layer?.layersInfo?.[
                layerName
              ]?.searchShortDisplayName
                ?.split(",")
                .map((df) => df.trim()) || [];
            const secondaryLabelFields =
              response.value.layer?.layersInfo?.[
                layerName
              ]?.secondaryLabelFields
                ?.split(",")
                .map((df) => df.trim()) || [];

            // Before we create the feature collection, ensure that
            // it doesn't exist already.
            const existingLayer = getFeatureInfoResults.find(
              (f) => f.layerId === layerId
            );

            // If it exists…
            if (existingLayer) {
              // …push the current feature…
              existingLayer.features.push(feature);
              // …and increase the count.
              existingLayer.numHits++;
            } else {
              // If this is the first feature from this layer…
              // …prepare the return object…
              const r = {
                layerId: layerId,
                type: "GetFeatureInfoResults",
                features: [feature],
                numHits: 1,
                displayName,
                infoclickDefinition,
                infoclickIcon,
                displayFields,
                shortDisplayFields,
                secondaryLabelFields,
              };
              // …and push onto the array.
              getFeatureInfoResults.push(r);
            }
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

      // When we're out of the loop, and if we've got any
      // feature collections pushed…
      if (getFeatureInfoResults.length > 0) {
        // …let's spread them onto our features array.
        features.push(...getFeatureInfoResults);
      }

      // In addition to WMS GetFeatureInfo, we must also query any local
      // layers, as we might get results from there too. We can expect
      // features from e.g. a vector layer or search results layer, that
      // do have their own OL Features in map already.

      // Prepare the Arrays
      const searchResultFeatures = [];
      const queryableLayerResults = [];

      // Grab all features at clicked pixel, with 10px tolerance
      this.map.forEachFeatureAtPixel(
        e.pixel,
        (feature, layer) => {
          if (layer?.get("type") === "searchResultLayer") {
            // Super-special case here: we don't follow the new
            // interface for a return object (see the "r" constant above),
            // because we want to conform to the old, working search results
            // code, which expects search results on the following form:
            feature.layer = layer;
            searchResultFeatures.push(feature);
          } else if (layer?.get("queryable") === true) {
            // If we have any features from vector (WFS) layers, we want
            // to return them in a way that is similar to how the GetFeatureInfo
            // features are treated. This will make it easy in the Component,
            // so we prepare an object that is similar to the "r" constant above.

            // Keep in mind that at this point we loop through _features_, not
            // layers. But we want to group features from the same layer together.
            // So the first step is to get a unique ID for the layer that the
            // current feature belongs to. We create it by combining the layer's name…
            const layerName = this.#getLayerNameFromVectorFeature(
              feature,
              layer
            );

            // …with the OL layer's UID property.
            const layerUid = layer?.ol_uid;
            const layerId =
              layerName + (layerUid !== undefined && "." + layerUid);

            // Next, check if we already have this layer in our collection…
            const existingLayer = queryableLayerResults.find(
              (c) => c.layerId === layerId
            );

            // …if yes…
            if (existingLayer) {
              // …just push the new feature to existing Array…
              existingLayer.features.push(feature);
              // …and increase the count.
              existingLayer.numHits++;
            } else {
              // Else, create the return object…
              const r = {
                layerId: layerId, // Unique layer id, used above
                type: "QueryableLayerResults",
                features: [feature], // Create a new Array, add the current feature
                numHits: 1, // Duh…
                displayName:
                  layer.get("layerInfo")?.caption ||
                  layer.get("caption") ||
                  "Unnamed vector layer",
                infoclickDefinition:
                  layer.get("layerInfo")?.information ||
                  layer.get("information") ||
                  "",
                infoclickIcon:
                  layer.get("layerInfo")?.infoclickIcon ||
                  layer.get("infoclickIcon") ||
                  "",
                displayFields:
                  layer
                    .get("layerInfo")
                    ?.displayFields?.split(",")
                    .map((df) => df.trim()) || [],
                shortDisplayFields:
                  layer
                    .get("layerInfo")
                    ?.shortDisplayFields?.split(",")
                    .map((df) => df.trim()) || [],
                secondaryLabelFields:
                  layer
                    .get("layerInfo")
                    ?.secondaryLabelFields?.split(",")
                    .map((df) => df.trim()) || [],
              };
              // …and push to the layers collection.
              queryableLayerResults.push(r);
            }
          }
        },
        {
          hitTolerance: 10,
        }
      );

      // If the operation above resulted in features that should
      // be treated by the search component, let's push them to
      // the array that will be returned.
      if (searchResultFeatures.length > 0) {
        features.push({
          type: "SearchResults",
          features: searchResultFeatures,
        });
      }

      // If the operation above resulted in any features from
      // vector layers, let's _spread_ them onto the features
      // array.
      if (queryableLayerResults.length > 0) {
        features.push(...queryableLayerResults);
      }

      // Reset the UI
      document.querySelector("body").style.cursor = "initial";

      // Decorate the features within collections with things like
      // primary label. We can do it here, once and for all, which
      // will make life easier down the road (e.g. sorting, where
      // a generated label will come in handy).
      const decoratedFeatureCollections =
        this.#decorateFeaturesInCollections(features);

      // Invoke the callback, supply the results.
      callback(decoratedFeatureCollections);

      // If we've got any results, let's highlight the clicked
      // pixel by placing a marker in that coordinate.
      decoratedFeatureCollections.length > 0
        ? this.#addMarker(this.map.getCoordinateFromPixel(e.pixel))
        : this.#removeMarker();
    } catch (error) {
      console.error("Oops: ", error);
      document.querySelector("body").style.cursor = "initial";
    }
  }

  /**
   * @summary Removes any previous markers and adds a new one to the given coordinates.
   * @memberof CoordinatesModel
   */
  #addMarker = (coordinates) => {
    // Prepare the feature
    const feature = new Feature({
      geometry: new Point(coordinates),
    });

    // Style it with a nice icon
    const styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 0.15,
        src: "marker.png",
      }),
    });
    feature.setStyle(styleMarker);

    // Remove any previous markers
    this.#removeMarker();

    // Add the new marker
    this.source.addFeature(feature);
  };

  #removeMarker = () => {
    this.vector.getSource().clear();
  };

  #decorateFeaturesInCollections(featureCollections) {
    /**
     * @summary Try to prepare a nice label for the list view.
     * @description Admin UI can set the displayFields property. If it exists, we want to grab
     * the specified properties' values for the given feature. If our attempt results in an
     * empty string, we try with a fallback.
     *
     * @param {Feature} feature
     * @return {string} Label describing the feature
     */
    const prepareLabelFromFields = (feature, fields, defaultValue) => {
      return (
        fields
          .map((df) => {
            return feature.get(df);
          })
          .filter((i) => i) // Get rid of all falsy values like undefined or ""
          .join(", ") || // Join values from specified display fields…
        (defaultValue ?? "[unknown value]") // or use the provided default (?? allows for empty string!), or just use hard-coded default.
      );
    };

    // Basic compare function used for alphabetic sorting of features using the primaryLabel property
    const basicLocaleCompare = (a, b) =>
      a.primaryLabel.localeCompare(b.primaryLabel);

    // Loop through all collections
    for (const collection of featureCollections) {
      // No need to decorate the search results collection
      if (collection.type !== "SearchResults") {
        const { displayFields, secondaryLabelFields } = collection;

        // Add the primary label to all features in collection
        collection.features = collection.features.map((f) => {
          // Generate a primary label using provided display fields from collection
          // and save the value as a property on current feature.
          f.primaryLabel = prepareLabelFromFields(f, displayFields, f.getId());
          f.secondaryLabel = prepareLabelFromFields(
            f,
            secondaryLabelFields,
            ""
          );
          return f;
        });

        // Sort features in collection
        collection.features = collection.features.sort(basicLocaleCompare);
      }
    }

    return featureCollections;
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
