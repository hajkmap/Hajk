import { Draw, Modify, Select, Translate } from "ol/interaction";
import { createBox } from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Icon, Stroke, Style, Circle, Fill, Text } from "ol/style";
import { Circle as CircleGeometry, LineString } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { MultiPoint, Point } from "ol/geom";
import Overlay from "ol/Overlay";
import GeoJSON from "ol/format/GeoJSON";
import transformTranslate from "@turf/transform-translate";
import { getArea as getExtentArea, getCenter, getWidth } from "ol/extent";
import { Feature } from "ol";
import { handleClick } from "./Click";

/*
 * A model supplying useful Draw-functionality.
 * Required settings:
 * - layerName: (string): The name of the layer that initially should be connected to the Draw-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 *
 * Optional settings:
 * - observer: (Observer): An observer on which the drawModel can publish events, for example when a geometry has been deleted.
 * - observerPrefix (String): A string acting as a prefix on all messages published on the observer.
 * - modifyDefaultEnabled: (Boolean): States if the Modify-interaction be enabled when the Edit-interaction is enabled.
 * - translateDefaultEnabled: (Boolean): States if the Translate-interaction should be enabled when the Move-interaction is enabled.
 *
 * Exposes a couple of methods:
 * - refreshFeaturesTextStyle(): Refreshes the text-style on all features in the draw-source.
 * - refreshDrawLayer(): Redraws all features in the draw-layer.
 * - addFeature(feature): Adds the supplied feature to the draw-source.
 * - duplicateFeature(feature): Duplicates the supplied feature and adds it to the draw-source.
 * - removeFeature(feature): Removes the supplied feature from the draw-source.
 * - getCurrentExtent(): Returns the current extent of the current draw-layer.
 * - getCurrentLayerName(): Returns the name of the layer currently connected to the draw-model.
 * - removeDrawnFeatures():  Removes all drawn features from the current draw-source.
 * - setLayer(layerName <string>): Sets (or creates) the layer that should be connected to the draw-model.
 * - toggleDrawInteraction(drawType, settings): Accepts a string with the drawType and an object containing settings.
 * - zoomToCurrentExtent(): Fits the map-view to the current extent of the current draw-source.
 * - getRGBAString(RGBA-object <object>): Accepts an object with r-, g-, b-, and a-properties and returns the string representation.
 * - parseColorString(hex/rgba-string <string>): Accepts a string and returns an object with r-, g-, b-, and a-properties.
 * - getCurrentVectorSource(): Returns the vector-source currently connected to the draw-model.
 * - get/set drawStyleSettings(): Get or set the style settings used by the draw-model.
 * - get/set showDrawTooltip(): Get or set wether a tooltip should be shown when drawing.
 * - get/set modifyActive(): Get or set wether the Modify-interaction should be active or not.
 * - get/set translateActive(): Get or set wether the Translate-interaction should be active or not.
 * - get/set measurementSettings(): Get or set the measurement-settings (units, show-area etc.)
 * - get/set circleRadius(): Get or set the radius of the circle.
 */
