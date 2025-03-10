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

  showPlugins = (url) => {
    try {
      // This code opens the plugin windows that are supplied via the url
      // if we have an appState in the hash, show the windows
      const params = new URLSearchParams(url.replaceAll("#", ""))
        .getAll("p")
        .flatMap((p) => p.split(","));

      const windows = this.appModel.windows;

      // and open the corresponding windows
      windows.forEach((w) => {
        if (params.includes(w.type)) {
          w.showWindow();
        }
      });
    } catch (error) {
      console.error("Error processing window parameters:", error);
    }
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", (url) => {
      this.globalObserver.publish("core.minimizeWindow");
      const mapSettings = this.convertMapSettingsUrlToOlSettings(url);
      const { enableAppStateInHash } = this.appModel.config.mapConfig.map;

      if (enableAppStateInHash) {
        this.showPlugins(url);
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

  flyTo(view, center, zoom) {
    view.animate({
      center: center,
      zoom: zoom,
      duration: 1500,
    });
    this.localObserver.publish("map-animation-complete");
  }
}
