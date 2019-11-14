class AnchorModel {
  constructor(settings) {
    this.app = settings.app;
    this.getCleanUrl = settings.getCleanUrl;
    this.map = settings.map;
    this.localObserver = settings.localObserver;
    var update = e => {
      setTimeout(() => {
        if (!e.target.getAnimating() && !e.target.getInteracting()) {
          this.localObserver.publish("mapUpdated", this.getAnchor());
        }
      }, 0);
    };
    this.map.getView().on("change:resolution", update);
    this.map.getView().on("change:center", update);
    this.map
      .getLayers()
      .getArray()
      .forEach(layer => {
        layer.on("change:visible", layer => {
          this.localObserver.publish("mapUpdated", this.getAnchor());
        });
      });
  }

  getMap() {
    return this.map;
  }

  toParams(obj) {
    return Object.keys(obj).reduce((paramStr, key, index) => {
      const prefix = index === 0 ? "?" : "&";
      return (paramStr += `${prefix}${key}=${obj[key]}`);
    }, "");
  }

  getVisibleLayers() {
    return this.map
      .getLayers()
      .getArray()
      .filter(
        layer =>
          layer.getVisible() &&
          layer.getProperties().name &&
          !isNaN(parseInt(layer.getProperties().name))
      )
      .map(layer => layer.getProperties().name)
      .join(",");
  }

  getAnchor() {
    const str = this.toParams({
      m: this.app.config.activeMap,
      x: this.map.getView().getCenter()[0],
      y: this.map.getView().getCenter()[1],
      z: this.map.getView().getZoom(),
      l: this.getVisibleLayers(),
      clean: this.getCleanUrl()
    });

    // Split on "?" and get only the first segment. This prevents
    // multiple query string situations, such as https://www.foo.com/?a=b?c=d
    // that can happen if user enters the application using a link that already
    // contains query parameters.
    return document.location.href.split("?")[0] + str;
  }
}

export default AnchorModel;
