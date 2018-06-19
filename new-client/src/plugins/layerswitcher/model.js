class LayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    var layerCollection = this.olMap.getLayers();
    layerCollection.on("add", layer => {
      this.observer.publish("layerAdded", layer.element);
    });
  }
}

export default LayerSwitcherModel;
