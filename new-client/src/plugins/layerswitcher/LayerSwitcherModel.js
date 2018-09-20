class LayerSwitcherModel {
  constructor(settings) {
    this.observer = settings.observer;
    this.layerMap = settings.map
      .getLayers()
      .getArray()
      .reduce((a, b) => {
        a[b.get("name")] = b;
        return a;
      }, {});
  }
}

export default LayerSwitcherModel;
