import Snap from "ol/interaction/Snap";

export default class SnapHelper {
  constructor(map, app, parent = null) {
    console.log("SnapHelper initiated ", parent);

    this.map = map;
    this.app = app;
    this.parent = parent; // Unique ID that tells which of plugins has initiated this given instance
    this.snapInteractions = []; // Will hold snap interactions
  }

  addSnapInteractionForEachVectorSource() {
    // Add snap only to currently activeTool
    if (this.app.activeTool !== this.parent) return;

    console.log("Add snap, activeTool: ", this.app.activeTool);
    console.log(
      this.map.getInteractions().getArray().length,
      "Add pre " + this.parent
    );
    const vectorSources = this.map
      .getLayers() // Get layers
      .getArray() // as arrays
      .filter((l) => l.getVisible()) // and only currently visible.
      .map((l) => l.getSource()) // Get each layer's source
      .filter((s) => typeof s["getFeatures"] === "function"); // but only if it is a VectorSource (which we'll know by checking for "getFeatures").

    // Add the snap interaction for each found source
    vectorSources.forEach((source) => {
      const snap = new Snap({
        source,
      });
      this.map.addInteraction(snap);

      // And save each interaction into a local stack (so we can remove them later)
      this.snapInteractions.push(snap);
    });

    console.log(
      this.map.getInteractions().getArray().length,
      "Add post " + this.parent
    );
  }

  removeAllSnapInteractions() {
    // In contrast to the add function, remove will
    // go on both for active tool and all other that
    // have registered SnapHelper. This works because
    // we don't do anything if this.snapInteractions.length === 0.

    if (this.snapInteractions.length === 0) return;

    console.log(
      `Removing Snap from ${this.parent}, activeTools is ${this.app.activeTool}`,
      this.snapInteractions
    );

    console.log(
      this.map.getInteractions().getArray().length,
      "Remove pre " + this.parent
    );

    // Loop through the local stack of snap interactions
    for (const i of this.snapInteractions) {
      // And remove each one of them from the map
      this.map.removeInteraction(i);
    }

    // Important: don't forget to purge the local stack!
    this.snapInteractions = [];

    console.log(
      this.map.getInteractions().getArray().length,
      "Remove post " + this.parent
    );
  }
}
