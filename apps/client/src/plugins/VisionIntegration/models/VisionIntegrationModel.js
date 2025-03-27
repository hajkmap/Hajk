import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import WKT from "ol/format/WKT";
import { HubConnectionBuilder } from "@microsoft/signalr";

import { generateRandomString } from "../utils";
import SearchModel from "models/SearchModel";
import {
  EDIT_STATUS,
  INTEGRATION_IDS,
  ENVIRONMENT_INFO,
  MAP_INTERACTIONS,
  MAP_INTERACTION_INFO,
} from "../constants";
import { MultiPolygon } from "ol/geom";

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
  #currentEnvironmentTypeId;
  #wktParser;
  #editEnabled;
  #enableLogging;

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
    this.#enableLogging = options.enableLogging ?? false; // If enabled we add some information to the console
    this.#app = app;
    this.#map = map;
    this.#options = options; // We're probably gonna need the options...
    this.#localObserver = localObserver; // ...and the observer
    this.#hubConnection = this.#createHubConnection(); // Create the hub-connection
    this.#wktParser = new WKT();
    this.#editEnabled = false; // A field to keep track of wether the edit-mode is enabled or not.
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
    this.#currentEnvironmentTypeId = settings.initialEnvironmentTypeId; // We're gonna need to keep track of the currently active environment-type...
  }

  // Logs the supplied message to the console if enableLogging is set to true.
  #log = (message) => {
    if (this.#enableLogging) {
      console.info(message);
    }
  };

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
      activeSpatialFilter: "within",
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
    // We're also interested in an event where Vision is asking for the currently selected environment-features(s)
    this.#hubConnection.on(
      "HandleAskingForFeatures",
      this.#handleVisionAskingForFeatures
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
    // Vision can also ask us to show "features" (features are in this case som environment-object)
    this.#hubConnection.on(
      "HandleFeatures",
      this.#handleVisionAskingToShowFeatures
    );
    // Vision can also ask us for a feature geometry (this can mean either that we have to create a new one,
    // but it can also mean that there already exists a geometry for the supplied feature - which we have to modify).
    this.#hubConnection.on(
      "HandleAskingForFeatureGeometry",
      this.#handleVisionAskingForFeatureGeometry
    );
    // When Vision has saved a geometry to the database, it will send some operation feedback. Let's make
    // sure we are listening for it...
    this.#hubConnection.on(
      "HandleOperationFeedback",
      this.#handleVisionSendingOperationFeedback
    );
  };

  // Initiates all listeners on the local-observer. Used for communication within the plugin.
  #initiateObserverListeners = () => {
    this.#localObserver.on(
      "mapView-estate-map-click-result",
      this.#handleEstateMapClickResults
    );
    this.#localObserver.on(
      "mapView-environment-map-click-result",
      this.#handleEnvironmentMapClickResults
    );
    this.#localObserver.on(
      "search-with-feature",
      this.#handleSearchWithFeature
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

  // Handles when the map-view-model has gotten som features from a map-click. Here we're supposed
  // to find the features connected to the currently active environment-layer, and update the view with those.
  #handleEnvironmentMapClickResults = (features) => {
    // We're gonna need the current environment-type settings...
    const environmentSettings = this.getEnvironmentInfoFromId(
      this.#currentEnvironmentTypeId
    );
    // ...so that we can get features belonging to the correct layer.
    const environmentFeatures = features.filter(
      (feature) => feature.layer.get("name") === environmentSettings.wmsId
    );
    // We're gonna need the current environment-source so that we can construct a valid title for the estates
    const environmentSource = this.getSearchSourceFromId(
      environmentSettings.wfsId
    );
    // Then we'll construct and add the title to every estate feature...
    environmentFeatures.forEach((f) => {
      this.#setFeatureTitle(f, environmentSource.displayFields);
    });
    // And finally we'll publish an event so that the view can be updated...
    this.#localObserver.publish("add-environment-features-to-selection", {
      typeId: this.#currentEnvironmentTypeId,
      features: environmentFeatures,
    });
  };

  // Handles when Vision is asking for information regarding all currently selected real-estates.
  #handleVisionAskingForRealEstateIdentifiers = () => {
    try {
      this.#log("HandleAskingForRealEstateIdentifiers caught!");
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        return;
      }
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
      this.#log(
        `Invoking SendRealEstateIdentifiers! Payload: ${JSON.stringify(
          informationToSend
        )}`
      );
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
      this.#log("HandleAskingForCoordinates caught!");
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        return;
      }
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
      this.#log(
        `Invoking SendCoordinates! Payload: ${JSON.stringify(
          informationToSend
        )}`
      );
      // Finally, we'll invoke a method on the hub, sending the coordinate-information to Vision
      this.#hubConnection.invoke("SendCoordinates", informationToSend);
    } catch (error) {
      console.error(`Could not send coordinates to Vision. ${error}`);
    }
  };

  #handleVisionAskingForFeatures = () => {
    try {
      this.#log("HandleAskingForFeatures caught!");
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        this.#log(
          "handleVisionAskingForFeatures fired but editing is enabled... Aborting."
        );
        return;
      }
      // First we'll get all the currently selected features. NOTE: We're only sending the
      // features that are currently showing in the map... There might be hidden features as well,
      // (for example, if areas are currently active, only these features are sent... Not investigations etc.)
      const selectedFeatures = this.#mapViewModel.getDrawnEnvironmentFeatures();
      // Then we'll initiate an array that we can send. (Vision expects an array with feature-information-objects
      // in a specific form, see below):
      // DTO: [ {id: <string>, type: <integer>} ]
      const informationToSend = [];
      selectedFeatures.forEach((f) => {
        informationToSend.push(this.#createFeatureSendObject(f));
      });
      this.#log(
        `Invoking SendFeatures! Payload: ${JSON.stringify(informationToSend)}`
      );
      // Finally, we'll invoke a method on the hub, sending the feature-information to Vision
      this.#hubConnection.invoke("SendFeatures", informationToSend);
    } catch (error) {
      console.error(`Could not send features to Vision. ${error}`);
    }
  };

  // Handles when Vision is asking the map to show the geometries connected to
  // the supplied real-estate-information.
  #handleVisionAskingToShowRealEstates = async (payload) => {
    try {
      this.#log(
        `HandleRealEstateIdentifiers caught! Payload: ${JSON.stringify(
          payload
        )}`
      );
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        return;
      }
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
      // Finally we'll publish an event with the features that were found
      this.#localObserver.publish("estate-search-completed", estateFeatures);
    } catch (error) {
      console.error(`Could not show real estates. ${error}`);
    }
  };

  // Handles when Vision is asking the map to show the location connected to the supplied coordinate-information.
  #handleVisionAskingToShowCoordinates = (payload) => {
    try {
      this.#log(
        `HandleCoordinates caught! Payload: ${JSON.stringify(payload)}`
      );
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        return;
      }
      // First we'll have to make sure we were supplied an array (we're expecting the payload
      // to consist of an array with coordinate-information).
      if (!Array.isArray(payload)) {
        console.error(
          `HandleCoordinates was invoked with incorrect parameters. Expecting an array with coordinate-information but got ${typeof payload}`
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
    } catch (error) {
      console.error(`Could not show coordinates. ${error}`);
    }
  };

  // Handles when Vision is asking the map to show the features connected to the supplied id's.
  #handleVisionAskingToShowFeatures = async (payload) => {
    try {
      this.#log(`HandleFeatures caught! Payload: ${JSON.stringify(payload)}`);
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        this.#log(
          "handleVisionAskingToShowFeatures fired but editing is enabled... Aborting."
        );
        return;
      }
      // First we'll have to make sure we were supplied an array (we're expecting the payload
      // to consist of an array with feature-information).
      if (!Array.isArray(payload)) {
        console.error(
          `HandleFeatures was invoked with incorrect parameters. Expecting an array with feature-information but got ${typeof payload}`
        );
        return null;
      }
      if (
        payload.some((o) => {
          return !o.type || !o.id || o.type !== payload[0].type;
        })
      ) {
        console.error(
          `HandleFeatures was invoked with incorrect parameters. 
          Expecting an array with objects containing 'id' <string> and 'type' <integer>. 
          All objects must have the same type. Got ${JSON.stringify(payload)}`
        );
        return null;
      }
      // Since the payload can only contain information connected to one type, we can get the type from the first entry...
      // (The type is an integer which corresponds to an environment type, see the constants for more info).
      const type = payload[0].type;
      // Since 'features' are really environment-objects, we have to get the environment-settings.
      // We can get the appropriate setting by providing the type (which should correspond to the correct settings).
      const environmentSettings = this.getEnvironmentInfoFromId(type);
      // When we have the settings, we can get the search-source etc. so that we can fetch the features connected to the provided id's.
      const environmentSearchSource = this.getSearchSourceFromId(
        environmentSettings.wfsId
      );
      // We have to make sure we have a proper search-source
      if (!environmentSearchSource) {
        console.error(
          `HandleFeatures was invoked but could not be handled. No search-source is configured.`
        );
        return null;
      }
      // When we've got the search-source, we can go ahead and create the search-string.
      // First, we'll need the search key...
      const searchKey = environmentSettings.searchKey || "id";
      // If we were supplied more than one feature-info, we can try to construct an "or-separator"-separated search-string
      // (Vision might be trying to show several features, in that case we'll get the search-key for each
      // feature-object and construct a "or-separator"-separated string with these. The search-model will make sure
      // to create an OR-filter for each key in the "or-separator"-separated string).
      const searchString = payload
        .map((f) => f[searchKey] || "")
        .join(this.#orSeparator);
      // When the string is constructed, we can conduct a search
      const searchResult = await this.#searchModel.getResults(
        searchString,
        [environmentSearchSource],
        this.#searchOptions
      );
      // When the search is done, we'll get two objects:
      // 1: The feature-collections (one for each source)
      // 2: The potential errors (one for each source)
      // Since we know we're dealing with one source here, we can just grab the [0]th
      const { featureCollections, errors } = searchResult;
      // If we got an error, or if the results are missing, we have to prompt the user in some way...
      if (errors[0] || !featureCollections[0]) {
        // TODO: this.#localObserver.publish("estate-search-failed");
        return null;
      }
      // If we didn't, we can grab the first featureCollection, which will include our results
      const featureCollection = featureCollections[0];
      // Then we can grab the resulting features
      const features = featureCollection.value.features || [];
      // We're gonna want to show a feature title in several places. Let's put the title
      // directly on the feature so we don't have to construct it several times.
      features.forEach((f) => {
        this.#setFeatureTitle(f, environmentSearchSource.displayFields);
      });
      // Finally we'll publish an event with the features that were found
      this.#localObserver.publish("environment-search-completed", {
        features,
        typeId: type,
      });
    } catch (error) {
      console.error(`Could not environment features. ${error}`);
    }
  };

  // Handler for when vision asks for a geometry to be connected to the supplied object.
  // (Vision asks for a geometry, we enable edit-mode, and return a geometry when the user is done drawing).
  #handleVisionAskingForFeatureGeometry = async (payload) => {
    try {
      this.#log(
        `HandleAskingForFeatureGeometry caught! Payload: ${JSON.stringify(
          payload
        )}`
      );
      // If the edit-mode is enabled, we don't want to let the user mess with anything else...
      if (this.#editEnabled) {
        return;
      }
      // If no id and type is supplied, we cannot allow the user to start drawing...
      const { id, type } = payload;
      if (!id || !type) {
        console.error(
          `HandleAskForFeatureGeometry was invoked with bad parameters. 'id' and 'type' is required. Got: ${JSON.stringify(
            payload
          )}`
        );
        return null;
      }
      // If we got OK parameters, we can get the proper search-source to find eventual existing geometries
      // First we'll have to get the settings so we can get the wfs-id etc.
      const environmentSettings = this.getEnvironmentInfoFromId(type);
      // Let's publish an event that will make sure the edit mode is activated...
      // The first status will be "SEARCH_LOADING" since we always want to check if geometries
      // already exists or not...
      this.#localObserver.publish("set-edit-state", {
        mode: EDIT_STATUS.SEARCH_LOADING,
        features: [],
        mapInteraction: MAP_INTERACTIONS.EDIT_NONE,
        text: `Letar efter ${environmentSettings.name.toLowerCase()} med id: ${id}`,
      });
      // Then we can get the search-source...
      const source = this.getSearchSourceFromId(environmentSettings.wfsId);
      // We have to make sure we have a proper search-source
      if (!source) {
        console.error(
          `HandleAskForFeatureGeometry was invoked but could not be handled. No search-source is configured.`
        );
        return null;
      }
      // When we've got the search-source, we can go ahead and conduct the search
      const searchResult = await this.#searchModel.getResults(id, [source]);
      const { featureCollections, errors } = searchResult;
      // If we got an error, or if the results are missing, we have to prompt the user in some way...
      if (errors[0] || !featureCollections[0]) {
        // TODO: this.#localObserver.publish("edit-search-failed");
        return null;
      }
      // If we didn't, we can grab the first featureCollection, which will include our results
      const featureCollection = featureCollections[0];
      // Then we can grab the resulting features
      const features = featureCollection.value.features || [];
      // Let's zoom to the potential features so that the user doesn't miss that they
      // already have some features...
      this.#mapViewModel.zoomToFeatures(features);
      // Let's make sure to set unique ids on the edit-features so that they cannot be mixed up with
      // "regular" features.
      features.forEach((f) => {
        f.setId(generateRandomString());
      });
      // When the search is done, we'll publish an event so that the view can update...
      this.#localObserver.publish("set-edit-state", {
        mode: EDIT_STATUS.ACTIVE,
        features,
        mapInteraction: MAP_INTERACTIONS.EDIT_NONE,
        text: `Du uppdaterar geometrin för ${environmentSettings.name.toLowerCase()} med id: ${id}.`,
      });
    } catch (error) {
      console.error(`Could not enable editing... Error: ${error}`);
    }
  };

  // Handler for when Vision sends feedback regarding the geometry that was recently saved
  #handleVisionSendingOperationFeedback = (payload) => {
    this.#log(
      `HandleOperationFeedback caught! Payload: ${JSON.stringify(payload)}`
    );
    // First we'll make sure to update the view state
    this.#localObserver.publish("set-edit-state", {
      mode: EDIT_STATUS.SAVE_SUCCESS,
      mapInteraction: MAP_INTERACTIONS.EDIT_NONE,
      text: payload?.text || this.#getDefaultFeedbackText(payload),
    });
    // Then we'll make sure to refresh the environment layers to make sure eventual changes can be seen!
    this.#options.integrationSettings.forEach((setting) => {
      // First we'll grab the layer using the id in the settings!
      const layer = this.getLayerFromId(setting.wmsId);
      // Then we'll refresh the layer!
      this.#mapViewModel.refreshWmsLayer(layer);
    });
  };

  // Returns a string that can be prompted to the user when they have tried to save a geometry to Vision
  #getDefaultFeedbackText = (payload) => {
    // The payload from Vision should contain a flag stating if the geometry was saved successfully or not...
    const { success } = payload;
    // Return a string based on the success flag...
    return success
      ? "Geometrin sparades utan problem!"
      : "Vision misslyckades att spara geometrin. Kontakta systemförvaltaren.";
  };

  // Returns the map SRS without EPSG: (Vision expects EPSG: to be removed for some reason...)
  #getMapSrsAsInteger = () => {
    // Example: If we're working with EPSG:3007, Vision expects 3007 (integer) only. Let's grab the code to begin with
    const projectionCode = this.#map.getView().getProjection().getCode() || "";
    // Then we'll remove the EPSG-part...
    const cleanedProjectionCode =
      projectionCode.split(":").length > 1
        ? projectionCode.split(":")[1]
        : projectionCode.split(":")[0];
    // Then we'll return the code as an int...
    return parseInt(cleanedProjectionCode);
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
    // Then we'll create the object
    return {
      northing: geometry.getCoordinates()[0],
      easting: geometry.getCoordinates()[1],
      spatialReferenceSystemIdentifier: this.#getMapSrsAsInteger(),
      label: coordinateFeature.get("VISION_LABEL") || "",
    };
  };

  // Creates an object from the provided feature to match Vision's DTO
  #createFeatureSendObject = (f) => {
    // First we'll need to check which environment type we're dealing with...
    const typeId = f.get("VISION_TYPE_ID");
    // ...and get the settings for that type...
    const environmentSettings = this.getEnvironmentInfoFromId(typeId);
    // ...in the settings we've stored which fields we should send.
    const { fieldsToSend } = environmentSettings;
    // Then we'll make sure the fieldsToSend is valid. (We're expecting the fieldsToSend-property
    // to be an array of objects containing which key to send information on, and where to get that value
    // from on the feature).
    if (!Array.isArray(fieldsToSend)) {
      throw new Error(
        "Environment-integration-settings not valid. Could not create environment-information to send"
      );
    }
    // If it is valid, we can create the object...
    const sendObject = {};
    // And then add all the properties...
    fieldsToSend.forEach((field) => {
      // KubbX expects the id-prop to be a string...
      const sendValue =
        field.key === "id"
          ? f.get(field.featureProperty)?.toString()
          : f.get(field.featureProperty);
      sendObject[field.key] = field.overrideValue || sendValue;
    });
    // Then we can return the object!
    return sendObject;
  };

  // Handles when the save button in the edit view has been clicked.
  // - Makes sure to update the edit-state
  // - Gets all edit-features from map
  // - Creates a WKT
  // Sends WKT to Vision
  handleEditSaveClick = () => {
    // First we'll have to update the edit-state so that the view reflects what is going on...
    this.#localObserver.publish("set-edit-state", {
      mode: EDIT_STATUS.WAITING,
      mapInteraction: MAP_INTERACTIONS.EDIT_NONE,
      text: "Objkten har skickats till Vision. Väntar på respons...",
    });
    const editFeatures = this.#mapViewModel.getDrawnEditFeatures();
    try {
      // TODO: Clean up...
      // OL does not implement WKT properly so i had to do some funky stuff...
      let wktString = "";
      switch (editFeatures.length) {
        case 0:
          wktString = "POLYGON EMPTY";
          break;
        case 1:
          wktString = this.#wktParser.writeFeature(editFeatures[0]);
          break;
        default:
          const geometries = [];
          for (const f of editFeatures) {
            const geom = f.getGeometry();
            if (geom.getType() === "MultiPolygon") {
              // We have to make sure to destructure eventual multi-polygons to regular polygons....
              geom.getPolygons().forEach((g) => geometries.push(g));
            } else {
              geometries.push(geom);
            }
          }
          const multiPolygon = new Feature({
            geometry: new MultiPolygon(geometries),
          });
          wktString = this.#wktParser.writeFeature(multiPolygon);
          break;
      }

      this.#log(`Sending WKT to vision! WKT: ${wktString}`);

      this.#hubConnection.invoke("SendGeometry", {
        wkt: wktString,
        srsId: this.#getMapSrsAsInteger(),
      });
    } catch (error) {
      console.error(error);
      this.#localObserver.publish("set-edit-state", {
        mode: EDIT_STATUS.SAVE_FAILED,
        mapInteraction: MAP_INTERACTIONS.EDIT_NONE,
        text: "Något gick fel när objekten skulle sparas i Vision. Kontakta systemförvaltaren.",
      });
    }
  };

  // Handles when the cancel button in the edit view has been clicked.
  // - Invokes "SendGeometry" passing null to make sure Vision cancels as well.
  handleEditCancelClick = () => {
    try {
      this.#hubConnection.invoke("SendGeometry", null);
    } catch (error) {
      console.error(`Failed to pass null over "SendGeometry" Error: ${error}`);
    }
  };

  #handleSearchWithFeature = async (payload) => {
    const source =
      payload.interaction === MAP_INTERACTIONS.SELECT_ESTATE
        ? this.getEstateSearchSource()
        : this.#getEnvironmentSearchSource();
    const searchResult = await this.#searchModel.getResults("", [source], {
      ...this.#searchOptions,
      featuresToFilter: [payload.feature],
    });
    const { featureCollections, errors } = searchResult;
    // If we got an error, or if the results are missing, we have to prompt the user in some way...
    if (errors[0] || !featureCollections[0]) {
      // TODO: this.#localObserver.publish("estate-search-failed");
      return null;
    }
    // If we didn't, we can grab the first featureCollection, which will include our results
    const featureCollection = featureCollections[0];
    // Then we can grab the resulting features
    const features = featureCollection.value.features || [];
    // We're gonna want to show a feature title in several places. Let's put the title
    // directly on the feature so we don't have to construct it several times.
    features.forEach((f) => {
      this.#setFeatureTitle(f, source.displayFields);
    });
    // Finally we'll publish an event with the features that were found
    if (payload.interaction === MAP_INTERACTIONS.SELECT_ESTATE) {
      this.#localObserver.publish("add-estates-to-selection", features);
    } else {
      this.#localObserver.publish("add-environment-features-to-selection", {
        features,
        typeId: this.#currentEnvironmentTypeId,
      });
    }
  };

  #getEnvironmentSearchSource = () => {
    const environmentSettings = this.getEnvironmentInfoFromId(
      this.#currentEnvironmentTypeId
    );
    // When we have the settings, we can get the search-source etc. so that we can fetch the features connected to the provided id's.
    return this.getSearchSourceFromId(environmentSettings.wfsId);
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
    return this.getSearchSourceFromId(estateSourceId);
  };

  // Returns the layer connected to the provided id
  getSearchSourceFromId = (id) => {
    return this.#searchSources.find((source) => source.id === id) || null;
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
    return this.getLayerFromId(estateWmsId);
  };

  // Returns the layer connected to the supplied id.
  getLayerFromId = (id) => {
    if (!id) {
      console.error("Could not fetch layer. Layer-ID is missing!");
      return null;
    }
    return (
      this.#map.getAllLayers().find((layer) => layer.get("name") === id) || null
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
    const estateSettings = this.#getEstateIntegrationSettings() || {};
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
    const estateSettings = this.#getEstateIntegrationSettings() || {};
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
    const {
      localObserver,
      options,
      searchSources,
      app,
      map,
      mapViewModel,
      initialEnvironmentTypeId,
    } = parameters;
    return (
      !localObserver ||
      !options ||
      !Array.isArray(searchSources) ||
      !app ||
      !map ||
      !mapViewModel ||
      !initialEnvironmentTypeId
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

  // Returns an object containing information about an environment-object from a environment-object-id
  getEnvironmentInfoFromId = (id = 0) => {
    const configInfo =
      this.#options.integrationSettings?.find(
        (s) => parseInt(s.id.split("ENVIRONMENT_")[1]) === id
      ) || {};
    const constantInfo = ENVIRONMENT_INFO.find((o) => o.id === id) || {};
    return { ...configInfo, ...constantInfo };
  };

  // Returns an object containing the initial environment state.
  getInitialEnvironmentState = () => {
    return {
      1: { selectedFeatures: [], wmsActive: false },
      2: { selectedFeatures: [], wmsActive: false },
      3: { selectedFeatures: [], wmsActive: false },
    };
  };

  // Returns the currently set environment-type-id
  getCurrentEnvironmentTypeId = () => {
    return this.#currentEnvironmentTypeId;
  };

  // Sets the environment-type-id
  setCurrentEnvironmentTypeId = (id) => {
    this.#currentEnvironmentTypeId = id;
  };

  // Returns a string that can be used to prompt the user with helping text.
  // The returned string is based on which map interaction id is supplied (Since we want the helping
  // text to be suitable to what the user is currently doing).
  getHelperSnackText = (mapInteractionId) => {
    const interactionInfo = MAP_INTERACTION_INFO.find(
      (info) => info.id === mapInteractionId
    );
    if (!interactionInfo) {
      return null;
    }
    return interactionInfo.helperText;
  };

  // Sets the field stating if edit is enabled or not.
  setEditEnabled = (enabled) => {
    this.#editEnabled = enabled;
  };
}

export default VisionIntegrationModel;
