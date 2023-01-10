import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { HubConnectionBuilder } from "@microsoft/signalr";

import { generateRandomString } from "../utils";
import SearchModel from "models/SearchModel";
import { INTEGRATION_IDS } from "../constants";

// A simple class containing functionality that is used in the VisionIntegration-plugin.
class VisionIntegrationModel {
  #app;
  #map;
  #options;
  #localObserver;
  #hubConnection;
  #searchSources;
  #orSeparator;
  #searchOptions;
  #searchModel;
  #mapViewModel;

  // There will probably not be many settings for this model... Options are required though!
  constructor(settings) {
    // Let's destruct some required properties...
    const { localObserver, options, searchSources, map, app } = settings;
    // ...and make sure they are passed.
    if (this.#requiredParametersMissing(settings)) {
      throw new Error(
        `Could not initiate VisionIntegration-model. Required parameters missing...`
      );
    }
    // Then we'll initiate some private fields...
    this.#app = app;
    this.#map = map;
    this.#options = options; // We're probably gonna need the options...
    this.#localObserver = localObserver; // ...and the observer
    this.#hubConnection = this.#createHubConnection(); // Create the hub-connection
    this.#searchSources = searchSources;
    this.#searchModel = new SearchModel(
      { sources: this.#searchSources },
      map,
      app
    ); // Initiate a search-model with the provided sources
    this.#mapViewModel = settings.mapViewModel;
    this.#orSeparator = "?"; // We're gonna be using an or-separator when searching, let's use "?"
    this.#searchOptions = this.#getDefaultSearchOptions(); // Create the default search-options
    this.#hubConnection !== null && this.#initiateHub(); // Initiate the hub and its listeners.
    this.#localObserver && this.#initiateObserverListeners(); // Initiate observer-listeners.
  }

