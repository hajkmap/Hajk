import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import KML from "ol/format/KML";
import { Circle } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { saveAs } from "file-saver";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";

/*
 * A model supplying useful KML-functionality.
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the KML-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of .kml-files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 *
 * Exposes a couple of methods:
 * - parseFeatures(kmlString, settings): Accepts a KML-string and tries to parse it to OL-features.
 * - import(kmlString, settings): Accepts a KML-string and adds the KML-features to the layer.
 * - export(): Exports all features in the current kml-layer.
 * - removeImportedFeatures(): Removes all imported features from the kml-source.
 * - zoomToCurrentExtent(): Zooms the map to the current extent of the kml-source.
 * - setLayer(layerName): Accepts a string containing a layer name. Will set current layer.
 * - getCurrentLayerName(): Returns the name of the vectorLayer that is currently connected to the model.
 * - getCurrentExtent(): Returns the current extent of the kml-source.
 */
class KmlModel {
  #map;
  #layerName;
  #drawModel;
  #observer;
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
    this.#drawModel = settings.drawModel || null;
    this.#observer = settings.observer || null;
    // If a setting to enable drag-and-drop has been passes, we have to initiate
    // the listeners for that.
    settings.enableDragAndDrop && this.#addMapDropListeners();
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

  // Adds listeners so that .kml-files can be drag-and-dropped into the map,
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

