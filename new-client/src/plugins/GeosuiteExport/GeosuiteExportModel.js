import Draw from "ol/interaction/Draw";
import DoubleClickZoom from "ol/interaction/DoubleClickZoom";
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
    this.doubleClick = this.getMapsDoubleClickInteraction();
  }

  handleWindowOpen = () => {
    //pass to the view, so we can re-set the view state.
    //TODO - can we just handle what we need to here in the model?
    this.localObserver.publish("window-opened");
  };

  handleWindowClose = () => {
    //pass to the view, so we can re-set the view state.
    this.localObserver.publish("window-closed");
  };

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

    /*
    Add the maps doubleclick zoom interaction back to map when we leave drawing mode (the doubleclick zoom interaction is removed from the map when we enter drawing mode, to avoid a zoom when doubleclicking to finish drawing).
    TODO - do this without a timeout. (timeout because otherwise the map still zooms).
    TODO - is there a better way to cancel the doubleclick zoom without removing and the re-adding the interaction?
    */
    if (this.doubleClick) {
      setTimeout(() => {
        this.map.addInteraction(this.doubleClick);
      }, 200);
    }
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

    //Remove the doubleClick interaction from the map. Otherwise when a user double clicks to finish drawing, the map will also zoom in.
    if (this.doubleClick) {
      this.map.removeInteraction(this.doubleClick);
    }
  };

  clearMapFeatures = () => {
    this.map.removeLayer(this.source.clear());
    this.localObserver.publish("area-selection-removed");
  };

  getMapsDoubleClickInteraction = () => {
    let doubleClick = null;
    this.map
      .getInteractions()
      .getArray()
      .forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          doubleClick = interaction;
        }
      });

    return doubleClick;
  };
}

export default GeosuiteExportModel;
