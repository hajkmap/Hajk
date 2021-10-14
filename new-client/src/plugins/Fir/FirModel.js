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
    };

    this.initSearchTypes();
  }

  initSearchTypes = () => {
    this.searchTypes = [];

    this.config.wfsLayers.forEach((layerRef) => {
      const wfs = this.app.plugins.search.options.sources.find(
        (_layer) => _layer.id === layerRef.id
      );
      if (wfs) {
        wfs.idField = layerRef.idField;
        wfs.areaField = layerRef.areaField;
        this.searchTypes.push(wfs);
      }
    });
  };

  getSearchTypeById = (id) => {
    return this.searchTypes.find((wfs) => wfs.id === id);
  };

  getMap() {
    return this.map;
  }
}
