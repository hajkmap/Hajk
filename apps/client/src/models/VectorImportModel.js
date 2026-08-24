import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { saveAs } from "file-saver";

/*
 * A base model supplying functionality for importing and exporting vector
 * files (such as KML or GPX) to/from an OpenLayers map. It implements the
 * entire flow: connecting to (or creating) a vector layer, drag-and-drop
 * handling, parsing, importing, exporting, and zooming.
 *
 * Everything that differs between file formats is either supplied via a
 * "profile" (a plain configuration object passed to the constructor by each
 * subclass), or by overriding one of the @protected hooks listed below.
 *
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the model.
 *   If there already is a layer in the map with the same name, the model will be
 *   connected to that layer. Otherwise, a new vector-layer will be created and added.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of supported files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 * - observer (Observer): Will receive a publish when a file has been imported.
 *
 * Required profile properties:
 * - displayName (string): Human readable name, e.g. "KML". Used in messages.
 * - parserFactory (Function): Returns a new OL format-instance, e.g. () => new KML().
 * - acceptedFileTypes (Array<string>): File extensions/MIME types accepted on drop.
 * - fileExtension (string): E.g. "kml". Used for the export filename.
 * - importTagPropertyName (string): Property set to true on all imported features.
 * - idPropertyName (string): Property used to group features per imported file.
 * - observerSubject (string): Subject published on the observer after a drop-import.
 * - layerCaption (string): Caption used if a new layer has to be created.
 * - layerZIndex (number): ZIndex used if a new layer has to be created.
 * - exportMimeType (string): MIME type of the exported blob.
 * - exportFileNamePrefix (string): Prefix of the export filename.
 * - exportDocSuffix (string): Suffix passed as second argument to writeFeatures().
 * Optional profile properties:
 * - setShowTextOnImport (boolean): If true, "SHOW_TEXT" is set on imported features.
 *
 * @protected hooks (may be overridden by subclasses):
 * - _prepareImportedFeatureForMapInjection(feature, { viewResolution }): Called
 *   for each parsed feature after it has been translated to the map-view SRS.
 * - _addParsedFeaturesToTarget(features, { drawModel, source }): Decides where
 *   parsed features are added. Defaults to adding them to the source.
 * - _makeExportCompatibleFeatures(features, { viewProjection, drawModel }):
 *   Returns clones transformed to EPSG:4326, ready for writeFeatures().
 *
 * Exposed methods:
 * - parseFeatures(fileContentsString, settings)
 * - import(fileContentsString, settings)
 * - export()
 * - removeImportedFeatures()
 * - importedFileStillHasFeatures(id)
 * - zoomToCurrentExtent()
 * - setLayer(layerName)
 * - getCurrentLayerName()
 * - getCurrentExtent()
 */
class VectorImportModel {
  #map;
  #layerName;
  #drawModel;
  #observer;
  #source;
  #layer;
  #parser;
  #currentExtent;
  #profile;

  constructor(settings, profile) {
    // A missing profile property is a programming error in a subclass and
    // should fail loudly rather than surface somewhere deep in a flow.
    this.#assertProfileIsValid(profile);
    // Make sure the profile is available before any potential early return
    // below (the error-handler reads displayName from it).
    this.#profile = Object.freeze({ ...profile });
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    this.#drawModel = settings.drawModel || null;
    this.#observer = settings.observer || null;
    // If a setting to enable drag-and-drop has been passed, we have to initiate
    // the listeners for that.
    settings.enableDragAndDrop && this.#addMapDropListeners();
    // We are gonna need a parser obviously.
    this.#parser = profile.parserFactory();
    // We are going to be keeping track of the current extent of the source.
    this.#currentExtent = null;
    // The model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing one.
    this.#initiateLayer();
  }

