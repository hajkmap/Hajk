import { Stroke, Style, Fill, Text, Icon } from "ol/style";
import { Point } from "ol/geom.js";

export default class FeatureStyle {
  #options;
  #defaultHighlightStyleSettings;
  #showLabelOnHighlight;

  constructor(options) {
    this.#options = options;
    this.#showLabelOnHighlight = options.showLabelOnHighlight ?? true;
    this.#defaultHighlightStyleSettings = this.#getDefaultHighlightStyleSettings();
  }

  #getDefaultHighlightStyleSettings = () => {
    const strokeColor =
      this.#options.highlightStrokeColor ?? "rgba(255, 214, 91, 0.6)";
    const fillColor =
      this.#options.highlightFillColor ?? "rgba(255, 214, 91, 0.2)";
    const textFillColor =
      this.#options.highlightTextFill ?? "rgba(255, 255, 255, 1)";
    const textStrokeColor =
      this.#options.highlightTextStroke ?? "rgba(0, 0, 0, 0.5)";

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
      textFillColor: textFillColor,
      textStrokeColor: textStrokeColor,
    };
  };

  getHighlightedStyle = (feature, displayFields) => {
    const { anchor, scale, markerImg } = this.#options;
    return new Style({
      fill: new Fill({
        color: this.#defaultHighlightStyleSettings.fillColor,
      }),
      stroke: new Stroke({
        color: this.#defaultHighlightStyleSettings.strokeColor,
        width: 4,
      }),
      image: new Icon({
        anchor: [anchor[0] ?? 0.5, anchor[1] ?? 1],
        scale: scale ?? 0.15,
        src: markerImg ?? "marker.png",
      }),
      text: new Text({
        textAlign: "center",
        textBaseline: "middle",
        font: "12pt sans-serif",
        fill: new Fill({
          color: this.#defaultHighlightStyleSettings.textFillColor,
        }),
        text: this.#getHighlightLabelValueFromFeature(feature, displayFields),
        overflow: true,
        stroke: new Stroke({
          color: this.#defaultHighlightStyleSettings.textStrokeColor,
          width: 3,
        }),
        offsetX: 0,
        offsetY: feature?.getGeometry() instanceof Point ? 10 : -10,
        rotation: 0,
        scale: 1,
      }),
    });
  };

  #getHighlightLabelValueFromFeature = (feature, displayFields) => {
    if (this.#showLabelOnHighlight) {
      if (!displayFields || displayFields.length < 1) {
        return `Visningsfält saknas`;
      } else {
        return this.#getFeatureTitle(feature, displayFields);
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
