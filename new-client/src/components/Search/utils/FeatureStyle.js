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
    this.#defaultSelectionStyleSettings =
      this.#getDefaultSelectionStyleSettings();
    this.#defaultHighlightStyleSettings =
      this.#getDefaultHighlightStyleSettings();
  }

  #getDefaultDisplayStyleSettings = () => {
    const fillColor = this.#options.displayFillColor ?? "rgba(74,144,226,0.15)";
    const strokeColor =
      this.#options.displayStrokeColor ?? "rgba(74,144,226,0.4)";

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
    };
  };

  #getDefaultSelectionStyleSettings = () => {
    const strokeColor =
      this.#options.selectionStrokeColor ?? "rgba(74,144,226,0.8)";
    const fillColor =
      this.#options.selectionFillColor ?? "rgba(74,144,226,0.3)";
    const textFillColor =
      this.#options.selectionTextFill ?? "rgba(63,122,190,1)";
    const textStrokeColor =
      this.#options.selectionTextStroke ?? "rgba(255,255,255,1)";
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
      this.#options.highlightStrokeColor ?? "rgba(245,166,35,0.8)";
    const fillColor = this.#options.highlightFillColor ?? "rgba(245,166,35,0)";
    const textFillColor =
      this.#options.highlightTextFill ?? "rgba(214,143,28,1)";
    const textStrokeColor =
      this.#options.highlightTextStroke ?? "rgba(255,255,255,1)";
    const fontSize = 15;

    return {
      strokeColor: strokeColor,
      fillColor: fillColor,
      textFillColor: textFillColor,
      textStrokeColor: textStrokeColor,
      fontSize: fontSize,
    };
  };

  getFeatureStyle = (feature, type) => {
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

    // Create new color to be used for icons: start with fill color but make sure that it's
    // _not_ transparent by setting the alpha channel value to 0.8. Unfortunately Safari doesn't
    // support lookbehind, so we must do it this way. Basically we do:
    // "rgba(x,y,z,ź)" => "rgba(x,y,z,0.8)"
    const iconColor = settings.fillColor.replace(/,[\d.]*\)/, ",0.8)");

    // Default SVG icon to be used as marker. Placed here so we can grab the current style's fill color.
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32pt" height="32pt" fill="${iconColor}"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
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
      ...(type === "highlight" && { zIndex: 1000 }), // Highlight style should always stay on top of other labels
      ...(this.#enableLabelOnHighlight && {
        text: new Text({
          textAlign: textAlign,
          textBaseline: "middle",
          font: `${settings.fontSize}pt "Roboto", sans-serif`,
          fill: new Fill({
            color: settings.textFillColor,
          }),
          text: feature.featureTitle,
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
      }),
    });
  };

  getDefaultSearchResultStyle = (feature) => {
    const settings = this.#defaultSelectionStyleSettings;

    const fill = new Fill({
      color: this.#defaultDisplayStyleSettings.fillColor,
    });

    const stroke = new Stroke({
      color: this.#defaultDisplayStyleSettings.strokeColor,
      width: 2,
    });
    return new Style({
      fill: fill,
      stroke: stroke,
      image: new Circle({
        fill: fill,
        stroke: stroke,
        radius: 10,
      }),
      ...(this.#enableLabelOnHighlight && {
        text: new Text({
          textAlign: "center",
          textBaseline: "middle",
          font: `10pt "Roboto", sans-serif`,
          fill: new Fill({
            color: settings.textFillColor,
          }),
          text: feature.shortFeatureTitle,
          overflow: true,
          stroke: new Stroke({
            color: settings.textStrokeColor,
            width: 3,
          }),
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          scale: 1,
        }),
      }),
    });
  };
}
