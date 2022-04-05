import { Stroke, Style, Circle, Fill, Text, Icon } from "ol/style";
import { Point } from "ol/geom.js";

export default class FeatureStyle {
  #options;
  #defaultDisplayStyleSettings;
  #defaultSelectionStyleSettings;
  #defaultHighlightStyleSettings;
  #enableLabelOnHighlight;

  constructor(options) {
    this.#options = options;
    this.#enableLabelOnHighlight = options.enableLabelOnHighlight ?? true;
    this.#defaultDisplayStyleSettings = this.#getDefaultDisplayStyleSettings();
    this.#defaultSelectionStyleSettings = this.#getDefaultSelectionStyleSettings();
    this.#defaultHighlightStyleSettings = this.#getDefaultHighlightStyleSettings();
  }

  #getDefaultDisplayStyleSettings = () => {
    const fillColor =
      this.#options.displayFillColor ?? "rgba(255, 255, 255, 0.4)";
    const strokeColor =
      this.#options.displayStrokeColor ?? "rgba(50, 150, 200, 1)";

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
    };
  };

  #getDefaultSelectionStyleSettings = () => {
    const strokeColor =
      this.#options.selectionStrokeColor ?? "rgba(0, 0, 255, 0.6)";
    const fillColor =
      this.#options.selectionFillColor ?? "rgba(0, 0, 255, 0.2)";
    const textFillColor =
      this.#options.selectionTextFill ?? "rgba(255, 255, 255, 1)";
    const textStrokeColor =
      this.#options.selectionTextStroke ?? "rgba(0, 0, 0, 0.5)";
    const fontSize = 12;

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
      textFillColor: textFillColor,
      textStrokeColor: textStrokeColor,
      fontSize: fontSize,
    };
  };

  #getDefaultHighlightStyleSettings = () => {
    const strokeColor =
      this.#options.highlightStrokeColor ?? "rgba(255, 0, 0, 0.6)";
    const fillColor =
      this.#options.highlightFillColor ?? "rgba(255, 0, 0, 0.2)";
    const textFillColor =
      this.#options.highlightTextFill ?? "rgba(255, 255, 255, 1)";
    const textStrokeColor =
      this.#options.highlightTextStroke ?? "rgba(0, 0, 0, 0.5)";
    const fontSize = 15;

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
      textFillColor: textFillColor,
      textStrokeColor: textStrokeColor,
      fontSize: fontSize,
    };
  };

  getFeatureStyle = (feature, featureTitle, displayFields, type) => {
    // Helper for the cumbersome type check: scale and anchor values, when unset in admin,
    // will consist of empty strings, perfectly legal but unusable in our case. So we must ensure
    // that the value we get can be parsed to a finite number, else fallback to something else.
    const isValidNumber = (n) => Number.isFinite(parseInt(n));

    const { scale, markerImg } = this.#options;
    const anchor = this.#options.anchor ?? [];

    const isPoint = feature?.getGeometry() instanceof Point;
    const textAlign = isPoint ? "left" : "center";
    const offsetY = isPoint ? -50 : -10;

    const settings =
      !type || type === "selection"
        ? this.#defaultSelectionStyleSettings
        : this.#defaultHighlightStyleSettings;

    // Default SVG icon to be used as marker. Placed here so we can grab the current style's fill color.
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32pt" height="32pt" fill="${settings.fillColor}"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    const defaultMarker = `data:image/svg+xml;base64,${window.btoa(svgString)}`; // We need base64 for kml-exports to work.
    // For the 'highlight' style, we want the marker icon to be 30% larger than other styles
    const multiplier = type === "highlight" ? 1.3 : 1;

    return new Style({
      fill: new Fill({
        color: settings.fillColor,
      }),
      stroke: new Stroke({
        color: settings.strokeColor,
        width: 2,
      }),
      image: new Icon({
        anchor: [
          isValidNumber(anchor[0]) ? anchor[0] : 0.5,
          isValidNumber(anchor[1]) ? anchor[1] : 1,
        ],
        scale: (isValidNumber(scale) ? scale : 1) * multiplier,
        src: markerImg?.length > 0 ? markerImg : defaultMarker,
      }),
      text: new Text({
        textAlign: textAlign,
        textBaseline: "middle",
        font: `${settings.fontSize}pt "Roboto", sans-serif`,
        fill: new Fill({
          color: settings.textFillColor,
        }),
        text: this.#getHighlightLabelValueFromFeature(
          feature,
          featureTitle,
          displayFields
        ),
        overflow: true,
        stroke: new Stroke({
          color: settings.textStrokeColor,
          width: 3,
        }),
        offsetX: 0,
        offsetY: offsetY,
        rotation: 0,
        scale: 1,
      }),
    });
  };

  getDefaultSearchResultStyle = () => {
    const fill = new Fill({
      color: this.#defaultDisplayStyleSettings.fillColor,
    });
    const stroke = new Stroke({
      color: this.#defaultDisplayStyleSettings.strokeColor,
      width: 1,
    });
    return new Style({
      fill: fill,
      stroke: stroke,
      image: new Circle({
        fill: fill,
        stroke: stroke,
        radius: 5,
      }),
    });
  };

  #getHighlightLabelValueFromFeature = (
    feature,
    featureTitle,
    displayFields
  ) => {
    if (this.#enableLabelOnHighlight) {
      if (!featureTitle || featureTitle.length === 0) {
        if (!displayFields || displayFields.length === 0) {
          return `Visningsfält saknas`;
        }
        return this.#getFeatureTitle(feature, displayFields);
      } else {
        return featureTitle;
      }
    }
  };

  #getFeatureTitle = (feature, displayFields) => {
    return displayFields.reduce((featureTitleString, df) => {
      let displayField = feature.get(df);
      if (Array.isArray(displayField)) {
        displayField = displayField.join(", ");
      }

      if (displayField) {
        if (featureTitleString.length > 0) {
          featureTitleString = featureTitleString.concat(` | ${displayField}`);
        } else {
          featureTitleString = displayField;
        }
      }

      return featureTitleString;
    }, "");
  };
}
