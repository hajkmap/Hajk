import { Draw } from "ol/interaction";
import { createBox, createRegularPolygon } from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill, Text } from "ol/style";
import { Circle as CircleGeometry, LineString, Point } from "ol/geom.js";
import Overlay from "ol/Overlay.js";

/*
 * A model supplying useful Draw-functionality.
 * Required settings:
 * - layerName: (string): The name of the layer that initially should be connected to the Draw-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 *
 * Exposes a couple of methods:
 * - getCurrentExtent(): Returns the current extent of the current draw-layer.
 * - getCurrentLayerName(): Returns the name of the layer currently connected to the draw-model.
 * - removeDrawnFeatures():  Removes all drawn features from the current draw-source.
 * - setLayer(layerName <string>): Sets (or creates) the layer that should be connected to the draw-model.
 * - toggleDrawInteraction(drawType, settings): Accepts a string with the drawType and an object containing settings.
 * - zoomToCurrentExtent(): Fits the map-view to the current extent of the current draw-source.
 * - getRGBAString(RGBA-object <object>): Accepts an object with r-, g-, b-, and a-properties and returns the string representation.
 * - getCurrentVectorSource(): Returns the vector-source currently connected to the draw-model.
 * - get/set drawStyleSettings(): Get or set the style settings used by the draw-model.
 * - get/set labelFormat(): Sets the format on the labels. ("AUTO", "M2", "KM2", "HECTARE")
 * - get/set showDrawTooltip(): Get or set wether a tooltip should be shown when drawing.
 * - get/set showFeatureMeasurements(): Get or set wether drawn feature measurements should be shown or not.
 */
class DrawModel {
  #map;
  #layerName;
  #drawSource;
  #drawLayer;
  #currentExtent;
  #drawTooltipElement;
  #drawTooltipElementStyle;
  #drawTooltip;
  #currentPointerCoordinate;
  #showDrawTooltip;
  #showFeatureMeasurements;
  #drawStyleSettings;
  #drawInteraction;
  #removeInteractionActive;
  #allowedLabelFormats;
  #labelFormat;
  #customHandleDrawStart;
  #customHandleDrawEnd;
  #customHandlePointerMove;
  #customHandleAddFeature;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    this.#showFeatureMeasurements = settings.showFeatureMeasurements ?? true;
    this.#drawStyleSettings =
      settings.drawStyleSettings ?? this.#getDefaultDrawStyleSettings();
    this.#allowedLabelFormats = ["AUTO", "M2", "KM2", "HECTARE"];
    this.#labelFormat = settings.labelFormat ?? "AUTO"; // One of #allowedLabelFormats
    // We are going to be keeping track of the current extent of the draw-source...
    this.#currentExtent = null;
    // And the current draw interaction.
    this.#drawInteraction = null;
    // We also have to make sure to keep track of if any other interaction is active.
    // E.g. "Remove", or "Edit".
    this.#removeInteractionActive = false;
    // We're also keeping track of the tooltip-settings
    this.#showDrawTooltip = settings.showDrawTooltip ?? true;
    this.#drawTooltip = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltipElement = null;
    this.#drawTooltipElementStyle =
      "position: relative; background: rgba(0, 0, 0, 0.5); border-radius: 4px; color: white; padding: 4px 8px; opacity: 0.7; white-space: nowrap;";
    // There might be some custom event-listeners passed when initiating the draw interaction,
    // we have to keep track of them.
    this.#customHandleDrawStart = null;
    this.#customHandleDrawEnd = null;
    this.#customHandlePointerMove = null;
    this.#customHandleAddFeature = null;

