import { Draw } from "ol/interaction";
import { Circle as CircleGeometry } from "ol/geom.js";
import { createBox } from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Overlay from "ol/Overlay.js";
import { handleClick } from "../../../models/Click";

class MapViewModel {
  #map;
  #localObserver;
  #drawStyleSettings;
  #draw;
  #drawSource;
  #drawLayer;
  #drawTooltipElement;
  #drawTooltip;

  constructor(settings) {
    this.#map = settings.map;
    this.#localObserver = settings.localObserver;
    this.#draw = null;
    this.#drawTooltipElement = null;
    this.#drawTooltip = null;

    this.#drawStyleSettings = this.#getDrawStyleSettings();
    this.#initDrawLayer();
    this.#bindSubscriptions();
    this.#createDrawTooltip();
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

  // Creates the element and overlay used to display the area of the feature
  // currently being drawn.
  #createDrawTooltip = () => {
    // If the element already exists in the dom (which it will if #drawTooltipElement
    //  isn't nullish), we must make sure to remove it.
    this.#removeEventualDrawTooltipElement();
    // Let's crete a element that we can use in the overlay.
    this.#drawTooltipElement = document.createElement("div");
    // Then let's create the overlay...
    this.#drawTooltip = new Overlay({
      element: this.#drawTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center",
    });
    // And add it to the map!
    this.#map.addOverlay(this.#drawTooltip);
  };

  #removeEventualDrawTooltipElement = () => {
    if (this.#drawTooltipElement) {
      this.#drawTooltipElement.parentNode.removeElement(
        this.#drawTooltipElement
      );
      this.#drawTooltip = null;
    }
  };

  #removeEventualDrawTooltipOverlay = () => {
    if (this.#drawTooltip) {
      this.#map.removeOverlay(this.#drawTooltip);
      this.#drawTooltip = null;
    }
  };

  #cleanupMapOverlays = () => {
    this.#removeEventualDrawTooltipElement();
    this.#removeEventualDrawTooltipOverlay();
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
  #toggleDrawMethod = (drawMethod, freehand = false) => {
    // We begin with removing potential existing draw
    this.#removeDrawInteraction();
    // And also remove potential event listeners
    this.#map.un("singleclick", this.#handleSelectFeatureClick);
    this.#drawSource.un("addfeature", this.#handleDrawFeatureAdded);
    // If the interaction is "Select" we dont wan't a draw method
    if (drawMethod === "Select") {
      return this.#enableSelectFeaturesSearch();
    }
    // Then we have to check wether the user is toggling on or off
    if (drawMethod !== "") {
      // If the drawMethod contains something, they want to toggle on!
      this.#draw = new Draw({
        source: this.#drawSource,
        // Rectangles should be created with the "Circle" method
        // apparently.
        type: drawMethod === "Rectangle" ? "Circle" : drawMethod,
        // We want freehand drawing for rectangles and circles
        freehand: ["Circle", "Rectangle"].includes(drawMethod)
          ? true
          : freehand,
        stopClick: true,
        geometryFunction: drawMethod === "Rectangle" ? createBox() : null,
        style: this.#getDrawStyle(),
      });
      // Let's add the clickLock to avoid the featureInfo
      this.#map.clickLock.add("fmeServer");
      // Then we'll add a listener for when the drawing starts
      this.#draw.on("drawstart", this.#handleDrawStart);
      // Then we'll add the interaction to the map!
      this.#map.addInteraction(this.#draw);
      // We need a listener for when a feature is added to the source.
      this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
    } else {
      // If no method was supplied, the user is toggling draw off!
      this.#map.removeInteraction(this.#draw);
      this.#map.clickLock.delete("fmeServer");
    }
  };

  #enableSelectFeaturesSearch = () => {
    this.#map.clickLock.add("search");
    this.#map.on("singleclick", this.#handleSelectFeatureClick);
    this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
  };

  #handleSelectFeatureClick = (event) => {
    handleClick(event, event.map, (response) => {
      const features = response.features;
      if (features.length === 0) {
        return;
      }
      this.#drawSource.addFeatures(response.features);
    });
  };

  #handleDrawFeatureAdded = () => {
    try {
      let totalArea = 0;
      const features = this.#getDrawnFeatures();
      features.map((feature) => {
        return (totalArea += this.#getFeatureArea(feature));
      });
      this.#localObserver.publish("map.featureAdded", {
        error: totalArea === 0,
        features: features,
        totalArea: totalArea,
      });
    } catch (error) {
      this.#localObserver.publish("map.featureAdded", {
        error: true,
        features: [],
      });
    }
  };

  // This handler has one job; add a change listener to the feature
  // currently being drawn.
  #handleDrawStart = (e) => {
    const feature = e.feature;
    feature.on("change", this.#handleFeatureChange);
  };

  // This handler will make sure that we keep the area calculation
  // updated during the feature changes.
  #handleFeatureChange = (e) => {
    const feature = e.target;
    const featureArea = this.#getFeatureArea(feature);
    console.log("Change fire: featureArea: ", featureArea);
  };

  // Calculates the area of the supplied feature.
  // Accepts an OL-feature, and is tested for Circle and Polygon.
  #getFeatureArea = (feature) => {
    const geometry = feature.getGeometry();
    // Apparently the circle geometry instance does not expose a
    // getArea method. Here's a quick fix. (Remember that this area
    // is only used as an heads-up for the user.)
    if (geometry instanceof CircleGeometry) {
      const radius = geometry.getRadius();
      return Math.round(Math.pow(radius, 2) * Math.PI);
    }
    // If we're not dealing with a circle, we can just return the area.
    return Math.round(geometry.getArea());
  };

  // Resets the draw-layer
  #resetDrawing = () => {
    console.log("Resetting draw!");
    this.#drawSource.clear();
    this.#removeDrawInteraction();
    this.#cleanupMapOverlays();
  };

  // Returns all drawn features.
  // TBD: Return OL- or GJ-features. Hmm...
  #getDrawnFeatures = () => {
    return this.#drawSource.getFeatures();
  };
}
export default MapViewModel;
