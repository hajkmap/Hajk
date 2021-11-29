import { Draw } from "ol/interaction";
import { createBox, createRegularPolygon } from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import { Circle as CircleGeometry, LineString } from "ol/geom.js";

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
 * - zoomToCurrentExtent(): Fits the map-view to the current extent of the current draw-source.
 * - get/set showDrawTooltip(): Get or set wether a tooltip should be shown when drawing.
 * - get/set drawStyleSettings(): Get or set the style settings used by the draw-model.
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
  #labelFormat;
  #showFeatureArea;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    this.#showDrawTooltip = settings.drawTooltip ?? true;
    this.#showFeatureMeasurements = settings.showFeatureMeasurements ?? true;
    this.#drawStyleSettings =
      settings.drawStyleSettings ?? this.#getDefaultDrawStyleSettings();
    this.#labelFormat = settings.labelFormat ?? "M2"; // ["M2", "KM2"]
    this.#showFeatureArea = settings.showFeatureArea ?? true;
    // We are going to be keeping track of the current extent of the draw-source...
    this.#currentExtent = null;
    // And the current draw interaction.
    this.#drawInteraction = null;
    // We're also keeping track of the tooltip-settings
    this.#drawTooltip = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltipElement = null;
    this.#drawTooltipElementStyle =
      "position: relative; background: rgba(0, 0, 0, 0.5); border-radius: 4px; color: white; padding: 4px 8px; opacity: 0.7; white-space: nowrap;";

    // A Draw-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateDrawLayer();
    // Let's display a warning for now, remove once it's properly tested. TODO: @Hallbergs
    console.info(
      "Initiation of Draw-model successful. Note that the model has not been properly tested yet and should not be used in critical operation."
    );
  }

  // Returns the default style settings used by the draw-model.
  #getDefaultDrawStyleSettings = () => {
    const strokeColor = "rgba(74,74,74,0.5)";
    const fillColor = "rgba(255,255,255,0.07)";
    return { strokeColor: strokeColor, fillColor: fillColor };
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
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#drawLayer);
  };

  // Returns the style that should be used on the drawn features
  #getFeatureStyle = (feature) => {
    // Let's start by grabbing the standard draw style as a baseline
    const baseLineStyle = this.#getDrawStyle();
    // If showFeatureArea is set to true, we create a text-style which
    // will allow us to show the area of the drawn feature.
    const textStyle = this.#showFeatureArea
      ? this.#getFeatureTextStyle(feature)
      : null;
    // Apply the text-style to the baseline style...
    baseLineStyle.setText(textStyle);
    // And return the finished style.
    return baseLineStyle;
  };

  // Returns a text-style that shows the tooltip-label
  // (i.e. the area of the feature in a readable format).
  #getFeatureTextStyle = (feature) => {
    return new Text({
      textAlign: "center",
      textBaseline: "middle",
      font: "12pt sans-serif",
      fill: new Fill({ color: "#FFF" }),
      text: this.#getFeatureMeasurementLabel(feature),
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
    // First we must get the feature area or length
    const featureMeasure = this.#getFeatureAreaOrLength(feature);
    // Then we'll check if we're dealing with a length measurement
    const measureIsLength = feature.getGeometry() instanceof LineString;
    // Let's check if we're gonna show the area in square kilometers
    if (this.#labelFormat === "KM2") {
      // If so, we'll show the area in km². Rounded to show 3 decimals.
      return `${(featureMeasure / 1e6).toFixed(3)} ${
        measureIsLength ? "km" : "km²"
      }`;
    }
    // Otherwise m² will do. (Displayed in local format).
    return `${featureMeasure.toLocaleString()} ${measureIsLength ? "m" : "m²"}`;
  };

  // Calculates the area of the supplied feature.
  // Accepts an OL-feature, and is tested for Circle and Polygon.
  #getFeatureAreaOrLength = (feature) => {
    const geometry = feature.getGeometry();
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
      width: 4,
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

  // TODO: Handle un-named arrow-functions
  #removeEventListeners = () => {
    this.#drawInteraction.un("drawstart", this.#handleDrawStart);
    this.#drawInteraction.un("drawend", this.#handleDrawEnd);
    this.#map.un("pointermove", this.#handlePointerMove);
    this.#drawSource.un("addfeature", this.#handleDrawFeatureAdded);
  };

  #addDrawListeners = (settings) => {
    // The initiator of the draw interaction might have passed some custom functions
    // that should be called when the appropriate event fires. Make sure to pass these
    // functions to the handlers.
    const {
      handleDrawStart,
      handleDrawEnd,
      handlePointerMove,
      handleAddFeature,
    } = settings;
    // Add a listener for the draw-start-event
    this.#drawInteraction.on("drawstart", (e) =>
      this.#handleDrawStart(e, handleDrawStart)
    );
    // Add a listener for the draw-end-event
    this.#drawInteraction.on("drawend", (e) =>
      this.#handleDrawEnd(e, handleDrawEnd)
    );
    // We'll also want a handler for the pointer event to keep
    // track of where the users pointer is located.
    this.#map.on("pointermove", (e) =>
      this.#handlePointerMove(e, handlePointerMove)
    );
    // We need a listener for when a feature is added to the source.
    this.#drawSource.on("addfeature", (e) =>
      this.#handleDrawFeatureAdded(e, handleAddFeature)
    );
  };

  // This handler has one job; add a change listener to the feature
  // currently being drawn. (Besides running the eventual passed function)
  #handleDrawStart = (e, upstreamFunction) => {
    // First of all, lets run the supplied function
    upstreamFunction && upstreamFunction(e);
    // Then we'll add the listener
    const feature = e.feature;
    feature.on("change", this.#handleFeatureChange);
  };

  // This handler will make sure that the overlay will be removed
  // when the feature drawing is done. (And run the eventual passed function)
  #handleDrawEnd = (e, upstreamFunction) => {
    // First of all, lets run the supplied function
    upstreamFunction && upstreamFunction(e);
    // Then we'll make sure to remove the draw tooltip
    const { feature } = e;
    this.#drawTooltipElement.innerHTML = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
    // And set a nice style on the feature to be added.
    feature.setStyle(this.#getFeatureStyle(feature));
  };

  // This handler will make sure that we keep the area calculation
  // updated during the feature changes.
  #handleFeatureChange = (e) => {
    // Make the area calculations and update the tooltip
    const feature = e.target;
    const toolTipText = this.#getFeatureMeasurementLabel(feature);
    this.#drawTooltipElement.innerHTML = toolTipText;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
  };

  // This handler has one job; get the coordinate from the event,
  // and store it for later use. (Besides running the eventual passed function)
  #handlePointerMove = (e, upstreamFunction) => {
    // First of all, lets run the supplied function
    upstreamFunction && upstreamFunction(e);
    // Then we'll store the coordinate
    this.#currentPointerCoordinate = e.coordinate;
  };

  // We're probably going to need a handler for when a feature is added
  #handleDrawFeatureAdded = (e, upstreamFunction) => {
    // First of all, lets run the supplied function
    upstreamFunction && upstreamFunction(e);
    console.log("Handle feature added! e: ", e);
  };

  // Disables the current draw interaction
  #disableDrawInteraction = () => {
    // If there isn't an active draw interaction currently, we just return.
    if (!this.#drawInteraction) return;
    // Otherwise, we remove the interaction from the map.
    this.#map.removeInteraction(this.#drawInteraction);
    // Then we'll make sure to remove all event-listeners
    this.#removeEventListeners();
    // And remove the click-lock!
    this.#map.clickLock.delete("coreDrawModel");
  };

  // Toggles the current draw interaction. To enable the draw interaction,
  // pass one of the allowed draw-interactions: "Polygon", "Rectangle", or "Circle"
  // as the first parameter. To disable the draw-interaction, pass nothing, or an empty string.
  toggleDrawInteraction = (drawMethod, settings) => {
    // Check if we are supposed to be toggling the draw interaction off.
    if (!drawMethod || drawMethod === "") {
      return this.#disableDrawInteraction();
    }
    // Check if there is a draw interaction active currently. If there is,
    // disable it before moving on.
    if (this.#drawInteraction) {
      this.#disableDrawInteraction();
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
    this.#addDrawListeners(settings);
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
  //  don't want to remove all search features, only the user drawn ones.
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
  };

  // Set:er allowing us to change which layer the draw-model will interact with
  setLayer = (layerName) => {
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the draw-layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateDrawLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#drawSource.getExtent();
  };

  // Set:er allowing us to change if a tooltip should be shown when drawing
  // TODO: Handle side effects
  setShowDrawTooltip = (drawTooltipActive) => {
    this.#showDrawTooltip = drawTooltipActive;
  };

  // Set:er allowing us to change if measurements of the drawn features should
  // be shown or not. // TODO: Handle side effects
  setShowFeatureMeasurements = (showFeatureMeasurements) => {
    this.#showFeatureMeasurements = showFeatureMeasurements;
  };

  // Set:er allowing us to change the style settings used in the draw-layer
  // TODO: Handle side effects
  setDrawStyleSettings = (newStyleSettings) => {
    this.#drawStyleSettings = newStyleSettings;
  };

  // Get:er returning the name of the draw-layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the current extent of the draw-source.
  getCurrentExtent = () => {
    return this.#currentExtent;
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