  // Makes sure that all required profile properties have been supplied.
  #assertProfileIsValid = (profile) => {
    const requiredProperties = [
      "displayName",
      "parserFactory",
      "acceptedFileTypes",
      "fileExtension",
      "importTagPropertyName",
      "idPropertyName",
      "observerSubject",
      "layerCaption",
      "layerZIndex",
      "exportMimeType",
      "exportFileNamePrefix",
      "exportDocSuffix",
    ];
    const missingProperties = requiredProperties.filter(
      (property) => profile[property] === undefined
    );
    if (missingProperties.length > 0) {
      throw new Error(
        `Failed to initiate VectorImportModel - invalid profile. Missing properties: ${missingProperties.join(", ")}`
      );
    }
  };

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the model.
  #handleInitiationParametersMissing = () => {
    throw new Error(
      `Failed to initiate ${this.#profile.displayName}-model, - required parameters missing. \n Required parameters: map, layerName`
    );
  };

  // We have to initiate a vector layer that can be used to display the imported features.
  #initiateLayer = () => {
    if (this.#vectorLayerExists()) {
      return this.#connectExistingVectorLayer();
    }
    return this.#createNewLayer();
  };

  // Adds listeners so that supported files can be drag-and-dropped into the map,
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
    // We're gonna need to add some more listeners (for dragEnter etc.).
    mapDiv.addEventListener("drop", this.#handleDrop, false);
  };

  // Prevents the default behaviors connected to drag-and-drop.
  #preventDefaultDropBehavior = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Handles the event when a file has been dropped. Tries to import the file
  // if it is of a type accepted by the profile.
  #handleDrop = async (e) => {
    try {
      for await (const file of e.dataTransfer.files) {
        const fileType = file.type ? file.type : file.name.split(".").pop();
        if (this.#profile.acceptedFileTypes.includes(fileType)) {
          this.#importDroppedFile(file);
        }
      }
    } catch (error) {
      console.error(
        `Error importing ${this.#profile.displayName}-file... ${error}`
      );
    }
  };

  #importDroppedFile = (file) => {
    const reader = new FileReader();
    // We're gonna want to set a random id on all features belonging
    // to the current file. That way we can keep track of which features
    // belongs to each file.
    const id = Math.random().toString(36).slice(2, 9);
    // Let's handle the onload-event and import the features!
    reader.onload = () => {
      this.import(reader.result, {
        zoomToExtent: true,
        setProperties: { [this.#profile.idPropertyName]: id },
      });
      // We also want to publish an event on the observer so that we can update potential views.
      this.#observer &&
        this.#observer.publish(this.#profile.observerSubject, { id });
    };
    reader.readAsText(file);
  };

  // Checks wether the layerName supplied when initiating the model
  // corresponds to an already existing vector-layer.
  #vectorLayerExists = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Check wether any of the layers has the same name (type)
    // as the supplied layerName. Also makes sure that the found
    // layer is a vectorLayer. (We cannot add features to an imageLayer...).
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
    return layer.get("name") === this.#layerName && this.#isVectorLayer(layer);
  };

  // Checks wether the supplied layer is a vectorLayer or not.
  #isVectorLayer = (layer) => {
    return layer instanceof VectorLayer;
  };

  // Connects the private fields of the model to an already existing
  // vectorLayer.
  #connectExistingVectorLayer = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Then we'll grab the layer corresponding to the supplied layerName.
    const connectedLayer = allMapLayers.find((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
    // Then we'll set the private fields
    this.#layer = connectedLayer;
    this.#source = connectedLayer.getSource();
  };

  // Creates a new vector layer that can be used to display imported features.
  #createNewLayer = () => {
    // Let's grab a vector-source.
    this.#source = this.#getNewVectorSource();
    // Let's create a layer
    this.#layer = this.#getNewVectorLayer(this.#source);
    // Make sure to set a unique name
    this.#layer.set("name", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#layer);
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
      zIndex: this.#profile.layerZIndex,
      caption: this.#profile.layerCaption,
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
      this._prepareImportedFeatureForMapInjection(feature, {
        viewResolution: this.#map.getView().getResolution(),
      });
      this.#drawModel && feature.set("USER_DRAWN", true);
    });
  };

  #tagFeaturesAsImported = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we set the import-property (from the profile) to true on all
    // features, and, if the profile demands it, also make sure text is shown.
    features.forEach((feature) => {
      feature.set(this.#profile.importTagPropertyName, true);
      this.#profile.setShowTextOnImport === true &&
        feature.set("SHOW_TEXT", true);
    });
  };

  // Checks wether there are any features in the source or not.
  #sourceHasFeatures = () => {
    return this.#source.getFeatures().length > 0;
  };

  // Fits the map to the current extent of the source (with some padding).
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

  // Returns all features from the source that are tagged
  // as imported.
  #getAllImportedFeatures = () => {
    return this.#source.getFeatures().filter((feature) => {
      return feature.get(this.#profile.importTagPropertyName) === true;
    });
  };

  // Accepts an id and checks if the current source still contains features
  // with the supplied id.
  importedFileStillHasFeatures = (id) => {
    return (
      this.#source
        .getFeatures()
        .filter((f) => f.get(this.#profile.idPropertyName) === id).length > 0
    );
  };

  // Tries to parse features from the supplied string.
  // Accepts a string and an optional second parameter stating if
  // the features should be translated to the map-views srs or not.
  // Returns an object on the following form:
  // {features: <Array of ol-features>, error: <String with potential error message>}
  // **The returned features are translated to the map-views coordinate system.**
  parseFeatures = (
    fileContentsString,
    settings = { prepareForMapInjection: true }
  ) => {
    // The method accepts a setting-object, lets extract the settings we need.
    // The settings includes a possibility to set prepareForMapInjection to false,
    // (default to true), allowing for the return-object to contain the pure parsed
    // features (not styled or translated).
    const prepareForMapInjection = settings.prepareForMapInjection;
    // Then we start parsing
    try {
      // First we must parse the string to ol-features
      const features = this.#parser.readFeatures(fileContentsString) ?? [];
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

  // Tries to parse features from the supplied string and then add them to
  // the source.
  // Accepts a string and an optional parameter stating if the map should
  // zoom the the imported features extent or not.
  import = (fileContentsString, settings = { zoomToExtent: true }) => {
    // Start by trying to parse the supplied string
    const { features, error } = this.parseFeatures(fileContentsString);
    // If the parsing led to any kind of error, we make sure to abort
    // and return the error to the initiator.
    if (error !== null) {
      return { status: "FAILED", error: error };
    }
    // If "setProperties" was supplied in the settings, we have to make sure
    // to set the supplied properties on all features.
    settings.setProperties &&
      this.#setFeatureProperties(features, settings.setProperties);
    // Then we add the features to their target (which might be the draw-model,
    // depending on the format-specific hook).
    this._addParsedFeaturesToTarget(features, {
      drawModel: this.#drawModel,
      source: this.#source,
    });
    // We have to make sure to update the current extent when we've added
    // features to the source.
    this.#currentExtent = this.#source.getExtent();
    // Then we make sure to zoom to the current extent (unless the initiator
    // has told us not to!).
    settings.zoomToExtent && this.zoomToCurrentExtent();
    // Finally we return a success message to the initiator.
    return { status: "SUCCESS", error: null };
  };

  // Tries to export all the features in the current layer
  export = () => {
    // First we need to get all the features from the current source
    // (except for hidden features, the users might be confused if hidden features are exported).
    const features = this.#source
      .getFeatures()
      .filter((f) => f.get("HIDDEN") !== true);
    // Then we have to make sure that there were some feature there to export.
    if (!features || features?.length === 0) {
      return {
        status: "FAILED",
        error: `No features exist in the current ${this.#profile.displayName.toLowerCase()}-layer.`,
      };
    }
    // Then we'll do some transformations on the features to make sure
    // that they are compatible with the format handled by this model.
    const compatibleFeatures = this._makeExportCompatibleFeatures(features, {
      viewProjection: this.#map.getView().getProjection(),
      drawModel: this.#drawModel,
    });
    // Let's make sure that we have some compatible features to return,
    // if we don't, we make sure to abort.
    if (compatibleFeatures.length === 0) {
      return {
        status: "FAILED",
        error: `Could not transform any features to the .${this.#profile.displayName.toLowerCase()} standard.`,
      };
    }
    // If we do have compatible features, we can create the output
    const postData = this.#parser.writeFeatures(
      compatibleFeatures,
      `${this.#layerName}${this.#profile.exportDocSuffix}`
    );
    // Then we'll call the save-as method from file-saver, which will
    // initiate the download-process for the user.
    try {
      saveAs(
        new Blob([postData], {
          type: this.#profile.exportMimeType,
        }),
        `${this.#profile.exportFileNamePrefix} - ${new Date().toLocaleString()}.${this.#profile.fileExtension}`
      );
      return {
        status: "SUCCESS",
        error: null,
      };
    } catch (_error) {
      return {
        status: "FAILED",
        error: `Could not save the ${this.#profile.displayName}-file. File-saver Error.`,
      };
    }
  };

  // We will need a way to remove all imported features from the source.
  // Why aren't we using a simple "clear()" one might ask =>  simply because
  // the source might be the draw-source, and we don't want to remove
  // all drawn features, only the imported ones.
  removeImportedFeatures = () => {
    // Let's get all the features in the source that have been imported
    const importedFeatures = this.#getAllImportedFeatures();
    // Since OL does not supply a "removeFeatures" method, we have to map
    // over the array, and remove every single feature one by one...
    importedFeatures.forEach((feature) => {
      this.#source.removeFeature(feature);
    });
    // When the imported features has been removed, we have to make sure
    // to update the current extent.
    this.#currentExtent = this.#source.getExtent();
  };

  // Fits the map to the extent of the features currently in the layer
  zoomToCurrentExtent = () => {
    // First we make sure to check wether the source has any features
    // or not. If none exist, what would we zoom to?!
    if (!this.#sourceHasFeatures()) {
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

  // Set:er allowing us to change which layer the model will interact with
  setLayer = (layerName) => {
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#source.getExtent();
  };

  // Get:er returning the name of the layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the current extent of the source.
  getCurrentExtent = () => {
    return this.#currentExtent;
  };

  /**
   * Called for each parsed feature after it has been translated to the
   * map-view SRS and before USER_DRAWN is potentially set. Subclasses that
   * have to do format-specific preparation (e.g. apply styling) override
   * this hook. The default implementation does nothing.
   *
   * @protected
   */
  _prepareImportedFeatureForMapInjection(_feature, _context) {
    // Intentionally left empty, see JSDoc above.
  }

  /**
   * Adds the parsed features to their target. The default implementation
   * adds them directly to the source. Subclasses whose features should be
   * routed via the draw-model override this hook.
   *
   * @protected
   */
  _addParsedFeaturesToTarget(features, context) {
    const { source } = context;
    source.addFeatures(features);
  }

  /**
   * Returns clones of the supplied features, transformed to EPSG:4326, ready
   * to be written by the OL format-writer. Subclasses needing extra handling
   * (e.g. style extraction or geometry filtering) override this hook.
   *
   * @protected
   */
  _makeExportCompatibleFeatures(features, context) {
    const { viewProjection } = context;
    // Declare an array where we can push the transformed features.
    const transformedFeatures = [];
    // Looping trough all the features, creating a clone of each, this clone
    // will be transformed and then pushed to the transformedFeatures-array.
    features.forEach((feature) => {
      // Create the feature-clone
      const clonedFeature = feature.clone();
      // Transform the geometry to WGS:84 so the interpreters will be happy.
      clonedFeature.getGeometry().transform(viewProjection, "EPSG:4326");
      // Finally, we can push the transformed feature to the
      // transformedFeatures-array.
      transformedFeatures.push(clonedFeature);
    });
    return transformedFeatures;
  }
}

export default VectorImportModel;
