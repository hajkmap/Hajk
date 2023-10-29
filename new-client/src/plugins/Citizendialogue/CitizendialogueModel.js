import LocalStorageHelper from "utils/LocalStorageHelper";
import { hfetch } from "utils/FetchWrapper";
export default class CitizendialogueModel {
  #map;
  #app;
  #localObserver;
  #storageKey;

  constructor(settings) {
    // Set some private fields
    this.mapServiceUrl =
      settings.app.config.appConfig.proxy +
      settings.app.config.appConfig.mapserviceBase;
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#storageKey = "citizendialogue"; // Key-name for local-storage (often the plugin name)
    this.#initSubscriptions(); // Initiate listeners on observer(s)
  }

  // Sets up listeners on observers
  #initSubscriptions = () => {
    this.#localObserver.subscribe(
      "citizendialogueEvent",
      this.#handleCitizendialogueEvent
    );
  };

  // Example of an event handler for observer-event
  #handleCitizendialogueEvent = (message = "") => {
    console.log(`Citizendialogue-event caught in model! Message: ${message}`);
  };

  // The local-storage helper allows us to set map-specific values in the local-storage.
  // For example, if we're using "map_1", we will get the following key in LS: "map_options_map_1": {}.
  // If we use the setter, we can set keys in the object mentioned above:
  // LocalStorageHelper.set("citizendialogue", {"test": "test"}) => "map_options_map_1": {"someEarlierSetKey": "someEarlierSetValue", "citizendialogue": {"test": "test"}}
  // The helper below allows us to update the keys and values in the "citizendialogue" key.
  setCitizendialogueKeyInStorage = (key, value) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      [key]: value,
    });
  };

  async loadSurvey(title) {
    try {
      const response = await hfetch(
        `${this.mapServiceUrl}/informative/surveyload/${title}`
      );

      if (!response || !response.ok) {
        throw new Error("Error loading survey");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error loading survey:", error);
      throw error;
    }
  }

  handleOnComplete = (data) => {
    console.log("Enkätsvar: ", data);
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
