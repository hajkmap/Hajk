import { Fill, Stroke, Style, Text, Circle } from "ol/style";

class FirStyles {
  constructor(model) {
    const config = model.config;
    this.colors = {
      result: config.colors?.result || "rgba(255,255,0,0.15)",
      resultStroke: config.colors?.resultStroke || "rgba(0,0,0,0.6)",
      previousResult: config.colors?.previousResult || "rgba(255,0,0,0.15)",
      previousResultStroke:
        config.colors?.previousResultStroke || "rgba(255,0,0,1)",
      highlight: config.colors?.highlight || "rgba(255,255,0,0.25)",
      highlightStroke: config.colors?.highlightStroke || "rgba(0, 130, 179, 1)",
      point: config.colors?.point || "rgba(255,255,0,1)",
      pointStroke: config.colors?.pointStroke || "rgba(0,0,0,1)",
    };

    this.model = model;
    this.setPreviousResultStyle();
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

  getPreviousResultStyle() {
    return this.previousResultStyle;
  }

  setResultStyle() {
    this.resultStyle = new Style({
      fill: new Fill({
        color: this.getColor("result"),
      }),
      stroke: new Stroke({
        color: this.getColor("resultStroke"),
        width: 2,
      }),
    });
  }

  setPreviousResultStyle() {
    this.previousResultStyle = new Style({
      fill: new Fill({
        color: this.getColor("previousResult"),
      }),
      stroke: new Stroke({
        color: this.getColor("previousResultStroke"),
        width: 2,
      }),
    });
  }

  getHighlightStyle() {
    return this.highlightStyle;
  }

  setHighlightStyle() {
    this.highlightStyle = new Style({
      fill: new Fill({
        color: this.getColor("highlight"),
      }),
      stroke: new Stroke({
        color: this.getColor("highlightStroke"),
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
      color: this.getColor("point"),
    });
    const stroke = new Stroke({
      color: this.getColor("pointStroke"),
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

export default FirStyles;
