import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";

class KmlModel {
  #map;
  #layerName;
  #kmlSource;
  #kmlLayer;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    // A KML-model is not really useful without a vector-layer, let's initiate it
    // right away.
    this.#initiateKmlLayer();
  }

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the KML-model.
  #handleParametersMissing = () => {
    throw new Error(
      "Failed to initiate KML-model, - required parameters missing. \n Required parameters: map, layerName"
    );
  };

  // We have to initiate a vector layer that can be used to display
  // the imported features.
  #initiateKmlLayer = () => {
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

  // Make sure to supply a get:er returning the name of the KML-layer.
  getLayerName = () => {
    return this.#layerName;
  };
}
export default KmlModel;
