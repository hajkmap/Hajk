import { Draw, Modify, Snap } from "ol/interaction.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";

class DrawModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
  }

  /*
   * Add source and layer to map
   */
  activate() {
    this.source = new VectorSource({ wrapX: false });
    this.layer = new VectorLayer({
      source: this.source,
      name: "draw-layer"
    });

    this.olMap.addLayer(this.layer);
  }

  /*
   * Removes all added interactions.
   * Layer and source remain intact.
   */
  deactivate() {
    this.deactivateDrawTool();
    this.deactivateModifyTool();
  }

  activateDrawTool(tool = "LineString") {
    this.deactivateDrawTool();
    this.deactivateModifyTool();

    this.draw = new Draw({
      source: this.source,
      type: tool
    });
    this.olMap.addInteraction(this.draw);

    this.snap = new Snap({
      source: this.source
    });
    this.olMap.addInteraction(this.snap);
  }

  deactivateDrawTool() {
    this.olMap.removeInteraction(this.draw);
    this.olMap.removeInteraction(this.snap);
  }

  activateModifyTool(tool = "move") {
    this.deactivateDrawTool();
    this.deactivateModifyTool();
    this.modify = new Modify({
      source: this.source
    });
    this.olMap.addInteraction(this.modify);
  }

  deactivateModifyTool() {
    this.olMap.removeInteraction(this.modify);
  }
}

export default DrawModel;