  // Creates a connection to supplied hub-url. (Hub meaning a signalR-communication-hub).
  #createHubConnection = () => {
    try {
      // Let's get the url tht we're supposed to connect to from the options...
      const { hubUrl } = this.#options;
      // Then we'll make sure we're dealing with a string...
      if (!this.#isValidString(hubUrl)) {
        throw new Error(
          `Failed to create hub-connection. Parameter 'hubUrl' missing.`
        );
      }
      // The url in the options does not include the current user (a test or a "real" user
      // is required when connecting to the hub). Let's try to get the override-user or the logged on user:
      const user = this.#getHubUser();
      // Then we have to make sure we found a valid user
      if (!this.#isValidString(user)) {
        throw new Error(
          `Failed to create hub-connection. No user defined to create connection. Is the AD properly configured?`
        );
      }
      // If we did find a user, we can create a hub-url with the user appended...
      const urlWithUser = hubUrl.includes("?")
        ? `${hubUrl}&user=${user}`
        : `${hubUrl}?user=${user}`;
      // ... If we are, we can try to create the connection
      return new HubConnectionBuilder().withUrl(urlWithUser).build();
    } catch (error) {
      // If we fail for some reason, we'll log an error and return null
      console.error(`Failed to create hub-connection. ${error}`);
      // Ugh... But we have to make sure all listeners are ready before we publish the failure...
      setTimeout(() => {
        this.#localObserver.publish("hub-initiation-failed");
      }, 200);
      return null;
    }
  };

  // Returns either the user-override from config, or the currently logged on user
  #getHubUser = () => {
    // If we have a valid string set in the user-override, we return that
    if (this.#isValidString(this.#options.userOverride)) {
      return this.#options.userOverride;
    }
    // Otherwise we return the currently logged in user
    return this.#app.config.userDetails?.sAMAccountName || null;
  };

  // Returns the default search-options
  #getDefaultSearchOptions = () => {
    return {
      ...this.#searchModel.getSearchOptions(),
      orSeparator: this.#orSeparator,
      initiator: "VisionIntegration",
    };
  };

  // Initiates all the hub and its listeners (handlers that can catch events sent from Vision).
  #initiateHub = () => {
    // First we'll connect all the listeners...
    this.#initiateHubListeners();
    // Then we'll try to start the connection
    this.#hubConnection
      .start()
      .then(() => this.#localObserver.publish("hub-initiation-success"))
      .catch((error) => {
        this.#hubConnection = null;
        this.#localObserver.publish("hub-initiation-failed");
        console.error(`Failed to initiate hub-connection. ${error}`);
      });
  };

  // Connects all events that we're interested in to the hub-connection.
  #initiateHubListeners = () => {
    // We're gonna need a listener for the close-event. (The connection might close if the hub
    // shuts down etc).
    this.#hubConnection.onclose(() => {
      this.#hubConnection = null;
      this.#localObserver.publish("hub-disconnected");
    });
    // The first implementation specific event that we're interested in is an event where
    // Vision is asking for information regarding all currently selected real-estates.
    this.#hubConnection.on(
      "HandleAskingForRealEstateIdentifiers",
      this.#handleVisionAskingForRealEstateIdentifiers
    );
    // We're also interested in an event where Vision is asking for the currently selected coordinate(s)
    this.#hubConnection.on(
      "HandleAskingForCoordinates",
      this.#handleVisionAskingForCoordinates
    );
    // Vision can also ask us to show the geometries connected to the supplied real-estate-information...
    this.#hubConnection.on(
      "HandleRealEstateIdentifiers",
      this.#handleVisionAskingToShowRealEstates
    );
    // ... or ask us to show the location of coordinates...
    this.#hubConnection.on(
      "HandleCoordinates",
      this.#handleVisionAskingToShowCoordinates
    );
  };

  // Initiates all listeners on the local-observer. Used for communication within the plugin.
  #initiateObserverListeners = () => {
    this.#localObserver.on(
      "mapView-estate-map-click-result",
      this.#handleEstateMapClickResults
    );
  };

  // Handles when the map-view-model has gotten som features from a map-click. Here we're supposed
  // to find the features connected to the estate-layer, and update the view with those.
  #handleEstateMapClickResults = (features) => {
    const estateFeatures = features.filter(
      (feature) => feature.layer.get("name") === this.#getEstateWmsId()
    );
    // We're gonna need the estate-source so that we can construct a valid title for the estates
    const estateSearchSource = this.getEstateSearchSource();
    // Then we'll construct and add the title to every estate feature...
    estateFeatures.forEach((feature) => {
      this.#setFeatureTitle(feature, estateSearchSource.displayFields);
    });
    // And finally we'll publish an event so that the view can be updated...
    this.#localObserver.publish("add-estates-to-selection", estateFeatures);
  };

  // Handles when Vision is asking for information regarding all currently selected real-estates.
  #handleVisionAskingForRealEstateIdentifiers = () => {
    try {
      // First we'll get all the currently selected estates. (The selected estates are drawn in the
      // map so let's get them from there...)
      const selectedEstates = this.#mapViewModel.getDrawnEstates();
      // Then we'll initiate an array that we can send. (Vision expects an array with estate-information-objects
      // in a specific form, see below):
      // DTO: [ {fnr: <string>, name: <string>, uuid: <string>, municipality: <string>} ]
      const informationToSend = [];
      selectedEstates.forEach((estate) => {
        informationToSend.push(this.#createEstateSendObject(estate));
      });
      // Finally, we'll invoke a method on the hub, sending the estate-information to Vision
      this.#hubConnection.invoke(
        "SendRealEstateIdentifiers",
        informationToSend
      );
    } catch (error) {
      console.error(`Could not send estates to Vision. ${error}`);
    }
  };

  // Handles when Vision is asking for information regarding all currently selected coordinates.
  #handleVisionAskingForCoordinates = () => {
    try {
      // First we'll get all the currently selected coordinates. (The selected coordinates are drawn in the
      // map so let's get them from there...)
      const selectedCoordinates = this.#mapViewModel.getDrawnCoordinates();
      // Then we'll initiate an array that we can send. (Vision expects an array with coordinate-information-objects
      // in a specific form, see below):
      // DTO: [ {northing: <string>, easting: <string>, spatialReferenceSystemIdentifier: <string>, label: <string>} ]
      const informationToSend = [];
      selectedCoordinates.forEach((coordinate) => {
        informationToSend.push(this.#createCoordinateSendObject(coordinate));
      });
      // Finally, we'll invoke a method on the hub, sending the coordinate-information to Vision
      this.#hubConnection.invoke("SendCoordinates", informationToSend);
    } catch (error) {
      console.error(`Could not send coordinates to Vision. ${error}`);
    }
  };

  // Handles when Vision is asking the map to show the geometries connected to
  // the supplied real-estate-information.
  #handleVisionAskingToShowRealEstates = async (payload) => {
    // First we'll have to make sure we were supplied an array (we're expecting the payload
    // to consist of an array with real-estate-information).
    if (!Array.isArray(payload)) {
      console.error(
        `HandleRealEstateIdentifiers was invoked with incorrect parameters. Expecting an array with estate-information but got ${typeof payload}`
      );
      return null;
    }
    // We'll also have to check that we have an estate-search-source to search for the estates in
    const estateSearchSource = this.getEstateSearchSource();
    if (!estateSearchSource) {
      console.error(
        `HandleRealEstateIdentifiers was invoked but could not be handled. No estate-search-source is configured.`
      );
      return null;
    }
    // We'll also have to get the settings for this part of the integration...
    const estateIntegrationSettings = this.#getEstateIntegrationSettings();
    // ...so that we can get the search-key...
    const searchKey = estateIntegrationSettings?.searchKey || "uuid";
    // If we we're supplied an array, we can try to construct an "or-separator"-separated search-string
    // (Vision might be trying to show several estates, in that case we'll get the estate-key for each
    // estate-object and construct a "or-separator"-separated string with these. The search-model will make sure
    // to create an OR-filter for each key in the "or-separator"-separated string).
    const searchString = payload
      .map((estate) => estate[searchKey] || "")
      .join(this.#orSeparator);
    // When the string is constructed, we can conduct a search
    const searchResult = await this.#searchModel.getResults(
      searchString,
      [estateSearchSource],
      this.#searchOptions
    );
    // When the search is done, we'll get two objects:
    // 1: The feature-collections (one for each source)
    // 2: The potential errors (one for each source)
    // Since we know we're dealing with one source here, we can just grab the [0]th
    const { featureCollections, errors } = searchResult;
    // If we got an error, or if the results are missing, we have to prompt the user in some way...
    if (errors[0] || !featureCollections[0]) {
      this.#localObserver.publish("estate-search-failed");
      return null;
    }
    // If we didn't, we can grab the first featureCollection, which will include our results
    const estateCollection = featureCollections[0];
    // Then we can grab the resulting features
    const estateFeatures = estateCollection.value.features || [];
    // We're gonna want to show a feature title in several places. Let's put the title
    // directly on the feature so we don't have to construct it several times.
    estateFeatures.forEach((estate) => {
      this.#setFeatureTitle(estate, estateSearchSource.displayFields);
    });
    // Finnally we'll publish an event with the features that were found
    this.#localObserver.publish("estate-search-completed", estateFeatures);
  };

  // Handles when Vision is asking the map to show the location connected to the supplied coordinate-information.
  #handleVisionAskingToShowCoordinates = (payload) => {
    // First we'll have to make sure we were supplied an array (we're expecting the payload
    // to consist of an array with coordinate-information).
    if (!Array.isArray(payload)) {
      console.error(
        `HandleVisionAskingToShowCoordinates was invoked with incorrect parameters. Expecting an array with coordinate-information but got ${typeof payload}`
      );
      return null;
    }
    // Otherwise, we'll initiate an array where we're gonna store coordinate features
    const coordinateFeatures = [];
    // Then we'll create an OL-feature for each coordinate-information-object and append it to the array
    payload.forEach((coordinateInfo) => {
      // The coordinates sent from vision are sent with northing on the X-axis and easting on the Y-axis...
      const { northing, easting, label } = coordinateInfo;
      coordinateFeatures.push(
        new Feature({
          geometry: new Point([northing, easting]),
          VISION_TYPE: "COORDINATES",
          VISION_LABEL: label || "",
          FEATURE_TITLE: `Nord: ${parseInt(easting)}, Öst: ${parseInt(
            northing
          )}`,
        })
      );
    });
    // Then we have to set random id's on each feature (since OL doesn't...)
    coordinateFeatures.forEach((f) => {
      f.setId(generateRandomString());
    });
    // Finally, we'll publish a message with the array of coordinate-features
    this.#localObserver.publish(
      "coordinates-received-from-vision",
      coordinateFeatures
    );
  };

  // Accepts a feature and returns an object with the required keys to match Visions API description.
  #createEstateSendObject = (estateFeature) => {
    // First we'll get the estate-integration-settings that we can use to check where we're supposed
    // to get the information to send from.
    const estateIntegrationSettings = this.#getEstateIntegrationSettings();
    // Then we'll grab the "valuesToSend" property from the settings.
    const { fieldsToSend } = estateIntegrationSettings;
    // Then we'll make sure the property is valid. (We're expecting the fieldsToSend-property
    // to be an array of objects containing which key to send information on, and where to get that value
    // from on the feature).
    if (!Array.isArray(fieldsToSend)) {
      throw new Error(
        "Estate-integration-settings not valid. Could not create estate-information to send"
      );
    }
    // If it is valid, we can create the object...
    const sendObject = {};
    // And then add all the properties...
    fieldsToSend.forEach((field) => {
      sendObject[field.key] =
        field.overrideValue || estateFeature.get(field.featureProperty);
    });
    // Finally we'll return the object!
    return sendObject;
  };

  // Accepts a feature and returns an object with the required keys to match Visions API description.
  #createCoordinateSendObject = (coordinateFeature) => {
    // First we'll get the feature geometry (so that we can get it's coordinates)
    const geometry = coordinateFeature.getGeometry();
    // Then we'll grab the projection-code. (Vision expects EPSG: to be removed for some reason...)
    // Example: If we're working with EPSG:3007, Vision expects 3007 (integer) only.
    // Let's grab the code to begin with
    const projectionCode = this.#map.getView().getProjection().getCode() || "";
    // Then we'll remove the EPSG-part...
    const cleanedProjectionCode =
      projectionCode.split(":").length > 1
        ? projectionCode.split(":")[1]
        : projectionCode.split(":")[0];
    // Then we'll create the object
    return {
      northing: geometry.getCoordinates()[0],
      easting: geometry.getCoordinates()[1],
      spatialReferenceSystemIdentifier: parseInt(cleanedProjectionCode),
      label: coordinateFeature.get("VISION_LABEL") || "",
    };
  };

  // Returns the WFS-source (config, not a "real" source) stated to be the
  // real-estate-source.
  getEstateSearchSource = () => {
    // First we'll get the estate-source-id
    const estateSourceId = this.#getEstateSearchSourceId();
    // If no id could be found, we cannot search for the source either...
    if (!estateSourceId) {
      console.error(
        "Could not fetch estate-source. Estate-source-ID is missing!"
      );
      return null;
    }
    // If we have an id, we can return the source connected to the id
    return (
      this.#searchSources.find((source) => source.id === estateSourceId) || null
    );
  };

  getEstateWmsLayer = () => {
    // First we'll get the estate-source-id
    const estateWmsId = this.#getEstateWmsId();
    // If no id could be found, we cannot search for the source either...
    if (!estateWmsId) {
      console.error(
        "Could not fetch estate-layer. Estate-layer-ID is missing!"
      );
      return null;
    }
    // If we have an id, we can return the layer connected to the id
    return (
      this.#map
        .getAllLayers()
        .find((layer) => layer.get("name") === estateWmsId) || null
    );
  };

  // Returns the WFS-source (config, not a "real" source) stated to be the coordinate-source.
  getCoordinateSearchSource = () => {
    return null;
  };

  // Sets a "FEATURE_TITLE"-attribute on the supplied feature. The title is
  // built by using the values of the display-fields.
  #setFeatureTitle = (feature, displayFields) => {
    // First we'll construct the title
    const title = displayFields.reduce((title, displayField) => {
      return title === ""
        ? (title = feature.get(displayField))
        : (title += ` | ${feature.get(displayField)}`);
    }, "");
    // Then we'll set the attribute on the supplied feature.
    feature.set("FEATURE_TITLE", title);
  };

  // Returns the id of the WFS-source that is connected to the estate-part of the integration.
  #getEstateSearchSourceId = () => {
    // First we'll get all the estate-settings
    const estateSettings = this.#getEstateIntegrationSettings();
    // Then we'll get the wfs-id
    const { wfsId } = estateSettings;
    // We'll check if the wfsId is defined so that we can log an error if its not
    if (!this.#isValidString(wfsId)) {
      console.error(
        `Error fetching estate WFS-source. Expected "wfsId" to be a string but got ${typeof wfsId}`
      );
      return null;
    }
    // If we've made it this far, we'll return the wfsId
    return estateSettings.wfsId || null;
  };

  // Returns the id of the WMS-layer that is connected to the estate-part of the integration.
  #getEstateWmsId = () => {
    // First we'll get all the estate-settings
    const estateSettings = this.#getEstateIntegrationSettings();
    // Then we'll get the wfs-id
    const { wmsId } = estateSettings;
    // We'll check if the wfsId is defined so that we can log an error if its not
    if (!this.#isValidString(wmsId)) {
      console.error(
        `Error fetching estate WMS-layer. Expected "wmsId" to be a string but got ${typeof wmsId}`
      );
      return null;
    }
    // If we've made it this far, we'll return the wfsId
    return estateSettings.wmsId || null;
  };

  // Returns the estate-integration-settings
  #getEstateIntegrationSettings = () => {
    // First we'll get all the integration-settings
    const { integrationSettings } = this.#options;
    // We also have to make sure the settings is an array...
    if (!Array.isArray(integrationSettings)) {
      console.error(
        `The plugin is missing proper integration-settings. Expected an array but got ${typeof integrationSettings}`
      );
      return null;
    }
    // If the settings is an array, we can try to find the estate-settings by using the ID.
    const estateSettings = integrationSettings.find(
      (setting) => setting.id === INTEGRATION_IDS.ESTATES
    );
    // If no settings were found, we'll return null...
    if (!estateSettings || typeof estateSettings !== "object") {
      console.error("Estate-settings missing from configuration.");
      return null;
    }
    // If we've made it this far, we can return the settings...
    return estateSettings;
  };

  // Returns wether any of the required parameters for the model is missing or not.
  #requiredParametersMissing = (parameters) => {
    const { localObserver, options, searchSources, app, map, mapViewModel } =
      parameters;
    return (
      !localObserver ||
      !options ||
      !Array.isArray(searchSources) ||
      !app ||
      !map ||
      !mapViewModel
    );
  };

  // Returns wether the supplied property is a valid string or not
  #isValidString = (url) => {
    return typeof url === "string" && url.length > 0;
  };

  // Makes sure that the supplied options contains all required settings.
  configurationIsValid = () => {
    // Let's destruct all options we want to check...
    const { hubUrl } = this.#options;
    // Make sure that the supplied hub-url (url to the communication hub between Vision and Hajk is a valid string).
    if (!this.#isValidString(hubUrl)) {
      return false;
    }
    // If we've made it this far, we're all good!
    return true;
  };

  // Returns wether the communication-hub is connected or not...
  getHubConnected = () => {
    return this.#hubConnection !== null;
  };
}

export default VisionIntegrationModel;
