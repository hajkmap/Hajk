import { extend, createEmpty, isEmpty } from "ol/extent";
import DrawModel from "models/DrawModel";
import { handleClick } from "models/Click";
import {
  INTEGRATION_IDS,
  DEFAULT_DRAW_SETTINGS,
  DEFAULT_DRAW_STYLE_SETTINGS,
  MAP_INTERACTIONS,
} from "../constants";

// A simple class containing functionality that is used in the VisionIntegration-plugin.
class VisionIntegrationModel {
  #app;
  #map;
  #options;
  #localObserver;
  #drawModel;

  // There will probably not be many settings for this model... Options are required though!
  constructor(settings) {
    // Let's destruct some required properties...
    const { localObserver, options, map, app } = settings;
    // ...and make sure they are passed.
    if (this.#requiredParametersMissing(settings)) {
      throw new Error(
        `Could not initiate VisionIntegration-map-view-model. Required parameters missing...`
      );
    }
    // Then we'll initiate some private-fields...
    this.#options = options;
    this.#localObserver = localObserver;
    this.#map = map;
    this.#app = app;
    // ...including a draw-model, which can be used to show draw features in the map in a simple way.
    this.#drawModel = new DrawModel({
      layerName: "pluginVisionIntegration",
      map: map,
      observer: localObserver,
      measurementSettings: DEFAULT_DRAW_SETTINGS,
      drawStyleSettings: DEFAULT_DRAW_STYLE_SETTINGS,
    });
  }

  // Returns wether any of the required parameters for the model is missing or not.
  #requiredParametersMissing = (parameters) => {
    const { localObserver, options, app, map } = parameters;
    return !localObserver || !options || !app || !map;
  };

  // Zooms to the supplied extent (with some padding)
  #fitMapToExtent = (extent) => {
    this.#map.getView().fit(extent, {
      size: this.#map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  // Zooms to the supplied features
  #zoomToFeatures = (features) => {
    // First we'll create an empty extent
    const extent = createEmpty();
    // Then, for each feature, we'll extend the extent
    features.forEach((feature) => {
      extend(extent, feature.getGeometry().getExtent());
    });
    // Finnaly, if the extent is not empty, we'll zoom to it
    !isEmpty(extent) && this.#fitMapToExtent(extent);
  };

  // Disables any potential interactions and removes click-lock
  #disableInteractions = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#disableEstateSelectInteraction();
  };

  // Enables functionality so that the user can select estates from the map
  #enableEstateSelectInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnSelectEstateClick);
  };

  // Disables select estates from map functionality
  #disableEstateSelectInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnSelectEstateClick);
  };

  // Handler for map-clicks when user is to select estates
  #handleOnSelectEstateClick = async (event) => {
    try {
      // Try to fetch features from WMS-layers etc. (Also from all vector-layers).
      const clickResult = await new Promise((resolve) =>
        handleClick(event, event.map, resolve)
      );
      // The response should contain an array of features
      const { features } = clickResult;
      // We'll just publish an event with all the features and let VisionIntegration-model
      // handle filtering etc.
      this.#localObserver.publish("mapview-estate-map-click-result", features);
    } catch (error) {
      console.error(
        `Failed to select estates in VisionIntegration... ${error}`
      );
    }
  };

  // Toggles map-interactions (possible interactions are "SELECT_ESTATE" and "SELECT_COORDINATE")
  toggleMapInteraction = (interaction) => {
    // First we must disable any potential interactions...
    this.#disableInteractions();
    // Then we'll check which interaction we should enable and enable that one...
    switch (interaction) {
      case MAP_INTERACTIONS.SELECT_ESTATE:
        return this.#enableEstateSelectInteraction();
      case MAP_INTERACTIONS.SELECT_COORDINATE:
        console.log("Enable select coordinate (TODO!)");
        return null;
      default:
        return null;
    }
  };

  // Handles when the selected estates has been updated. Makes sure to update the map accordingly.
  setEstatesToShow = (estates) => {
    // First we'll clear any eventual estate-features already in the map
    this.getDrawnEstates().forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // Then we'll add all the currently selected features
    estates.forEach((estate) => {
      estate.set("VISION_TYPE", INTEGRATION_IDS.ESTATES);
      this.#drawModel.addFeature(estate);
    });
    // Then we'll zoom to the current extent (If we've not removed all features, since it
    // does not make sence to zoom to nothing...)
    if (estates.length !== 0) {
      this.#zoomToFeatures(estates);
    }
  };

  // Handles when the selected coordinates has been updated. Makes sure to update the map accordingly.
  setCoordinatesToShow = (coordinates) => {
    // First we'll clear any eventual estate-features already in the map
    this.getDrawnCoordinates().forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // Then we'll add all the currently selected features
    coordinates.forEach((coordinate) => {
      coordinate.set("VISION_TYPE", INTEGRATION_IDS.COORDINATES);
      this.#drawModel.addFeature(coordinate);
    });
    // Then we'll zoom to the current extent (If we've not removed all features, since it
    // does not make sence to zoom to nothing...)
    if (coordinates.length !== 0) {
      this.#zoomToFeatures(coordinates);
    }
  };

  // Returns all drawn (selected) estates from the map
  getDrawnEstates = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => f.get("VISION_TYPE") === INTEGRATION_IDS.ESTATES);
  };

  // Returns all the drawn (selected) coordinates from the map.
  getDrawnCoordinates = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => f.get("VISION_TYPE") === INTEGRATION_IDS.COORDINATES);
  };

  // Hidea all features that does not have the vision type supplied
  updateHiddenFeatures = (visionTypeToShow) => {
    // First we'll update the hidden-prop on all features
    this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .forEach((feature) => {
        if (feature.get("VISION_TYPE") === visionTypeToShow) {
          feature.set("HIDDEN", false);
        } else {
          feature.set("HIDDEN", true);
        }
      });
    // Then we'll refresh the draw-layer so that the change is applied
    this.#drawModel.refreshDrawLayer();
  };
}

export default VisionIntegrationModel;
