import { Fill, Stroke, Style, Text } from "ol/style";

class FirStyles {
  constructor() {
    this.colors = {
      colorResult: "rgba(255,255,0,0.15)",
      colorResultStroke: "rgba(0,0,0,0.6)",
      colorHighlight: "rgba(255,255,0,0.25)",
      colorHighlightStroke: "rgba(0, 130, 179, 1)",
    };
    this.model = {};
    this.setResultStyle();
    this.setHighlightStyle();
  }

  getColor(key) {
    return this.colors[key] || null;
  }

  getResultStyle() {
    return this.resultStyle;
  }

  setResultStyle() {
    this.resultStyle = new Style({
      fill: new Fill({
        color: this.getColor("colorResult"),
      }),
      stroke: new Stroke({
        color: this.getColor("colorResultStroke"),
        width: 2,
      }),
    });
  }

  getHighlightStyle() {
    return this.highlightStyle;
  }

  setModel(model) {
    this.model = model;
  }

  setHighlightStyle() {
    this.highlightStyle = new Style({
      fill: new Fill({
        color: this.getColor("colorHighlight"),
      }),
      stroke: new Stroke({
        color: this.getColor("colorHighlightStroke"),
        width: 3,
      }),
    });
  }

  getLabelStyle(feature) {
    return new Style({
      text: new Text({
        font: "13px Arial, sans-serif",
        fill: new Fill({ color: "#000" }),
        stroke: new Stroke({
          color: "#fff",
          width: 2,
        }),
        text: feature.get(this.model.baseSearchType.labelField) || "",
      }),
    });
  }
}

const instance = new FirStyles();

export default instance;
