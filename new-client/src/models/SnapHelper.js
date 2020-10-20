import Snap from "ol/interaction/Snap";

export default class SnapHelper {
  constructor(app) {
    this.map = app.map;
    this.globalObserver = app.globalObserver;

    this.snapInteractions = []; // Will hold snap interactions

    // Initiate a new set that will hold active plugins
    this.activePlugins = new Set();

    // Initiate a variable that keeps track of pending updates
    this.updatePending = false;

    // When layer visibility is changed, check if there was a
    // vector source. If so, refresh the snap interactions to
    // reflect the visibility change.
    this.globalObserver.on(
      "core.layerVisibilityChanged",
      this.#handleLayerVisibilityChanged
    );
  }
  /**
   * @summary Adds a given plugin to the set of plugins interested of
   * snap interaction. As long as this set isn't empty, Snap helper knows
   * that interactions should be added.
   *
   * @param {string} plugin
   * @memberof SnapHelper
   */
  add(plugin) {
    // If this is the first plugin that wants to activate Snap,
    // ensure that we add the interactions to map. Else, they've
    // already been added and there's no need to do it again.
    this.activePlugins.size === 0 && this.#addSnapToAllVectorSources();

    // Add the plugin to our stack
    this.activePlugins.add(plugin);
  }
  /**
   * @summary Does the opposite of add() by deleting a plugin from the Set.
   * When the set is empty, Snap helper knows that no one is interested in snapping
   * anyway, and it can remove all snap interactions (when the last plugin leaves the list).
   *
   * @param {string} plugin
   * @memberof SnapHelper
   */
  delete(plugin) {
    this.activePlugins.delete(plugin);

    // If there are no active plugins left, remove interactions
    this.activePlugins.size === 0 && this.#removeAllSnapInteractions();
  }
  /**
   * @summary Helper used to determine if a given source is ol.VectorSource.
   * @description Ideally, we would look into the prototype, to see if
   * constructor.name is "VectorSource". But, because Webpack uglifies the
   * class names, we can't do that. This is the best I came up with regarding
   * finding out whether the source appears to be a vector source or not: we
   * look for the getFeatures() method. It only exists on vector sources, so
   * it should be safe to use this way.
   *
   * @param {object} source
   * @returns {*} isVectorSource
   */
  #isVectorSource = (source) => {
    return typeof source["getFeatures"] === "function";
  };

  /**
   * @summary Called when a layer's visibility is changed. Ensures that
   * snapping is always enabled for all visible vector sources.
   *
   * @param {*} e Event that contains the layer who's visibility has changed.
   */
  #handleLayerVisibilityChanged = (e) => {
    if (
      this.activePlugins.size === 0 || // Abort if no plugin is interested of snap interactions
      this.updatePending === true || // Abort if there already is a pending update
      this.#isVectorSource(e.target.getSource()) === false // Abort if event was triggered on a non-vector source
    )
      return;

    // Switch the pending flag to true, this will avoid multiple invokations
    this.updatePending = true;

    // After 250 ms…
    setTimeout(() => {
      // Reload sources
      this.#removeAllSnapInteractions();
      this.#addSnapToAllVectorSources();
      // Reset the flag
      this.updatePending = false;
    }, 250);
  };

  #addSnapToAllVectorSources = () => {
    const vectorSources = this.map
      .getLayers() // Get layers
      .getArray() // as arrays
      .filter((l) => l.getVisible()) // and only currently visible.
      .map((l) => l.getSource()) // Get each layer's source
      .filter(this.#isVectorSource); // but only if it is a VectorSource (which we'll know by checking for "getFeatures").

    // Add the snap interaction for each found source
    vectorSources.forEach((source) => {
      const snap = new Snap({
        source,
      });
      this.map.addInteraction(snap);

      // And save each interaction into a local stack (so we can remove them later)
      this.snapInteractions.push(snap);
    });
  };

  #removeAllSnapInteractions = () => {
    if (this.snapInteractions.length === 0) return;

    // Loop through the local stack of snap interactions
    for (const i of this.snapInteractions) {
      // And remove each one of them from the map
      this.map.removeInteraction(i);
    }

    // Important: purge the local stack!
    this.snapInteractions = [];
  };
}
