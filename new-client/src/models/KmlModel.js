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
 * - parseFeatures(kmlString): Accepts a KML-string and tries to parse it to OL-features.
 * - import(kmlString): Accepts a KML-string and adds the KML-features to the layer.
 * - removeImportedFeatures(): Removes all imported features from the kml-source.
 * - zoomToCurrentExtent(): Zooms the map to the current extent of the kml-source.
 * - setLayer(layerName): Accepts a string containing a layer name. Will set current layer.
 * - getCurrentLayerName(): Returns the name of the vectorLayer that is currently connected to the model.
 * - getCurrentExtent(): Returns the current extent of the kml-source.
 */
class KmlModel {
  #map;
  #layerName;
  #kmlSource;
  #kmlLayer;
  #parser;
  #currentExtent;

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
    // We are going to be keeping track of the current extent of the kml-source.
    this.#currentExtent = null;
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
    const mapViewProjection = this.#map.getView().getProjection();
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

  #tagFeaturesAsImported = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we set the "KML_IMPORT" property to true
    features.forEach((feature) => {
      feature.set("KML_IMPORT", true);
    });
  };

  // Returns all features from the kml-source that are tagged
  // as imported.
  #getAllImportedFeatures = () => {
    return this.#kmlSource.getFeatures().filter((feature) => {
      return feature.get("KML_IMPORT") === true;
    });
  };

  // Checks wether there are any features in the kml-source or not.
  #kmlSourceHasFeatures = () => {
    return this.#kmlSource.getFeatures().length > 0;
  };

  // Fits the map to the current extent of the kml-source (with some padding).
  #fitMapToExtent = () => {
    this.#map.getView().fit(this.#currentExtent, {
      size: this.#map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  // Tries to parse features from the supplied kml-string.
  // Accepts a kmlString and an optional second parameter stating if
  // the features should be translated to the map-views srs or not.
  // Returns an object on the following form:
  // {features: <Array of ol-features>, error: <String with potential error message>}
  // **The returned features are translated to the map-views coordinate system.**
  parseFeatures = (kmlString, translateToViewSrs = true) => {
    try {
      // First we must parse the string to ol-features
      const features = this.#parser.readFeatures(kmlString) ?? [];
      // Let's make sure to tag all imported features so that we can
      // distinguish them from "ordinary" features.
      this.#tagFeaturesAsImported(features);
      // Then we must make sure to translate all the features to
      // the current map-views coordinate system. (If the user has not
      // explicitly told us no to!)
      translateToViewSrs && this.#translateFeaturesToViewSrs(features);
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
  // Accepts an kmlString and an optional parameter stating if the map should
  // zoom the the imported features extent or not.
  import = (kmlString, zoomToExtent = true) => {
    // Start by trying to parse the kml-string
    const { features, error } = this.parseFeatures(kmlString);
    // If the parsing led to any kind of error, we make sure to abort
    // and return the error to the initiator.
    if (error !== null) {
      return { status: "FAILED", error: error };
    }
    // Otherwise we add the parsed features to the kml-source.
    this.#kmlSource.addFeatures(features);
    // We have to make sure to update the current extent when we've added
    // features to the kml-source.
    this.#currentExtent = this.#kmlSource.getExtent();
    // Then we make sure to zoom to the current extent (unless the initiator
    // has told us not to!).
    zoomToExtent && this.zoomToCurrentExtent();
    // Finally we return a success message to the initiator.
    return { status: "SUCCESS", error: null };
  };

  // Fits the map to the extent of the features currently in the kml-layer
  zoomToCurrentExtent = () => {
    // First we make sure to check wether the kml-source has any features
    // or not. If none exist, what would we zoom to?!
    if (!this.#kmlSourceHasFeatures()) {
      return;
    }
    // Let's also make sure that the current extent is not null.
    if (this.#currentExtent === null) {
      return;
    }
    // If there are features, and the extent is not null, we'll check
    // that the current extent is finite
    if (this.#currentExtent.map(Number.isFinite).includes(false) === false) {
      // If it is, we can fit the map to that extent!
      this.#fitMapToExtent(this.#currentExtent);
    }
  };

  // We will need a way to remove all imported features from the kml-source.
  // Why aren't we using a simple "clear()" one might ask =>  simply because
  // the kml-source might be the draw-source, and we don't want to remove
  // all drawn features, only the imported ones.
  removeImportedFeatures = () => {
    // Let's get all the features in the kml-source that have been imported
    const importedFeatures = this.#getAllImportedFeatures();
    // Since OL does not supply a "removeFeatures" method, we have to map
    // over the array, and remove every single feature one by one...
    importedFeatures.forEach((feature) => {
      this.#kmlSource.removeFeature(feature);
    });
    // When the imported features has been removed, we have to make sure
    // to update the current extent.
    this.#currentExtent = this.#kmlSource.getExtent();
  };

  // Set:er allowing us to change which layer the kml-model will interact with
  setLayer = (layerName) => {
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the kml-layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateKmlLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#kmlSource.getExtent();
  };

  // Get:er returning the name of the KML-layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the current extent of the kml-source.
  getCurrentExtent = () => {
    return this.#currentExtent;
  };
}
export default KmlModel;
