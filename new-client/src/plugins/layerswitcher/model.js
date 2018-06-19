class LayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    var layerCollection = this.olMap.getLayers();
    layerCollection.on("add", layer => {
      console.log("Add layer");
    });
  }
}

export default LayerSwitcherModel;
