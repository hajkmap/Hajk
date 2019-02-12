class SimpleLayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    this.globalObserver = settings.app.globalObserver;
    this.layerMap = this.olMap
      .getLayers()
      .getArray()
      .reduce((a, b) => {
        a[b.get("name")] = b;
        return a;
      }, {});
  }

  clear() {
    this.clearing = true;
    this.olMap
      .getLayers()
      .getArray()
      .forEach(layer => {
        if (
          layer.getProperties &&
          layer.getProperties().layerInfo &&
          layer.getProperties().layerInfo.layerType === "layer"
        ) {
          if (layer.layerType === "group") {
            this.observer.emit("hideLayer", layer);
          } else {
            layer.setVisible(false);
          }
        }
      });
    setTimeout(() => {
      this.clearing = false;
    }, 100);
  }
}

export default SimpleLayerSwitcherModel;
