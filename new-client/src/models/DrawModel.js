import { Draw, Modify } from "ol/interaction";
import { createBox } from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Icon, Stroke, Style, Circle, Fill, Text } from "ol/style";
import { Circle as CircleGeometry, LineString } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { MultiPoint, Point } from "ol/geom";
import Overlay from "ol/Overlay.js";

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
 *
 * Exposes a couple of methods:
 * - refreshFeaturesTextStyle(): Refreshes the text-style on all features in the draw-source.
 * - refreshDrawLayer(): Redraws all features in the draw-layer.
 * - addFeature(feature): Adds the supplied feature to the draw-source.
 * - removeFeature(feature): Removes the supplied feature from the draw-source.
 * - getCurrentExtent(): Returns the current extent of the current draw-layer.
 * - getCurrentLayerName(): Returns the name of the layer currently connected to the draw-model.
 * - removeDrawnFeatures():  Removes all drawn features from the current draw-source.
 * - setLayer(layerName <string>): Sets (or creates) the layer that should be connected to the draw-model.
 * - toggleDrawInteraction(drawType, settings): Accepts a string with the drawType and an object containing settings.
 * - zoomToCurrentExtent(): Fits the map-view to the current extent of the current draw-source.
 * - getRGBAString(RGBA-object <object>): Accepts an object with r-, g-, b-, and a-properties and returns the string representation.
 * - parseRGBAString(RGBA-string <string>): Accepts a string and returns an object with r-, g-, b-, and a-properties.
 * - getCurrentVectorSource(): Returns the vector-source currently connected to the draw-model.
 * - get/set drawStyleSettings(): Get or set the style settings used by the draw-model.
 * - get/set labelFormat(): Sets the format on the labels. ("AUTO", "M2", "KM2", "HECTARE")
 * - get/set showDrawTooltip(): Get or set wether a tooltip should be shown when drawing.
 * - get/set showFeatureMeasurements(): Get or set wether drawn feature measurements should be shown or not.
 * - get/set ModifyActive(): Get or set wether the modify-interaction should be active or not.
 */
class DrawModel {
  #map;
  #layerName;
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
  #showFeatureMeasurements;
  #drawStyleSettings;
  #textStyleSettings;
  #drawInteraction;
  #removeInteractionActive;
  #editInteractionActive;
  #featureChosenForEdit;
  #modifyInteraction;
  #keepModifyActive;
  #allowedLabelFormats;
  #labelFormat;
  #customHandleDrawStart;
  #customHandleDrawEnd;
  #customHandlePointerMove;
  #customHandleAddFeature;

  constructor(settings) {
    // Let's make sure that we don't allow initiation if required settings
    // are missing.
    if (!settings.map || !settings.layerName) {
      return this.#handleInitiationParametersMissing();
    }
    // Make sure that we keep track of the supplied settings.
    this.#map = settings.map;
    this.#layerName = settings.layerName;
    // An observer might be supplied. If it is, the drawModel will publish messages when features are deleted etc.
    this.#observer = settings.observer || null;
    // There might be an "observerPrefix" (string) passed. States a string
    // which will act as a prefix on all messages published on the
    // supplied observer.
    this.#observerPrefix = this.#getObserverPrefix(settings);
    this.#showFeatureMeasurements = settings.showFeatureMeasurements ?? true;
    this.#drawStyleSettings =
      settings.drawStyleSettings ?? this.#getDefaultDrawStyleSettings();
    this.#textStyleSettings =
      settings.textStyleSettings ?? this.#getDefaultTextStyleSettings();
    this.#allowedLabelFormats = ["AUTO", "M2", "KM2", "HECTARE"];
    this.#labelFormat = settings.labelFormat ?? "AUTO"; // One of #allowedLabelFormats
    // We are going to be keeping track of the current extent of the draw-source...
    this.#currentExtent = null;
    // And the current draw interaction.
    this.#drawInteraction = null;
    // We also have to make sure to keep track of if any other interaction is active.
    // E.g. "Remove", or "Edit".
    this.#removeInteractionActive = false;
    this.#editInteractionActive = false;
    this.#modifyInteraction = null;
    this.#keepModifyActive = settings.modifyDefaultEnabled ?? false;
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

    // A Draw-model is not really useful without a vector-layer, let's initiate it
    // right away, either by creating a new layer, or connect to an existing layer.
    this.#initiateDrawLayer();
    // We also have to initiate the element for the draw-tooltip
    this.#createDrawTooltip();
    // Let's display a warning for now, remove once it's properly tested. TODO: @Hallbergs
    console.info(
      "Initiation of Draw-model successful. Note that the model has not been properly tested yet and should not be used in critical operation."
    );
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
    // TODO: Make sure type is the way to go, a bit confusing setting the
    // layer name on that property. Hmm...
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
    // If we're dealing with "Arrow" we'll return a special style array
    if (feature?.get("DRAW_METHOD") === "Arrow") {
      return this.#getArrowStyle(feature, settingsOverride);
    }
    // Let's grab the standard draw style as a baseline.
    // The standard style can be overridden if the override is supplied.
    const baseLineStyle = this.#getDrawStyle(settingsOverride);
    // If showFeatureMeasurements is set to true, we create a text-style which
    // will allow us to show the measurements of the drawn feature.
    const textStyle = this.#showFeatureMeasurements
      ? this.#getFeatureTextStyle(feature)
      : null;
    // Apply the text-style to the baseline style...
    baseLineStyle.setText(textStyle);
    // And return the finished style.
    return baseLineStyle;
  };

