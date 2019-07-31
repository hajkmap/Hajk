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
}

export default SimpleLayerSwitcherModel;
