import { Fill, Stroke, Style, Text } from "ol/style";

class FirStyles {
  // constructor(settings) {
  //   // this.map = settings.map;
  //   // this.app = settings.app;
  //   // this.localObserver = settings.localObserver;
  // }

  getLabelStyle(feature) {
    return new Style({
      text: new Text({
        font: "12px Calibri, sans-serif",
        fill: new Fill({ color: "#000" }),
        stroke: new Stroke({
          color: "#fff",
          width: 2,
        }),
        text: feature.get("block_enhet") || "",
      }),
    });
  }
}

const instance = new FirStyles();

export default instance;
