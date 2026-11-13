import KML from "ol/format/KML";
import { Circle } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import VectorImportModel from "./VectorImportModel";

/*
 * A model supplying useful KML-functionality. Extends the generic
 * VectorImportModel with a KML-specific profile, styling of imported
 * features, and style-preserving export handling.
 *
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the KML-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of .kml-files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 * - observer (Observer): Will receive "kmlModel.fileImported" when a file has been dropped.
 *
 * The complete public API is documented in VectorImportModel. On top of that,
 * this class keeps the legacy alias importedKmlStillHasFeatures(id), and
 * removeImportedFeatures() is inherited from the base class.
 */
class KmlModel extends VectorImportModel {
  constructor(settings) {
    super(settings, {
      displayName: "KML",
      parserFactory: () => new KML(),
      acceptedFileTypes: ["kml", "application/vnd.google-earth.kml+xml"],
      fileExtension: "kml",
      importTagPropertyName: "KML_IMPORT",
      setShowTextOnImport: true,
      idPropertyName: "KML_ID",
      observerSubject: "kmlModel.fileImported",
      layerCaption: "KML model",
      layerZIndex: 5000,
      exportMimeType: "application/vnd.google-earth.kml+xml;charset=utf-8",
      exportFileNamePrefix: "Ritexport",
      exportDocSuffix: "-kml-export",
    });
  }

  // Kept for backwards-compatibility with the pre-refactor public API.
  importedKmlStillHasFeatures = (id) => {
    return this.importedFileStillHasFeatures(id);
  };

  // Extracts style from the feature props or style func and applies it.
  // Called for each feature during map-injection (via the base class hook),
  // making KML the only format where imported features get styled on import.
  _prepareImportedFeatureForMapInjection = (feature, { viewResolution }) => {
    this.#setFeatureStyle(feature, viewResolution);
  };

  // When a draw-model is supplied, the features are added via it, so that
  // they can be altered by the user just like ordinary drawn features.
  _addParsedFeaturesToTarget = (features, { drawModel, source }) => {
    if (drawModel) {
      drawModel.addKmlFeatures(features);
    } else {
      source.addFeatures(features);
    }
  };

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the .kml-format.
  _makeExportCompatibleFeatures = (features, { viewProjection, drawModel }) => {
    return this.#getKmlCompatibleFeatures(features, viewProjection, drawModel);
  };

  // Extracts style from the feature props or style func and applies it.
  #setFeatureStyle = (feature, viewResolution) => {
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
      return this.#setStyleFromStyleFunction(
        feature,
        styleFunc,
        viewResolution
      );
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
  #setStyleFromStyleFunction = (feature, styleFunction, viewResolution) => {
    // Let's create the style using the style function. The views resolution
    // must be passed since the style might behave differently when resolution change.
    const style = styleFunction(feature, viewResolution);
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
        radius: imageStyle.radius,
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

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the .kml-format.
  #getKmlCompatibleFeatures = (features, viewProjection, drawModel) => {
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
      if (drawModel) {
        clonedFeature.set(
          "EXTRACTED_STYLE",
          JSON.stringify(drawModel.extractFeatureStyleInfo(feature))
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
      clonedFeature.getGeometry().transform(viewProjection, "EPSG:4326");
      // Finally, we can push the transformed feature to the
      // transformedFeatures-array.
      transformedFeatures.push(clonedFeature);
    });
    return transformedFeatures;
  };
}
export default KmlModel;
