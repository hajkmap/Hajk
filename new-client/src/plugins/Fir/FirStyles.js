import { Fill, Stroke, Style, Text, Circle } from "ol/style";

class FirStyles {
  constructor() {
    this.colors = {
      colorResult: "rgba(255,255,0,0.15)",
      colorResultStroke: "rgba(0,0,0,0.6)",
      colorHighlight: "rgba(255,255,0,0.25)",
      colorHighlightStroke: "rgba(0, 130, 179, 1)",
      colorResult100: "rgba(255,255,0,1)",
      colorResultStroke100: "rgba(0,0,0,1)",
    };
    this.model = {};
    this.setResultStyle();
    this.setHighlightStyle();
    this.setPointStyle();
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

  getPointStyle() {
    return this.pointStyle;
  }

  setPointStyle() {
    const fill = new Fill({
      color: this.getColor("colorResult100"),
    });
    const stroke = new Stroke({
      color: this.getColor("colorResultStroke100"),
      width: 2,
    });

    this.pointStyle = new Style({
      image: new Circle({
        fill: fill,
        stroke: stroke,
        radius: 5,
      }),
      fill: fill,
      stroke: stroke,
    });
  }
}

const instance = new FirStyles();

export default instance;
