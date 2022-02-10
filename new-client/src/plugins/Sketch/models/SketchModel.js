import { ACTIVITIES, MAX_REMOVED_FEATURES } from "../constants";
import LocalStorageHelper from "../../../utils/LocalStorageHelper";
import { Circle, Fill, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { STROKE_DASHES } from "../constants";

class SketchModel {
  #geoJSONParser;
  #storageKey;
  #dateTimeOptions;
  #drawModel;

  constructor(settings) {
    this.#geoJSONParser = new GeoJSON();
    this.#storageKey = "sketch";
    this.#dateTimeOptions = {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    this.#drawModel = settings.drawModel;
  }

  // Updates the removed features in the local-storage
  #setStoredRemovedFeatures = (removedFeatures) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      removedFeatures: removedFeatures,
    });
  };

  // Updates the stored sketches in the local-storage
  #setStoredSketches = (sketches) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      sketches: sketches,
    });
  };

  // Creates an object containing all the supplied properties along with
  // all the features currently in the sketch-layer.
  #createSketchObject = (sketchInformation) => {
    return {
      ...sketchInformation,
      id: this.#generateRandomString(),
      date: this.#getDateTimeString(),
      features: this.#drawModel
        .getAllDrawnFeatures()
        .map((f) => this.#prepareFeatureForStorage(f)),
    };
  };

  // Since we cannot save the OL-features directly in local-storage without
  // loosing some information, we'll have to parse the feature to a geoJSON
  // before we store it. We also have to decorate the feature with some style-information
  // so that we can extract the style when adding the feature to the map again;
  #prepareFeatureForStorage = (f) => {
    // So first, we'll decorate the feature with its style-information
    f.set("EXTRACTED_STYLE", this.#extractFeatureStyle(f));
    // Then we'll create the geoJSON, and return that.
    return this.#geoJSONParser.writeFeature(f);
  };

  // Returns the activity-object connected to the supplied id
  getActivityFromId = (id) => {
    return ACTIVITIES.find((activity) => {
      return activity.id === id;
    });
  };

  // Extracts the fill-style from the supplied feature-style
  #getFillStyle = (featureStyle) => {
    try {
      // Since we might be dealing with a style-array instead of a style-object
      // (in case of the special Arrow feature-type) we have to make sure to get
      // the actual base-style (which is located at position 0 in the style-array).
      const color = Array.isArray(featureStyle)
        ? featureStyle[0].getFill().getColor()
        : featureStyle.getFill().getColor();
      return { color };
    } catch (error) {
      console.error(`Failed to extract fill-style, ${error.message}`);
      return { color: null };
    }
  };

  // Extracts the stroke-style from the supplied feature-style
  #getStrokeStyle = (featureStyle) => {
    try {
      // Since we might be dealing with a style-array instead of a style-object
      // (in case of the special Arrow feature-type) we have to make sure to get
      // the actual base-style (which is located at position 0 in the style-array).
      const s = Array.isArray(featureStyle)
        ? featureStyle[0].getStroke()
        : featureStyle.getStroke();
      const color = s.getColor();
      const dash = s.getLineDash();
      const width = s.getWidth();
      return {
        color,
        dash,
        width,
      };
    } catch (error) {
      console.error(`Failed to extract stroke-style, ${error.message}`);
      return { color: null, dash: null, width: null };
    }
  };

  // Extracts the image-style from the supplied feature-style
  #getImageStyle = (featureStyle) => {
    // Since we might be dealing with a style-array instead of a style-object
    // (in case of the special Arrow feature-type) we have to make sure to get
    // the actual base-style (which is located at position 0 in the style-array).
    const s = Array.isArray(featureStyle)
      ? featureStyle[0]?.getImage()
      : featureStyle?.getImage();
    // Let's extract the fill- and stroke-style from the image-style.
    const fillStyle = s?.getFill();
    const strokeStyle = s?.getStroke();
    // Let's make sure the image-style has fill- and stroke-style before moving on
    if (!fillStyle || !strokeStyle) {
      return {
        fillColor: null,
        strokeColor: null,
        strokeWidth: null,
        dash: null,
      };
    }
    const fillColor = fillStyle.getColor();
    const strokeColor = strokeStyle.getColor();
    const strokeWidth = strokeStyle.getWidth();
    const dash = strokeStyle.getLineDash();
    return { fillColor, strokeColor, strokeWidth, dash };
  };

  // Extracts and returns information about the feature style.
  #extractFeatureStyle = (feature) => {
    // Let's run this in a try-catch since we cannot be sure that a
    // real feature is supplied. (I.e. getStyle() etc. might not exist).
    try {
      const featureStyle = feature?.getStyle();
      // If no feature was supplied, or if we're unable to extract the style,
      // we return null.
      if (!featureStyle) {
        return { fillStyle: null, strokeStyle: null, imageStyle: null };
      }
      // If we were able to extract the style we can continue by extracting
      // the fill- and stroke-style.
      const fillStyle = this.#getFillStyle(featureStyle);
      const strokeStyle = this.#getStrokeStyle(featureStyle);
      const imageStyle = this.#getImageStyle(featureStyle);
      // And return an object containing them
      return { fillStyle, strokeStyle, imageStyle };
    } catch (error) {
      console.error(`Failed to extract feature-style. Error: ${error}`);
      return { fillStyle: null, strokeStyle: null, imageStyle: null };
    }
  };

  // Returns the current date and time on YYYY-MM-DD HH:MM:SS
  #getDateTimeString = () => {
    const date = new Date();
    return date.toLocaleString("default", this.#dateTimeOptions);
  };

  // Generates a random string that can be used as an ID.
  #generateRandomString = () => {
    return Math.random().toString(36).slice(2, 9);
  };

  // Accepts an array containing the line-dash, and returns the line (stroke) type
  // that corresponds to that value.
  #getStrokeType = (lineDash) => {
    for (const [key, value] of STROKE_DASHES.entries()) {
      // The value and actual line-dash might be null, lets check if they
      // both are: (If they are, the line-type is "solid").
      if (value === lineDash) {
        return key;
      }
      // The value might also be an array, and "===" will therefore check for reference equality.
      // Which will obviously not work, since they are not pointing to the same object. Instead,
      // let's check if the arrays has the same content. (We don't care about the array order).
      if (
        Array.isArray(value) &&
        Array.isArray(lineDash) &&
        value.every((v) => lineDash.includes(v))
      ) {
        return key;
      }
    }
    // If it wasn't found, we'll log an error and return null.
    console.error(
      `Could not find corresponding stroke-type from supplied line-dash. The supplied line-dash was: ${lineDash}`
    );
    return null;
  };

  // Extract the style settings from the supplied object and returns an object
  // with the color settings converted to string to comply with OL.
  #extractStyleSettings = (settings) => {
    const { strokeColor, fillColor, strokeWidth, lineDash } = settings;
    const strokeColorString = this.#drawModel.getRGBAString(strokeColor);
    const fillColorString = this.#drawModel.getRGBAString(fillColor);
    return {
      strokeColor: strokeColorString,
      fillColor: fillColorString,
      strokeWidth,
      lineDash,
    };
  };

  // Creates a circle-style that can be used within an image-style.
  #createImageStyle = (settings) => {
    return new Circle({
      radius: 6,
      stroke: new Stroke({
        color: settings.strokeColor,
        width: settings.strokeWidth,
        lineDash: settings.lineDash,
      }),
      fill: new Fill({
        color: settings.fillColor,
      }),
    });
  };

  // Returns the feature-style in a form that fits the feature-style-editor
  getFeatureStyle = (feature) => {
    try {
      // We're gonna need the base-style of the feature
      const featureBaseStyle = this.#extractFeatureStyle(feature);
      // Then we'll extract the text-settings. (These might be undefined, and
      // are only set if we are dealing with a text-feature).
      const featureTextStyle = feature.get("TEXT_SETTINGS");
      // Then we'll construct the feature-style-object and return it.
      return {
        strokeColor: this.#drawModel.parseRGBAString(
          featureBaseStyle?.strokeStyle.color
        ),
        lineDash: featureBaseStyle?.strokeStyle.dash,
        strokeWidth: featureBaseStyle?.strokeStyle.width,
        strokeType: this.#getStrokeType(featureBaseStyle?.strokeStyle.dash),
        fillColor: this.#drawModel.parseRGBAString(
          featureBaseStyle?.fillStyle.color
        ),
        textForegroundColor: featureTextStyle?.foregroundColor,
        textBackgroundColor: featureTextStyle?.backgroundColor,
        textSize: featureTextStyle?.size,
      };
    } catch (error) {
      console.error(`Failed to get feature-style: Error: ${error}`);
      return null;
    }
  };

  // Applies the supplied style on the supplied feature.
  setFeatureStyle = (feature, styleSettings) => {
    try {
      // First we'll have to get the base-style. (If we're dealing
      // with an arrow-feature, the base-style is the first element of the array
      // returned from the getStyle-method).
      const featureStyle = Array.isArray(feature.getStyle())
        ? feature.getStyle()[0]
        : feature.getStyle();
      // Then we'll get the stroke and text-style
      const fillStyle = featureStyle.getFill();
      const strokeStyle = featureStyle.getStroke();
      const imageStyle = featureStyle.getImage();

      const { fillColor, strokeColor, strokeWidth, lineDash } =
        this.#extractStyleSettings(styleSettings);

      fillStyle.setColor(fillColor);
      strokeStyle.setColor(strokeColor);
      strokeStyle.setWidth(strokeWidth);
      strokeStyle.setLineDash(lineDash);
      // Unfortunately, the feature-image-style does not update by re-setting the
      // stroke- and fill-settings within the image-style. Instead, a new image-style
      // has to be created.
      imageStyle &&
        featureStyle.setImage(
          this.#createImageStyle({
            fillColor,
            strokeColor,
            strokeWidth,
            lineDash,
          })
        );

      // If we're dealing with a text.feature, the text-style-settings must be updated as well.
      if (feature.get("DRAW_METHOD") === "Text") {
        feature.set("TEXT_SETTINGS", {
          size: styleSettings.textSize,
          foregroundColor: styleSettings.textForegroundColor,
          backgroundColor: styleSettings.textBackgroundColor,
        });
      }
    } catch (error) {
      console.error(`Failed to apply the supplied style. Error: ${error}`);
    }
  };

  // When a feature is removed, we should usually add it to the list of
  // removed features. However, there is one case where we should not!
  // If we've added a text-feature, and the user has chosen to abort the
  // input of text to apply to the feature, we make sure to remove it, and
  // that removed feature should not be shown in the list of removed features.
  featureShouldBeAddedToStorage = (feature) => {
    return !(
      feature.get("DRAW_METHOD") === "Text" && !feature.get("USER_TEXT")
    );
  };

  // We're gonna need to set some properties on the handled feature so that we can keep
  // track of it. (The "HANDLED_AT" prop will show the user at what time the feature was
  // removed, and the "HANDLED_ID" will be used if the user choses to restore the feature).
  decorateFeature = (feature) => {
    feature.set("EXTRACTED_STYLE", this.#extractFeatureStyle(feature));
    feature.set("HANDLED_AT", this.#getDateTimeString());
    feature.set("HANDLED_ID", this.#generateRandomString());
  };

  // Returns the earlier removed features which are stored in local-storage
  // If the first parameter is omitted, the method will return parsed OL-features,
  // otherwise, it will return the actual local-storage value.
  getRemovedFeaturesFromStorage = (returnType = "FEATURES") => {
    const inStorage = LocalStorageHelper.get(this.#storageKey);
    const storedFeatures = inStorage["removedFeatures"] || [];
    return returnType === "FEATURES"
      ? storedFeatures.map((parsedFeature) =>
          this.#geoJSONParser.readFeature(parsedFeature)
        )
      : storedFeatures;
  };

  // Returns sketches that has been saved to local-storage.
  getSketchesFromStorage = () => {
    const inStorage = LocalStorageHelper.get(this.#storageKey);
    const storedSketches = inStorage["sketches"] || [];
    return storedSketches;
  };

  // Updates the local-storage by adding the removed feature and potentially
  // removing old removed features. (We want to keep a maximum of MAX_REMOVED_FEATURES).
  addFeatureToStorage = (feature) => {
    const removedFeatures = this.getRemovedFeaturesFromStorage("STRINGS");
    const parsedFeature = this.#geoJSONParser.writeFeature(feature);
    this.#setStoredRemovedFeatures([
      parsedFeature,
      ...removedFeatures.slice(0, MAX_REMOVED_FEATURES - 1),
    ]);
  };

  // Updates the local-storage by adding a new sketch containing all the features currently
  // in the the sketch-layer. If a sketch with the same id as the one supplied one already exist,
  // the already stored sketch will be over-written.
  addCurrentSketchToStorage = (sketchInfo) => {
    // First we'll make sure to remove any potential sketch (with same title) already in storage.
    this.removeSketchFromStorage(sketchInfo.title);
    // Then we'll create a sketch (an object containing the supplied sketch-information along with the
    // features currently existing in the sketch-layer).
    const sketch = this.#createSketchObject(sketchInfo);
    // Then we'll get all the currently stored sketches.
    const storedSketches = this.getSketchesFromStorage();
    // Then we'll update the stored sketches with the supplied one.
    this.#setStoredSketches([...storedSketches, sketch]);
  };

  // Updates the local-storage by removing the feature corresponding to the supplied id
  removeFeatureFromStorage = (id) => {
    const storedFeatures = this.getRemovedFeaturesFromStorage("STRINGS");
    this.#setStoredRemovedFeatures(
      storedFeatures.filter((f) => !f.includes(id))
    );
  };

  // Updates the local-storage by removing the sketch corresponding to the supplied title.
  // Why title and not an id? Since we dont allow for multiple sketches with the same title, we can
  // use the title as an id.
  removeSketchFromStorage = (title) => {
    const storedSketches = this.getSketchesFromStorage();
    this.#setStoredSketches(storedSketches.filter((f) => f.title !== title));
  };
}
export default SketchModel;
