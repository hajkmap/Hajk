import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";

class MapViewModel {
  #map;
  #localObserver;
  #drawStyleSettings;
  #draw;
  #drawSource;
  #drawLayer;

  constructor(settings) {
    this.#map = settings.map;
    this.#localObserver = settings.localObserver;

    this.#drawStyleSettings = this.#getDrawStyleSettings();
    this.#draw = null;
    this.#initDrawLayer();
    this.#bindSubscriptions();
  }

  // Initializes the layer in which the user will be adding their
  // drawn geometries.
  #initDrawLayer = () => {
    // Let's grab a vector-source.
    this.#drawSource = this.#getNewVectorSource();
    // Let's create a layer
    this.#drawLayer = this.#getNewVectorLayer(
      this.#drawSource,
      this.#getDrawStyle()
    );
    // Make sure to set the layer type to something understandable.
    this.#drawLayer.set("type", "fmeServerDrawLayer");
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#drawLayer);
  };

  // We must make sure that we are listening to the appropriate events from
  // the local observer.
  #bindSubscriptions = () => {
    // Will fire when the user changes tool
    this.#localObserver.subscribe(
      "map.toggleDrawMethod",
      this.#toggleDrawMethod
    );
    // Will fire when the user wants to reset the drawing.
    this.#localObserver.subscribe("map.resetDrawing", this.#resetDrawing);
    // Will fire when we want to collect all drawn features
    this.#localObserver.subscribe(
      "map.getDrawnFeatures",
      this.#getDrawnFeatures
    );
  };

  // Returns the style settings used in the OL-style.
  #getDrawStyleSettings = () => {
    const strokeColor = "rgba(74,74,74,0.5)";
    const fillColor = "rgba(255,255,255,0.07)";
    return { strokeColor: strokeColor, fillColor: fillColor };
  };

  // Returns an OL style to be used in the draw-layer.
  #getDrawStyle = () => {
    return new Style({
      stroke: new Stroke({
        color: this.#drawStyleSettings.strokeColor,
        width: 4,
      }),
      fill: new Fill({
        color: this.#drawStyleSettings.fillColor,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.#drawStyleSettings.strokeColor,
          width: 2,
        }),
      }),
    });
  };

  // Returns a new vector source.
  #getNewVectorSource = () => {
    return new VectorSource({ wrapX: false });
  };

  // Returns a new vector layer.
  #getNewVectorLayer = (source, style) => {
    return new VectorLayer({
      source: source,
      style: style,
    });
  };

  // Removes the draw interaction if there is one active
  #removeDrawInteraction = () => {
    if (this.#draw) {
      this.#map.removeInteraction(this.#draw);
    }
  };

  // Toggles the draw method
  #toggleDrawMethod = (drawStyle) => {
    console.log("drawStyle: ", drawStyle);
  };

  // Resets the draw-layer
  #resetDrawing = () => {
    console.log("Resetting draw!");
    this.#drawSource.clear();
    this.#removeDrawInteraction();
  };

  // Returns all drawn features.
  // TBD: Return OL- or GJ-features. Hmm...
  #getDrawnFeatures = () => {
    return this.#drawSource.getFeatures();
  };
}
export default MapViewModel;
