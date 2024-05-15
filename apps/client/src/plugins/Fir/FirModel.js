export default class FirModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.config = this.app.plugins.fir.options;
    this.config.srsName = this.map.getView().getProjection().getCode();

    this.layers = {
      feature: null,
      highlight: null,
      buffer: null,
      draw: null,
      label: null,
      marker: null,
      wmsRealEstate: null,
    };

    this.searchTypes = this.config.wfsLayers;
    this.baseSearchType = this.config.wfsRealEstateLayer;
  }

  getWfsById = (id) => {
    return this.config.wfsLayers.find((layer) => layer.id === id);
  };

  getMap() {
    return this.map;
  }
}
