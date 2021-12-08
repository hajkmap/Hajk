export default class KirModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.config = this.app.plugins.kir.options;
    this.config.srsName = this.map.getView().getProjection().getCode();
  }

  getMap() {
    return this.map;
  }
}
