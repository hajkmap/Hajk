class LayerSwitcherModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
    this.layerMap = settings.app.layers;
  }
}

export default LayerSwitcherModel;