  // Method returning if we're supposed to be showing text on the feature
  // or not. We're showing text in two cases: One: if the feature is of text-type,
  // or two: if we're supposed to be showing feature measurements. If the feature is
  // of arrow-type, we're never showing text.
  #shouldShowText = (feature) => {
    // Let's get the draw-method
    const featureDrawMethod = feature?.get("DRAW_METHOD");
    // And check if we're supposed to be showing text or not.
    return (
      featureDrawMethod !== "Arrow" &&
      (this.#showFeatureMeasurements || featureDrawMethod === "Text")
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
    // First we'll grab the arrow base-style
    const baseStyle = this.#getArrowBaseStyle(settings);
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

  // Creates a highlight style (a style marking the coordinates of the
  // supplied feature).
  #getNodeHighlightStyle = () => {
    try {
      const style = new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: "grey",
          }),
        }),
        geometry: (feature) => {
          const coordinates = this.#getFeatureCoordinates(feature);
          return new MultiPoint(coordinates);
        },
      });
      return style;
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

  // Returns the area of the supplied feature in a readable format.
  #getFeatureMeasurementLabel = (feature) => {
    // First we must get the feature area, length, or placement.
    // (Depending on if we're dealing with Point, LineString, or surface).
    const featureMeasure = this.#getFeatureMeasurement(feature);
    // Let's grab the geometry so that we can check what we're dealing with.
    const featureGeometry = feature.getGeometry();
    // First we'll check if we're dealing with a point. If we are, we return it's
    // placement right a way. The measurement will be an array containing it's coordinates.
    if (featureGeometry instanceof Point) {
      // If we're dealing with a point, the measurement will be an array containing
      // it's coordinates.
      return `N: ${Math.round(featureMeasure[1])} E: ${Math.round(
        featureMeasure[0]
      )}`;
    }
    // Then we'll check if we're dealing with a length measurement
    const measureIsLength = featureGeometry instanceof LineString;
    // Let's check how we're gonna present the label
    switch (this.#labelFormat) {
      case "AUTO":
        // If the format is AUTO, we're checking if the measurement is large
        // enough to show it in kilometers or not. First, we need to check
        // where the cutoff point for the kilometer display is. (It will vary
        // depending on if we're measuring length or area).
        const kilometerCutoff = measureIsLength ? 1e3 : 1e6;
        // If the measurement is larger or equal to the cutoff, we return a string
        // formatted in kilometers.
        if (featureMeasure >= kilometerCutoff) {
          return this.#getKilometerMeasurementString(
            featureMeasure,
            measureIsLength
          );
        }
        // Otherwise we return a string formatted in meters.
        return this.#getMeasurementString(featureMeasure, measureIsLength);
      case "KM2":
        // If the format is "KM2", we'll show the measurement in km²
        // (Or km if we're measuring length). Rounded to show 3 decimals.
        return this.#getKilometerMeasurementString(
          featureMeasure,
          measureIsLength
        );
      case "HECTARE":
        // If the format is "HECTARE" we will show the measurement in hectare
        // if we're dealing with a surface. If we're dealing with a lineString
        // we will return the measurement with "M2" format.
        return this.#getHectareMeasurementString(
          featureMeasure,
          measureIsLength
        );
      default:
        // Otherwise m² (or m) will do. (Displayed in local format).
        return this.#getMeasurementString(featureMeasure, measureIsLength);
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
    // Otherwise we return the measurement-text (If we're supposed to
    // show it)!
    return this.#showFeatureMeasurements
      ? this.#getFeatureMeasurementLabel(feature)
      : "";
  };

  // Returns the supplied measurement as a kilometer-formatted string.
  // If we're measuring area, km² is returned, otherwise, km is returned.
  #getKilometerMeasurementString = (featureMeasure, measureIsLength) => {
    return `${(featureMeasure / (measureIsLength ? 1e3 : 1e6)).toFixed(3)} ${
      measureIsLength ? "km" : "km²"
    }`;
  };

  // Returns the measurement in hectare if we're dealing with a surface, and if
  // we're dealing with a line-string we return the measurement in metres.
  #getHectareMeasurementString = (featureMeasure, measureIsLength) => {
    return measureIsLength
      ? this.#getMeasurementString(featureMeasure, measureIsLength)
      : `${(featureMeasure / 1e4).toFixed(3)} ha`;
  };

  // Returns the supplied measurement as a locally formatted string.
  // If we're measuring area m² is returned, otherwise, m is returned.
  #getMeasurementString = (featureMeasure, measureIsLength) => {
    return `${featureMeasure.toLocaleString()} ${measureIsLength ? "m" : "m²"}`;
  };

  // Calculates the area, length, or placement of the supplied feature.
  // Accepts an OL-feature, and is tested for Circle, LineString, Point, and Polygon.
  #getFeatureMeasurement = (feature) => {
    // Let's get the geometry-type to begin with, we are going
    // to be handling points, line-strings, and surfaces differently.
    const geometry = feature.getGeometry();
    // If we're dealing with a point, we simply return the coordinates of the point.
    if (geometry instanceof Point) {
      return geometry.getCoordinates();
    }
    // Apparently the circle geometry instance does not expose a
    // getArea method. Here's a quick fix. (Remember that this area
    // is only used as an heads-up for the user.)
    if (geometry instanceof CircleGeometry) {
      const radius = geometry.getRadius();
      return Math.round(Math.pow(radius, 2) * Math.PI);
    }
    // If we're dealing with a line we cannot calculate an area,
    // instead, we return the length.
    if (geometry instanceof LineString) {
      return Math.round(geometry.getLength());
    }
    // If we're not dealing with a circle or a line, we can just return the area.
    return Math.round(geometry.getArea());
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
      }),
      fill: new Fill({
        color: settings
          ? settings.fillStyle.color
          : this.#drawStyleSettings.fillColor,
      }),
    });
  };

  // Updates the text-style on all drawn features. Used when toggling
  // if the measurement-label should be shown or not for example.
  #refreshFeaturesTextStyle = () => {
    // Get all the drawn features (Except for arrows, these doesn't have any text
    // and shouldn't be refreshed)...
    const drawnFeatures = this.#getAllDrawnFeatures().filter(
      (f) => f.get("DRAW_METHOD") !== "Arrow"
    );
    // Iterate the drawn features...
    drawnFeatures.forEach((feature) => {
      // Get the current style.
      const featureStyle = feature.getStyle();
      // Get an updated text-style (which depends on #showFeatureMeasurements).
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
  #getAllDrawnFeatures = () => {
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
    feature.set("DRAW_METHOD", this.#drawInteraction.get("DRAW_METHOD"));
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
    const toolTipText = this.#getFeatureMeasurementLabel(feature);
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
    // the first one. TODO: Remove all? No? Yes? Maybe?
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
    // TODO: Haven't really decided the above yet.
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

  // Handler targeted when any feature property has changed. Only checks
  // if the "EDIT_ACTIVE" property has changed, and if it has, it makes sure
  // to toggle the highlight-style of the feature accordingly.
  // TODO: Handle two clicks on same feature!
  #handleFeaturePropertyChange = (e) => {
    // First, we'll extract the key and the target (the target will be the feature clicked).
    const { key, target: feature } = e;
    // Then we'll check if it was the "EDIT_ACTIVE" property that was changed.
    // Let's ignore arrow-highlight for now...
    if (key === "EDIT_ACTIVE" && feature.get("DRAW_METHOD") !== "Arrow") {
      // If the "EDIT_ACTIVE" was changed to true, we add the highlight-style.
      if (feature.get("EDIT_ACTIVE")) {
        this.#setHighlightStyle(feature);
      } else {
        // Otherwise, we remove the highlight-style.
        this.#removeHighlightStyle(feature);
      }
    }
  };

  // Adds a highlight-style to the supplied feature.
  #setHighlightStyle = (feature) => {
    // First we'll get the current style of the feature.
    const featureStyle = feature.getStyle();
    // Then we'll create the highlight-style.
    const highlightStyle = this.#getNodeHighlightStyle(feature);
    // If the current style of the feature is an array of styles,
    // we merge the original style array with the highligh-style and apply
    // it to the feature.
    if (Array.isArray(featureStyle)) {
      feature.setStyle([...featureStyle, highlightStyle]);
    } else {
      // Otherwise we create an array with the current style and the
      // highlight-style.
      feature.setStyle([featureStyle, highlightStyle]);
    }
  };

  // Removes the highlight-style from the supplied feature.
  #removeHighlightStyle = (feature) => {
    // First we'll get the feature style-
    const featureStyle = feature.getStyle();
    // Then we'll remove the last style from the style array (the
    // last style will be the highlight-style).
    featureStyle.pop();
    // If the result is an array containing only one style-object,
    // well apply that style-object on the feature.
    if (featureStyle.length === 1) {
      feature.setStyle(...featureStyle);
    } else {
      // Otherwise, we'll apply the feature-style-array to the feature.
      feature.setStyle(featureStyle);
    }
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

  // Refreshes the text-style on the features in the draw-source. Useful for when a feature-prop
  // has been changed and the text-style has to be updated.
  refreshFeaturesTextStyle = () => {
    this.#refreshFeaturesTextStyle();
  };

  // CUSTOM ADDER: Adds the supplied feature to the draw-source
  // TODO: Explain!
  addFeature = (feature) => {
    try {
      // The supplied feature might contain a property with style-information
      // that has been set in an earlier session. Let's apply that style (if present)
      // before we add the feature to the source.
      const extractedStyle = feature.get("EXTRACTED_STYLE");
      extractedStyle &&
        feature.setStyle(this.#getFeatureStyle(feature, extractedStyle));
      // When we're done styling we can add the feature.
      this.#drawSource.addFeature(feature);
      // Then we'll publish some information about the addition.
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

  // CUSTOM REMOVER: Removes the supplied feature from the draw-source
  // TODO: Explain!
  removeFeature = (feature) => {
    // Let's start by removing the supplied feature from the draw-source
    this.#drawSource.removeFeature(feature);
    // Then we (potentially) publish that we've removed a feature.
    this.#publishInformation({
      subject: "drawModel.featureRemoved",
      payLoad: feature,
    });
  };

  // Accepts an RGBA-object containing r-, g-, b-, and a-properties and
  // returns the string representation of the supplied object.
  getRGBAString = (o) => {
    // If nothing was supplied, return an empty string
    if (!o) {
      return "";
    }
    return typeof o === "object" ? `rgba(${o.r},${o.g},${o.b},${o.a})` : o;
  };

  // Accepts a RGBA-string and returns an object containing r-, g-, b-, and a-properties.
  parseRGBAString = (s) => {
    try {
      // First, we make sure we're dealing with a string. If not, return null.
      if (typeof s !== "string") {
        return null;
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
      console.error("RGBA parsing failed: " + error.message);
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
    // Check if the supplied method is set to "Delete" or "Edit", if it is, we activate the remove or edit
    // interaction. Since these are special interactions, (not real ol-draw-interactions)
    // we make sure not to continue executing.
    if (drawMethod === "Delete") {
      return this.#enableRemoveInteraction(settings);
    }
    if (drawMethod === "Edit") {
      return this.#enableEditInteraction(settings);
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
    const drawnFeatures = this.#getAllDrawnFeatures();
    // Since OL does not supply a "removeFeatures" method, we have to map
    // over the array, and remove every single feature one by one...
    drawnFeatures.forEach((feature) => {
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

  setLabelFormat = (format) => {
    if (!format || !this.#allowedLabelFormats.includes(format)) {
      return {
        status: "FAILED",
        message: "Provided label-format is not supported.",
      };
    }
    this.#labelFormat = format;
    this.#refreshFeaturesTextStyle();
    return { status: "SUCCESS", message: `Label-format changed to ${format}` };
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
  // TODO: Handle side effects
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

  // Set:er allowing us to change if measurements of the drawn features should
  // be shown or not. Also makes sure to refresh the current features text-style.
  setShowFeatureMeasurements = (showFeatureMeasurements) => {
    // Let's make sure we're provided proper input before we set anything
    if (typeof showFeatureMeasurements !== "boolean") {
      // If we were not, let's return a fail message
      return this.#getSetFailedObject(
        this.showFeatureMeasurements,
        showFeatureMeasurements
      );
    }
    // If we've made it this far, we can go ahead and set the internal value.
    this.#showFeatureMeasurements = showFeatureMeasurements;
    // Then we have to refresh the style so that the change is shown.
    this.#refreshFeaturesTextStyle();
    // And return a success-message
    return {
      status: "SUCCESS",
      message: `Measurement labels are now ${
        showFeatureMeasurements ? "shown" : "hidden"
      }`,
    };
  };

  // Set:er allowing us to change the style settings used in the draw-layer
  // The fill- and strokeColor passed might be either a string, or an object containing
  // r-, g-, b-, and a-properties. If they are objects, we have to make sure to parse them
  // to strings before setting the new style-settings.
  // TODO: Handle side effects
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
        typeof fillColor === "object"
          ? this.getRGBAString(fillColor)
          : fillColor,
      strokeColor:
        typeof strokeColor === "object"
          ? this.getRGBAString(strokeColor)
          : strokeColor,
    };
    // Then we'll update the style.
    this.#drawStyleSettings = parsedStyle;
    // To make sure the new style is shown in the draw-interaction, we have
    // to refresh the interaction if it is currently active.
    this.#refreshDrawInteraction();
  };

  // Makes sure all features are re-drawn. (If any feature-style has changed
  // this might be necessary in some cases to make the change show).
  // Also making sure to completely re-style arrow- and text-features so that
  // the arrow head and texts has the correct color...
  refreshDrawLayer = () => {
    this.#drawSource.forEachFeature((f) => {
      if (f.get("DRAW_METHOD") === "Arrow") {
        this.#refreshArrowStyle(f);
      }
      if (f.get("DRAW_METHOD") === "Text") {
        f.setStyle(this.#getFeatureStyle(f));
      }
    });
    this.#drawLayer.changed();
  };

  setTextStyleSettings = (newStyleSettings) => {
    this.#textStyleSettings = newStyleSettings;
  };

  setModifyActive = (active) => {
    this.#keepModifyActive = active;
    active ? this.#enableModifyInteraction() : this.#disableModifyInteraction();
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

  // Get:er returning the current label-format
  getLabelFormat = () => {
    return this.#labelFormat;
  };

  // Get:er returning if the modify-interaction is active.
  getModifyActive = () => {
    return this.#modifyInteraction ? true : false;
  };

  // Get:er returning the state of the showDrawTooltip
  getShowDrawTooltip = () => {
    return this.#showDrawTooltip;
  };

  // Get:er returning the state of the showFeatureMeasurements
  getShowFeatureMeasurements = () => {
    return this.#showFeatureMeasurements;
  };

  // Get:er returning the current draw-style settings
  getDrawStyleSettings = () => {
    return this.#drawStyleSettings;
  };

  // Get:er returning the current text-style settings
  getDrawStyleSettings = () => {
    return this.#textStyleSettings;
  };
}
export default DrawModel;
