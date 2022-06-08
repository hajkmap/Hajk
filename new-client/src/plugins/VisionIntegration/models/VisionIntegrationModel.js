import { HubConnectionBuilder } from "@microsoft/signalr";

// A simple class containing functionality that is used in the VisionIntegration-plugin.
class VisionIntegrationModel {
  #options;
  #localObserver;
  #hubConnection;

  // There will probably not be many settings for this model... Options are required though!
  constructor(settings) {
    // Let's destruct some required properties...
    const { localObserver, options } = settings;
    // ...and make sure they are passed.
    if (!localObserver || !options) {
      throw new Error(
        `Could not initiate VisionIntegration-model. Required parameters missing...`
      );
    }
    // Then we'll initiate some private fields
    this.#options = options;
    this.#localObserver = localObserver;
    this.#hubConnection = this.#createHubConnection();
    this.#hubConnection !== null && this.#initiateHub();
  }

  // Creates a connection to supplied hub-url. (Hub meaning a signalR-communication-hub).
  #createHubConnection = () => {
    try {
      // Let's get the url tht we're supposed to connect to from the options...
      const { hubUrl } = this.#options;
      // Then we'll make sure we're dealing with a string...
      if (typeof hubUrl !== "string" || hubUrl.length < 1) {
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

  // Makes sure that the supplied options contains all required settings.
  configurationIsValid = () => {
    // Let's destruct all options we want to check...
    const { hubUrl } = this.#options;
    // Make sure that the supplied hub-url (url to the communication hub between Vision and Hajk is a valid string).
    if (!hubUrl || typeof hubUrl !== "string" || hubUrl.length < 1) {
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
