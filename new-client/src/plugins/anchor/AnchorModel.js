class AnchorModel {
  constructor(settings) {
    this.app = settings.app;
    this.getCleanUrl = settings.getCleanUrl;
    this.cqlFilters = {};
    this.map = settings.map;
    this.localObserver = settings.localObserver;
    const update = e => {
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
        // Grab an unique ID for each layer, we'll need this to save CQL filter value for each layer
        const layerId = layer.get("name");
        layer.on("change:visible", event => {
          this.localObserver.publish("mapUpdated", this.getAnchor());
        });
        layer.getSource().on("change", ({ target }) => {
          if (
            target.constructor.name !== "ImageWMS" &&
            target.constructor.name !== "TiledWMS"
          )
            return;
          const cqlFilterForCurrentLayer = target.getParams()?.CQL_FILTER;
          this.cqlFilters[layerId] = cqlFilterForCurrentLayer;
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
          !Number.isNaN(parseInt(layer.getProperties().name))
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
      f: encodeURIComponent(JSON.stringify(this.cqlFilters)),
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
