import { PLUGINS_TO_IGNORE_IN_HASH_APP_STATE } from "constants";
import { isValidLayerId } from "utils/Validator";
import { debounce } from "utils/debounce";

class AnchorModel {
  #app;
  #cqlFilters;
  #map;

  constructor(settings) {
    this.#app = settings.app;
    this.#cqlFilters = {};
    this.#map = settings.map;

    this.#app.globalObserver.subscribe("core.appLoaded", () => {
      this.#initiate();
    });
  }

  #initiate() {
    // Initiate the model by defining what should trigger an update.
    // A: Update when map view changes (zoom, pan, rotate etc)
    this.#map.getView().on("change", this.#getAnchorWhenAnimationFinishes);

    // B: Update when search phrase changes
    this.#app.globalObserver.subscribe(
      "search.searchPhraseChanged",
      async () => {
        this.#app.globalObserver.publish("core.mapUpdated", {
          url: await this.getAnchor(),
          source: "search",
        });
      }
    );

    // C: A plugin based on BaseWindowPlugin changes visibility
    this.#app.globalObserver.subscribe(
      "core.pluginVisibilityChanged",
      async () => {
        this.#app.globalObserver.publish("core.mapUpdated", {
          url: await this.getAnchor(),
          source: "pluginVisibility",
        });
      }
    );

    // D: A layer's visibility changes
    this.#map
      .getLayers()
      .getArray()
      .forEach((layer) => {
        // Grab an unique ID for each layer, we'll need this to save CQL filter value for each layer
        const layerId = layer.get("name");

        // Update anchor each time layer visibility changes (to reflect current visible layers)
        layer.on("change:visible", async (event) => {
          this.#app.globalObserver.publish("core.mapUpdated", {
            url: await this.getAnchor(),
            source: "layerVisibility",
          });
        });

        // Update anchor each time an underlying Source changes in some way (could be new CQL params, for example).
        layer.getSource().on("change", async ({ target }) => {
          if (typeof target.getParams !== "function") return;

          // Update CQL filters only if a real value exists
          const cqlFilterForCurrentLayer = target.getParams()?.CQL_FILTER;
          if (
            cqlFilterForCurrentLayer !== null &&
            cqlFilterForCurrentLayer !== undefined
          ) {
            this.#cqlFilters[layerId] = cqlFilterForCurrentLayer;
          }

          // Publish the event
          this.#app.globalObserver.publish("core.mapUpdated", {
            url: await this.getAnchor(),
            source: "sourceVisibility",
          });
        });
      });
  }

  #getAnchorWhenAnimationFinishes = async (e) => {
    // Only update the anchor if View is done animating
    if (e.target.getAnimating() === false) {
      const newAnchor = await this.getAnchor();
      this.#app.globalObserver.publish("core.mapUpdated", {
        url: newAnchor,
        source: "animating",
      });
    }
  };

  getVisibleLayers() {
    return this.#map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          // We consider a layer to be visible only if…
          layer.getVisible() && // …it's visible…
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name) // …has a specified name property…
        );
      })
      .map((layer) => layer.getProperties().name)
      .join(",");
  }

  getPartlyToggledGroupLayers() {
    const partlyToggledGroupLayers = {};
    this.#map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          // We consider a layer to be visible only if…
          layer.getVisible() && // …it's visible…
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name) && // …has a specified name property…
          layer.getProperties().layerType === "group" && // …and it is a group layer.
          // Now, find out how many sublayers there are in this group layer and
          // compare it with the amount of sublayer that are active right now.
          // Include this group layers _only_ if a subset of sublayers is selected.
          layer.subLayers?.length !==
            layer.getSource().getParams?.().LAYERS?.split(",").length
        );
      })
      .forEach((layer) => {
        // Create an array where each element will have the layer id as key
        // and a string of selected sublayers as value. This comma-separated
        // string is handy as it's the exact format that is used in OL as the
        // LAYER property of getParams, so it will be easy to turn it back into
        // valid OL configuration.
        partlyToggledGroupLayers[layer.getProperties().name] = layer
          .getSource()
          .getParams().LAYERS;
      });
    return partlyToggledGroupLayers;
  }

  #getVisiblePlugins = () =>
    // Get visible plugins but make sure to ignore
    // some specific that should NEVER be part of the
    // p-param. See #1294.
    this.#app.windows
      .filter(
        (w) =>
          w.state.windowVisible && // Is visible and…
          PLUGINS_TO_IGNORE_IN_HASH_APP_STATE.indexOf(w.type) === -1 // …is not in the list of excluded plugins
      )
      .map((p) => p.type)
      .join();

  // getAnchor is where the main action happens. A lot of events will cause
  // a call to this function. Because of that we limit the amount of actual
  // calls by wrapping it in a debounce helper. The default delay is 500 ms,
  // so we will avoid all sorts of issues but still get a pretty responsive
  // link/hash string.
  getAnchor = debounce((preventHashUpdate = false) => {
    // Read some "optional" values so we have them prepared.
    // If some conditions aren't met, we won't add them to the
    // anchor string, in order to keep the string short.
    const q = document.getElementById("searchInputField")?.value.trim() || "";
    const f = this.#cqlFilters;

    // Split current URL on the "?" and just get the first part. This
    // way we'll get rid of any unwanted search params, without messing
    // up the remaining portion of URL (protocol, host, path, hash).
    const url = new URL(document.location.href.split("?")[0]);

    // The following params are always appended
    url.searchParams.append("m", this.#app.config.activeMap);
    url.searchParams.append("x", this.#map.getView().getCenter()[0]);
    url.searchParams.append("y", this.#map.getView().getCenter()[1]);
    url.searchParams.append("z", this.#map.getView().getZoom());
    url.searchParams.append("l", this.getVisibleLayers());
    url.searchParams.append("p", this.#getVisiblePlugins());

    // Only add gl if there are group layers with a subset of selected layers
    const partlyToggledGroupLayers = this.getPartlyToggledGroupLayers();
    Object.keys(partlyToggledGroupLayers).length > 0 &&
      url.searchParams.append("gl", JSON.stringify(partlyToggledGroupLayers));

    // Only add 'f' if it isn't an empty object
    Object.keys(f).length > 0 &&
      url.searchParams.append("f", JSON.stringify(f));

    // Only add 'q' if it isn't empty
    q.length > 0 && url.searchParams.append("q", q);

    // Occasionally we may want to prevent hash update, but it's off by default
    if (
      this.#app.config.mapConfig.map.enableAppStateInHash === true &&
      preventHashUpdate === false
    ) {
      // We want to update the URL with new hash value only
      // if the newly calculated hash differs from the one that
      // already exists in URL.
      const newHash = "#" + url.searchParams.toString();
      if (newHash !== window.location.hash) {
        window.location.hash = newHash;
      }
    }

    if (this.#app.config.mapConfig.map.enableAppStateInHash === true) {
      // Finalize by setting hash value by using all search params AND
      // removing all search params. I.e.: no more ?, only # in our URL.
      url.hash = url.searchParams.toString();
      url.search = "";
    }
    return url.toString();
  });
}

export default AnchorModel;
