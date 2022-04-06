export default class MapViewModel {
  constructor(settings) {
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
      };
    } catch (error) {
      console.error(error);
      // In case parsing the params failed, let's ensure we have
      // a valid return object:
      return {
        center: this.map.getView().getCenter(),
        zoom: this.map.getView().getZoom(),
        layers: null,
      };
    }
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", (url) => {
      this.globalObserver.publish("core.minimizeWindow");
      const mapSettings = this.convertMapSettingsUrlToOlSettings(url);

      if (mapSettings.layers !== null) {
        const visibleLayers = mapSettings.layers.split(",");
        const { layersToShow, layersToHide } =
          this.getLayersToShowAndHide(visibleLayers);

        this.setMapLayersVisibility(layersToShow, layersToHide);
      }

      this.flyTo(this.map.getView(), mapSettings.center, mapSettings.zoom);
    });
  };

  getLayersToShowAndHide = (visibleLayers) => {
    const layersInMap = this.map.getLayers().getArray();
    return layersInMap.reduce(
      (layers, layer) => {
        if (
          layer.getProperties()["layerInfo"] &&
          layer.getProperties()["layerInfo"]["layerType"]
        ) {
          if (visibleLayers.includes(layer.getProperties()["name"])) {
            layers.layersToShow.push(layer);
          } else {
            layers.layersToHide.push(layer);
          }
        }
        return layers;
      },
      { layersToShow: [], layersToHide: [] }
    );
  };

  setMapLayersVisibility(layersToShow, layersToHide) {
    layersToShow.forEach((mapLayerToShow) => {
      if (mapLayerToShow.layerType === "group") {
        this.globalObserver.publish("layerswitcher.showLayer", mapLayerToShow);
      } else if (!mapLayerToShow.getVisible()) {
        mapLayerToShow.setVisible(true);
      }
    });

    layersToHide.forEach((mapLayerToHide) => {
      if (mapLayerToHide.layerType === "group") {
        this.globalObserver.publish("layerswitcher.hideLayer", mapLayerToHide);
      } else if (mapLayerToHide.getVisible()) {
        mapLayerToHide.setVisible(false);
      }
    });
  }

  flyTo(view, center, zoom) {
    view.animate({
      center: center,
      zoom: zoom,
      duration: 1500,
    });
    this.localObserver.publish("map-animation-complete");
  }
}
