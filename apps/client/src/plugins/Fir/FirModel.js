export class FirModelBase {
  constructor(settings, pluginName, layerKeys) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.config = this.app.plugins[pluginName].options;
    this.config.srsName = this.map.getView().getProjection().getCode();

    this.layers = Object.fromEntries(layerKeys.map((key) => [key, null]));
  }

  getWfsById = (id) => {
    return this.config.wfsLayers.find((layer) => layer.id === id);
  };

  getMap() {
    return this.map;
  }
}

export default class FirModel extends FirModelBase {
  constructor(settings) {
    super(settings, "fir", [
      "feature",
      "highlight",
      "buffer",
      "draw",
      "label",
      "marker",
      "wmsRealEstate",
    ]);

    this.searchTypes = this.config.wfsLayers;
    this.baseSearchType = this.config.wfsRealEstateLayer;
  }
}
