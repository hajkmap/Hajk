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

    this.searchTypes = [];
    this.baseSearchType = {};

    this.initSearchTypes();
  }

  initSearchTypes = () => {
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

    const wfsRef = this.app.plugins.fir.options.wfsRealEstateLayer;

    this.baseSearchType = this.app.plugins.search.options.sources.find(
      (_layer) => _layer.id === wfsRef.id
    );
    if (this.baseSearchType) {
      this.baseSearchType.areaField = wfsRef.areaField;
      this.baseSearchType.idField = wfsRef.idField;
      this.baseSearchType.labelField = wfsRef.labelField;
      this.baseSearchType.maxFeatures = wfsRef.maxFeatures;
    }
    // TODO: Add warning if not configured.
  };

  getSearchTypeById = (id) => {
    return this.searchTypes.find((wfs) => wfs.id === id);
  };

  getMap() {
    return this.map;
  }
}
