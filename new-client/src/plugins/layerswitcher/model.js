class LayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    var layerCollection = this.olMap.getLayers();
    layerCollection.on("add", layer => {
      this.observer.publish("layerAdded", layer.element);
    });

    console.log("Layer switcher", settings.app);
  }
}

export default LayerSwitcherModel;
