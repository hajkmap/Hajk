import { HubConnectionBuilder } from "@microsoft/signalr";
import SearchModel from "models/SearchModel";

import { INTEGRATION_IDS } from "../constants";

// A simple class containing functionality that is used in the VisionIntegration-plugin.
class VisionIntegrationModel {
  #options;
  #localObserver;
  #hubConnection;
  #searchSources;
  #orSeparator;
  #searchOptions;
  #searchModel;

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
    this.#options = options; // We're probably gonna need the options...
    this.#localObserver = localObserver; // ...and the observer
    this.#hubConnection = this.#createHubConnection(); // Create the hub-connection
    this.#searchSources = searchSources;
    this.#searchModel = new SearchModel(
      { sources: this.#searchSources },
      map,
      app
    ); // Initiate a search-model with the provided sources
    this.#orSeparator = "?"; // We're gonna be using an or-separator when searching, let's use "?"
    this.#searchOptions = this.#getDefaultSearchOptions(); // Create the default search-options
    this.#hubConnection !== null && this.#initiateHub(); // Initiate the hub and its listeners.
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
      // ... If we are, we can try to create the connection
      return new HubConnectionBuilder().withUrl(hubUrl).build();
    } catch (error) {
      // If we fail for some reason, we'll log an error and return null
      console.error(`Failed to create hub-connection. ${error}`);
      return null;
    }
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
    // Vision can also ask us to show the geometries connected to the supplied real-estate-information.
    this.#hubConnection.on(
      "HandleRealEstateIdentifiers",
      this.#handleVisionAskingToShowRealEstates
    );
  };

  // Handles when Vision is asking for information regarding all currently selected real-estates.
  #handleVisionAskingForRealEstateIdentifiers = (payload) => {
    console.log(
      "handleVisionAskingForRealEstateIdentifiers, payload: ",
      payload
    );
  };

  // Handles when Vision is asking for information regarding all currently selected coordinates.
  #handleVisionAskingForCoordinates = (payload) => {
    console.log("handleVisionAskingForCoordinates, payload: ", payload);
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
    const searchKey = estateIntegrationSettings?.searchKey || "fnr";
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
    // Otherwise we'll publish an event including the features that were found
    this.#localObserver.publish("estate-search-completed", estateFeatures);
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
    const { localObserver, options, searchSources, app, map } = parameters;
    return (
      !localObserver ||
      !options ||
      !Array.isArray(searchSources) ||
      !app ||
      !map
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
