class AnchorModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
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
    var str = this.toParams({
      x: this.map.getView().getCenter()[0],
      y: this.map.getView().getCenter()[1],
      z: this.map.getView().getZoom(),
      l: this.getVisibleLayers()
    });
    return document.location.href + str;
  }
}

export default AnchorModel;
