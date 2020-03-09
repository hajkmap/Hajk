export default class MapViewModel {
  constructor(settings) {
    console.log(settings, "settings");
    this.localObserver = settings.localObserver;
    this.globalObserver = settings.globalObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  convertMapSettingsUrlToOlSettings = inputUrl => {
    let url = inputUrl.toLowerCase();
    if (url.includes("x=") && url.includes("y=") && url.includes("z=")) {
      let url = inputUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      let l = url[4]?.substring(2);
      let center = [x, y];
      let zoom = z;

      return {
        center: center,
        zoom: zoom,
        layers: l
      };
    }
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", url => {
      this.displayMap(this.convertMapSettingsUrlToOlSettings(url));
    });
  };

  displayMap(mapSettings) {
    var visibleLayers = mapSettings.layers.split(",");
    const layers = this.map.getLayers().getArray();

    visibleLayers.forEach(arrays =>
      layers
        .filter(
          layer =>
            layer.getProperties()["layerInfo"] &&
            layer.getProperties()["layerInfo"]["layerType"] !== "base"
        )
        .forEach(layer => {
          if (layer.getProperties()["name"] === arrays) {
            debugger;
            this.globalObserver.publish("showLayer", layer);
            layer.setVisible(true);
          }
          if (
            visibleLayers.some(
              arrays => arrays === layer.getProperties()["name"]
            )
          ) {
            if (layer.layerType === "group") {
              this.globalObserver.publish("showLayer", layer);
            } else {
              layer.setVisible(true);
            }
          } else {
            if (layer.layerType === "group") {
              this.globalObserver.publish("hideLayer", layer);
            } else {
              layer.setVisible(false);
            }
          }
        })
    );
    console.log(mapSettings, "mapSettings");
    this.flyTo(this.map.getView(), mapSettings.center, mapSettings.zoom);
  }

  flyTo(view, location, zoom) {
    const duration = 1500;
    view.animate({
      center: location,
      zoom: zoom,
      duration: duration
    });
  }
}
