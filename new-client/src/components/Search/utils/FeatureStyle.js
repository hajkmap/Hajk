import { Stroke, Style, Fill, Text, Icon } from "ol/style";
import { Point } from "ol/geom.js";

const defaultMarker =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAADpElEQVR4Ae3aA9DsSBQF4DNa2+ZvZNL3lNa2d0tr24W1bdu2bdu2beO5l8/InX/6JpmqfKdcgz4dA4VCoVAohNQ7mSwrB8k5cjOf4gcyiL/zA3lcbpZzeIAsyxpyrMLV5Ab+Tj+J/C7XcTVUkDcLTCG7yWf0ushnsnvb5MiNqtuZX9I3mC+5A6rIHtfme/QDzHtuTWSqIifSNxc5IbMtgtPLffTNR+7j9EhffW6+TR8ob0XzIF2cTz6nDxf5nPMhPV0z8336wHm/a2akgzU+TW+Qp1M6TvMieqNcBHvcgN4wG8BW2+TyuWUB+dz4FEP2obeN7Gt76PrNvMBvhoc1OZbePnKM2e5TfqVPIb8Y7U5lHf0gZJBc5TaJ43iGvxO7TeQqGUT9t9eBBblKPYR73PwYh5ufd6sLXA0DJf6kHMCRmLCSHE6vyk8oIbR4MeXsHY5JcEfQaxIvhtDcnrqVJ2HuSryHXpG9EJqcr9l0k8/r++ZVbc7nITR5RFHgMijIZYpfegSh8YNQp2Ka00H5EKHxe/qkRJ1QiDoVU/E9QpMR9EnpnBYKndMqlsBwhMY/6JPSNh0U2qajT8wfCI2f0CfF9UDB9SgKfILQ+EKaGzFfQGiqA9AVUOAVqgNiaHK66kC2IBJEC2oOZHI6QpPNdLcJk04ldLcjZTOEVu9Vn4tOAo+i16Tei+DK/KPJ89GSHEavyh8oIzy5o5kLmv6FeI/2+3InLHCrRi8pXT2egdO7uttEruIQenW2MrqlKyPo7SMjemeCDT5An0IegBW3XSoFtoeVaGoZZD18GcSpYEcuNC9wISzFi1oXiBeFLb5tOv/vwppsZlpgM5irykdmBT5GFfbcFlYF3BYwYr8M7OfffjuQzZGaMt8MXuAtlJEet17oAm49pEteClrgFaTNLR/0+LsC0sdrgxW4FlnonSPMU0v5tW92ZIPb257/2yvJ403P/xMoITtRJ4c1VWBY1IlsydFNzf/RyNo8U/KTARf4dJ4pkb14rQHv/ddCPvCKARW4AnnRNh2/aHj4X7RNh/yIl260gFsK+dLYW9RyEvKGNXlOXeB51pA/9bn5nWr437u5kE/x0jI8+RG2WxL5JQcmFjgQuVbmU5Ms8DTKyLe+eeWHic7+j9E8yD+uOOEtQYZzRbQG2W2CBXaDHfsX1OR8tJSKPDnW8J9EBa0lmk2+HjX8r6PZ0Hoo/z8bHkJBa5Kt6ella7QuHsWjYKZQKBQKhb8AaFXSW3c/idsAAAAASUVORK5CYII=";
export default class FeatureStyle {
  #options;
  #defaultHighlightStyleSettings;
  #enableLabelOnHighlight;

  constructor(options) {
    this.#options = options;
    this.#enableLabelOnHighlight = options.enableLabelOnHighlight ?? true;
    this.#defaultHighlightStyleSettings = this.#getDefaultHighlightStyleSettings();
  }

  #getDefaultHighlightStyleSettings = () => {
    const strokeColor =
      this.#options.highlightStrokeColor ?? "rgba(255, 0, 0, 0.6)";
    const fillColor =
      this.#options.highlightFillColor ?? "rgba(255, 0, 0, 0.2)";
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
    const { scale, markerImg } = this.#options;
    const anchor = this.#options.anchor ?? [];
    const isPoint = feature?.getGeometry() instanceof Point;
    const textAlign = isPoint ? "left" : "center";
    const offsetY = isPoint ? -50 : -10;
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
        scale: markerImg ? scale ?? 0.15 : 0.5,
        src: markerImg ?? defaultMarker,
      }),
      text: new Text({
        textAlign: textAlign,
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
        offsetY: offsetY,
        rotation: 0,
        scale: 1,
      }),
    });
  };

  #getHighlightLabelValueFromFeature = (feature, displayFields) => {
    if (this.#enableLabelOnHighlight) {
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
