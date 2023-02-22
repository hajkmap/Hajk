export default class MeasurerModel {
  #map;
  #app;
  #localObserver;

  constructor(settings) {
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
  }

  getMap = () => {
    return this.#map;
  };

  getApp = () => {
    return this.#app;
  };
}
