export default class DummyModel {
  #map;
  #app;
  #localObserver;

  constructor(settings) {
    // Set some private fields
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#initSubscriptions(); // Initiate listeners on observer(s)
  }

  // Sets up listeners on observers
  #initSubscriptions = () => {
    this.#localObserver.subscribe("dummyEvent", this.#handleDummyEvent);
  };

  // Example of an event handler for observer-event
  #handleDummyEvent = (message = "") => {
    console.log(`Dummy-event caught in model! Message: ${message}`);
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