    // A Draw-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateDrawLayer();
    // We also have to initiate the element for the draw-tooltip
    this.#createDrawTooltip();
    // Let's display a warning for now, remove once it's properly tested. TODO: @Hallbergs
    console.info(
      "Initiation of Draw-model successful. Note that the model has not been properly tested yet and should not be used in critical operation."
    );
  }

  // Returns the default style settings used by the draw-model.
  #getDefaultDrawStyleSettings = () => {
    const strokeColor = "rgba(74,74,74,0.5)";
    const strokeDash = null;
    const strokeWidth = 2;
    const fillColor = "rgba(255,255,255,0.07)";
    return {
      strokeColor: strokeColor,
      lineDash: strokeDash,
      strokeWidth: strokeWidth,
      fillColor: fillColor,
    };
  };

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the draw-model.
  #handleInitiationParametersMissing = () => {
    throw new Error(
      "Failed to initiate Draw-model, - required parameters missing. \n Required parameters: map, layerName"
    );
  };

  // We have to initiate a vector layer that can be used by the draw-model
  #initiateDrawLayer = () => {
    if (this.#vectorLayerExists()) {
      return this.#connectExistingVectorLayer();
    }
    return this.#createNewDrawLayer();
  };

  // Checks wether the layerName supplied when initiating the Draw-model
  // corresponds to an already existing vector-layer.
  #vectorLayerExists = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Check wether any of the layers has the same name (type)
    // as the supplied layerName. TODO: type?!
    // Also makes sure that the found layer is a vectorLayer. (We cannot
    // add features to an imageLayer...).
    return allMapLayers.some((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
  };

  // Returns all layers connected to the map-object supplied
  // when initiating the model.
  #getAllMapLayers = () => {
    return this.#map.getLayers().getArray();
  };

  // Checks wether the name (type) of the supplied layer matches
  // the layerName supplied when initiating the model. Also makes
  // sure that the layer is a vectorLayer.
  #layerHasCorrectNameAndType = (layer) => {
    return layer.get("type") === this.#layerName && this.#isVectorLayer(layer);
  };

  // Checks wether the supplied layer is a vectorLayer or not.
  #isVectorLayer = (layer) => {
    return layer instanceof VectorLayer;
  };

  // Connects the private fields of the draw-model to an already existing
  // vectorLayer.
  #connectExistingVectorLayer = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Then we'll grab the layer corresponding to the supplied layerName.
    const connectedLayer = allMapLayers.find((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
    // Then we'll set the private fields
    this.#drawLayer = connectedLayer;
    this.#drawSource = connectedLayer.getSource();
  };

  // Creates a new vector layer that can be used by the draw-model
  #createNewDrawLayer = () => {
    // Let's grab a vector-source.
    this.#drawSource = this.#getNewVectorSource();
    // Then we'll create the layer
    this.#drawLayer = this.#getNewVectorLayer(this.#drawSource);
    // Make sure to set the layer type to something understandable.
    // TODO: Make sure type is the way to go, a bit confusing setting the
    // layer name on that property. Hmm...
    this.#drawLayer.set("type", this.#layerName);
    // FIXME: Remove "type", use only "name" throughout
    // the application. Should be done as part of #883.
    this.#drawLayer.set("name", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#drawLayer);
  };

  // Creates the element and overlay used to display the area of the feature
  // currently being drawn.
  #createDrawTooltip = () => {
    // If the element already exists in the dom (which it will if #drawTooltipElement
    //  isn't nullish), we must make sure to remove it.
    this.#removeEventualDrawTooltipElement();
    // Let's crete a element that we can use in the overlay.
    this.#drawTooltipElement = document.createElement("div");
    // Let's style the element a bit so it looks prettier...
    this.#drawTooltipElement.setAttribute(
      "style",
      this.#drawTooltipElementStyle
    );
    // Then let's create the overlay...
    this.#drawTooltip = new Overlay({
      element: this.#drawTooltipElement,
      offset: [30, -5],
      positioning: "bottom-center",
    });
    // And add it to the map!
    this.#map.addOverlay(this.#drawTooltip);
  };

  // We have to make sure that we remove eventual unused elements
  // from the dom tree so they're not lurking around.
  #removeEventualDrawTooltipElement = () => {
    // Before we do anything else, we make sire that there actually is
    // an element present.
    if (this.#drawTooltipElement) {
      // Then we can remove it
      this.#drawTooltipElement.parentNode.removeElement(
        this.#drawTooltipElement
      );
      // And clear the variable
      this.#drawTooltipElement = null;
    }
  };

  // Returns the style that should be used on the drawn features
  #getFeatureStyle = (feature) => {
    // Let's start by grabbing the standard draw style as a baseline
    const baseLineStyle = this.#getDrawStyle();
    // If showFeatureMeasurements is set to true, we create a text-style which
    // will allow us to show the measurements of the drawn feature.
    const textStyle = this.#showFeatureMeasurements
      ? this.#getFeatureTextStyle(feature)
      : null;
    // Apply the text-style to the baseline style...
    baseLineStyle.setText(textStyle);
    // And return the finished style.
    return baseLineStyle;
  };

  // Returns a text-style that shows the tooltip-label
  // (i.e. the area of the feature in a readable format).
  // *If the measurement-label is supposed to be shown!*
  #getFeatureTextStyle = (feature) => {
    return new Text({
      textAlign: "center",
      textBaseline: "middle",
      font: "12pt sans-serif",
      fill: new Fill({ color: "#FFF" }),
      text: this.#showFeatureMeasurements
        ? this.#getFeatureMeasurementLabel(feature)
        : "",
      overflow: true,
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      scale: 1,
    });
  };

  // Returns the area of the supplied feature in a readable format.
  #getFeatureMeasurementLabel = (feature) => {
    // First we must get the feature area, length, or placement.
    // (Depending on if we're dealing with Point, LineString, or surface).
    const featureMeasure = this.#getFeatureMeasurement(feature);
    // Let's grab the geometry so that we can check what we're dealing with.
    const featureGeometry = feature.getGeometry();
    // First we'll check if we're dealing with a point. If we are, we return it's
    // placement right a way. The measurement will be an array containing it's coordinates.
    if (featureGeometry instanceof Point) {
      // If we're dealing with a point, the measurement will be an array containing
      // it's coordinates.
      return `N: ${Math.round(featureMeasure[1])} E: ${Math.round(
        featureMeasure[0]
      )}`;
    }
    // Then we'll check if we're dealing with a length measurement
    const measureIsLength = featureGeometry instanceof LineString;
    // Let's check how we're gonna present the label
    switch (this.#labelFormat) {
      case "AUTO":
        // If the format is AUTO, we're checking if the measurement is large
        // enough to show it in kilometers or not. First, we need to check
        // where the cutoff point for the kilometer display is. (It will vary
        // depending on if we're measuring length or area).
        const kilometerCutoff = measureIsLength ? 1e3 : 1e6;
        // If the measurement is larger or equal to the cutoff, we return a string
        // formatted in kilometers.
        if (featureMeasure >= kilometerCutoff) {
          return this.#getKilometerMeasurementString(
            featureMeasure,
            measureIsLength
          );
        }
        // Otherwise we return a string formatted in meters.
        return this.#getMeasurementString(featureMeasure, measureIsLength);
      case "KM2":
        // If the format is "KM2", we'll show the measurement in km²
        // (Or km if we're measuring length). Rounded to show 3 decimals.
        return this.#getKilometerMeasurementString(
          featureMeasure,
          measureIsLength
        );
      case "HECTARE":
        // If the format is "HECTARE" we will show the measurement in hectare
        // if we're dealing with a surface. If we're dealing with a lineString
        // we will return the measurement with "M2" format.
        return this.#getHectareMeasurementString(
          featureMeasure,
          measureIsLength
        );
      default:
        // Otherwise m² (or m) will do. (Displayed in local format).
        return this.#getMeasurementString(featureMeasure, measureIsLength);
    }
  };

  // Returns the supplied measurement as a kilometer-formatted string.
  // If we're measuring area, km² is returned, otherwise, km is returned.
  #getKilometerMeasurementString = (featureMeasure, measureIsLength) => {
    return `${(featureMeasure / (measureIsLength ? 1e3 : 1e6)).toFixed(3)} ${
      measureIsLength ? "km" : "km²"
    }`;
  };

  // Returns the measurement in hectare if we're dealing with a surface, and if
  // we're dealing with a line-string we return the measurement in metres.
  #getHectareMeasurementString = (featureMeasure, measureIsLength) => {
    return measureIsLength
      ? this.#getMeasurementString(featureMeasure, measureIsLength)
      : `${(featureMeasure / 1e4).toFixed(3)} ha`;
  };

  // Returns the supplied measurement as a locally formatted string.
  // If we're measuring area m² is returned, otherwise, m is returned.
  #getMeasurementString = (featureMeasure, measureIsLength) => {
    return `${featureMeasure.toLocaleString()} ${measureIsLength ? "m" : "m²"}`;
  };

  // Calculates the area, length, or placement of the supplied feature.
  // Accepts an OL-feature, and is tested for Circle, LineString, Point, and Polygon.
  #getFeatureMeasurement = (feature) => {
    // Let's get the geometry-type to begin with, we are going
    // to be handling points, line-strings, and surfaces differently.
    const geometry = feature.getGeometry();
    // If we're dealing with a point, we simply return the coordinates of the point.
    if (geometry instanceof Point) {
      return geometry.getCoordinates();
    }
    // Apparently the circle geometry instance does not expose a
    // getArea method. Here's a quick fix. (Remember that this area
    // is only used as an heads-up for the user.)
    if (geometry instanceof CircleGeometry) {
      const radius = geometry.getRadius();
      return Math.round(Math.pow(radius, 2) * Math.PI);
    }
    // If we're dealing with a line we cannot calculate an area,
    // instead, we return the length.
    if (geometry instanceof LineString) {
      return Math.round(geometry.getLength());
    }
    // If we're not dealing with a circle or a line, we can just return the area.
    return Math.round(geometry.getArea());
  };

  // Returns an OL style to be used in the draw-interaction.
  #getDrawStyle = () => {
    return new Style({
      stroke: this.#getDrawStrokeStyle(),
      fill: this.#getDrawFillStyle(),
      image: this.#getDrawImageStyle(),
    });
  };

  // Returns the stroke style (based on the style settings)
  #getDrawStrokeStyle = () => {
    return new Stroke({
      color: this.#drawStyleSettings.strokeColor,
      lineDash: this.#drawStyleSettings.lineDash,
      width: this.#drawStyleSettings.strokeWidth,
    });
  };

  // Returns the fill style (based on the style settings)
  #getDrawFillStyle = () => {
    return new Fill({
      color: this.#drawStyleSettings.fillColor,
    });
  };

  // Returns the image style (based on the style settings)
  #getDrawImageStyle = () => {
    return new Circle({
      radius: 6,
      stroke: new Stroke({
        color: this.#drawStyleSettings.strokeColor,
        width: 2,
      }),
    });
  };

  // Updates the text-style on all drawn features. Used when toggling
  // if the measurement-label should be shown or not for example.
  #refreshFeaturesTextStyle = () => {
    // Get all the drawn features
    const drawnFeatures = this.#getAllDrawnFeatures();
    // Iterate the drawn features...
    drawnFeatures.forEach((feature) => {
      // Get the current style.
      const featureStyle = feature.getStyle();
      // Get an updated text-style (which depends on #showFeatureMeasurements).
      const textStyle = this.#getFeatureTextStyle(feature);
      // Set the updated text-style on the base-style.
      featureStyle.setText(textStyle);
      // Then update the feature style.
      feature.setStyle(featureStyle);
    });
  };

  // Returns a new vector source.
  #getNewVectorSource = () => {
    return new VectorSource({ wrapX: false });
  };

  // Returns a new vector layer connected to the supplied source.
  #getNewVectorLayer = (source) => {
    return new VectorLayer({
      source: source,
    });
  };

  // Returns all user drawn features from the draw-source
  #getAllDrawnFeatures = () => {
    return this.#drawSource.getFeatures().filter((feature) => {
      return feature.get("USER_DRAWN") === true;
    });
  };

  // Fits the map to the current extent of the draw-source (with some padding).
  #fitMapToExtent = () => {
    this.#map.getView().fit(this.#currentExtent, {
      size: this.#map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  // Removes all event-listeners that have been set when initiating the
  // draw interaction.
  #removeEventListeners = () => {
    // Remove the "ordinary" listeners
    this.#drawInteraction.un("drawstart", this.#handleDrawStart);
    this.#drawInteraction.un("drawend", this.#handleDrawEnd);
    this.#drawInteraction.un("drawabort", this.#handleDrawAbort);
    this.#map.un("pointermove", this.#handlePointerMove);
    this.#drawSource.un("addfeature", this.#handleDrawFeatureAdded);
    document.removeEventListener("keyup", this.#handleKeyUp);
    // Then we'll remove the custom listeners
    this.#removeCustomEventListeners();
  };

  // Adds all event-listeners needed for the the draw interaction.
  #addEventListeners = (settings) => {
    // The initiator of the draw interaction might have passed some custom functions
    // that should be called when the appropriate event fires. We have to make sure
    // to bind those if they exist.
    settings && this.#addCustomEventListeners(settings);
    // Add a listener for the draw-start-event
    this.#drawInteraction.on("drawstart", this.#handleDrawStart);
    // Add a listener for the draw-end-event
    this.#drawInteraction.on("drawend", this.#handleDrawEnd);
    // Add a listener for when drawing is aborted (e.g. if all points are
    // removed by pressing esc several times).
    this.#drawInteraction.on("drawabort", this.#handleDrawAbort);
    // We need a listener for when a feature is added to the source.
    this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
    // We need a listener for keyboard input. For example, pressing the escape
    // key will allow the users to remove the last point.
    document.addEventListener("keyup", this.#handleKeyUp);
  };

  // Adds listeners that might have been passed in the settings when
  // initiating the draw interaction.
  #addCustomEventListeners = (settings) => {
    // Let's update all internal fields so that we can keep track of the
    // custom handlers.
    this.#customHandleDrawStart = settings.handleDrawStart || null;
    this.#customHandleDrawEnd = settings.handleDrawEnd || null;
    this.#customHandlePointerMove = settings.handlePointerMove || null;
    this.#customHandleAddFeature = settings.handleAddFeature || null;
    // Then we'll add the listeners if the corresponding handler exists
    this.#customHandleDrawStart &&
      this.#drawInteraction.on("drawstart", this.#customHandleDrawStart);
    this.#customHandleDrawEnd &&
      this.#drawInteraction.on("drawend", this.#customHandleDrawEnd);
    this.#customHandlePointerMove &&
      this.#map.on("pointermove", this.#customHandlePointerMove);
    this.#customHandleAddFeature &&
      this.#drawSource.on("addfeature", this.#customHandleAddFeature);
  };

  // Removes listeners that might have been passed in the settings when
  // initiating the draw interaction.
  #removeCustomEventListeners = () => {
    // Let's unbind the listers if they ever existed
    this.#customHandleDrawStart &&
      this.#drawInteraction.un("drawstart", this.#customHandleDrawStart);
    this.#customHandleDrawEnd &&
      this.#drawInteraction.un("drawend", this.#customHandleDrawEnd);
    this.#customHandlePointerMove &&
      this.#map.on("pointermove", this.#customHandlePointerMove);
    this.#customHandleAddFeature &&
      this.#drawSource.un("addfeature", this.#customHandleAddFeature);
    // Then we have to make sure to remove the reference to the handlers.
    this.#customHandleDrawStart = null;
    this.#customHandleDrawEnd = null;
    this.#customHandlePointerMove = null;
    this.#customHandleAddFeature = null;
  };

  // This handler has a couple of jobs; add a change listener to the feature
  // currently being drawn, and register an event-handler for pointer moves.
  #handleDrawStart = (e) => {
    // Let's add a handler for the pointer event to keep
    // track of where the users pointer is located.
    this.#map.on("pointermove", this.#handlePointerMove);
    // Then we'll add a handler handling feature changes.
    const feature = e.feature;
    feature.on("change", this.#handleFeatureChange);
    // Finally, we'll make sure the feature being drawn has the correct style:
    feature.setStyle(this.#getDrawStyle());
  };

  // This handler will make sure that the overlay will be removed
  // when the feature drawing is done.
  #handleDrawEnd = (e) => {
    // Let's make sure to reset the draw tooltip
    this.#resetDrawTooltip();
    const { feature } = e;
    // We set the USER_DRAWN prop to true so that we can keep track
    // of the user drawn features.
    feature.set("USER_DRAWN", true);
    // And set a nice style on the feature to be added.
    feature.setStyle(this.#getFeatureStyle(feature));
    // Make sure to remove the event-listener for the pointer-moves.
    // (We don't want the pointer to keep updating while we're not drawing).
    this.#map.un("pointermove", this.#handlePointerMove);
  };

  // Cleans up if the drawing is aborted.
  #handleDrawAbort = () => {
    this.#resetDrawTooltip();
  };

  #resetDrawTooltip = () => {
    this.#drawTooltipElement.innerHTML = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
  };

  // This handler will make sure that we keep the measurement calculation
  // updated during the feature changes.
  #handleFeatureChange = (e) => {
    // Make the measurement calculations and update the tooltip
    const feature = e.target;
    const toolTipText = this.#getFeatureMeasurementLabel(feature);
    this.#drawTooltipElement.innerHTML = this.#showDrawTooltip
      ? toolTipText
      : null;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
  };

  // This handler has one job; get the coordinate from the event,
  // and store it for later use. *But only if the draw tooltip should be active! If
  // the draw tooltip is disabled, we set the coordinate to null*
  #handlePointerMove = (e) => {
    this.#currentPointerCoordinate = this.#showDrawTooltip
      ? e.coordinate
      : null;
  };

  // We're probably going to need a handler for when a feature is added
  #handleDrawFeatureAdded = (e) => {
    return;
  };

  // We want to handle key-up events so that we can let the user
  // remove the last drawn point by pressing the escape key. (And perhaps more...?)
  #handleKeyUp = (e) => {
    const { keyCode } = e;
    if (keyCode === 27) {
      this.#drawInteraction.removeLastPoint();
    }
  };

  // Disables the current draw interaction
  #disablePotentialInteraction = () => {
    // First we check if any of the "special" interactions are active, and if they
    // are, we disable them.
    if (this.#removeInteractionActive) {
      return this.#disableRemoveInteraction();
    }
    // If there isn't an active draw interaction currently, we just return.
    if (!this.#drawInteraction) return;
    // Otherwise, we remove the interaction from the map.
    this.#map.removeInteraction(this.#drawInteraction);
    // Then we'll make sure to remove all event-listeners
    this.#removeEventListeners();
    // We're also making sure to set the private field to null
    this.#drawInteraction = null;
    // And remove the click-lock!
    this.#map.clickLock.delete("coreDrawModel");
  };

  // Creates an object that can be returned to the initiator of a
  // set:er if the set:er fails due to a bad value provided.
  #getSetFailedObject = (field, providedValue) => {
    return {
      status: "FAILED",
      message: `Set:er failed. The set:er only accepts ${typeof field}, and was provided ${typeof providedValue}`,
    };
  };

  // Removes the first feature that is present at the supplied
  // pixel from the click-event.
  #removeClickedFeature = (e) => {
    const clickedFeatures = this.#map.getFeaturesAtPixel(e.pixel);
    clickedFeatures.length > 0 &&
      this.#drawSource.removeFeature(clickedFeatures[0]);
  };

  // Enables a remove-interaction which allows the user to remove drawn features by clicking on them.
  // We're also making sure to enable the click-lock so that the feature-info does not infer.
  #enableRemoveInteraction = () => {
    // We have to make sure to set a field so that the handlers responsible for deleting
    // all active interactions knows that there is a remove interaction to delete.
    this.#removeInteractionActive = true;
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("coreDrawModel");
    // Then we'll add the event-handler responsible for removing clicked features.
    this.#map.on("singleclick", this.#removeClickedFeature);
  };

  // Disables the remove interaction by removing the event-listener and disabling
  // the click-lock.
  #disableRemoveInteraction = () => {
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.un("singleclick", this.#removeClickedFeature);
    this.#removeInteractionActive = false;
  };

  // Accepts an RGBA-object containing r-, g-, b-, and a-properties and
  // returns the string representation of the supplied object.
  getRGBAString = (o) => {
    return `rgba(${o.r},${o.g},${o.b},${o.a})`;
  };

  // Toggles the current draw interaction. To enable the draw interaction,
  // pass one of the allowed draw-interactions: "Polygon", "Rectangle", "Circle", or "Delete"
  // as the first parameter. To disable the draw-interaction, pass nothing, or an empty string.
  toggleDrawInteraction = (drawMethod = "", settings = {}) => {
    // If this method is fired, the first thing we have to do is to remove the (potentially)
    // already active interaction. (We never want two interactions active at the same time...)
    this.#disablePotentialInteraction();
    // Check if we are supposed to be toggling the draw interaction off. If we're toggling off,
    // we make sure to abort so that we're not activating anything.
    if (!drawMethod || drawMethod === "") {
      return;
    }
    // Check if the supplied method is set to "Delete", if it is, we activate the remove
    // interaction. Since the remove-interaction is a special interaction, (not a real ol-draw-interaction)
    // we make sure not to continue executing.
    if (drawMethod === "Delete") {
      return this.#enableRemoveInteraction();
    }
    // If we've made it this far it's time to enable a new draw interaction!
    // First we must make sure to gather some settings and defaults.
    // Which draw-type should we use? (Rectangles should be created with the
    // "Circle" method apparently).
    const type = drawMethod === "Rectangle" ? "Circle" : drawMethod;
    // Are we going free-hand drawing? (We're always free if we're drawing circles
    // or rectangles).
    const freehand = ["Circle", "Rectangle"].includes(drawMethod)
      ? true
      : settings.freehand ?? false;
    // Then we'll add the interaction!
    this.#drawInteraction = new Draw({
      source: this.#drawSource,
      type: type,
      freehand: freehand,
      stopClick: true,
      geometryFunction:
        drawMethod === "Rectangle"
          ? createBox()
          : drawMethod === "Circle"
          ? createRegularPolygon()
          : null,
      style: this.#getDrawStyle(),
    });
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("coreDrawModel");
    // Then we'll add all draw listeners
    this.#addEventListeners(settings);
    // Then we'll add the interaction to the map!
    this.#map.addInteraction(this.#drawInteraction);
  };

  // Fits the map to the extent of the drawn features in the draw-source
  zoomToCurrentExtent = () => {
    // Let's make sure that the current extent is not null.
    if (this.#currentExtent === null) {
      return;
    }
    // If the extent is not null, we'll check that the current extent is finite
    if (this.#currentExtent.map(Number.isFinite).includes(false) === false) {
      // If it is, we can fit the map to that extent!
      this.#fitMapToExtent(this.#currentExtent);
    }
  };

  // We will need a way to remove all drawn features from the draw-source.
  // Why aren't we using a simple "clear()" one might ask =>  simply because
  // the draw-source might be connected to the search-source for example, and we
  // don't want to remove all search features, only the user drawn ones.
  removeDrawnFeatures = () => {
    // Let's get all the features in the draw-source that have been drawn
    const drawnFeatures = this.#getAllDrawnFeatures();
    // Since OL does not supply a "removeFeatures" method, we have to map
    // over the array, and remove every single feature one by one...
    drawnFeatures.forEach((feature) => {
      this.#drawSource.removeFeature(feature);
    });
    // When the drawn features has been removed, we have to make sure
    // to update the current extent.
    this.#currentExtent = this.#drawSource.getExtent();
    return { status: "SUCCESS", removedFeatures: drawnFeatures };
  };

  setLabelFormat = (format) => {
    if (!format || !this.#allowedLabelFormats.includes(format)) {
      return {
        status: "FAILED",
        message: "Provided label-format is not supported.",
      };
    }
    this.#labelFormat = format;
    this.#refreshFeaturesTextStyle();
    return { status: "SUCCESS", message: `Label-format changed to ${format}` };
  };

  // Set:er allowing us to change which layer the draw-model will interact with
  setLayer = (layerName) => {
    // We're not allowing the layer to be changed while the draw interaction is active...
    if (this.#drawInteraction !== null) {
      console.warn(
        "The layer cannot be changed. The draw interaction is currently active. Disable the draw interaction before changing layer."
      );
      return { status: "FAILED", message: "Disable draw to change layer." };
    }
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the draw-layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateDrawLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#drawSource.getExtent();
    return { status: "SUCCESS", message: `Layer changed to ${layerName}` };
  };

  // Set:er allowing us to change if a tooltip should be shown when drawing
  // TODO: Handle side effects
  setShowDrawTooltip = (drawTooltipActive) => {
    // Let's make sure we're provided proper input before we set anything
    if (typeof drawTooltipActive !== "boolean") {
      // If we were not, let's return a fail message
      return this.#getSetFailedObject(this.#showDrawTooltip, drawTooltipActive);
    }
    // If we've made it this far, we can go ahead and set the internal value.
    this.#showDrawTooltip = drawTooltipActive;
    // And return a success-message
    return {
      status: "SUCCESS",
      message: `Draw tooltip is now ${drawTooltipActive ? "shown" : "hidden"}`,
    };
  };

  // Set:er allowing us to change if measurements of the drawn features should
  // be shown or not. Also makes sure to refresh the current features text-style.
  setShowFeatureMeasurements = (showFeatureMeasurements) => {
    // Let's make sure we're provided proper input before we set anything
    if (typeof showFeatureMeasurements !== "boolean") {
      // If we were not, let's return a fail message
      return this.#getSetFailedObject(
        this.showFeatureMeasurements,
        showFeatureMeasurements
      );
    }
    // If we've made it this far, we can go ahead and set the internal value.
    this.#showFeatureMeasurements = showFeatureMeasurements;
    // Then we have to refresh the style so that the change is shown.
    this.#refreshFeaturesTextStyle();
    // And return a success-message
    return {
      status: "SUCCESS",
      message: `Measurement labels are now ${
        showFeatureMeasurements ? "shown" : "hidden"
      }`,
    };
  };

  // Set:er allowing us to change the style settings used in the draw-layer
  // The fill- and strokeColor passed might be either a string, or an object containing
  // r-, g-, b-, and a-properties. If they are objects, we have to make sure to parse them
  // to strings before setting the new style-settings.
  // TODO: Handle side effects
  setDrawStyleSettings = (newStyleSettings) => {
    // The fill- and strokeColor might have to be parsed to strings, let's
    // destruct them and parse them if we have to.
    const { fillColor, strokeColor } = newStyleSettings;
    // Create a new object containing the potentially parsed objects.
    const parsedStyle = {
      // We still want to pass all the other settings...
      ...newStyleSettings,
      //... and the potentially parsed colors.
      fillColor:
        typeof fillColor === "object"
          ? this.getRGBAString(fillColor)
          : fillColor,
      strokeColor:
        typeof strokeColor === "object"
          ? this.getRGBAString(strokeColor)
          : strokeColor,
    };
    // Then we'll update the style.
    this.#drawStyleSettings = parsedStyle;
  };

  // Get:er returning the name of the draw-layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the currently connected Vector-source
  getCurrentVectorSource = () => {
    return this.#drawSource;
  };

  // Get:er returning the current extent of the draw-source.
  getCurrentExtent = () => {
    return this.#currentExtent;
  };

  // Get:er returning the current label-format
  getLabelFormat = () => {
    return this.#labelFormat;
  };

  // Get:er returning the state of the showDrawTooltip
  getShowDrawTooltip = () => {
    return this.#showDrawTooltip;
  };

  // Get:er returning the state of the showFeatureMeasurements
  getShowFeatureMeasurements = () => {
    return this.#showFeatureMeasurements;
  };

  // Get:er returning the current draw-style settings
  getDrawStyleSettings = () => {
    return this.#drawStyleSettings;
  };
}
export default DrawModel;
