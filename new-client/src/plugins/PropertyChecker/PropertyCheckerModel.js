import {
  parseGMLFeatures,
  parseGeoJsonFeatures,
  experimentalParseEsriWmsRawXml,
  parseWmsGetFeatureInfoXml,
} from "utils/wmsFeatureParsers";

export default class PropertyCheckerModel {
  #app;
  #attributeNameToGroupBy;
  #checkLayer;
  #checkLayerId;
  #drawModel;
  #localObserver;
  #map;
  #viewResolution;
  #viewProjection;

  constructor(settings) {
    // Set some private fields
    this.#app = settings.app;
    this.#attributeNameToGroupBy = settings.attributeNameToGroupBy;
    this.#checkLayerId = settings.checkLayerId;
    this.#drawModel = settings.drawModel;
    this.#localObserver = settings.localObserver;
    this.#map = settings.map;
    this.#viewResolution = this.#map.getView().getResolution();
    this.#viewProjection = this.#map.getView().getProjection();

    this.#initSubscriptions(); // Initiate listeners on observer(s)

    // Finding the correct layer in our OL Map is an expensive operation. Let's do it once.
    this.#checkLayer = this.#getCheckLayer();
  }

  #getCheckLayer = () => {
    try {
      const l = this.#map
        .getAllLayers()
        .find((l) => l.get("name") === this.#checkLayerId);
      if (l === undefined) {
        throw new Error(
          `PropertyChecker error: Couldn't find layer with ID ${
            this.#checkLayerId
          }. Please contact system administrator.`
        );
      }
      return l;
    } catch (error) {
      console.error(error.message);
    }
  };

  #getOLFeaturesForCoords = async (coords) => {
    // Ensure we have a layer setup so we can create the URL
    if (!this.#checkLayer) {
      console.warn("Creating check layer again");
      this.#checkLayer = this.#getCheckLayer();
    }

    const url = this.#checkLayer
      .getSource()
      .getFeatureInfoUrl(coords, this.#viewResolution, this.#viewProjection, {
        INFO_FORMAT: "application/json",
        FEATURE_COUNT: 100, // Without this, only first feature is returned
      });

    const response = await fetch(url);

    // If the response succeeded…
    if (response.status === 200) {
      // …try to read the Content-Type header. We need it for parsing.
      const responseContentType = response.headers
        .get("content-type")
        ?.split(";")[0];

      // Prepare an object to hold the features to be parsed.
      let olFeatures = [];

      // Depending on the response type, parse accordingly
      switch (responseContentType) {
        case "application/geojson":
        case "application/json": {
          olFeatures = parseGeoJsonFeatures(await response.json());
          break;
        }
        case "text/xml": {
          olFeatures = parseWmsGetFeatureInfoXml(await response.text());
          break;
        }
        case "application/vnd.ogc.gml": {
          olFeatures = parseGMLFeatures(await response.text());
          break;
        }
        case "application/vnd.esri.wms_raw_xml": {
          olFeatures = experimentalParseEsriWmsRawXml(await response.text());
          break;
        }
        default:
          console.warn(
            "Unsupported response type for GetFeatureInfo request:",
            responseContentType
          );
          break;
      }
      return olFeatures;
    } else {
      // I'm adding this for pure readability. We don't want to throw any errors
      // here, even if one of the Promises was rejected. The reason is that throwing
      // an error here would abort the flow (by taking us straight to the catch() below).
      // In that case, we'd miss any successfully parsed responses, and we don't want that.
      // So we just go on, silently.
      console.error("Couldn't parse GetFeatureInfo.", response.reason);
    }
  };

  // Sets up listeners on observers
  #initSubscriptions = () => {
    this.#localObserver.subscribe(
      "drawModel.featureAdded",
      this.#handleFeatureAdded
    );
  };

  #groupFeaturesByAttributeName = (features, attributeName) => {
    // Features that arrive from the WMS service will be in a flat
    // array. For our use case, we want to group features that correspond
    // to a specific property. The attribute name that holds the properties
    // will however differ, between setups. So it's a Admin setting.
    //
    // Let's grab the attribute's name and loop through our results, pushing
    // each feature into a new object, one for each property.
    const groupedFeatures = {};
    features.forEach((f) => {
      const identifier = f.get(attributeName);
      // Ensure that we have a category to push into
      if (!Object.hasOwn(groupedFeatures, identifier)) {
        // Prepare an object that will contain to things:
        // - a markerFeature (used to visualize the affected geometry for the user)
        // - an array of actual features from which we'll display properties

        // First let's extract the first feature. We will use it to visualize
        // the affected area in map.
        const markerFeature = f;
        // We must add USER_DRAWN=true to "trick" DrawModel into thinking that
        // this feature was drawn by user and should be removed when we clean up.
        // Without this, drawModel.removeFeatures won't take care of this geometry.
        markerFeature.set("USER_DRAWN", true);

        // Add the marker feature to map, don't send any events from DrawModel
        this.#drawModel.addFeature(markerFeature, { silent: true });

        // Finally, initialize the object for the current identifier, don't add
        // any features to the features array yet (it'll be taken care of next).
        groupedFeatures[identifier] = {
          markerFeature: f,
          features: [],
        };
      }

      // Now when we know that we have a place to push features into, let's do it.
      groupedFeatures[identifier].features.push(f);
    });
    return groupedFeatures;
  };

  #handleFeatureAdded = async (feature) => {
    const coords = feature.getGeometry().getCoordinates();
    const features = await this.#getOLFeaturesForCoords(coords);
    const groupedFeatures = this.#groupFeaturesByAttributeName(
      features,
      this.#attributeNameToGroupBy // the attribute name that we wish to group on
    );
    console.log("groupedFeatures in Model: ", groupedFeatures);
    // If we've got at least one feature in the response
    if (Object.keys(groupedFeatures).length > 0) {
      // Tell the rest of the plugin that we've got feature. The View
      // subscribes to this and will update itself accordingly.
      this.#localObserver.publish("getFeatureInfoFeatures", groupedFeatures);
    } else {
      this.#localObserver.publish("noFeaturesInResult");
    }
  };

  // Example of public method, returns the map instance
  getMap = () => {
    return this.#map;
  };

  // Example of public method, returns the app instance
  getApp = () => {
    return this.#app;
  };
}