class DrawModel {
  #map;
  #layerName;
  #geoJSONParser;
  #observer;
  #observerPrefix;
  #drawSource;
  #drawLayer;
  #currentExtent;
  #drawTooltipElement;
  #drawTooltipElementStyle;
  #drawTooltip;
  #currentPointerCoordinate;
  #showDrawTooltip;
  #measurementSettings;
  #drawStyleSettings;
  #textStyleSettings;
  #drawInteraction;
  #removeInteractionActive;
  #editInteractionActive;
  #featureChosenForEdit;
  #moveInteractionActive;
  #selectInteraction;
  #translateInteraction;
  #modifyInteraction;
  #keepModifyActive;
  #keepTranslateActive;
  #allowedLabelFormats;
  #customHandleDrawStart;
  #customHandleDrawEnd;
  #customHandlePointerMove;
  #customHandleAddFeature;
  #highlightFillColor;
  #highlightStrokeColor;
  #circleRadius;
  #circleInteractionActive;
  #selectInteractionActive;
  #selectedFeatures;
  #showSelectedFeatures;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    // We're gonna need a GeoJSON-parser with the maps projection set.
    this.#geoJSONParser = new GeoJSON({
      featureProjection: this.#map.getView().getProjection(),
    });
    // An observer might be supplied. If it is, the drawModel will publish messages when features are deleted etc.
    this.#observer = settings.observer || null;
    // There might be an "observerPrefix" (string) passed. States a string
    // which will act as a prefix on all messages published on the
    // supplied observer.
    this.#observerPrefix = this.#getObserverPrefix(settings);
    this.measurementSettings =
      settings.measurementSettings ?? this.#getDefaultMeasurementSettings();
    this.#drawStyleSettings =
      settings.drawStyleSettings ?? this.#getDefaultDrawStyleSettings();
    this.#textStyleSettings =
      settings.textStyleSettings ?? this.#getDefaultTextStyleSettings();
    // We are going to be keeping track of the current extent of the draw-source...
    this.#currentExtent = null;
    // And the current draw interaction.
    this.#drawInteraction = null;
    // We also have to make sure to keep track of if any other interaction is active.
    // E.g. "Remove", or "Edit".
    this.#removeInteractionActive = false;
    this.#editInteractionActive = false;
    this.#moveInteractionActive = false;
    this.#modifyInteraction = null;
    this.#keepModifyActive = settings.modifyDefaultEnabled ?? false;
    this.#translateInteraction = null;
    this.#keepTranslateActive = settings.translateDefaultEnabled ?? true;
    this.#selectInteraction = null;
    this.#featureChosenForEdit = null;
    // We're also keeping track of the tooltip-settings
    this.#showDrawTooltip = settings.showDrawTooltip ?? true;
    this.#drawTooltip = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltipElement = null;
    this.#drawTooltipElementStyle =
      "position: relative; background: rgba(0, 0, 0, 0.5); border-radius: 4px; color: white; padding: 4px 8px; opacity: 0.7; white-space: nowrap;";
    // There might be some custom event-listeners passed when initiating the draw interaction,
    // we have to keep track of them.
    this.#customHandleDrawStart = null;
    this.#customHandleDrawEnd = null;
    this.#customHandlePointerMove = null;
    this.#customHandleAddFeature = null;
    this.#highlightFillColor = "rgba(35,119,252,1)";
    this.#highlightStrokeColor = "rgba(255,255,255,1)";
    this.#circleRadius = 0;
    this.#selectInteractionActive = false;

    // A Draw-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateDrawLayer();
    // We also have to initiate the element for the draw-tooltip
    this.#createDrawTooltip();
  }

  // Returns the supplied observerPrefix from the supplied settings or null if none was supplied.
  #getObserverPrefix = (settings) => {
    return typeof settings.observerPrefix === "string"
      ? settings.observerPrefix
      : null;
  };

  // Helper function that accepts an object containing two parameters:
  // - subject: (string): The subject to be published on the observer
  // - payLoad: (any): The payload to send when publishing.
  #publishInformation = ({ subject, payLoad }) => {
    // If no observer has been set-up, or if the subject is missing, we abort
    if (!this.#observer || !subject) {
      return;
    }
    // Otherwise we create the prefixed-subject to send. (The drawModel might have
    // been initiated with a prefix that should be added on all subjects).
    const prefixedSubject = this.#observerPrefix
      ? `${this.observerPrefix}.${subject}`
      : subject;
    // Then we publish the event!
    this.#observer.publish(prefixedSubject, payLoad);
  };

  // Returns the default style settings used by the draw-model.
  #getDefaultDrawStyleSettings = () => {
    const strokeColor = "rgba(74,74,74,0.5)";
    const strokeDash = null;
    const strokeWidth = 2;
    const fillColor = "rgba(255,255,255,0.07)";
    return {
      strokeColor: strokeColor,
      lineDash: strokeDash,
      strokeWidth: strokeWidth,
      fillColor: fillColor,
    };
  };

  // Returns the default settings used to display measurement-labels
  #getDefaultMeasurementSettings = () => {
    return {
      showText: false,
      showArea: false,
      showPerimeter: false,
      areaUnit: "AUTO",
      lengthUnit: "AUTO",
      precision: 0,
    };
  };

  // Returns the default text-style settings used by the draw-model.
  #getDefaultTextStyleSettings = () => {
    const foregroundColor = "#FFFFFF";
    const backgroundColor = "#000000";
    const size = 14;
    return { foregroundColor, backgroundColor, size };
  };

  // If required parameters are missing, we have to make sure we abort the
  // initiation of the draw-model.
  #handleInitiationParametersMissing = () => {
    throw new Error(
      "Failed to initiate Draw-model, - required parameters missing. \n Required parameters: map, layerName"
    );
  };

  // We have to initiate a vector layer that can be used by the draw-model
  #initiateDrawLayer = () => {
    if (this.#vectorLayerExists()) {
      return this.#connectExistingVectorLayer();
    }
    return this.#createNewDrawLayer();
  };

  // Checks wether the layerName supplied when initiating the Draw-model
  // corresponds to an already existing vector-layer.
  #vectorLayerExists = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Check wether any of the layers has the same name (type)
    // as the supplied layerName.
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

  // Connects the private fields of the draw-model to an already existing
  // vectorLayer.
  #connectExistingVectorLayer = () => {
    // Get all the layers from the map
    const allMapLayers = this.#getAllMapLayers();
    // Then we'll grab the layer corresponding to the supplied layerName.
    const connectedLayer = allMapLayers.find((layer) => {
      return this.#layerHasCorrectNameAndType(layer);
    });
    // Then we'll set the private fields
    this.#drawLayer = connectedLayer;
    this.#drawSource = connectedLayer.getSource();
  };

  // Creates a new vector layer that can be used by the draw-model
  #createNewDrawLayer = () => {
    // Let's grab a vector-source.
    this.#drawSource = this.#getNewVectorSource();
    // Then we'll create the layer
    this.#drawLayer = this.#getNewVectorLayer(this.#drawSource);
    // Make sure to set the layer type to something understandable.
    this.#drawLayer.set("type", this.#layerName);
    // FIXME: Remove "type", use only "name" throughout
    // the application. Should be done as part of #883.
    this.#drawLayer.set("name", this.#layerName);
    // Then we can add the layer to the map.
    this.#map.addLayer(this.#drawLayer);
  };

  // Creates the element and overlay used to display the area of the feature
  // currently being drawn.
  #createDrawTooltip = () => {
    // If the element already exists in the dom (which it will if #drawTooltipElement
    //  isn't nullish), we must make sure to remove it.
    this.#removeEventualDrawTooltipElement();
    // Let's crete a element that we can use in the overlay.
    this.#drawTooltipElement = document.createElement("div");
    // Let's style the element a bit so it looks prettier...
    this.#drawTooltipElement.setAttribute(
      "style",
      this.#drawTooltipElementStyle
    );
    // Then let's create the overlay...
    this.#drawTooltip = new Overlay({
      element: this.#drawTooltipElement,
      offset: [30, -5],
      positioning: "bottom-center",
    });
    // And add it to the map!
    this.#map.addOverlay(this.#drawTooltip);
  };

  // We have to make sure that we remove eventual unused elements
  // from the dom tree so they're not lurking around.
  #removeEventualDrawTooltipElement = () => {
    // Before we do anything else, we make sire that there actually is
    // an element present.
    if (this.#drawTooltipElement) {
      // Then we can remove it
      this.#drawTooltipElement.parentNode.removeElement(
        this.#drawTooltipElement
      );
      // And clear the variable
      this.#drawTooltipElement = null;
    }
  };

  // Returns the style that should be used on the drawn features
  #getFeatureStyle = (feature, settingsOverride) => {
    if (feature.get("HIDDEN") === true) {
      !feature.get("STYLE_BEFORE_HIDE") &&
        feature.set("STYLE_BEFORE_HIDE", feature.getStyle());
      return new Style({});
    }
    // If we're dealing with "Arrow" we'll return a special style array
    if (feature?.get("DRAW_METHOD") === "Arrow") {
      return this.#getArrowStyle(feature, settingsOverride);
    }
    // Otherwise we'll grab the 'current' style. The 'current' style might be
    // stored in the 'STYLE_BEFORE_HIDE' property (and feature.getStyle() will
    // return an empty style). This case happens when the feature has been hid, and
    // is now to be shown again. For all the 'ordinary' cases, this property will be null
    // and wont affect the feature-style.
    const currentStyle = feature.get("STYLE_BEFORE_HIDE") || feature.getStyle();
    feature.set("STYLE_BEFORE_HIDE", null);
    // Let's grab the standard draw (or the currently set) style as a baseline.
    // The standard style can be overridden if the override is supplied. This is a real mess,
    // since OL might decide to apply a style-array sometimes (in that case we want the fist style
    // from the style-array) and sometimes its not an array.
    const baseLineStyle = settingsOverride
      ? this.#getDrawStyle(settingsOverride)
      : currentStyle
      ? Array.isArray(currentStyle)
        ? currentStyle[0]
        : currentStyle
      : this.#getDrawStyle();
    // If we're dealing with a text-feature, we don't want an image-style.
    feature.get("DRAW_METHOD") === "Text" && baseLineStyle.setImage(null);
    // ILet's create a text-style. (Remember that this might be null, depending
    // on the feature-text-settings, see more info in the method itself).
    const textStyle = this.#getFeatureTextStyle(feature);
    // Apply the text-style to the baseline style...
    baseLineStyle.setText(textStyle);
    // If the "EDIT_ACTIVE"-property is set (meaning that the feature has been selected for
    // editing of its color etc) we have to return the baseline-style along with a highligh-style.
    if (feature.get("EDIT_ACTIVE") === true) {
      return [baseLineStyle, this.#getNodeHighlightStyle(feature)];
    } else {
      // If its not set, we just return the baseline style!
      return baseLineStyle;
    }
  };

  // Method returning if we're supposed to be showing text on the feature
  // or not. We're showing text in two cases: One: if the feature is of text-type,
  // or two: if we're supposed to be showing feature measurements. If the feature is
  // of arrow-type, we're never showing text.
  #shouldShowText = (feature) => {
    if (!feature) {
      console.warn(
        "Could not evaluate '#shouldShowText' since no feature was supplied."
      );
      return false;
    }
    // The "SHOW_TEXT" prop can be toggled by the user allowing them to hide all texts.
    if (feature.get("SHOW_TEXT") === false) {
      return false;
    }
    // Let's get the feature draw-method
    const featureDrawMethod =
      feature.get("DRAW_METHOD") || feature.get("geometryType");
    // And check if we're supposed to be showing text or not.
    // (We're never showing text on arrow-features, and text-features override
    // the measurement-settings, since the text-features would be useless
    // if the text wasn't shown).
    return (
      featureDrawMethod !== "Arrow" &&
      (this.#measurementSettings.showText || featureDrawMethod === "Text")
    );
  };

  // Returns a text-style that shows the tooltip-label
  // (i.e. the area of the feature in a readable format).
  // *If the measurement-label is supposed to be shown!*
  #getFeatureTextStyle = (feature) => {
    // First we have to make sure we're supposed to be showing text on the feature.
    const shouldShowText = this.#shouldShowText(feature);
    // If we're not supposed to be showing any text, we can just return null
    if (!shouldShowText) {
      return null;
    }
    // Before we create the text-style we have to check if we,re dealing with a
    // point. If we are, we have to make sure to offset the text in the negative y-direction.
    const featureIsPoint = feature?.getGeometry() instanceof Point;
    // We also have to check if we're dealing with a text-feature or not
    const featureIsTextType = feature?.get("DRAW_METHOD") === "Text";
    // Then we can create and return the style
    return new Text({
      textAlign: "center",
      textBaseline: "middle",
      font: `${
        featureIsTextType
          ? feature.get("TEXT_SETTINGS")?.size ?? this.#textStyleSettings.size
          : 12
      }pt sans-serif`,
      fill: new Fill({
        color: featureIsTextType
          ? feature.get("TEXT_SETTINGS")?.foregroundColor ??
            this.#textStyleSettings.foregroundColor
          : "#FFF",
      }),
      text: this.#getFeatureLabelText(feature),
      overflow: true,
      stroke: new Stroke({
        color: featureIsTextType
          ? feature.get("TEXT_SETTINGS")?.backgroundColor ??
            this.#textStyleSettings.backgroundColor
          : "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
      offsetX: 0,
      offsetY: featureIsPoint && !featureIsTextType ? -15 : 0,
      rotation: 0,
      scale: 1,
    });
  };

  #getArrowBaseStyle = (settings) => {
    // First we'll grab the feature base-style
    const baseStyle = this.#getDrawStyle(settings);
    // Then we'll alter the base-style a bit... We don't want to apply
    // eventual line-dash, and we also want a hard-coded stroke-width.
    const baseStroke = baseStyle.getStroke();
    baseStroke.setWidth(5);
    baseStroke.setLineDash(null);
    // Then we return the altered base-style
    return baseStyle;
  };

  // Returns a svg-string that is used to display arrows in the draw-source.
  #createArrowSvg = (color) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32pt" height="32pt" fill="${color}"><path d="M 1 5 L 1 5 L 1 13 L 1 21 L 1 21 L 12 13"/></svg>`;
    return `data:image/svg+xml;base64,${window.btoa(svgString)}`; // We need base64 for kml-exports to work.
  };

  // Returns a style array that is used to style arrow features.
  // (All other features consist of a single style-object).
  #getArrowStyle = (feature, settings) => {
    // First we'll extract the current style. We only want the current style if it is
    // an array! Otherwise we're not dealing with an arrow-style... (Arrow-style should always be an array).
    const currentStyle = Array.isArray(feature.getStyle())
      ? feature.getStyle()
      : null;
    // Then we'll grab the arrow base-style, which should be the first style in the current
    // style-array. If that style is missing, we'll create a new one.
    const baseStyle = settings
      ? this.#getArrowBaseStyle(settings)
      : currentStyle
      ? currentStyle[0]
      : this.#getArrowBaseStyle();
    // We have to extract the base-color as well, so that we can create an arrow-head with
    // the correct color.
    const baseColor = baseStyle.getStroke()?.getColor() ?? null;
    // Then we'll add the base-style to the styles-array
    const styles = [baseStyle];
    // Then we'll add the arrow-head at the end of every line-segment.
    feature?.getGeometry().forEachSegment((start, end) => {
      // We'll have to rotate the arrow-head, let's calculate the
      // line-segments rotation.
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const rotation = Math.atan2(dy, dx);
      // Then we'll push a style for each arrow-head.
      styles.push(
        new Style({
          geometry: new Point(end),
          image: new Icon({
            src: this.#createArrowSvg(
              settings
                ? settings.strokeStyle.color
                : baseColor
                ? baseColor
                : this.#drawStyleSettings.strokeColor
            ),
            anchor: [0.38, 0.53],
            rotateWithView: true,
            rotation: -rotation,
          }),
        })
      );
    });
    // And finally return the style-array.
    return styles;
  };

  // Creates a highlight style (a style marking the coordinates of the supplied feature).
  #getNodeHighlightStyle = (feature) => {
    try {
      return new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: this.#highlightFillColor,
          }),
          stroke: new Stroke({ color: this.#highlightStrokeColor, width: 2 }),
        }),
        geometry: () => {
          const coordinates = this.#getFeatureCoordinates(feature);
          return new MultiPoint(coordinates);
        },
      });
    } catch (error) {
      console.error(`Could not create highlight style. Error: ${error}`);
      return null;
    }
  };

  // Returns an array of arrays with the coordinates of the supplied feature
  #getFeatureCoordinates = (feature) => {
    // First, we have to extract the feature geometry
    const geometry = feature.getGeometry();
    // Then we'll have to extract the feature type, since we have to extract the
    // coordinates in different ways, depending on the geometry type.
    const geometryType = geometry.getType();
    // Then we'll use a switch-case to make sure we return the coordinates in
    // the correct format.
    switch (geometryType) {
      case "Circle":
        // If we're dealing with a circle, we'll create a simplified geometry
        // with 8 points, which we can use to highlight some of the "nodes" of
        // the circle. GetCoordinates returns the coordinates in an extra wrapping
        // array (for polygons), so let's return the first element.
        return fromCircle(geometry, 8).getCoordinates()[0];
      case "LineString":
        // GetCoordinates returns an array of arrays with coordinates for LineStrings,
        // so we can return it as-is.
        return geometry.getCoordinates();
      case "Point":
        // GetCoordinates returns an array with the coordinates for points,
        // so we have to wrap that array in an array before returning.
        return [geometry.getCoordinates()];
      default:
        // The default catches Polygons, which are wrapped in an "extra" array, so let's
        // return the first element.
        return geometry.getCoordinates()[0];
    }
  };

  // Returns the area, perimeter, and/or length of the supplied feature in a readable format.
  #getFeatureMeasurementLabel = (feature, labelType) => {
    // First we must get the feature measurements (The returned measurements will differ
    // Depending on if we're dealing with Point, LineString, or surface).
    const measurements = this.#getFeatureMeasurements(feature);
    // Then we'll reduce the measurements down to a string that we can show.
    return measurements.reduce((acc, curr) => {
      switch (curr.type) {
        case "COORDINATES":
          return (acc += `N: ${Math.round(curr.value[1])} E: ${Math.round(
            curr.value[0]
          )}`);
        case "AREA":
        case "PERIMETER":
        case "LENGTH":
          return (acc += this.#getFormattedMeasurementString(curr, labelType));
        default:
          return acc;
      }
    }, "");
  };

  #getFormattedMeasurementString = (measurement, labelType) => {
    // Let's destruct some measurement-information that we can
    // use to construct the measurement-string.
    const { type, value, prefix } = measurement;
    // We have to make sure that we're supposed to show the measurement-text.
    // This is controlled in the measurement-settings, but is also affected by
    // the supplied type (if we're creating a tooltip, we're always showing everything!).
    const showMeasurement =
      labelType === "TOOLTIP" ||
      type === "LENGTH" ||
      (type === "AREA" && this.#measurementSettings.showArea) ||
      (type === "PERIMETER" && this.#measurementSettings.showPerimeter);
    // If we're not supposed to be showing the measurement, lets return an empty string.
    if (!showMeasurement) {
      return "";
    }
    // Otherwise we'll handle the formatting according to the labelFormat set by the user
    switch (this.#getLabelFormatFromMeasurementType(type)) {
      case "AUTO":
        const formatted = this.#shouldFormatToKm(value, type)
          ? this.#getKilometerMeasurementString(value, type)
          : this.#getMeasurementString(value, type);
        return `${prefix} ${formatted}`;
      case "KM":
      case "KM2":
        // If the format is "KM2", we'll show the measurement in km²
        // (Or km if we're measuring length). Rounded to show 3 decimals.
        return `${prefix} ${this.#getKilometerMeasurementString(value, type)}`;
      case "HECTARE":
        // If the format is "HECTARE" we will show the measurement in hectare
        // if we're dealing with a surface. If we're dealing with a lineString
        // we will return the measurement with "M2" format.
        return `${prefix} ${this.#getHectareMeasurementString(value, type)}`;
      default:
        // Otherwise m² (or m) will do. (Displayed in local format).
        return `${prefix} ${this.#getMeasurementString(value, type)}`;
    }
  };

  #getLabelFormatFromMeasurementType = (type) => {
    switch (type) {
      case "LENGTH":
      case "PERIMETER":
        return this.#measurementSettings.lengthUnit;
      default:
        return this.#measurementSettings.areaUnit;
    }
  };

  // Checks if the supplied value and type should be formatted to km or not.
  #shouldFormatToKm = (value, type) => {
    // If the format is AUTO, we're checking if the measurement is large
    // enough to show it in kilometers or not. First, we need to set
    // the cutoff points for the kilometer display.
    const lengthCutOff = 1e3;
    const areaCutOff = 1e6;
    switch (type) {
      case "LENGTH":
      case "PERIMETER":
        return value > lengthCutOff;
      default:
        return value > areaCutOff;
    }
  };

  // Returns the label text that should be shown on the feature.
  // Usually the text is constructed by the measurement of the feature,
  // but if the feature is of text-type, we show the user-added-text.
  #getFeatureLabelText = (feature) => {
    // Are we dealing with a text-feature? Let's return the user-
    // added-text.
    if (feature.get("DRAW_METHOD") === "Text") {
      return feature.get("USER_TEXT") ?? "";
    }
    // There might be a title present on the feature, if there is, we'll want
    // to display it.
    const featureTitle = feature.get("FEATURE_TITLE") ?? "";
    // We'll also have to grab the eventual measurement-label
    const measurementLabel = this.#measurementSettings.showText
      ? this.#getFeatureMeasurementLabel(feature, "LABEL")
      : "";
    // Finally, we can return the eventual title, and the eventual measurement-label combined.
    return featureTitle.length > 0
      ? `${featureTitle}${
          measurementLabel.length > 0 ? "\n" : ""
        }${measurementLabel}`
      : measurementLabel;
  };

  // Returns the supplied measurement as a kilometer-formatted string.
  // If we're measuring area, km² is returned, otherwise, km is returned.
  #getKilometerMeasurementString = (featureMeasure, type) => {
    // The precision can be changed by the user and is set in the measurement-settings.
    const precision = this.#measurementSettings.precision ?? 0;
    switch (type) {
      case "LENGTH":
      case "PERIMETER":
        return `${Number(
          (featureMeasure / 1e3).toFixed(precision)
        ).toLocaleString()} km`;
      default:
        return `${Number(
          (featureMeasure / 1e6).toFixed(precision)
        ).toLocaleString()} km²`;
    }
  };

  // Returns the measurement in hectare if we're dealing with a surface, and if
  // we're dealing with a line-string we return the measurement in metres.
  #getHectareMeasurementString = (featureMeasure, type) => {
    // The precision can be changed by the user and is set in the measurement-settings.
    const precision = this.#measurementSettings.precision ?? 0;
    switch (type) {
      case "LENGTH":
      case "PERIMETER":
        return this.#getMeasurementString(featureMeasure, type);
      default:
        return `${Number(
          (featureMeasure / 1e4).toFixed(precision)
        ).toLocaleString()} ha`;
    }
  };

  // Returns the supplied measurement as a locally formatted string.
  // If we're measuring area m² is returned, otherwise, m is returned.
  #getMeasurementString = (featureMeasure, type) => {
    // The precision can be changed by the user and is set in the measurement-settings.
    const precision = this.#measurementSettings.precision ?? 0;
    switch (type) {
      case "LENGTH":
      case "PERIMETER":
        return `${Number(
          featureMeasure.toFixed(precision)
        ).toLocaleString()} m`;
      default:
        return `${Number(
          featureMeasure.toFixed(precision)
        ).toLocaleString()} m²`;
    }
  };

  // Calculates the area, length, or placement of the supplied feature.
  // Accepts an OL-feature, and is tested for Circle, LineString, Point, and Polygon.
  #getFeatureMeasurements = (feature) => {
    // Let's get the geometry-type to begin with, we are going
    // to be handling points, line-strings, and surfaces differently.
    const geometry = feature.getGeometry();
    // If we're dealing with a point, we simply return the coordinates of the point.
    if (geometry instanceof Point) {
      return [
        { type: "COORDINATES", value: geometry.getCoordinates(), prefix: "" },
      ];
    }
    // If the user has chosen to only show the area (and not the perimeter), we don't
    // need to show the area-prefix. The area-prefix should only be shown if both area and
    // perimeter is chosen to be shown.
    const showAreaPrefix =
      this.#measurementSettings.showArea &&
      this.#measurementSettings.showPerimeter;
    // Apparently the circle geometry instance does not expose a
    // getArea method. Here's a quick fix. (Remember that this area
    // is only used as an heads-up for the user.)
    if (geometry instanceof CircleGeometry) {
      const radius = geometry.getRadius();
      return [
        {
          type: "AREA",
          value: Math.pow(radius, 2) * Math.PI,
          prefix: `${showAreaPrefix ? "Area:" : ""}`,
        },
        {
          type: "PERIMETER",
          value: radius,
          prefix: "\n Radie:",
        },
      ];
    }
    // If we're dealing with a line we cannot calculate an area,
    // instead, we only calculate the length.
    if (geometry instanceof LineString) {
      return [{ type: "LENGTH", value: geometry.getLength(), prefix: "" }];
    }
    // If we're not dealing with a point, circle, or a line, we are probably dealing
    // with a polygon. For the polygons, we want to return the area and perimeter.
    return [
      {
        type: "AREA",
        value: geometry?.getArea() || 0,
        prefix: `${showAreaPrefix ? "Area:" : ""}`,
      },
      {
        type: "PERIMETER",
        value: this.#getPolygonPerimeter(geometry),
        prefix: "\n Omkrets:",
      },
    ];
  };

  // Returns the perimeter of the supplied polygon-geometry
  #getPolygonPerimeter = (geometry) => {
    try {
      // To get the perimeter, we have to get the coordinates of the
      // outer (0) linear-ring of the supplied geometry. If we fail to extract these
      // coordinates, we set the linear-ring-coords to null.
      const linearRingCoords =
        geometry?.getLinearRing(0)?.getCoordinates() || null;
      // If no coords were found, we simply return an area of 0.
      if (!linearRingCoords) {
        return 0;
      }
      // If some coords were found, we can construct a Line-string, and get the length
      // of that line-string!
      return new LineString(linearRingCoords)?.getLength() || 0;
    } catch (error) {
      // If we fail somewhere, we return 0. Would be better with more handling here!
      return 0;
    }
  };

  // Returns an OL style to be used in the draw-interaction.
  #getDrawStyle = (settings) => {
    return new Style({
      stroke: this.#getDrawStrokeStyle(settings),
      fill: this.#getDrawFillStyle(settings),
      image: this.#getDrawImageStyle(settings),
    });
  };

  // Returns the stroke style (based on the style settings)
  #getDrawStrokeStyle = (settings) => {
    return new Stroke({
      color: settings
        ? settings.strokeStyle.color
        : this.#drawStyleSettings.strokeColor,
      lineDash: settings
        ? settings.strokeStyle.dash
        : this.#drawStyleSettings.lineDash,
      width: settings
        ? settings.strokeStyle.width
        : this.#drawStyleSettings.strokeWidth,
    });
  };

  // Returns the fill style (based on the style settings)
  #getDrawFillStyle = (settings) => {
    return new Fill({
      color: settings
        ? settings.fillStyle.color
        : this.#drawStyleSettings.fillColor,
    });
  };

  // Returns the image style (based on the style settings)
  #getDrawImageStyle = (settings) => {
    return new Circle({
      radius: 6,
      stroke: new Stroke({
        color: settings
          ? settings.strokeStyle.color
          : this.#drawStyleSettings.strokeColor,
        width: settings
          ? settings.strokeStyle.width
          : this.#drawStyleSettings.strokeWidth,
        lineDash: settings
          ? settings.strokeStyle.dash
          : this.#drawStyleSettings.lineDash,
      }),
      fill: new Fill({
        color: settings
          ? settings.fillStyle.color
          : this.#drawStyleSettings.fillColor,
      }),
    });
  };

  // Extracts the fill-style from the supplied feature-style
  #getFillStyleInfo = (featureStyle) => {
    try {
      // Since we might be dealing with a style-array instead of a style-object
      // (in case of the special Arrow feature-type) we have to make sure to get
      // the actual base-style (which is located at position 0 in the style-array).
      const color = Array.isArray(featureStyle)
        ? featureStyle[0]?.getFill()?.getColor()
        : featureStyle?.getFill()?.getColor();
      return { color: this.getRGBAString(color) };
    } catch (error) {
      console.error(`Failed to extract fill-style, ${error.message}`);
      return { color: null };
    }
  };

  // Extracts the stroke-style from the supplied feature-style
  #getStrokeStyleInfo = (featureStyle) => {
    try {
      // Since we might be dealing with a style-array instead of a style-object
      // (in case of the special Arrow feature-type) we have to make sure to get
      // the actual base-style (which is located at position 0 in the style-array).
      const s = Array.isArray(featureStyle)
        ? featureStyle[0]?.getStroke()
        : featureStyle?.getStroke();
      const color = s?.getColor();
      const dash = s?.getLineDash();
      const width = s?.getWidth();
      return {
        color: this.getRGBAString(color),
        dash,
        width,
      };
    } catch (error) {
      console.error(`Failed to extract stroke-style, ${error.message}`);
      return { color: null, dash: null, width: null };
    }
  };

  // Extracts the image-style from the supplied feature-style
  #getImageStyleInfo = (featureStyle) => {
    // Since we might be dealing with a style-array instead of a style-object
    // (in case of the special Arrow feature-type) we have to make sure to get
    // the actual base-style (which is located at position 0 in the style-array).
    const s = Array.isArray(featureStyle)
      ? featureStyle[0]?.getImage()
      : featureStyle?.getImage();
    // Let's extract the fill- and stroke-style from the image-style.
    const fillStyle = s?.getFill?.();
    const strokeStyle = s?.getStroke?.();
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
    return {
      fillColor: this.getRGBAString(fillColor),
      strokeColor: this.getRGBAString(strokeColor),
      strokeWidth,
      dash,
    };
  };

  // Extracts and returns information about the feature style.
  extractFeatureStyleInfo = (feature) => {
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
      const fillStyle = this.#getFillStyleInfo(featureStyle);
      const strokeStyle = this.#getStrokeStyleInfo(featureStyle);
      const imageStyle = this.#getImageStyleInfo(featureStyle);
      // And return an object containing them
      return { fillStyle, strokeStyle, imageStyle };
    } catch (error) {
      console.error(`Failed to extract feature-style. Error: ${error}`);
      return { fillStyle: null, strokeStyle: null, imageStyle: null };
    }
  };

  // Updates the text-style on all drawn features. Used when toggling
  // if the measurement-label should be shown or not for example.
  #refreshFeaturesTextStyle = () => {
    // Get all the drawn features (Except for arrows, these doesn't have any text
    // and shouldn't be refreshed)...
    const drawnFeatures = this.getAllDrawnFeatures().filter(
      (f) => f.get("DRAW_METHOD") !== "Arrow"
    );
    // Iterate the drawn features...
    drawnFeatures.forEach((feature) => {
      // Get the current style.
      const featureStyle = feature.getStyle();
      // Get an updated text-style (which depends on the #measurementSettings).
      const textStyle = this.#getFeatureTextStyle(feature);
      // Set the updated text-style on the base-style.
      Array.isArray(featureStyle)
        ? featureStyle[0].setText(textStyle)
        : featureStyle.setText(textStyle);
      // Then update the feature style.
      feature.setStyle(featureStyle);
    });
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

  // Returns all user drawn features from the draw-source
  getAllDrawnFeatures = () => {
    return this.#drawSource.getFeatures().filter((feature) => {
      return feature.get("USER_DRAWN") === true;
    });
  };

  // Fits the map to the current extent of the draw-source (with some padding).
  #fitMapToExtent = () => {
    this.#map.getView().fit(this.#currentExtent, {
      size: this.#map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  // Removes all event-listeners that have been set when initiating the
  // draw interaction.
  #removeEventListeners = () => {
    // Remove the "ordinary" listeners
    this.#drawInteraction.un("drawstart", this.#handleDrawStart);
    this.#drawInteraction.un("drawend", this.#handleDrawEnd);
    this.#drawInteraction.un("drawabort", this.#handleDrawAbort);
    this.#map.un("pointermove", this.#handlePointerMove);
    this.#drawSource.un("addfeature", this.#handleDrawFeatureAdded);
    document.removeEventListener("keyup", this.#handleKeyUp);
    // Then we'll remove the custom listeners
    this.#removeCustomEventListeners();
  };

  // Adds all event-listeners needed for the the draw interaction.
  #addEventListeners = (settings) => {
    // The initiator of the draw interaction might have passed some custom functions
    // that should be called when the appropriate event fires. We have to make sure
    // to bind those if they exist.
    settings && this.#addCustomEventListeners(settings);
    // Add a listener for the draw-start-event
    this.#drawInteraction.on("drawstart", this.#handleDrawStart);
    // Add a listener for the draw-end-event
    this.#drawInteraction.on("drawend", this.#handleDrawEnd);
    // Add a listener for when drawing is aborted (e.g. if all points are
    // removed by pressing esc several times).
    this.#drawInteraction.on("drawabort", this.#handleDrawAbort);
    // We need a listener for when a feature is added to the source.
    this.#drawSource.on("addfeature", this.#handleDrawFeatureAdded);
    // We need a listener for keyboard input. For example, pressing the escape
    // key will allow the users to remove the last point.
    document.addEventListener("keyup", this.#handleKeyUp);
  };

  // Adds listeners that might have been passed in the settings when
  // initiating the draw interaction.
  #addCustomEventListeners = (settings) => {
    // Let's update all internal fields so that we can keep track of the
    // custom handlers.
    this.#customHandleDrawStart = settings.handleDrawStart || null;
    this.#customHandleDrawEnd = settings.handleDrawEnd || null;
    this.#customHandlePointerMove = settings.handlePointerMove || null;
    this.#customHandleAddFeature = settings.handleAddFeature || null;
    // Then we'll add the listeners if the corresponding handler exists
    this.#customHandleDrawStart &&
      this.#drawInteraction.on("drawstart", this.#customHandleDrawStart);
    this.#customHandleDrawEnd &&
      this.#drawInteraction.on("drawend", this.#customHandleDrawEnd);
    this.#customHandlePointerMove &&
      this.#map.on("pointermove", this.#customHandlePointerMove);
    this.#customHandleAddFeature &&
      this.#drawSource.on("addfeature", this.#customHandleAddFeature);
  };

  // Removes listeners that might have been passed in the settings when
  // initiating the draw interaction.
  #removeCustomEventListeners = () => {
    // Let's unbind the listers if they ever existed
    this.#customHandleDrawStart &&
      this.#drawInteraction.un("drawstart", this.#customHandleDrawStart);
    this.#customHandleDrawEnd &&
      this.#drawInteraction.un("drawend", this.#customHandleDrawEnd);
    this.#customHandlePointerMove &&
      this.#map.on("pointermove", this.#customHandlePointerMove);
    this.#customHandleAddFeature &&
      this.#drawSource.un("addfeature", this.#customHandleAddFeature);
    // Then we have to make sure to remove the reference to the handlers.
    this.#customHandleDrawStart = null;
    this.#customHandleDrawEnd = null;
    this.#customHandlePointerMove = null;
    this.#customHandleAddFeature = null;
  };

  // This handler has a couple of jobs; add a change listener to the feature
  // currently being drawn, and register an event-handler for pointer moves.
  #handleDrawStart = (e) => {
    // Let's add a handler for the pointer event to keep
    // track of where the users pointer is located.
    this.#map.on("pointermove", this.#handlePointerMove);
    // Then we'll add a handler handling feature changes.
    const feature = e.feature;
    feature.on("change", this.#handleFeatureChange);
    // Finally, we'll make sure the feature being drawn has the correct style:
    feature.setStyle(this.#getDrawStyle());
  };

  // This handler will make sure that the overlay will be removed
  // when the feature drawing is done.
  #handleDrawEnd = (e) => {
    // Let's make sure to reset the draw tooltip
    this.#resetDrawTooltip();
    const { feature } = e;
    // We set the USER_DRAWN prop to true so that we can keep track
    // of the user drawn features. We also set "DRAW_TYPE" so that we can
    // handle special features, such as arrows.
    feature.set("USER_DRAWN", true);
    feature.set("DRAW_METHOD", this.#drawInteraction?.get("DRAW_METHOD"));
    feature.set("TEXT_SETTINGS", this.#textStyleSettings);
    // And set a nice style on the feature to be added.
    feature.setStyle(this.#getFeatureStyle(feature));
    // Make sure to remove the event-listener for the pointer-moves.
    // (We don't want the pointer to keep updating while we're not drawing).
    this.#map.un("pointermove", this.#handlePointerMove);
  };

  // Handler that will fire when features has been modified with the modify-interaction.
  // Makes sure to update the text-styling so that eventual measurement-label is up-to-date.
  #handleModifyEnd = (e) => {
    e.features.forEach((f) => {
      // If we're dealing with arrows, we have to make sure to
      // update the whole style, so that the arrow-head is moved.
      if (f.get("DRAW_METHOD") === "Arrow") {
        this.#refreshArrowStyle(f);
      }
    });
    this.#refreshFeaturesTextStyle();
  };

  // Re-calculates and re-applies the arrow style. For ordinary features this is
  // not required, but since the arrows consists of an svg, we have to re-calculate
  // the style to make sure the svg gets the correct color.
  #refreshArrowStyle = (f) => {
    try {
      const strokeStyle = f.getStyle()[0].getStroke();
      f.setStyle(
        this.#getArrowStyle(f, {
          strokeStyle: {
            color: strokeStyle.getColor(),
          },
          fillStyle: { color: strokeStyle.getColor() },
        })
      );
    } catch (error) {
      console.error(`Failed to set arrow style. Error: ${error}`);
    }
  };

  // Cleans up if the drawing is aborted.
  #handleDrawAbort = () => {
    this.#resetDrawTooltip();
  };

  #resetDrawTooltip = () => {
    this.#drawTooltipElement.innerHTML = null;
    this.#currentPointerCoordinate = null;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
  };

  // This handler will make sure that we keep the measurement calculation
  // updated during the feature changes.
  #handleFeatureChange = (e) => {
    // Make the measurement calculations and update the tooltip
    const feature = e.target;
    const toolTipText = this.#getFeatureMeasurementLabel(feature, "TOOLTIP");
    this.#drawTooltipElement.innerHTML = this.#showDrawTooltip
      ? toolTipText
      : null;
    this.#drawTooltip.setPosition(this.#currentPointerCoordinate);
  };

  // This handler has one job; get the coordinate from the event,
  // and store it for later use. *But only if the draw tooltip should be active! If
  // the draw tooltip is disabled, we set the coordinate to null*
  #handlePointerMove = (e) => {
    this.#currentPointerCoordinate = this.#showDrawTooltip
      ? e.coordinate
      : null;
  };

  // We're probably going to need a handler for when a feature is added.
  // For now, let's publish an event on the observer.
  #handleDrawFeatureAdded = (e) => {
    this.#publishInformation({
      subject: "drawModel.featureAdded",
      payLoad: e.feature,
    });
  };

  // We want to handle key-up events so that we can let the user
  // remove the last drawn point by pressing the escape key. (And perhaps more...?)
  #handleKeyUp = (e) => {
    const { keyCode } = e;
    if (keyCode === 27) {
      this.#drawInteraction.removeLastPoint();
    }
  };

  // Disables the current draw interaction
  #disablePotentialInteraction = () => {
    // First we check if any of the "special" interactions are active, and if they
    // are, we disable them.
    if (this.#removeInteractionActive) {
      return this.#disableRemoveInteraction();
    }
    if (this.#editInteractionActive) {
      return this.#disableEditInteraction();
    }
    if (this.#moveInteractionActive) {
      return this.#disableMoveInteraction();
    }
    if (this.#selectInteractionActive) {
      return this.#disableSelectInteraction();
    }
    if (this.#circleInteractionActive) {
      this.#disableCircleInteraction();
    }
    // If there isn't an active draw interaction currently, we just return.
    if (!this.#drawInteraction) return;
    // Otherwise, we remove the interaction from the map.
    this.#map.removeInteraction(this.#drawInteraction);
    // Then we'll make sure to remove all event-listeners
    this.#removeEventListeners();
    // We're also making sure to set the private field to null
    this.#drawInteraction = null;
    // And remove the click-lock and the snap-helper
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.snapHelper.delete("coreDrawModel");
  };

  // Creates an object that can be returned to the initiator of a
  // set:er if the set:er fails due to a bad value provided.
  #getSetFailedObject = (field, providedValue) => {
    return {
      status: "FAILED",
      message: `Set:er failed. The set:er only accepts ${typeof field}, and was provided ${typeof providedValue}`,
    };
  };

  // Removes the first feature that is present at the supplied
  // pixel from the click-event.
  #removeClickedFeature = (e) => {
    // Get features present at the clicked feature.
    const clickedFeatures = this.#map.getFeaturesAtPixel(e.pixel);
    // We only care about features that have been drawn by a user.
    const userDrawnFeatures = clickedFeatures.filter((f) =>
      f.get("USER_DRAWN")
    );
    // Let's make sure we found some feature(s) to remove. We're only removing
    // the first one.
    if (userDrawnFeatures.length > 0) {
      // Let's get the first user-drawn feature
      const feature = userDrawnFeatures[0];
      // Then we remove it from the draw-source
      this.removeFeature(feature);
    }
  };

  // Publishes a modify-message with the clicked feature in the payload.
  #editClickedFeature = (e) => {
    // Get features present at the clicked feature.
    const clickedFeatures = this.#map.getFeaturesAtPixel(e.pixel);
    // We only care about features that have been drawn by a user.
    const userDrawnFeatures = clickedFeatures.filter((f) =>
      f.get("USER_DRAWN")
    );
    // Let's get the (potential) first user-drawn feature, otherwise null.
    const feature = userDrawnFeatures.length > 0 ? userDrawnFeatures[0] : null;
    // Then we'll update the private field holding the feature currently chosen for editing.
    this.#updateChosenEditFeature(feature);
    // Then we'll publish a modify-message with the clicked feature in the payload (or null).
    this.#publishInformation({
      subject: "drawModel.modify.mapClick",
      payLoad: feature,
    });
  };

  // Updates the private field holding the feature which is currently chosen
  // for edit. Also makes sure to set the "EDIT_ACTIVE" prop to false on the
  // feature that is no longer chosen, and to true on the chosen feature.
  // The "EDIT_ACTIVE" prop is used to style the chosen feature.
  #updateChosenEditFeature = (feature) => {
    this.#featureChosenForEdit &&
      this.#featureChosenForEdit.set("EDIT_ACTIVE", false);
    // If we have a new feature clicked, and if the feature is not already
    // marked as "EDIT_ACTIVE" (selected for edit), we set "EDIT_ACTIVE" to true.
    feature && !feature.get("EDIT_ACTIVE") && feature.set("EDIT_ACTIVE", true);
    // Let's update the chosen feature with whatever was clicked (might be null).
    this.#featureChosenForEdit = feature;
  };

  // Refreshes the snap-helper by removing it and then adding it again.
  #refreshSnapHelper = () => {
    this.#map.snapHelper.delete("coreDrawModel");
    this.#map.snapHelper.add("coreDrawModel");
  };

  // Enables a remove-interaction which allows the user to remove drawn features by clicking on them.
  // We're also making sure to enable the click-lock so that the feature-info does not infer.
  #enableRemoveInteraction = () => {
    // We have to make sure to set a field so that the handlers responsible for deleting
    // all active interactions knows that there is a remove-interaction to delete.
    this.#removeInteractionActive = true;
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("coreDrawModel");
    // Then we'll add the event-handler responsible for removing clicked features.
    this.#map.on("singleclick", this.#removeClickedFeature);
  };

  // Disables the remove-interaction by removing the event-listener and disabling
  // the click-lock.
  #disableRemoveInteraction = () => {
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.un("singleclick", this.#removeClickedFeature);
    this.#removeInteractionActive = false;
  };

  // Enables an edit-interaction which allows the user to edit the shape of user-drawn
  // features. The draw-model also makes sure to enable an on-click handler that publish
  // an event when a feature is clicked (i.e. chosen for editing).
  #enableEditInteraction = (settings) => {
    // Let's set a field so that we know that edit is enabled.
    this.#editInteractionActive = true;
    // We're gonna need a handler that can update the feature-style when
    // the modification is completed.
    this.#map.on("singleclick", this.#editClickedFeature);
    // We also need a listener which listens for property-changes on the features.
    // (We use a property on the feature to show that it is currently being edited).
    this.#bindFeaturePropertyListener();
    // Let's add the clickLock to avoid the featureInfo etc.
    this.#map.clickLock.add("coreDrawModel");
    // Usually, the modify interaction is enabled at the same time as the edit-interaction,
    // allowing the user to change the feature geometry.
    // The user might pass "modifyEnabled: false" in the toggle-draw-settings, and in that case
    // we do not enable the modify-interaction. Otherwise we check the "keepModifyActive" field,
    // which keeps track of if the user had modify enabled the last time they enabled the edit-interaction.
    (settings.modifyEnabled ?? this.#keepModifyActive) &&
      this.#enableModifyInteraction();
  };

  // Disables the edit-interaction by removing the event-listener and disabling
  // the click-lock.
  #disableEditInteraction = () => {
    // Remove the click-lock so that the feature-info works again,
    this.#map.clickLock.delete("coreDrawModel");
    // Remove the event-listener
    this.#map.un("singleclick", this.#editClickedFeature);
    // We also have to make sure to de-select the eventual features which might be selected for editing.
    this.#removeFeatureEditSelection();
    // Remove the feature-property-change-listener
    this.#unBindFeaturePropertyListener();
    // Disable the potential modify-interaction (it should only be active when the edit-interaction
    // is active).
    this.#disableModifyInteraction();
    // Finally, we reset the field so we know that the interaction is no longer active.
    this.#editInteractionActive = false;
  };

  #enableModifyInteraction = () => {
    // If the edit-interaction is not active, we shouldn't enable the modify-interaction.
    // The modify-interaction is an interaction that should be used on-top of the edit-interaction.
    if (!this.#editInteractionActive) {
      return {
        status: "FAILED",
        message:
          "Modify-interaction could not be enabled. Edit has to be enabled before enabling.",
      };
    }
    // Let's disable potential interaction that might be enabled already
    this.#disableModifyInteraction();
    // We have to make sure to set a field so that the handlers responsible for deleting
    // all active interactions knows that there is an edit-interaction to delete.
    this.#modifyInteraction = new Modify({ source: this.#drawSource });
    // We're gonna need a handler that can update the feature-style when
    // the modification is completed.
    this.#modifyInteraction.on("modifyend", this.#handleModifyEnd);
    // Then we'll add the interaction to the map.
    this.#map.addInteraction(this.#modifyInteraction);
    // Let's add the clickLock to avoid the featureInfo etc...
    this.#map.clickLock.add("coreDrawModel");
    //  ...and snap-helper for the snap-functionality.
    this.#map.snapHelper.add("coreDrawModel");
    // Finally we return something so that the enabler knows that we've enabled.
    return {
      status: "SUCCESS",
      message: "Modify-interaction enabled.",
    };
  };

  // Disables and removes the Modify-interaction if there is one active currently.
  #disableModifyInteraction = () => {
    // If the modify-interaction is not active, we can abort.
    if (!this.#modifyInteraction) {
      return;
    }
    // Otherwise, let's disable it. First remove the interaction.
    this.#map.removeInteraction(this.#modifyInteraction);
    // Then we'll remove the event-listener
    this.#modifyInteraction.un("modifyend", this.#handleModifyEnd);
    // And remove the snap-helper.
    this.#map.snapHelper.delete("coreDrawModel");
    // Then we'll reset the field referring to the interaction
    this.#modifyInteraction = null;
  };

  // Enables the Move-interaction (An interaction allowing the user to move features by selecting
  // amount of meters and degrees the selected features should be moved). It is also possible to
  // add a Translate-interaction on top, allowing the user to move features in the map by dragging them.
  // The Translate-interaction is added by default if the draw-model is initiated with keepTranslateActive: true,
  // and can be added afterwards calling setTranslateActive or by providing translateEnabled: true when enabling the
  // Move-interaction.
  #enableMoveInteraction = (settings) => {
    // The Move-interaction will obviously need a Select-interaction so that the features to
    // move can be selected.
    this.#selectInteraction = new Select();
    // We need a handler catching the "select"-events so that we can keep track of if any
    // features has been selected or not.
    this.#selectInteraction.on("select", this.#handleFeatureSelect);
    // Then we'll add the interaction to the map...
    this.#map.addInteraction(this.#selectInteraction);
    // When this is done, we can set the private field keeping track of
    // if the Move-interaction is active or not.
    this.#moveInteractionActive = true;
    // If we should enable the Translate-interaction, we do that as well.
    (settings.translateEnabled ?? this.#keepTranslateActive) &&
      this.#enableTranslateInteraction();
    // ...finally we'll add the snap- and clickLock-helpers.
    this.#map.clickLock.add("coreDrawModel");
    this.#map.snapHelper.add("coreDrawModel");
  };

  // Enables a Translate-interaction, allowing users to move features by dragging them
  // in the map.
  #enableTranslateInteraction = () => {
    // If the base Move-interaction is not active, the Translate-interaction cannot be enabled.
    if (!this.#moveInteractionActive) {
      return {
        status: "FAILED",
        message:
          "Translate-interaction could not be enabled. Move has to be enabled before enabling.",
      };
    }
    // Otherwise, we can create a new Translate-interaction...
    this.#translateInteraction = new Translate({
      features: this.#selectInteraction.getFeatures(),
    });
    // ...and add it to the map!
    this.#map.addInteraction(this.#translateInteraction);
    // We also have to make sure to refresh the snap-helper, otherwise
    // the snap won't work on the translate-features.
    this.#refreshSnapHelper();
  };

  // Disabled the Move-interaction and removed it from the map.
  #disableMoveInteraction = () => {
    // First, we'll remove the Move-interaction from the map
    this.#map.removeInteraction(this.#selectInteraction);
    // Then we'll remove the "select"-event-listener
    this.#selectInteraction.un("select", this.#handleFeatureSelect);
    // Then we'll remove (potentially, there might not be any) the Translate-interaction.
    this.#disableTranslateInteraction();
    // Let's update the private fields so that we know that the Select- and Move-interactions
    // are disabled.
    this.#selectInteraction = null;
    this.#moveInteractionActive = false;
    // And remove the clickLock- and snap-helpers.
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.snapHelper.delete("coreDrawModel");
    // We also have to make sure to refresh all the feature-styles so that
    // they are up-to-date with any potential moves.
    this.refreshDrawLayer();
  };

  // Disabled the Translate-interaction if there is one active.
  #disableTranslateInteraction = () => {
    if (this.#translateInteraction) {
      this.#map.removeInteraction(this.#translateInteraction);
      this.#translateInteraction = null;
    }
  };

  // Enables possibility to draw a circle with fixed radius by 'single-click'
  #enableCircleInteraction = () => {
    this.#map.clickLock.add("coreDrawModel");
    this.#circleInteractionActive = true;
    this.#map.on("singleclick", this.#createRadiusOnClick);
  };

  // Disables possibility to draw a circle with fixed radius by 'single-click'
  #disableCircleInteraction = () => {
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.un("singleclick", this.#createRadiusOnClick);
    this.#circleInteractionActive = false;
  };

  #enableSelectInteraction = () => {
    this.#map.clickLock.add("coreDrawModel");
    this.#map.on("singleclick", this.#handleSelectOnClick);
    this.#selectInteractionActive = true;
  };

  #disableSelectInteraction = () => {
    this.#map.clickLock.delete("coreDrawModel");
    this.#map.un("singleclick", this.#handleSelectOnClick);
    this.#showSelectedFeatures = false;
    this.#selectedFeatures = [];
    this.#selectInteractionActive = true;
  };

  drawSelectedIndex = (index) => {
    const feature = this.#selectedFeatures[index];
    if (!feature) return;

    // If we have only one feature, we can show it on the map.
    this.#drawSource.addFeature(feature);
    // Set style
    this.#handleDrawEnd({ feature });
    // feature.setStyle(this.#getFeatureStyle(feature));
    this.#selectedFeatures = [];
    this.#publishInformation({
      subject: "drawModel.select.click",
      payLoad: [],
    });
  };

  #handleSelectOnClick = (event) => {
    handleClick(event, event.map, (response) => {
      // The response will contain an array
      const features = response.features;
      // Which might contain features without geometry. We have to make sure
      // we remove those.
      const featuresWithGeom = features.filter((feature) => {
        return feature.getGeometry();
      });
      // The resulting array might be empty, then we abort.
      if (featuresWithGeom.length === 0) {
        return;
      }

      // We set out features so our frontend can later on use them.
      this.#selectedFeatures = featuresWithGeom;
      // Set to observer
      this.#publishInformation({
        subject: "drawModel.select.click",
        payLoad: featuresWithGeom,
      });
      if (featuresWithGeom.length >= 2) return;

      // If we have only one feature, we can show it on the map.
      this.#drawSource.addFeature(featuresWithGeom[0]);
      // Set style
      // featuresWithGeom[0].setStyle(this.#getFeatureStyle(featuresWithGeom[0]));
      this.#handleDrawEnd({ feature: featuresWithGeom[0] });
    });
  };

  // Creates a Feature with a circle geometry with fixed radius
  // (If the radius is bigger than 0).
  #createRadiusOnClick = (e) => {
    // If the radius is zero we don't want to add a circle...
    if (this.#circleRadius === 0) {
      return;
    }
    // Create the feature
    const feature = new Feature({
      geometry: new CircleGeometry(e.coordinate, this.#circleRadius),
    });
    // Add the feature to the draw-source
    this.#drawSource.addFeature(feature);
    // Make sure to trigger the draw-end event so that all props etc. are
    // set on the feature.
    this.#handleDrawEnd({ feature });
  };

  // Handles the "select"-event that fires from the event-listener added when adding
  // the Move-interaction.
  #handleFeatureSelect = (e) => {
    // Let's just publish the currently selected features on the observer so that
    // the views can keep track of them if they want to.
    this.#publishInformation({
      subject: "drawModel.move.select",
      payLoad: e.selected,
    });
    // We also has to refresh the draw-layer to make sure all the styling is updated.
    // For example: If an arrow is moved, we have to refresh the style so that the arrow
    // head is in the correct location.
    e.deselected.forEach((f) => {
      f.setStyle(this.#getFeatureStyle(f));
    });
  };

  // Binds a listener to each feature which fires on property-change
  #bindFeaturePropertyListener = () => {
    this.#drawSource.forEachFeature((f) => {
      f.on("propertychange", this.#handleFeaturePropertyChange);
    });
  };

  // Un-binds the property-change-listeners
  #unBindFeaturePropertyListener = () => {
    this.#drawSource.forEachFeature((f) => {
      f.un("propertychange", this.#handleFeaturePropertyChange);
    });
  };

  // Handler targeted when any feature property has changed. If any property change, we have
  // to make sure to refresh the draw-layer (since some properties affect the feature-styling!)
  #handleFeaturePropertyChange = (e) => {
    return this.refreshDrawLayer();
  };

  // Sets the "EDIT_ACTIVE" prop to false on all features in the draw-source.
  // Used when disabling the edit-interaction, since we don't want any features
  // selected for editing after the edit-interaction is removed.
  #removeFeatureEditSelection = () => {
    this.#drawSource.forEachFeature((f) => {
      if (f.get("EDIT_ACTIVE")) {
        f.set("EDIT_ACTIVE", false);
      }
    });
  };

  // Toggles the draw-interaction on and off if it is currently on.
  // This refresh makes sure new settings are applied.
  #refreshDrawInteraction = () => {
    if (this.#drawInteraction) {
      this.toggleDrawInteraction(this.#drawInteraction.get("DRAW_METHOD"));
    }
  };

  // Returns a valid draw-interaction-type from the supplied
  // draw-method. For example, if the user wants to create a rectangle,
  // the draw-interaction-type should apparently be "Circle".
  #getDrawInteractionType = (method) => {
    switch (method) {
      case "Arrow":
        return "LineString";
      case "Rectangle":
        return "Circle";
      case "Text":
        return "Point";
      default:
        return method;
    }
  };

  // Returns wether we should be free-hand-drawing or not.
  // Circles and Rectangles are always drawn with free-hand set to true.
  #isFreeHandDrawing = (drawMethod, settings) => {
    return ["Circle", "Rectangle"].includes(drawMethod)
      ? true
      : settings.freehand ?? false;
  };

  // Accepts a feature with "CIRCLE_RADIUS" and "CIRCLE_CENTER" properties.
  // Updates the feature-geometry to a Circle-geometry with the supplied center and radius.
  #createRealCircleGeometry = (feature) => {
    try {
      const center = JSON.parse(feature.get("CIRCLE_CENTER"));
      const radius = parseFloat(feature.get("CIRCLE_RADIUS"));
      feature.setGeometry(new CircleGeometry(center, radius));
    } catch (error) {
      console.error(
        `Failed to create 'real' Circle geometry from supplied feature, error: ${error}`
      );
    }
  };

  // Creates an OpenLayers Circle geometry from a simplified circle geometry (polygon).
  // Since the calculation from the extent does not seem to result in the exact radius,
  // we allow for a optional radius to be passed.
  #creteCircleGeomFromSimplified = (simplified, opt_radius) => {
    // First we'll have to get the extent of the simplified circle
    const simplifiedExtent = simplified.getExtent();
    // Then we'll calculate the center and radius
    const center = getCenter(simplifiedExtent);
    const radius = opt_radius ?? getWidth(simplifiedExtent) / 2;
    // Finally we'll return a circle geometry based on those:
    return new CircleGeometry(center, radius);
  };

  // Removes the property-change-listeners from all features and then adds
  // them again. Useful if a new feature is added to the draw-source, and you
  // have to make sure the new feature has a listener.
  reBindFeaturePropertyListener = () => {
    this.#unBindFeaturePropertyListener();
    this.#bindFeaturePropertyListener();
  };

  // Refreshes the text-style on the features in the draw-source. Useful for when a feature-prop
  // has been changed and the text-style has to be updated.
  refreshFeaturesTextStyle = () => {
    this.#refreshFeaturesTextStyle();
  };

  // CUSTOM ADDER: Adds the supplied feature to the draw-source
  // On top of just adding the feature to the draw-source, it makes sure
  // to create some proper styling and emit events on the observer.
  // If you want to use the adder without emitting events, you can pass
  // silent: true in the settings.
  addFeature = (feature, settings) => {
    // The initiator might have supplied some settings, for example "silent",
    // which states if we should avoid firing events when adding the feature.
    // If the silent-property is not supplied, we will fire events.
    const silent = settings?.silent ?? false;
    try {
      // The supplied feature might contain a property with information regarding
      // circle-radius. If that is the case, we have to replace the Point-geometry
      // with a Circle-geometry with the supplied radius. This case appears when circles
      // has been saved in LS, since geoJSON does not support Circles.
      feature.get("CIRCLE_RADIUS") && this.#createRealCircleGeometry(feature);
      // The supplied feature might contain a property with style-information
      // that has been set in an earlier session. Let's apply that style (if present)
      // before we add the feature to the source.
      const extractedStyle = feature.get("EXTRACTED_STYLE");
      extractedStyle &&
        feature.setStyle(this.#getFeatureStyle(feature, extractedStyle));
      // When we're done styling we can add the feature.
      this.#drawSource.addFeature(feature);
      // Then we'll publish some information about the addition. (If we're not supposed to be silent).
      !silent &&
        this.#publishInformation({
          subject: "drawModel.featureAdded",
          payLoad: feature,
        });
    } catch (error) {
      console.error(`Error while adding feature: ${error}`);
      this.#publishInformation({
        subject: "drawModel.addFeature.error",
        payLoad: error,
      });
    }
  };

  // Method used when adding features that has been parsed using the kmlModel-parser.
  // The method makes sure to extract and parse eventual style- and text-settings that
  // has been stored in the kml-features.
  addKmlFeatures = (features) => {
    // Let's check what the current draw-interaction is. If we have a draw-interaction
    // active, we have to make sure to disable it so that any active event-listeners doesn't
    // fire when adding the kml-features.
    const currentInteraction = this.#drawInteraction
      ? this.#drawInteraction.get("DRAW_METHOD")
      : null;
    // If the interaction isn't null, let's toggle the current interaction off.
    currentInteraction && this.toggleDrawInteraction("");
    features.forEach((f) => {
      // If a draw-method-property is missing from the imported features, we have to add it.
      // Why? Well, in the sketch-tool (which is using the draw-model) we rely on the fact that
      // the draw-method is set so that we can present proper styling menus (polygons and lines have
      // different menus for example). The imported kml-features might not have been created with
      // the hajk-drawModel, and therefore lacks this property. We'll set it to the geometry-type
      // which should be sufficient.
      !f.get("DRAW_METHOD") &&
        f.set(
          "DRAW_METHOD",
          f.get("geometryType") || f.getGeometry().getType()
        );
      // Let's grab the style- and text-settings. (At this point they will
      // can be undefined, a string, or the actual objects). We also have to grab the userDrawn-prop
      // (which should be a boolean, but since we're dealing with kml, it might be a string...).
      const extractedStyle = f.get("EXTRACTED_STYLE");
      const textSettings = f.get("TEXT_SETTINGS");
      const userDrawn = f.get("USER_DRAWN");
      // If the setting exist, and they are strings, we parse them and apply the parsed setting.
      typeof extractedStyle === "string" &&
        f.set("EXTRACTED_STYLE", JSON.parse(extractedStyle));
      typeof textSettings === "string" &&
        f.set("TEXT_SETTINGS", JSON.parse(textSettings));
      typeof userDrawn === "string" &&
        f.set("USER_DRAWN", JSON.parse(userDrawn));
      // Then we can add the feature to the map. We'll provide "silent" as well,
      // since we don't want any events to trigger when adding kml-features. (For example
      // when adding a text-feature, normally an event would fire, allowing the user to enter
      // the text they want. Now we do not want that behavior).
      this.addFeature(f, { silent: true });
    });
    // Let's make sure to refresh all features text-style to make sure they are up-to-date
    this.#refreshFeaturesTextStyle();
    // If we had a draw-interaction active before the kml-import, we have to enable it again.
    currentInteraction && this.toggleDrawInteraction(currentInteraction);
  };

  // Toggles the hidden-property of all features connected to a kml-import
  // with the supplied id.
  toggleKmlFeaturesVisibility = (id) => {
    this.#drawSource.getFeatures().forEach((f) => {
      if (f.get("KML_ID") === id) {
        const featureHidden = f.get("HIDDEN") ?? false;
        f.set("HIDDEN", !featureHidden);
        f.setStyle(this.#getFeatureStyle(f));
      }
    });
  };

  // Toggles the show-text-property of all features connected to a kml-import
  // with the supplied id.
  toggleKmlFeaturesTextVisibility = (id) => {
    this.#drawSource.getFeatures().forEach((f) => {
      if (f.get("KML_ID") === id) {
        const featureTextShown = f.get("SHOW_TEXT") ?? true;
        f.set("SHOW_TEXT", !featureTextShown);
        f.setStyle(this.#getFeatureStyle(f));
      }
    });
  };

  // Removes all features with the supplied kml-id.
  removeKmlFeaturesById = (id) => {
    this.#drawSource.getFeatures().forEach((f) => {
      if (f.get("KML_ID") === id) {
        this.#drawSource.removeFeature(f);
      }
    });
  };

  // Clones the supplied ol-feature and adds it to the map (the added clone
  // will be offset just a tad to the east of the supplied feature).
  duplicateFeature = (feature) => {
    try {
      // First we'll have to get a clone of the supplied feature
      const duplicate = this.#createDuplicateFeature(feature);
      // Then we'll have to check if we're dealing with a circle-geometry.
      const isCircle = duplicate.getGeometry() instanceof CircleGeometry;
      // We also have to make sure to store the eventual radius so that we can use
      // that to create a 'real' circle later.
      const radius = isCircle ? duplicate.getGeometry().getRadius() : 0;
      // If we are dealing with a circle, we have to create a simplified geometry (since
      // geoJSON does not like OpenLayers circles). Let's update the geometry if we are:
      if (isCircle) {
        duplicate.setGeometry(fromCircle(duplicate.getGeometry()));
      }
      // Then we'll have to create a GeoJSON-feature from the ol-feature (since turf only accepts geoJSON).
      const gjFeature = this.#geoJSONParser.writeFeatureObject(duplicate);
      // We want to add the cloned feature with an offset to the east. First, we'll
      // have to get the offset-amount.
      const offset = this.#getDuplicateOffsetAmount();
      // Then we'll translate (move) the geoJSON-feature slightly to the east.
      const translated = transformTranslate(gjFeature, offset, 140);
      // Then we have to read the geometry from the translated geoJSON
      const translatedGeom = this.#geoJSONParser.readGeometry(
        translated.geometry
      );
      // When thats done, we'll update the duplicates geometry. If we are dealing
      // with a circle, we have to create a "real" circle:
      if (isCircle) {
        duplicate.setGeometry(
          this.#creteCircleGeomFromSimplified(translatedGeom, radius)
        );
      } else {
        // Otherwise we can just set the geometry.
        duplicate.setGeometry(translatedGeom);
      }
      // Since the feature we are duplicating is probably selected for edit, we have to
      // make sure to toggle the edit-flag on the new feature to false.
      duplicate.set("EDIT_ACTIVE", false);
      // Then we'll add the cloned feature to the map!
      this.addFeature(duplicate);
      // Finally, we'll refresh the draw-layer so that the feature styles are
      // up to date.
      this.refreshDrawLayer();
    } catch (error) {
      console.error(
        `Could not duplicate the supplied feature. Error: ${error}`
      );
    }
  };

  // Moves the features currently selected via the Move-interaction.
  // The features are moved the supplied length (in meters) in the supplied
  // direction (in degrees, where north is 0 and east is 90 and so on).
  translateSelectedFeatures = (length, angle) => {
    this.#selectInteraction.getFeatures().forEach((f) => {
      try {
        // We'll have to create a GeoJSON-feature from the ol-feature (since
        // turf only accepts geoJSON).
        const gjFeature = this.#geoJSONParser.writeFeatureObject(f);
        // Then we'll translate the feature according to the supplied parameters
        const translated = transformTranslate(gjFeature, length / 1000, angle);
        // When thats done, we'll update the duplicates geometry.
        f.setGeometry(this.#geoJSONParser.readGeometry(translated.geometry));
      } catch (error) {
        console.error(`Failed to translate selected features. Error: ${error}`);
      }
    });
  };

  // Returns a clone of the supplied feature. Makes sure to clone both
  // the feature and its style.
  #createDuplicateFeature = (feature) => {
    // First we'll clone the supplied feature.
    const duplicate = feature.clone();
    // Then we'll have to clone the style (so that the feature-styles are not connected).
    // We only want the first style-object from the style array (since the rest are highlight-styles).
    // The above applied to all features except for Arrows, which aren't highlighted.
    const style =
      feature.get("DRAW_METHOD") === "Arrow"
        ? feature.getStyle().map((style) => style.clone())
        : Array.isArray(feature.getStyle())
        ? feature.getStyle()[0].clone()
        : feature.getStyle().clone();
    // Then we'll apply the cloned-style.
    duplicate.setStyle(style);
    // Finally we'll return the cloned feature.
    return duplicate;
  };

  // Cloned features are going to be placed offset from the original feature when
  // added to the map. This function returns an offset-amount that depends on the current
  // zoom-level. This is done by calculating the area of the current map-extent, and then
  // take a fraction of that number. (The returned number is the offset from the feature in
  // kilometers).
  #getDuplicateOffsetAmount = () => {
    // First we'll get the current map-extent.
    const mapExtent = this.#map.getView().calculateExtent(this.#map.getSize());
    // Then we'll:
    // 1: Get the extent-area
    // 2: Take the square-root of the area (to get approximately the length of one map-side).
    // 3: Take a fraction of one side of the map, and return that as the offset-amount.
    return Math.sqrt(getExtentArea(mapExtent)) * 0.00005;
  };

  // CUSTOM REMOVER: Removes the supplied feature from the draw-source
  // Also makes sure to emit an event on the observer.
  removeFeature = (feature) => {
    // Let's start by removing the supplied feature from the draw-source
    // We won't remove if it set as hidden currently (otherwise we might confuse the users
    // by removing stuff they're not seeing at the time of removal).
    if (feature.get("HIDDEN") !== true) {
      this.#drawSource.removeFeature(feature);
      // Then we (potentially) publish that we've removed a feature.
      this.#publishInformation({
        subject: "drawModel.featureRemoved",
        payLoad: feature,
      });
    }
  };

  // Accepts an RGBA-object containing r-, g-, b-, and a-properties, or an array
  // with four elements (r, g, b, and a in that order)...
  // Returns the string representation of the supplied object (or array).
  getRGBAString = (o) => {
    // If nothing was supplied, return an empty string
    if (!o) {
      return null;
    }
    // Otherwise we check the type and return an rgba-string.
    return Array.isArray(o)
      ? `rgba(${o[0]},${o[1]},${o[2]},${o[3]})`
      : typeof o === "object"
      ? `rgba(${o.r},${o.g},${o.b},${o.a})`
      : o;
  };

  // Accepts a color-string (hex or rgba) and returns an object containing r-, g-, b-, and a-properties.
  parseColorString = (s) => {
    try {
      // First, we make sure we're dealing with a string with proper length. If not, return an empty object.
      if (typeof s !== "string" || s.length < 7) {
        return {};
      }
      // Then we'll check if the supplied string is an hex-string (must start with hash and be 7 chars).
      // Cannot handle hex-shorthands such as #fff obviously.
      if (s.length === 7 && s.startsWith("#")) {
        // If it is, we parse the hex-string and return an object containing the
        // corresponding values.
        const [r, g, b] = s.match(/\w\w/g).map((c) => parseInt(c, 16));
        return { r, g, b, a: 1 };
      }
      // Otherwise, some regex-magic.
      // 1. RegEx that matches stuff between a set of parentheses
      // 2. Execute that regex on the input string, but first remove any whitespace it may contain
      // 3. RegEx exec returns an array. Grab the second element, which will contain the value.
      // 4. Split the value to extract individual rgba values
      const o = /\(([^)]+)\)/.exec(s.replace(/\s/g, ""))[1].split(",");
      return {
        r: parseFloat(o[0]),
        g: parseFloat(o[1]),
        b: parseFloat(o[2]),
        a: parseFloat(o[3]),
      };
    } catch (error) {
      console.error(`Color-string parsing failed: ${error}`);
      return null;
    }
  };

  // Toggles the current draw interaction. To enable the draw interaction,
  // pass one of the allowed draw-interactions: "Polygon", "Rectangle", "Circle", or "Delete"
  // as the first parameter. To disable the draw-interaction, pass nothing, or an empty string.
  toggleDrawInteraction = (drawMethod = "", settings = {}) => {
    // If this method is fired, the first thing we have to do is to remove the (potentially)
    // already active interaction. (We never want two interactions active at the same time...)
    this.#disablePotentialInteraction();
    // Check if we are supposed to be toggling the draw interaction off. If we're toggling off,
    // we make sure to abort so that we're not activating anything.
    if (!drawMethod || drawMethod === "") {
      return;
    }
    // Check if the supplied method is set to "Delete", "Edit", or "Move", if it is, we activate the remove, edit, or move
    // interaction. Since these are special interactions, (not real ol-draw-interactions) we make sure not to continue executing.
    if (drawMethod === "Delete") {
      return this.#enableRemoveInteraction(settings);
    }
    if (drawMethod === "Edit") {
      return this.#enableEditInteraction(settings);
    }
    if (drawMethod === "Move") {
      return this.#enableMoveInteraction(settings);
    }
    if (drawMethod === "Select") {
      return this.#enableSelectInteraction(settings);
    }
    if (drawMethod === "Circle") {
      this.#enableCircleInteraction();
    }
    // If we've made it this far it's time to enable a new draw interaction!
    // First we must make sure to gather some settings and defaults.
    const type = this.#getDrawInteractionType(drawMethod);
    // Are we going to be free-hand drawing?
    const freehand = this.#isFreeHandDrawing(drawMethod, settings);
    // Then we'll add the interaction!
    this.#drawInteraction = new Draw({
      source: this.#drawSource,
      type: type,
      freehand: freehand,
      stopClick: true,
      geometryFunction: drawMethod === "Rectangle" ? createBox() : null,
      style: this.#getDrawStyle(),
    });
    // Let's set the supplied draw-method as a property on the draw-interaction
    // so that we can keep track of if we're creating special features (arrows etc).
    this.#drawInteraction.set("DRAW_METHOD", drawMethod);
    // Then we'll add all draw listeners
    this.#addEventListeners(settings);
    // Then we'll add the interaction to the map!
    this.#map.addInteraction(this.#drawInteraction);
    // Finally we'll add the clickLock to avoid the featureInfo etc...
    this.#map.clickLock.add("coreDrawModel");
    //  ...and snap-helper for the snap-functionality.
    this.#map.snapHelper.add("coreDrawModel");
  };

  // Fits the map to the extent of the drawn features in the draw-source
  zoomToCurrentExtent = () => {
    // Let's make sure that the current extent is not null.
    if (this.#currentExtent === null) {
      return;
    }
    // If the extent is not null, we'll check that the current extent is finite
    if (this.#currentExtent.map(Number.isFinite).includes(false) === false) {
      // If it is, we can fit the map to that extent!
      this.#fitMapToExtent(this.#currentExtent);
    }
  };

  // We will need a way to remove all drawn features from the draw-source.
  // Why aren't we using a simple "clear()" one might ask =>  simply because
  // the draw-source might be connected to the search-source for example, and we
  // don't want to remove all search features, only the user drawn ones.
  removeDrawnFeatures = () => {
    // Let's get all the features in the draw-source that have been drawn
    const drawnFeatures = this.getAllDrawnFeatures();
    // Since OL does not supply a "removeFeatures" method, we have to map
    // over the array, and remove every single feature one by one... (Remember
    // that currently hidden features should be ignored).
    drawnFeatures
      .filter((f) => f.get("HIDDEN") !== true)
      .forEach((feature) => {
        this.#drawSource.removeFeature(feature);
      });
    // When the drawn features has been removed, we have to make sure
    // to update the current extent.
    this.#currentExtent = this.#drawSource.getExtent();
    // Then we (potentially) publish that we've removed a bunch of features.
    this.#publishInformation({
      subject: "drawModel.featuresRemoved",
      payLoad: drawnFeatures,
    });
    return { status: "SUCCESS", removedFeatures: drawnFeatures };
  };

  // Set:er allowing us to change which layer the draw-model will interact with
  setLayer = (layerName) => {
    // We're not allowing the layer to be changed while the draw interaction is active...
    if (this.#drawInteraction !== null) {
      console.warn(
        "The layer cannot be changed. The draw interaction is currently active. Disable the draw interaction before changing layer."
      );
      return { status: "FAILED", message: "Disable draw to change layer." };
    }
    // First we must update the private field holding the current layer name
    this.#layerName = layerName;
    // Then we must initiate the draw-layer. This will either get the layer
    // corresponding to the supplied name, or create a new one.
    this.#initiateDrawLayer();
    // When the current layer changes, the current extent will obviously
    // change as well.
    this.#currentExtent = this.#drawSource.getExtent();
    return { status: "SUCCESS", message: `Layer changed to ${layerName}` };
  };

  // Set:er allowing us to change if a tooltip should be shown when drawing
  setShowDrawTooltip = (drawTooltipActive) => {
    // Let's make sure we're provided proper input before we set anything
    if (typeof drawTooltipActive !== "boolean") {
      // If we were not, let's return a fail message
      return this.#getSetFailedObject(this.#showDrawTooltip, drawTooltipActive);
    }
    // If we've made it this far, we can go ahead and set the internal value.
    this.#showDrawTooltip = drawTooltipActive;
    // And return a success-message
    return {
      status: "SUCCESS",
      message: `Draw tooltip is now ${drawTooltipActive ? "shown" : "hidden"}`,
    };
  };

  // Set:er allowing us to change the style settings used in the draw-layer
  // The fill- and strokeColor passed might be either a string, or an object containing
  // r-, g-, b-, and a-properties. If they are objects, we have to make sure to parse them
  // to strings before setting the new style-settings.
  setDrawStyleSettings = (newStyleSettings) => {
    // The fill- and strokeColor might have to be parsed to strings, let's
    // destruct them and parse them if we have to.
    const { fillColor, strokeColor } = newStyleSettings;
    // Create a new object containing the potentially parsed objects.
    const parsedStyle = {
      // We still want to pass all the other settings...
      ...newStyleSettings,
      //... and the potentially parsed colors.
      fillColor:
        typeof fillColor !== "string"
          ? this.getRGBAString(fillColor)
          : fillColor,
      strokeColor:
        typeof strokeColor !== "string"
          ? this.getRGBAString(strokeColor)
          : strokeColor,
    };
    // Then we'll update the style.
    this.#drawStyleSettings = parsedStyle;
    // To make sure the new style is shown in the draw-interaction, we have
    // to refresh the interaction if it is currently active.
    this.#refreshDrawInteraction();
  };

  // Makes sure all features are re-drawn to make sure the latest style is applied.
  // The arrows are handled separately since they need some special styling...
  refreshDrawLayer = () => {
    this.#drawSource.forEachFeature((f) => {
      if (f.get("DRAW_METHOD") === "Arrow") {
        this.#refreshArrowStyle(f);
      } else {
        f.setStyle(this.#getFeatureStyle(f));
      }
    });
  };

  // Updates the supplied features' <attribute> with the supplied <value>.
  // When the attribute has been updated, the style is refreshed.
  setFeatureAttribute = (feature, attribute, value) => {
    // If no feature was supplied, or if the supplied 'feature' is not
    // a feature, we'll abort.
    if (!(feature instanceof Feature)) {
      return;
    }
    // Otherwise we'll update the attribute.
    feature.set(attribute, value);
  };

  // Updates the Text-style-settings.
  setTextStyleSettings = (newStyleSettings) => {
    this.#textStyleSettings = newStyleSettings;
  };

  // Enabled the Modify-interaction
  setModifyActive = (active) => {
    this.#keepModifyActive = active;
    active ? this.#enableModifyInteraction() : this.#disableModifyInteraction();
  };

  // Enabled the Translate-interaction
  setTranslateActive = (active) => {
    this.#keepTranslateActive = active;
    active
      ? this.#enableTranslateInteraction()
      : this.#disableTranslateInteraction();
  };

  setMeasurementSettings = (settings) => {
    // First we'll update the private field
    this.#measurementSettings = settings;
    // Then we have to refresh the style so that the change is shown.
    this.#refreshFeaturesTextStyle();
  };

  setCircleRadius = (radius) => {
    this.#circleRadius = parseInt(radius);
    // Ensure is not NaN
    if (Number.isNaN(this.#circleRadius)) {
      this.#circleRadius = 0;
    }
  };

  getMeasurementSettings = () => {
    return this.#measurementSettings;
  };

  // Get:er returning the name of the draw-layer.
  getCurrentLayerName = () => {
    return this.#layerName;
  };

  // Get:er returning the currently connected Vector-source
  getCurrentVectorSource = () => {
    return this.#drawSource;
  };

  // Get:er returning the current extent of the draw-source.
  getCurrentExtent = () => {
    return this.#currentExtent;
  };

  // Get:er returning if the modify-interaction is active.
  getModifyActive = () => {
    return this.#modifyInteraction ? true : false;
  };

  // Get:er returning if the modify-interaction is active.
  getTranslateActive = () => {
    return this.#translateInteraction ? true : false;
  };

  // Get:er returning the state of the showDrawTooltip
  getShowDrawTooltip = () => {
    return this.#showDrawTooltip;
  };

  // Get:er returning the current draw-style settings
  getDrawStyleSettings = () => {
    return this.#drawStyleSettings;
  };

  // Get:er returning the current text-style settings
  getTextStyleSettings = () => {
    return this.#textStyleSettings;
  };

  // Get:er returning circle radius
  getCircleRadius = () => {
    return this.#circleRadius;
  };
}
export default DrawModel;
