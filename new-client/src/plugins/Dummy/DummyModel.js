import LocalStorageHelper from "utils/LocalStorageHelper";

export default class DummyModel {
  #map;
  #app;
  #localObserver;
  #storageKey;

  constructor(settings) {
    // Set some private fields
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#storageKey = "dummy"; // Key-name for local-storage (often the plugin name)
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

  // The local-storage helper allows us to set map-specific values in the local-storage.
  // For example, if we're using "map_1", we will get the following key in LS: "map_options_map_1": {}.
  // If we use the setter, we can set keys in the object mentioned above:
  // LocalStorageHelper.set("dummy", {"test": "test"}) => "map_options_map_1": {"someEarlierSetKey": "someEarlierSetValue", "dummy": {"test": "test"}}
  // The helper below allows us to update the keys and values in the "dummy" key.
  setDummyKeyInStorage = (key, value) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      [key]: value,
    });
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
