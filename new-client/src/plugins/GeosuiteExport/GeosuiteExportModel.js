import Draw from "ol/interaction/Draw";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";

class GeosuiteExportModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      name: "geoSuiteDrawLayer",
    });
    this.style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
    });

    this.map.addLayer(this.vector);
    this.draw = null;
  }

  handleDrawStart = (e) => {
    //When the user starts drawing a feature, remove any existing feature. We only want one shape.
    this.clearMapFeatures();
  };

  handleDrawEnd = (e) => {
    this.removeDrawInteraction();
    this.localObserver.publish("area-selection-complete");
  };

  removeDrawInteraction = () => {
    if (this.draw !== null) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
    this.map.clickLock.delete("geosuiteexport");
  };

  addDrawInteraction = () => {
    this.draw = new Draw({
      source: this.source,
      type: "Polygon",
    });
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);

    //When drawing starts, lock clicks to this tool, otherwise the InfoClick tool will fire on click.
    this.map.clickLock.add("geosuiteexport");
  };

  clearMapFeatures = () => {
    this.map.removeLayer(this.source.clear());
    this.localObserver.publish("area-selection-removed");
  };
}

export default GeosuiteExportModel;
