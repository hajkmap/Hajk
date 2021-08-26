/**
 * @summary Dummy model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DummyModel
 */

import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw.js";

import { hfetch } from "utils/FetchWrapper";

export default class DummyModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;

    this.draw = null;
    this.source = new VectorSource();
    this.vector = new Vector({
      source: this.source,
      name: "FbproxyDrawLayer",
    });

    this.map.addLayer(this.vector);
  }
  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof DummyModel
   */
  getMap() {
    return this.map;
  }

  load = async (action) => {
    const geom = this.source.getFeatures()[0].getGeometry();
    const [easting, northing] = geom.getCenter();
    const radius = geom?.getRadius();
    console.log("radius: ", radius);
    const srid = this.map.getView().getProjection().getCode().split(":")[1];

    const { proxy, mapserviceBase } = this.app.config.appConfig;
    const url = `${proxy}${mapserviceBase}/fbproxy/${action}/${northing}/${easting}/${srid}/${
      radius || 1000
    }`;

    console.log("url: ", url);
    if (action.includes("/")) {
      const response = await hfetch(url);
      const json = await response.json();
      console.log(json);
    }
  };

  activate(mode) {
    console.log("Activating mode: ", mode);
    if (mode === null) {
      this.map.snapHelper.delete("fbproxy");
      this.map.removeInteraction(this.draw);
      this.map.clickLock.delete("fbproxy");
      this.vector.getSource().clear();
      // this.localObserver.publish("hideSnackbar");
      console.log("All cleaned up");
    } else {
      this.map.removeInteraction(this.draw);
      this.draw = new Draw({
        source: this.source,
        type: mode === "circle" ? "Circle" : "Polygon",
      });
      // this.draw.on("drawend", this.#handleDrawEnd);
      this.map.addInteraction(this.draw);
      this.map.clickLock.add("fbproxy");

      // Add snap interactions AFTER measure source has been added
      // this will allow us to snap to the newly added source too
      this.map.snapHelper.add("fbproxy");
      console.log("Draw active");
    }
  }
}
