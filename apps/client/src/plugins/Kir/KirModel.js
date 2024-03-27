export default class KirModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.config = this.app.plugins.kir.options;
    this.config.srsName = this.map.getView().getProjection().getCode();

    this.layers = {
      buffer: null,
      draw: null,
      marker: null,
      features: null,
    };
  }

  getWfsById = (id) => {
    return this.config.wfsLayers.find((layer) => layer.id === id);
  };

  getMap() {
    return this.map;
  }
}
