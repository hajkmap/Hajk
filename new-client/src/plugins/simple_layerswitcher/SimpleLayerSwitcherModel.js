class SimpleLayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    this.layerMap = this.olMap
      .getLayers()
      .getArray()
      .reduce((a, b) => {
        a[b.get("name")] = b;
        return a;
      }, {});
  }

  clear() {
    this.olMap
      .getLayers()
      .getArray()
      .forEach(layer => {
        if (
          layer.getProperties &&
          layer.getProperties().layerInfo &&
          layer.getProperties().layerInfo.layerType === "layer"
        ) {
          layer.setVisible(false);
        }
      });
  }
}

export default SimpleLayerSwitcherModel;
