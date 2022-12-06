export default class Measure2Model {
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
