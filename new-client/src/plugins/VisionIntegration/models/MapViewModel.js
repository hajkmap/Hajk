import { extend, createEmpty, isEmpty } from "ol/extent";
import { Fill, Stroke, Style } from "ol/style";
import Collection from "ol/Collection";
import { Modify } from "ol/interaction";
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
  #ctrlKeyPressed;
  #modifyInteraction;

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
    this.#modifyInteraction = null;
    this.#ctrlKeyPressed = false; // The CTRL-key is used to extend the select-features functionality. Let's keep track of its state.
    // ...including a draw-model, which can be used to show draw features in the map in a simple way.
    this.#drawModel = new DrawModel({
      layerName: "pluginVisionIntegration",
      map: map,
      observer: localObserver,
      measurementSettings: DEFAULT_DRAW_SETTINGS,
      drawStyleSettings: DEFAULT_DRAW_STYLE_SETTINGS,
    });
    // We're always gonna want to listen for some key-down/up events... Let's initiate the listeners.
    // (We want to keep track of the CTRL-key state...)
    document.addEventListener("keydown", this.#handleKeyDown);
    document.addEventListener("keyup", this.#handleKeyUp);
  }

  // Returns wether any of the required parameters for the model is missing or not.
  #requiredParametersMissing = (parameters) => {
    const { localObserver, options, app, map } = parameters;
    return !localObserver || !options || !app || !map;
  };

  // Handles key-down events and makes sure to track wether the CTRL-key is pressed or not.
  // If any of the selection-modes are currently active, we make sure to change it to polygon-selection instead!
  #handleKeyDown = (event) => {
    const { keyCode } = event;
    if (keyCode === 17 && !this.#ctrlKeyPressed) {
      this.#ctrlKeyPressed = true;
      if (this.#polygonSelectIsAvailable()) {
        this.#enablePolygonSelection();
      }
    }
  };

  // Handles key-up events and makes sure to track wether the CTRL-key is pressed or not.
  // If any of the selection-modes are currently active, we make sure to remove the polygon selection!
  #handleKeyUp = (event) => {
    const { keyCode } = event;
    if (keyCode === 17 && this.#ctrlKeyPressed) {
      this.#ctrlKeyPressed = false;
      if (this.#polygonSelectIsAvailable()) {
        this.#disablePolygonSelection();
      }
    }
  };

  // Returns wether the currently enabled interaction allows for polygon-select or not.
  #polygonSelectIsAvailable = () => {
    return [
      MAP_INTERACTIONS.SELECT_ESTATE,
      MAP_INTERACTIONS.SELECT_ENVIRONMENT,
    ].includes(this.#activeMapInteraction);
  };

  #enablePolygonSelection = () => {
    // First we must disable any potential interactions...
    this.#disableEstateSelectInteraction();
    this.#disableEnvironmentSelectInteraction();
    this.#drawModel.toggleDrawInteraction("Rectangle", {
      handleAddFeature: this.#handlePolygonFeatureAdded,
    });
  };

  #disablePolygonSelection = () => {
    // First we must disable any potential interactions...
    this.#drawModel.toggleDrawInteraction();
    this.toggleMapInteraction(this.#activeMapInteraction);
  };

  #handlePolygonFeatureAdded = (e) => {
    const { feature } = e;
    this.#localObserver.publish("search-with-feature", {
      interaction: this.#activeMapInteraction,
      feature,
    });
    this.#drawModel.removeFeature(feature);
  };

  // Handler for when the user has finished drawing a polygon while in edit mode
  #handleEditFeatureAdded = (e) => {
    const { feature } = e;
    feature.set("VISION_DRAW_TYPE", "USER_DRAWN");
    this.#localObserver.publish("add-edit-feature", feature);
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
    this.#drawModel.toggleDrawInteraction();
    this.#disableEstateSelectInteraction();
    this.#disableCreateCoordinateInteraction();
    this.#disableEnvironmentSelectInteraction();
    this.#disableDrawPolygonInteraction();
    this.#disableDeleteFeatureInteraction();
    this.#disableModifyFeatureInteraction();
    this.#disableSelectFeatureInteraction();
  };

  // Enables functionality so that the user can select estates from the map
  #enableEstateSelectInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnSelectEstateClick);
  };

  #enableEnvironmentSelectInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnSelectEnvironmentClick);
  };

  // Enables functionality so that the user can create coordinate (point) features
  #enableCreateCoordinateInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#map.on("singleclick", this.#handleOnCreateCoordinateClick);
  };

  // Enables functionality so that the user can draw polygons
  #enableDrawPolygonInteraction = () => {
    this.#map.clickLock.add("visionintegration");
    this.#drawModel.toggleDrawInteraction("Polygon", {
      handleDrawEnd: this.#handleEditFeatureAdded,
    });
  };

  // Enables functionality so that the user can remove a drawn feature
  #enableDeleteFeatureInteraction = () => {
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("visionintegration");
    // Then we'll add the event-handler responsible for removing clicked features.
    this.#map.on("singleclick", this.#removeClickedFeature);
  };

  // Enables functionality so that the user can modify a drawn feature
  #enableModifyFeatureInteraction = () => {
    // Go ahead and create the modify-interaction..
    this.#modifyInteraction = new Modify({
      features: new Collection(this.getDrawnEditFeatures()),
    });
    // Then we'll add the interaction to the map.
    this.#map.addInteraction(this.#modifyInteraction);
  };

  // Enables functionality so that the user can select features from active layers
  #enableSelectFeatureInteraction = () => {
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("visionintegration");
    // Then we can add the select-listener to the map...
    this.#map.on("singleclick", this.#handleOnSelectClick);
  };

  // Disables select estates from map functionality
  #disableEstateSelectInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnSelectEstateClick);
  };

  // Disables select environment-features from map functionality
  #disableEnvironmentSelectInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnSelectEnvironmentClick);
  };

  // Disables create coordinate from map functionality
  #disableCreateCoordinateInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnCreateCoordinateClick);
  };

  // Disables the draw-polygon interaction
  #disableDrawPolygonInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#drawModel.toggleDrawInteraction();
  };

  // Disables the delete-feature interaction
  #disableDeleteFeatureInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#removeClickedFeature);
  };

  // Disables the delete-feature interaction
  #disableSelectFeatureInteraction = () => {
    this.#map.clickLock.delete("visionintegration");
    this.#map.un("singleclick", this.#handleOnSelectClick);
  };

  // Disables the modify-feature interaction
  #disableModifyFeatureInteraction = () => {
    // If the modify-interaction is not active, we can abort.
    if (!this.#modifyInteraction) {
      return;
    }
    // Otherwise, let's disable it. First remove the interaction.
    this.#map.removeInteraction(this.#modifyInteraction);
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

  // Handler for select-features-from-layers map-click
  #handleOnSelectClick = async (event) => {
    try {
      // Try to fetch features from WMS-layers etc. (Also from all vector-layers).
      const clickResult = await new Promise((resolve) =>
        handleClick(event, event.map, resolve)
      );
      // The response should contain an array of features
      const { features } = clickResult;
      // Which might contain features without geometry. We have to make sure we remove those.
      const featuresWithGeom = features.filter((feature) =>
        feature.getGeometry()
      );
      // If we've fetched exactly one feature, we can add it straight away...
      featuresWithGeom.length === 1 &&
        this.#localObserver.publish("add-edit-feature", featuresWithGeom[0]);
      // If we have more than one feature, we'll have to let the user
      // pick which features they want to add. Let's publish an event that the view can catch...
      if (featuresWithGeom.length > 1) {
        this.#localObserver.publish("select-edit-features", featuresWithGeom);
        return;
      }
    } catch (error) {
      console.error(
        `(VisionIntegration) Failed to select features in mapViewModel... Error: ${error}`
      );
    }
  };

  #handleOnSelectEnvironmentClick = async (event) => {
    try {
      // Try to fetch features from WMS-layers etc. (Also from all vector-layers).
      const clickResult = await new Promise((resolve) =>
        handleClick(event, event.map, resolve)
      );
      // The response should contain an array of features
      const { features } = clickResult;
      // We'll just publish an event with all the features and let VisionIntegration-model
      // handle filtering etc.
      this.#localObserver.publish(
        "mapView-environment-map-click-result",
        features
      );
    } catch (error) {
      console.error(
        `Failed to select environment-features in VisionIntegration... ${error}`
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

  // Removes the first feature that is present at the supplied
  // pixel from the click-event.
  #removeClickedFeature = (e) => {
    // Get features present at the clicked feature.
    const clickedFeatures = this.#map.getFeaturesAtPixel(e.pixel);
    // We only care about features that are connected to the Vision-plugin
    const visionFeatures = clickedFeatures.filter(
      (f) => f.get("VISION_TYPE") === INTEGRATION_IDS.EDIT
    );
    // Let's make sure we found some feature(s) to remove. We're only removing the first one.
    if (visionFeatures.length > 0) {
      // Let's get the first user-drawn feature
      const feature = visionFeatures[0];
      // Then we remove it from the draw-source
      this.#drawModel.removeFeature(feature);
      // Finally we'll have to make sure to update the view-state
      this.#localObserver.publish("remove-edit-feature", feature);
    }
  };

  // Returns the style used to highlight features
  #createHighlightStyle = () => {
    return new Style({
      stroke: new Stroke({
        color: "rgba(255, 0, 0, 1)",
        width: 3,
      }),
      fill: new Fill({
        color: "rgba(255, 0, 0, 0.1)",
      }),
    });
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
      case MAP_INTERACTIONS.SELECT_ENVIRONMENT:
        this.#activeMapInteraction = MAP_INTERACTIONS.SELECT_ENVIRONMENT;
        return this.#enableEnvironmentSelectInteraction();
      case MAP_INTERACTIONS.EDIT_CREATE_POLYGON:
        this.#activeMapInteraction = MAP_INTERACTIONS.EDIT_CREATE_POLYGON;
        return this.#enableDrawPolygonInteraction();
      case MAP_INTERACTIONS.EDIT_DELETE:
        this.#activeMapInteraction = MAP_INTERACTIONS.EDIT_DELETE;
        return this.#enableDeleteFeatureInteraction();
      case MAP_INTERACTIONS.EDIT_MODIFY:
        this.#activeMapInteraction = MAP_INTERACTIONS.EDIT_MODIFY;
        return this.#enableModifyFeatureInteraction();
      case MAP_INTERACTIONS.EDIT_SELECT_FROM_LAYER:
        this.#activeMapInteraction = MAP_INTERACTIONS.EDIT_SELECT_FROM_LAYER;
        return this.#enableSelectFeatureInteraction();
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
      f.set("VISION_TYPE_ID", environmentType);
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

  // Handles when the features that are selected for editing has been updated. Makes sure to update the map accordingly.
  setEditFeaturesToShow = (features) => {
    // First we'll get any potential edit-features already in the map
    const editFeaturesInMap = this.getDrawnEditFeatures();
    // Then we'll remove the old features...
    editFeaturesInMap.forEach((f) => {
      this.#drawModel.removeFeature(f);
    });
    // Then we'll add all the currently selected edit-features
    // Some funky stuff is going on here... Features added by drawing will be added twice
    // (once by this added and then by the draw-model) if we don't prevent it. By checking the
    // VISION_DRAW_TYPE (which will be set to "USER_DRAWN" in the double feature case) we can prevent that.
    features.forEach((f) => {
      f.set("VISION_TYPE", INTEGRATION_IDS.EDIT);
      if (f.get("VISION_DRAW_TYPE") === "USER_DRAWN") {
        f.unset("VISION_DRAW_TYPE");
      } else {
        this.#drawModel.addFeature(f);
      }
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
        const visionType = f.get("VISION_TYPE") || "";
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

  // Returns the environment features that are currently visible in the map
  getDrawnEnvironmentFeatures = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => {
        return (
          f.get("VISION_TYPE").includes("ENVIRONMENT_") &&
          f.get("HIDDEN") !== true
        );
      });
  };

  // Returns the edit-features that are currently visible in the map
  getDrawnEditFeatures = () => {
    return this.#drawModel
      .getCurrentVectorSource()
      .getFeatures()
      .filter((f) => f.get("VISION_TYPE") === INTEGRATION_IDS.EDIT);
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

  // Creates a new feature with the same geometry as the supplied one. The new
  // feature can be used an an highlight, to show where the supplied feature is.
  createHighlightFeature = (feature) => {
    // If no feature (or a feature with no get-geometry) is supplied, we abort.
    if (feature && feature.getGeometry()) {
      // Otherwise we create a new feature...
      const highlightFeature = new Feature({
        geometry: feature.getGeometry().clone(),
      });
      // ...set an id and a highlight-style...
      highlightFeature.setId(generateRandomString());
      highlightFeature.setStyle(this.#createHighlightStyle());
      // Finally we return the feature so that we can add it to the map etc.
      return highlightFeature;
    }
  };

  // Draws the supplied feature in the current draw-layer
  drawFeature = (f) => {
    this.#drawModel.addFeature(f, { silent: true });
  };

  // Removes the supplied feature from the current draw-layer
  removeDrawnFeature = (f) => {
    this.#drawModel.removeFeature(f);
  };
}

export default VisionIntegrationModel;
