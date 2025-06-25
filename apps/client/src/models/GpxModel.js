import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GPX from "ol/format/GPX";
import { saveAs } from "file-saver";

/*
 * A model supplying useful GPX-functionality.
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the GPX-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of .gpx-files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 *
 * Exposes a couple of methods:
 * - parseFeatures(gpxString, settings): Accepts a GPX-string and tries to parse it to OL-features.
 * - import(gpxString, settings): Accepts a GPX-string and adds the GPX-features to the layer.
 * - export(): Exports all features in the current gpx-layer.
 * - zoomToCurrentExtent(): Zooms the map to the current extent of the gpx-source.
 * - setLayer(layerName): Accepts a string containing a layer name. Will set current layer.
 * - getCurrentLayerName(): Returns the name of the vectorLayer that is currently connected to the model.
 * - getCurrentExtent(): Returns the current extent of the gpx-source.
 */
class GpxModel {
  #map;
  #layerName;
  #drawModel;
  #gpxSource;
  #gpxLayer;
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
    this.#drawModel = settings.drawModel || null;

    // If a setting to enable drag-and-drop has been passed, we have to initiate
    // the listeners for that.
    settings.enableDragAndDrop && this.#addMapDropListeners();
    // We are gonna need a gpx parser obviously.
    this.#parser = new GPX();
    // We are going to be keeping track of the current extent of the gpx-source.
    this.#currentExtent = null;
    // A GPX-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateGpxLayer();
  }

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the GPX-model.
  #handleInitiationParametersMissing = () => {
    throw new Error(
      "Failed to initiate GPX-model, - required parameters missing. \n Required parameters: map, layerName"
    );
  };

  // We have to initiate a vector layer that can be used to display the imported features.
  #initiateGpxLayer = () => {
    if (this.#vectorLayerExists()) {
      return this.#connectExistingVectorLayer();
    }
    return this.#createNewGpxLayer();
  };

  // Adds listeners so that .gpx-files can be drag-and-dropped into the map,
  // triggering an import.
  #addMapDropListeners = () => {
    const mapDiv = document.getElementById("map");
    ["drop", "dragover", "dragend", "dragleave", "dragenter"].forEach(
      (eventName) => {
        mapDiv.addEventListener(
          eventName,
          this.#preventDefaultDropBehavior,
          false
        );
      }
    );

    mapDiv.addEventListener("drop", this.#handleDrop, false);
  };

  // Prevents the default behaviors connected to drag-and-drop.
  #preventDefaultDropBehavior = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Handles the event when a file has been dropped. Tries to import the file as a .gpx.
  #handleDrop = async (e) => {
    try {
      for await (const file of e.dataTransfer.files) {
        const fileType = file.type ? file.type : file.name.split(".").pop();
        if (fileType === "gpx" || fileType === "application/gpx+xml") {
          this.#importDroppedGpx(file);
        }
      }
    } catch (error) {
      console.error(`Error importing GPX-file... ${error}`);
    }
  };

  #importDroppedGpx = (file) => {
    const reader = new FileReader();
    // We're gonna want to set a random id on all features belonging
    // to the current file. That way we can keep track of which features
    // belongs to each file.
    const id = Math.random().toString(36).slice(2, 9);
    // Let's handle the onload-event and import the features!
    reader.onload = () => {
      this.import(reader.result, {
        zoomToExtent: true,
        setProperties: { GPX_ID: id },
      });
    };
    reader.readAsText(file);
  };

  // Checks whether the layerName supplied when initiating the GPX-model
  // corresponds to an already existing vector-layer.
  #vectorLayerExists = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Check whether any of the layers has the same name (type)
    // as the supplied layerName. Also makes sure that the found
    // layer is a vectorLayer.
    return allMapLayers.some((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
  };

  // Returns all layers connected to the map-object supplied
  // when initiating the model.
  #getAllMapLayers = () => {
    return this.#map.getLayers().getArray();
  };

  // Checks whether the name (type) of the supplied layer matches
  // the layerName supplied when initiating the model. Also makes
  // sure that the layer is a vectorLayer.
  #layerHasCorrectNameAndType = (layer) => {
    return layer.get("name") === this.#layerName && this.#isVectorLayer(layer);
  };

  // Checks whether the supplied layer is a vectorLayer or not.
  #isVectorLayer = (layer) => {
    return layer instanceof VectorLayer;
  };

  // Connects the private fields of the GPX-model to an already existing
  // vectorLayer.
  #connectExistingVectorLayer = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Then we'll grab the layer corresponding to the supplied layerName.
    const connectedLayer = allMapLayers.find((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
    // Then we'll set the private fields
    this.#gpxLayer = connectedLayer;
    this.#gpxSource = connectedLayer.getSource();
  };

  // Creates a new vector layer that can be used to display GPX-features.
  #createNewGpxLayer = () => {
    // Let's grab a vector-source.
    this.#gpxSource = this.#getNewVectorSource();
    // Let's create a layer
    this.#gpxLayer = this.#getNewVectorLayer(this.#gpxSource);
    // Make sure to set a unique name
    this.#gpxLayer.set("name", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#gpxLayer);
  };

  // Returns a new vector source.
  #getNewVectorSource = () => {
    return new VectorSource({ wrapX: false });
  };

  // Returns a new vector layer connected to the supplied source.
  #getNewVectorLayer = (source) => {
    return new VectorLayer({
      source: source,
      layerType: "system",
      zIndex: 5001,
      caption: "GPX model",
    });
  };

  // Translates the supplied feature to the map-views coordinate system.
  #translateFeatureToViewSrs = (feature) => {
    // Let's get the geometry-type to begin with
    const baseGeometryType = feature?.getGeometry?.().getType?.() ?? null;
    // If no geometry-type could be fetched from the supplied feature, we make sure
    // to terminate to avoid errors.
    if (baseGeometryType === null) return null;
    // We are going to be using the view of the map when translating, let's get it
    const mapViewProjection = this.#map.getView().getProjection();
    // Finally we translate the feature to the view-projection.
    feature.getGeometry().transform("EPSG:4326", mapViewProjection);
  };

  // Prepares the supplied features for injection in the map.
  // Includes translating and styling of the features.
  #prepareForMapInjection = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we check if the features are to be added via the drawModel. If they are, we set
    // the USER_DRAWN-prop to true since all features in the draw-source _can_ be altered by the user.
    // We also have to translate every feature to the map-views coordinate system.
    features.forEach((feature) => {
      this.#translateFeatureToViewSrs(feature);
      // this.#setFeatureStyle(feature);
      this.#drawModel && feature.set("USER_DRAWN", true);
    });
  };

  #tagFeaturesAsImported = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we set the "GPX_IMPORT" property to true.
    features.forEach((feature) => {
      feature.set("GPX_IMPORT", true);
    });
  };

  // Checks whether there are any features in the gpx-source or not.
  #gpxSourceHasFeatures = () => {
    return this.#gpxSource.getFeatures().length > 0;
  };

  // Fits the map to the current extent of the gpx-source (with some padding).
  #fitMapToExtent = () => {
    this.#map.getView().fit(this.#currentExtent, {
      size: this.#map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  // Sets the supplied properties on the supplied features
  #setFeatureProperties = (features, properties) => {
    for (const feature of features) {
      feature.setProperties(properties);
    }
  };

  // Accepts an id and checks if the current source still contains features
  // with the supplied gpx-id.
  importedGpxStillHasFeatures = (id) => {
    return (
      this.#gpxSource.getFeatures().filter((f) => f.get("GPX_ID") === id)
        .length > 0
    );
  };

  // Tries to parse features from the supplied gpx-string.
  // Accepts a gpxString and an optional second parameter stating if
  // the features should be translated to the map-views srs or not.
  // Returns an object on the following form:
  // {features: <Array of ol-features>, error: <String with potential error message>}
  // **The returned features are translated to the map-views coordinate system.**
  parseFeatures = (gpxString, settings = { prepareForMapInjection: true }) => {
    // The method accepts a setting-object, lets extract the settings we need.
    // The settings includes a possibility to set prepareForMapInjection to false,
    // (default to true), allowing for the return-object to contain the pure parsed
    // features (not styled or translated).
    const prepareForMapInjection = settings.prepareForMapInjection;
    // Then we start parsing
    try {
      // First we must parse the string to ol-features
      const features = this.#parser.readFeatures(gpxString) ?? [];
      // Let's make sure to tag all imported features so that we can
      // distinguish them from "ordinary" features.
      this.#tagFeaturesAsImported(features);
      // Then we must make sure to prepare all the features for
      // map-injection. This includes translating the features to
      // the current map-views coordinate system, and setting some style.
      prepareForMapInjection && this.#prepareForMapInjection(features);
      // Then we can return the features
      return { features: features, error: null };
    } catch (error) {
      // If we happen to hit a mine, we make sure to return the error
      // message and an empty array.
      return { features: [], error: error };
    }
  };

  // Tries to parse features from a GPX-string and then add them to
  // the gpx-source.
  // Accepts a gpxString and an optional parameter stating if the map should
  // zoom the the imported features extent or not.
  import = (gpxString, settings = { zoomToExtent: true }) => {
    // Start by trying to parse the gpx-string
    const { features, error } = this.parseFeatures(gpxString);
    // If the parsing led to any kind of error, we make sure to abort
    // and return the error to the initiator.
    if (error !== null) {
      return { status: "FAILED", error: error };
    }
    // If "setProperties" was supplied in the settings, we have to make sure
    // to set the supplied properties on all features.
    settings.setProperties &&
      this.#setFeatureProperties(features, settings.setProperties);

    // If we have a drawModel, use it to add the features
    if (this.#drawModel) {
      this.#drawModel.addGpxFeatures(features);
    } else {
      // Otherwise add to the GPX source
      this.#gpxSource.addFeatures(features);
    }

    // We have to make sure to update the current extent when we've added
    // features to the gpx-source.
    this.#currentExtent = this.#gpxSource.getExtent();
    // Then we make sure to zoom to the current extent (unless the initiator
    // has told us not to!).
    settings.zoomToExtent && this.zoomToCurrentExtent();
    // Finally we return a success message to the initiator.
    return { status: "SUCCESS", error: null };
  };

  // Tries to export all the features in the current gpx-layer
  export = () => {
    // First we need to get all the features from the current gpx-source
    // (except for hidden features, the users might be confused if hidden features are exported).
    const features = this.#gpxSource
      .getFeatures()
      .filter((f) => f.get("HIDDEN") !== true);
    // Then we have to make sure that there were some feature there to export.
    if (!features || features?.length === 0) {
      return {
        status: "FAILED",
        error: "No features exist in the current gpx-layer.",
      };
    }
    // Then we'll do some transformations on the features to make sure
    // that they are gpx-compatible.
    const compatibleFeatures = this.#getGpxCompatibleFeatures(features);
    // Let's make sure that we have some compatible features to return,
    // if we don't, we make sure to abort.
    if (compatibleFeatures.length === 0) {
      return {
        status: "FAILED",
        error: "Could not transform any features to the .gpx standard.",
      };
    }
    // If we do have compatible features, we can create the gpx-xml
    const postData = this.#parser.writeFeatures(
      compatibleFeatures,
      `${this.#layerName}-gpx-export`
    );
    // Then we'll call the save-as method from file-saver, which will
    // initiate the download-process for the user.
    try {
      saveAs(
        new Blob([postData], {
          type: "application/gpx+xml;charset=utf-8",
        }),
        `Gpxexport - ${new Date().toLocaleString()}.gpx`
      );
      return {
        status: "SUCCESS",
        error: null,
      };
    } catch (error) {
      return {
        status: "FAILED",
        error: "Could not save the GPX-file. File-saver Error.",
      };
    }
  };

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the .gpx-format.
  #getGpxCompatibleFeatures = (features) => {
    // Declare an array where we can push the transformed features.
    const transformedFeatures = [];
    // Looping trough all the features, creating a clone of each, this clone
    // will be transformed and then pushed to the transformedFeatures-array.
    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      const geometryType = geometry.getType();

      // Only include features with supported geometry types
      if (["Point", "LineString", "MultiLineString"].includes(geometryType)) {
        // Create the feature-clone
        const clonedFeature = feature.clone();
        // Transform the geometry to WGS:84 so the gpx-interpreters will be happy.
        clonedFeature
          .getGeometry()
          .transform(this.#map.getView().getProjection(), "EPSG:4326");
        // Finally, we can push the transformed feature to the
        // transformedFeatures-array.
        transformedFeatures.push(clonedFeature);
      }
    });
    return transformedFeatures;
  };

  // Fits the map to the extent of the features currently in the gpx-layer
  zoomToCurrentExtent = () => {
    // First we make sure to check whether the gpx-source has any features
    // or not. If none exist, what would we zoom to?!
    if (!this.#gpxSourceHasFeatures()) {
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

  // Set:er allowing us to change which layer the gpx-model will interact with
  setLayer = (layerName) => {
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the gpx-layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateGpxLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#gpxSource.getExtent();
  };

  // Get:er returning the name of the GPX-layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the current extent of the gpx-source.
  getCurrentExtent = () => {
    return this.#currentExtent;
  };
}

export default GpxModel;
