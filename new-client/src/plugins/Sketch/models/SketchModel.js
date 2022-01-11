import { ACTIVITIES, MAX_REMOVED_FEATURES } from "../constants";
import LocalStorageHelper from "../../../utils/LocalStorageHelper";
import GeoJSON from "ol/format/GeoJSON";

class SketchModel {
  #geoJSONParser;
  #storageKey;
  #dateTimeOptions;

  constructor() {
    this.#geoJSONParser = new GeoJSON();
    this.#storageKey = "sketch";
    this.#dateTimeOptions = {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
  }

  // Updates the removed features in the local-storage
  #setStoredRemovedFeatures = (removedFeatures) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      removedFeatures: removedFeatures,
    });
  };

  // Returns the activity-object connected to the supplied id
  getActivityFromId = (id) => {
    return ACTIVITIES.find((activity) => {
      return activity.id === id;
    });
  };

  // Returns the current date and time on YYYY-MM-DD HH:MM:SS
  #getDateTimeString = () => {
    const date = new Date();
    return date.toLocaleString("default", this.#dateTimeOptions);
  };

  // Generates a random string that can be used as an ID.
  #generateRandomString = () => {
    return Math.random().toString(36).slice(2, 9);
  };

  // We're gonna need to set some properties on the handled feature so that we can keep
  // track of it. (The "HANDLED_AT" prop will show the user at what time the feature was
  // removed, and the "HANDLED_ID" will be used if the user choses to restore the feature).
  decorateFeature = (feature) => {
    feature.set("HANDLED_AT", this.#getDateTimeString());
    feature.set("HANDLED_ID", this.#generateRandomString());
  };

  // Returns the earlier removed features which are stored in local-storage
  // If the first parameter is omitted, the method will return parsed OL-features,
  // otherwise, it will return the actual local-storage value.
  getRemovedFeaturesFromStorage = (returnType = "FEATURES") => {
    const inStorage = LocalStorageHelper.get(this.#storageKey);
    const storedFeatures = inStorage["removedFeatures"] || [];
    return returnType === "FEATURES"
      ? storedFeatures.map((parsedFeature) =>
          this.#geoJSONParser.readFeature(parsedFeature)
        )
      : storedFeatures;
  };

  // Updates the local-storage by adding the removed feature and potentially
  // removing old removed features. (We want to keep a maximum of MAX_REMOVED_FEATURES).
  addRemovedFeatureToStorage = (feature) => {
    const removedFeatures = this.getRemovedFeaturesFromStorage("STRINGS");
    const parsedFeature = this.#geoJSONParser.writeFeature(feature);
    this.#setStoredRemovedFeatures([
      parsedFeature,
      ...removedFeatures.slice(0, MAX_REMOVED_FEATURES),
    ]);
  };
}
export default SketchModel;