  // Handles the event when a file has been dropped. Tries to import the file as a .kml.
  #handleDrop = async (e) => {
    try {
      for await (const file of e.dataTransfer.files) {
        const fileType = file.type ? file.type : file.name.split(".").pop();
        // Not sure about filetype for kml... Qgis- and Hajk-generated kml:s does not contain any information about type.
        // The application/vnd is... a guess.
        if (
          fileType === "kml" ||
          fileType === "application/vnd.google-earth.kml+xml"
        ) {
          this.#importDroppedKml(file);
        }
      }
    } catch (error) {
      console.error(`Error importing KML-file... ${error}`);
    }
  };

  #importDroppedKml = (file) => {
    const reader = new FileReader();
    // We're gonna want to set a random id on all features belonging
    // to the current file. That way we can keep track of which features
    // belongs to each file.
    const id = Math.random().toString(36).slice(2, 9);
    // Let's handle the onload-event and import the features!
    reader.onload = () => {
      this.import(reader.result, {
        zoomToExtent: true,
        setProperties: { KML_ID: id },
      });
      // We also want to publish an event on the observer so that we can update potential views.
      this.#observer && this.#observer.publish("kmlModel.fileImported", { id });
    };
    reader.readAsText(file);
  };

  // Checks wether the layerName supplied when initiating the KML-model
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
    // Make sure to set a unique name
    this.#kmlLayer.set("name", this.#layerName);
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
      layerType: "system",
      zIndex: 5000,
      caption: "KML model",
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

  // Extracts style from the feature props or style func and applies it.
  #setFeatureStyle = (feature) => {
    if (!feature) {
      console.warn(
        "Cannot apply a style on nothing. (Supplied feature is nullish)."
      );
    }
    // First, we try to get the style from the feature props
    const styleProperty =
      feature.get("EXTRACTED_STYLE") || feature.get("style") || null;
    // If it exists, we apply the style using this prop.
    if (styleProperty !== null) {
      return this.#setFeatureStyleFromProps(feature, styleProperty);
    }
    // Otherwise the feature might contain a style-function. If it does, we can use that
    // to style the feature.
    const styleFunc = feature.getStyleFunction() ?? null;
    if (styleFunc !== null) {
      return this.#setStyleFromStyleFunction(feature, styleFunc);
    }
  };

  // Extracts the feature style from its properties and applies it.
  #setFeatureStyleFromProps = (feature, styleProperty) => {
    try {
      // Parse the string to a real object
      const parsedStyle = JSON.parse(styleProperty);
      // Get the geometry-type so that we can check if we're
      // dealing with a text drawn with the draw-plugin. (The old draw-plugin used 'geometryType'
      // and the new "Sketch"-plugin uses 'DRAW_METHOD').
      const geometryType =
        feature.get("DRAW_METHOD") || feature.get("geometryType") || null;
      // If the type is set to text, we are dealing with a draw-plugin
      // text, and we have to handle it separately. (We don't want to
      // extract information from the point-object which is it built upon).
      if (geometryType === "Text") {
        this.#setFeatureTextProperties(feature, parsedStyle.text);
      }
      // Then we create a style and apply it on the feature to make
      // sure the import looks like the features drawn in the draw-plugin.
      feature.setStyle(this.#createFeatureStyle(parsedStyle));
    } catch (error) {
      console.error(
        `KML-model: Style attribute could not be parsed. Error: ${error}`
      );
    }
  };

  // Extracts the style from the style function and applies it.
  #setStyleFromStyleFunction = (feature, styleFunction) => {
    // Let's create the style using the style function. The views resolution
    // must be passed since the style might behave differently when resolution change.
    const style = styleFunction(feature, this.#map.getView().getResolution());
    // Checks if the fill is nullish, if it is, we must make sure to set _something_
    // to avoid issues when adding the feature to the map.
    if (this.#styleFillIsNullish(style)) {
      style[0].setFill(
        new Fill({
          color: [0, 0, 0, 0],
        })
      );
    }
    // Finally, we apply the style on the feature.
    feature.setStyle(style);
  };

  // Checks wether the supplied style exist and has a nullish fill.
  #styleFillIsNullish = (style) => {
    return style[0] && style[0].getFill && style[0].getFill() === null;
  };

  // Sets the user-text-properties on the supplied feature. This is required
  // since we want to support text-features from Hajk2, and features drawn there does
  // not have the same settings as the current draw-model.
  #setFeatureTextProperties = (feature, text) => {
    if (!feature.get("USER_TEXT")) {
      feature.set("USER_TEXT", text);
      feature.set("TEXT_SETTINGS", {
        backgroundColor: "#000000",
        foregroundColor: "#FFFFFF",
        size: 14,
      });
    }
  };

  // Creates a style-object from the special settings that are
  // added when drawing features in the draw-plugin. E.g. stroke-dash
  // and so on.
  #createFeatureStyle = (parsedStyle) => {
    return new Style({
      fill: this.#getFillStyle(parsedStyle),
      image: this.#getImageStyle(parsedStyle),
      stroke: this.#getStrokeStyle(parsedStyle),
      text: this.#getTextStyle(parsedStyle),
    });
  };

  // Returns a fill-style based on the supplied settings.
  // If the feature was created with the new draw-model, the settings
  // will contain a fillStyle-object, and if it was created with Hajk2 it
  // will only contain a fillColor-property.
  #getFillStyle = (styleSettings) => {
    const { fillStyle, fillColor } = styleSettings;
    if (fillStyle) {
      return new Fill({ color: fillStyle.color });
    }
    return new Fill({ color: fillColor });
  };

  // Returns an image-style based on the supplied settings.
  // If the feature was created with the new draw-model, the settings
  // will contain a imageStyle-object, and if it was created with Hajk2 it
  // will only contain the pointColor property.
  #getImageStyle = (styleSettings) => {
    const { imageStyle, pointColor } = styleSettings;
    // If the settings has the imageStyle-property, we create the style from that one.
    if (imageStyle) {
      return new CircleStyle({
        radius: 6,
        stroke: new Stroke({
          color: imageStyle.strokeColor,
          width: imageStyle.strokeWidth,
          lineDash: imageStyle.dash,
        }),
        fill: new Fill({
          color: imageStyle.fillColor,
        }),
      });
    }
    // Otherwise we use the pointColor property and some defaults.
    return new CircleStyle({
      radius: 6,
      stroke: new Stroke({
        color: "#FFFFFF",
        width: 2,
        lineDash: null,
      }),
      fill: new Fill({
        color: pointColor,
      }),
    });
  };

  // Returns a stroke-style based on the supplied settings.
  // If the feature was created with the new draw-model, the settings
  // will contain a strokeStyle-object, and if it was created with Hajk2 it
  // will only contain the strokeDash, strokeWidth, strokeColor directly.
  #getStrokeStyle = (styleSettings) => {
    const { strokeStyle } = styleSettings;
    // If the settings contain a strokeStyle, we use that one.
    if (strokeStyle) {
      return new Stroke({
        lineDash: strokeStyle.dash,
        color: strokeStyle.color,
        width: strokeStyle.width,
      });
    }
    // Otherwise we use the 'old' settings (from Hajk2).
    const { strokeDash, strokeWidth, strokeColor } = styleSettings;
    return new Stroke({
      lineDash: strokeDash,
      color: strokeColor,
      width: strokeWidth,
    });
  };

  // Returns a text-style based on the supplied values
  #getTextStyle = (styleSettings) => {
    const { text } = styleSettings;
    return new Text({
      font: "12pt sans-serif",
      fill: new Fill({ color: "#FFFFF" }),
      text: text,
      overflow: true,
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
      offsetX: 0,
      offsetY: -15,
    });
  };

  // Extracts the coordinates for the
  #getFeaturePointPosition = (featureGeometry) => {
    // First we have to get the geometry type, since we only
    // want to extract the coordinates when we're dealing with a point.
    const geometryType = featureGeometry.getType();
    // If we're not dealing with a point, return.
    if (geometryType !== "Point") return null;
    // Otherwise we get the coordinates
    const coordinates = featureGeometry.getCoordinates();
    // And return them formatted...
    return {
      n: coordinates[1],
      e: coordinates[0],
    };
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
      this.#setFeatureStyle(feature);
      this.#drawModel && feature.set("USER_DRAWN", true);
    });
  };

  #tagFeaturesAsImported = (features) => {
    // If no features are supplied, we abort!
    if (!features || features?.length === 0) {
      return null;
    }
    // Otherwise we set the "KML_IMPORT" property to true. We also want
    // to set the "SHOW_TEXT" to true on all features.
    // Why? Well, kml's created from dgw:s usually contains a lot of text, and
    // we do not want to provide the user with a possibility to turn text off.
    features.forEach((feature) => {
      feature.set("KML_IMPORT", true);
      feature.set("SHOW_TEXT", true);
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

  // Sets the supplied properties on the supplied features
  #setFeatureProperties = (features, properties) => {
    for (const feature of features) {
      feature.setProperties(properties);
    }
  };

  // Accepts an id and checks if the current source still contains features
  // with the supplied kml-id.
  importedKmlStillHasFeatures = (id) => {
    return (
      this.#kmlSource.getFeatures().filter((f) => f.get("KML_ID") === id)
        .length > 0
    );
  };

  // Tries to parse features from the supplied kml-string.
  // Accepts a kmlString and an optional second parameter stating if
  // the features should be translated to the map-views srs or not.
  // Returns an object on the following form:
  // {features: <Array of ol-features>, error: <String with potential error message>}
  // **The returned features are translated to the map-views coordinate system.**
  parseFeatures = (kmlString, settings = { prepareForMapInjection: true }) => {
    // The method accepts a setting-object, lets extract the settings we need.
    // The settings includes a possibility to set prepareForMapInjection to false,
    // (default to true), allowing for the return-object to contain the pure parsed
    // features (not styled or translated).
    const prepareForMapInjection = settings.prepareForMapInjection;
    // Then we start parsing
    try {
      // First we must parse the string to ol-features
      const features = this.#parser.readFeatures(kmlString) ?? [];
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

  // Tries to parse features from a KML-string and then add them to
  // the kml-source.
  // Accepts an kmlString and an optional parameter stating if the map should
  // zoom the the imported features extent or not.
  import = (kmlString, settings = { zoomToExtent: true }) => {
    // Start by trying to parse the kml-string
    const { features, error } = this.parseFeatures(kmlString);
    // If the parsing led to any kind of error, we make sure to abort
    // and return the error to the initiator.
    if (error !== null) {
      return { status: "FAILED", error: error };
    }
    // If "setProperties" was supplied in the settings, we have to make sure
    // to set the supplied properties on all features.
    settings.setProperties &&
      this.#setFeatureProperties(features, settings.setProperties);
    // If a draw-model has been supplied, we use that model to add the
    // features to the map.
    if (this.#drawModel) {
      this.#drawModel.addKmlFeatures(features);
    } else {
      // Otherwise we add the parsed features directly to the kml-source.
      this.#kmlSource.addFeatures(features);
    }
    // We have to make sure to update the current extent when we've added
    // features to the kml-source.
    this.#currentExtent = this.#kmlSource.getExtent();
    // Then we make sure to zoom to the current extent (unless the initiator
    // has told us not to!).
    settings.zoomToExtent && this.zoomToCurrentExtent();
    // Finally we return a success message to the initiator.
    return { status: "SUCCESS", error: null };
  };

  // Tries to export all the features in the current kml-layer
  export = () => {
    // First we need to get all the features from the current kml-source
    // (except for hidden features, the users might be confused if hidden features are exported).
    const features = this.#kmlSource
      .getFeatures()
      .filter((f) => f.get("HIDDEN") !== true);
    // Then we have to make sure that there were some feature there to export.
    if (!features || features?.length === 0) {
      return {
        status: "FAILED",
        error: "No features exist in the current kml-layer.",
      };
    }
    // Then we'll do some transformations on the features to make sure
    // that they are kml-compatible.
    const compatibleFeatures = this.#getKmlCompatibleFeatures(features);
    // Let's make sure that we have some compatible features to return,
    // if we don't, we make sure to abort.
    if (compatibleFeatures.length === 0) {
      return {
        status: "FAILED",
        error: "Could not transform any features to the .kml standard.",
      };
    }
    // If we do have compatible features, we can create the kml-xml
    const postData = this.#parser.writeFeatures(
      compatibleFeatures,
      `${this.#layerName}-kml-export`
    );
    // Then we'll call the save-as method from file-saver, which will
    // initiate the download-process for the user.
    try {
      saveAs(
        new Blob([postData], {
          type: "application/vnd.google-earth.kml+xml;charset=utf-8",
        }),
        `Ritexport - ${new Date().toLocaleString()}.kml`
      );
      return {
        status: "SUCCESS",
        error: null,
      };
    } catch (error) {
      return {
        status: "FAILED",
        error: "Could not save the KML-file. File-saver Error.",
      };
    }
  };

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the .kml-format.
  #getKmlCompatibleFeatures = (features) => {
    // Declare an array where we can push the transformed features.
    const transformedFeatures = [];
    // Looping trough all the features, creating a clone of each, this clone
    // will be transformed and then pushed to the transformedFeatures-array.
    features.forEach((feature) => {
      // Create the feature-clone
      const clonedFeature = feature.clone();
      // Let's check if we're dealing with a circle
      const geomIsCircle = clonedFeature.getGeometry() instanceof Circle;
      // If a drawModel has been supplied, we have to make sure to get and set
      // the specific style-information used during drawing. We also have to make sure
      // to stringify the information, since the kml-format does not handle objects.
      // We also have to extract and stringify eventual text-settings used. (Used for
      // the text-features in the sketch-plugin to determine text-size etc.).
      if (this.#drawModel) {
        clonedFeature.set(
          "EXTRACTED_STYLE",
          JSON.stringify(this.#drawModel.extractFeatureStyleInfo(feature))
        );
        clonedFeature.set(
          "TEXT_SETTINGS",
          JSON.stringify(feature.get("TEXT_SETTINGS"))
        );
      }
      // If we're dealing with a circle, we have to make sure to simplify
      // the geometry since the kml standard does not like circles.
      if (geomIsCircle) {
        const circleGeometry = clonedFeature.getGeometry();
        // Let's store the circle-radius and center if the user wants to load the
        // kml using the sketch-tool later. (The radius and center is required by the draw-model
        // so that it is able to create a real circle).
        clonedFeature.set("CIRCLE_RADIUS", circleGeometry.getRadius());
        clonedFeature.set(
          "CIRCLE_CENTER",
          JSON.stringify(circleGeometry.getCenter())
        );
        // Create the simplified geometry
        const simplifiedGeometry = fromCircle(circleGeometry, 96);
        // And then set the cloned feature's geometry to the simplified one.
        clonedFeature.setGeometry(simplifiedGeometry);
      }
      // Transform the geometry to WGS:84 so the kml-interpreters will be happy.
      clonedFeature
        .getGeometry()
        .transform(this.#map.getView().getProjection(), "EPSG:4326");
      // Finally, we can push the transformed feature to the
      // transformedFeatures-array.
      transformedFeatures.push(clonedFeature);
    });
    return transformedFeatures;
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
