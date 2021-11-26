import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";

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
  #showDrawTooltip;
  #showFeatureMeasurements;
  #drawStyleSettings;

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
    // We are going to be keeping track of the current extent of the draw-source.
    this.#currentExtent = null;
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
    // Let's create a layer
    this.#drawLayer = this.#getNewVectorLayer(this.#drawSource);
    // Make sure to set the layer type to something understandable.
    // TODO: Make sure type is the way to go, a bit confusing setting the
    // layer name on that property. Hmm...
    this.#drawLayer.set("type", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#drawLayer);
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
