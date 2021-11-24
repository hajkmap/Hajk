import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import KML from "ol/format/KML.js";

/*
 * A model supplying useful KML-functionality.
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the KML-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 *
 * Exposes a couple of methods:
 * - getLayerName(): Returns the name of the vectorLayer that is connected to the model.
 * - parseFeatures(kmlString): Accepts a KML-string and tries to parse it to OL-features.
 * - import(kmlString): Accepts a KML-string and adds the KML-features to the layer.
 */
class KmlModel {
  #map;
  #layerName;
  #kmlSource;
  #kmlLayer;
  #parser;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    // We are gonna need a kml parser obviously.
    this.#parser = new KML();
    // A KML-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateKmlLayer();
  }

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the KML-model.
  #handleInitiationParametersMissing = () => {
    throw new Error(
      "Failed to initiate KML-model, - required parameters missing. \n Required parameters: map, layerName"
    );
  };

  // We have to initiate a vector layer that can be used to display the imported features.
  #initiateKmlLayer = () => {
    if (this.#vectorLayerExists()) {
      return this.#connectExistingVectorLayer();
    }
    return this.#createNewKmlLayer();
  };

  // Checks wether the layerName supplied when initiating the KML-model
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

  // Connects the private fields of the KML-model to an already existing
  // vectorLayer.
  #connectExistingVectorLayer = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Then we'll grab the layer corresponding to the supplied layerName.
    const connectedLayer = allMapLayers.find((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
    // Then we'll set the private fields
    this.#kmlLayer = connectedLayer;
    this.#kmlSource = connectedLayer.getSource();
  };

  // Creates a new vector layer that can be used to display KML-features.
  #createNewKmlLayer = () => {
    // Let's grab a vector-source.
    this.#kmlSource = this.#getNewVectorSource();
    // Let's create a layer
    this.#kmlLayer = this.#getNewVectorLayer(this.#kmlSource);
    // Make sure to set the layer type to something understandable.
    // TODO: Make sure type is the way to go, a bit confusing setting the
    // layer name on that property. Hmm...
    this.#kmlLayer.set("type", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#kmlLayer);
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

  // Translates the supplied feature to the map-views coordinate system.
  #translateFeatureToViewSrs = (feature) => {
    // Let's get the geometry-type to begin with
    const geometryType = feature?.getGeometry?.().getType?.() ?? null;
    // If no geometry-type could be fetched from the supplied feature, we make sure
    // to terminate to avoid errors.
    if (geometryType === null) return null;
    // We are going to be using the view of the map when translating, let's get it
    const mapViewProjection = this.map.getView().getProjection();
    // The kml-parser which has been used to extract features from the .kml-file can return
    // a bunch of geometry-types. We have to make sure that we handle each of them.
    feature.getGeometry().transform("EPSG:4326", mapViewProjection);
  };

  // Translates the supplied features to the map-views coordinate system.
  #translateFeaturesToViewSrs = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we translate every feature to the map-views coordinate system.
    features.forEach((feature) => {
      this.#translateFeatureToViewSrs(feature);
    });
  };

  // Tries to parse features from the supplied kml-string.
  // Returns an object on the following form:
  // {features: <Array of ol-features>, error: <String with potential error message>}
  // **The returned features are translated to the map-views coordinate system.**
  parseFeatures = (kmlString) => {
    try {
      // First we must parse the string to ol-features
      const features = this.#parser.readFeatures(kmlString) ?? [];
      // Then we must make sure to translate all the features to
      // the current map-views coordinate system.
      this.#translateFeaturesToViewSrs(features);
      // Then we can return the features
      return { features: features, error: null };
    } catch (exception) {
      // If we happen to hit a mine, we make sure to return the error
      // message and an empty array.
      return { features: [], error: exception.message };
    }
  };

  // Tries to parse features from a KML-string and then add them to
  // the kml-source.
  import = (kmlString) => {
    // Start by trying to parse the kml-string
    const { features, error } = this.parseFeatures(kmlString);
    // If the parsing led to any kind of error, we make sure to abort
    // and return the error to the initiator.
    if (error !== null) {
      return { status: "FAILED", error: error };
    }
    // Otherwise we add the parsed features to the kml-source and return
    // a success message to the initiator.
    this.#kmlSource.addFeatures(features);
    return { status: "SUCCESS", error: null };
  };

  // Make sure to supply a get:er returning the name of the KML-layer.
  getLayerName = () => {
    return this.#layerName;
  };
}
export default KmlModel;
