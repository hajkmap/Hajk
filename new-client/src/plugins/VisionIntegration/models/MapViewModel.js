import { extend, createEmpty, isEmpty } from "ol/extent";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import DrawModel from "models/DrawModel";
import { handleClick } from "models/Click";
import { generateRandomString } from "../utils";
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
  #activeMapInteraction;

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
    this.#activeMapInteraction = null;
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
      padding: [100, 100, 100, 100],
      duration: 1000,
    });
  };

  // Zooms to the supplied features
  zoomToFeatures = (features) => {
    // First we'll create an empty extent
    const extent = createEmpty();
    // Then, for each feature, we'll extend the extent
    features.forEach((feature) => {
      extend(extent, feature.getGeometry().getExtent());
    });
    // Finally, if the extent is not empty, we'll zoom to it
    !isEmpty(extent) && this.#fitMapToExtent(extent);
  };

  // Disables any potential interactions and removes click-lock
  #disableInteractions = () => {
    this.#activeMapInteraction = null;
    this.#map.clickLock.delete("visionintegration");
    this.#disableEstateSelectInteraction();
    this.#disableCreateCoordinateInteraction();
  };

  // Enables functionality so that the user can select estates from the map
  #enableEstateSelectInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnSelectEstateClick);
  };

  // Enables functionality so that the user can create coordinate (point) features
  #enableCreateCoordinateInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnCreateCoordinateClick);
  };

  // Disables select estates from map functionality
  #disableEstateSelectInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnSelectEstateClick);
  };

  // Disables create coordinate from map functionality
  #disableCreateCoordinateInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnCreateCoordinateClick);
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
      this.#localObserver.publish("mapView-estate-map-click-result", features);
    } catch (error) {
      console.error(
        `Failed to select estates in VisionIntegration... ${error}`
      );
    }
  };

  // Handler for map-clicks when user is to create a coordinate (point) feature
  #handleOnCreateCoordinateClick = (event) => {
    // First we'll get the coordinates from the click-event
    const coordinates = this.#map.getCoordinateFromPixel(event.pixel);
    // Then we'll create a new point-feature with the required properties
    const coordinateFeature = new Feature({
      geometry: new Point(coordinates),
      VISION_TYPE: "COORDINATES",
      FEATURE_TITLE: `Nord: ${parseInt(coordinates[1])}, Öst: ${parseInt(
        coordinates[0]
      )}`,
    });
    // We also have to set a random id on each feature (since OL doesn't...)
    coordinateFeature.setId(generateRandomString());
    // Then we'll publish an event so that the views can be updated
    this.#localObserver.publish(
      "mapView-new-coordinate-created",
      coordinateFeature
    );
  };

  // Toggles map-interactions (possible interactions are "SELECT_ESTATE" and "SELECT_COORDINATE")
  toggleMapInteraction = (interaction) => {
    // First we must disable any potential interactions...
    this.#disableInteractions();
    // Then we'll check which interaction we should enable and enable that one...
    switch (interaction) {
      case MAP_INTERACTIONS.SELECT_ESTATE:
        this.#activeMapInteraction = MAP_INTERACTIONS.SELECT_ESTATE;
        return this.#enableEstateSelectInteraction();
      case MAP_INTERACTIONS.SELECT_COORDINATE:
        this.#activeMapInteraction = MAP_INTERACTIONS.SELECT_COORDINATE;
        return this.#enableCreateCoordinateInteraction();
      default:
        return null;
    }
  };

  // Handles when the selected estates has been updated. Makes sure to update the map accordingly.
  setEstatesToShow = (estates) => {
    // First we'll get any potential estates already in the map
    const estatesInMap = this.getDrawnEstates();
    // Then we'll remove the old estates features...
    estatesInMap.forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // ...and then we'll add all the currently selected features
    estates.forEach((estate) => {
      estate.set("VISION_TYPE", INTEGRATION_IDS.ESTATES);
      this.#drawModel.addFeature(estate);
    });
  };

  // Handles when the selected environment features has been updated. Makes sure to update the map accordingly.
  setEnvironmentFeaturesToShow = (features, environmentType) => {
    // First we'll get any potential features already in the map
    const featuresInMap =
      this.getDrawnEnvironmentFeaturesByType(environmentType);
    // Then we'll remove the old features...
    featuresInMap.forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // ...and then we'll add all the currently selected features
    features.forEach((f) => {
      f.set("VISION_TYPE", `ENVIRONMENT_${environmentType}`);
      this.#drawModel.addFeature(f);
    });
  };

  // Handles when the selected coordinates has been updated. Makes sure to update the map accordingly.
  setCoordinatesToShow = (coordinates) => {
    // First we'll get any potential coordinates already in the map
    const coordinatesInMap = this.getDrawnCoordinates();
    // Then we'll remove the old coordinate features...
    coordinatesInMap.forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // Then we'll add all the currently selected coordinates
    coordinates.forEach((coordinate) => {
      coordinate.set("VISION_TYPE", INTEGRATION_IDS.COORDINATES);
      this.#drawModel.addFeature(coordinate);
    });
  };

  // Returns all drawn (selected) estates from the map
  getDrawnEstates = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => f.get("VISION_TYPE") === INTEGRATION_IDS.ESTATES);
  };

  // Returns all drawn (selected) environment features belonging to the supplied type
  // The supplied type is an id corresponding to the environment-type (areas, investigations etc.)
  // The VISION_TYPE is set to ENVIRONMENT_TYPE-ID, hence the odd solution below.
  getDrawnEnvironmentFeaturesByType = (type) => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => {
        const visionType = f.get("VISION_TYPE");
        if (!visionType.includes("ENVIRONMENT_")) {
          return false;
        }
        const typeId = visionType.split("ENVIRONMENT_")[1];
        return parseInt(typeId) === type;
      });
  };

  // Returns all the drawn (selected) coordinates from the map.
  getDrawnCoordinates = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => f.get("VISION_TYPE") === INTEGRATION_IDS.COORDINATES);
  };

  // Hide all features that does not have the vision type supplied
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
