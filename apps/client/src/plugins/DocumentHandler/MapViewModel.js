export default class MapViewModel {
  constructor(settings) {
    this.appModel = settings.appModel;
    this.localObserver = settings.localObserver;
    this.globalObserver = settings.globalObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  convertMapSettingsUrlToOlSettings = (inputUrl) => {
    try {
      const params = new URLSearchParams(inputUrl);
      let center;
      if (!params.has("x") || !params.has("y")) {
        center = this.map.getView().getCenter();
      } else {
        center = [params.get("x"), params.get("y")];
      }
      return {
        center: center,
        zoom: params.get("z") || this.map.getView().getZoom(),
        layers: params.get("l"), // Allow 'null', we handle it later
        groupLayers: params.get("gl") || "{}", // Default to an empty stringified JSON object
      };
    } catch (error) {
      console.error(error);
      // In case parsing the params failed, let's ensure we have
      // a valid return object:
      return {
        center: this.map.getView().getCenter(),
        zoom: this.map.getView().getZoom(),
        layers: null,
        groupLayers: "{}", // Default to an empty stringified JSON object
      };
    }
  };

  showPluginsFromUrlParams = (url) => {
    try {
      //We check for plugin parameters in url
      const params = new Set(
        new URLSearchParams(url.replaceAll("#", ""))
          .getAll("p")
          .flatMap((p) => p.split(","))
      );
      // Open matching windows
      this.appModel.windows
        .filter((w) => params.has(w.type))
        .forEach((w) => w.showWindow());

      // Close windows that are not in params, except "documentviewer"
      this.appModel.windows
        .filter((w) => !params.has(w.type) && w.type !== "documentviewer")
        .forEach((w) => w.closeWindow());
    } catch (error) {
      console.error("Error processing window parameters:", error);
    }
  };

  updateUrl = (url) => {
    try {
      const params = new URLSearchParams(url.replaceAll("#", "&"));
      const pluginParams = params
        .getAll("p")
        .flatMap((p) => p.split(","))
        .filter(Boolean)
        .join(",");

      if (pluginParams) {
        params.set("p", pluginParams);
      }

      const newHash = "#" + params.toString();
      if (newHash !== window.location.hash) {
        window.location.hash = newHash;
      }
    } catch (error) {
      console.error("Error updating URL:", error);
    }
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", (url) => {
      this.globalObserver.publish("core.minimizeWindow");
      const mapSettings = this.convertMapSettingsUrlToOlSettings(url);

      if (this.appModel.config.mapConfig.map.enableAppStateInHash === true) {
        this.updateUrl(url);
      } else {
        this.showPluginsFromUrlParams(url);
      }

      if (mapSettings.layers !== null) {
        // Let's use Hajk's generic layer visibility
        // mechanism as exposed in AppModel
        this.appModel.setLayerVisibilityFromParams(
          mapSettings.layers,
          mapSettings.groupLayers
        );
      }

      // Let's ensure we end up in the correct location, even
      // if no layer's visibility was changed
      this.flyTo(this.map.getView(), mapSettings.center, mapSettings.zoom);
    });
  };

  flyTo(view, center = [], zoom) {
    view.animate({
      center: center.map((coord) => coord * 1.0),
      zoom: zoom,
      duration: 1500,
    });
    this.localObserver.publish("map-animation-complete");
  }
}
