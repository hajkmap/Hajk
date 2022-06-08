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
    return null;
  };

  // Initiates all the hub and its listeners (handlers that can catch events sent from Vision).
  #initiateHub = () => {
    return null;
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
  hubIsConnected = () => {
    return this.#hubConnection !== null;
  };
}

export default VisionIntegrationModel;
