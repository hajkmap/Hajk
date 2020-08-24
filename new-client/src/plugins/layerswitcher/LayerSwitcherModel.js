class LayerSwitcherModel {
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

  getBaseLayers() {
    return this.olMap
      .getLayers()
      .getArray()
      .filter(
        (l) =>
          l.getProperties().layerInfo &&
          l.getProperties().layerInfo.layerType === "base"
      )
      .map((l) => l.getProperties());
  }
}

export default LayerSwitcherModel;
