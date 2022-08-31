export default class DummyModel {
  #map;
  #app;
  #localObserver;

  constructor(settings) {
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;

    this.#initSubscriptions();
  }

  #initSubscriptions = () => {
    this.#localObserver.subscribe("dummyEvent", this.#handleDummyEvent);
  };

  #handleDummyEvent = (message = "") => {
    console.log(`Dummy-event caught in model! Message: ${message}`);
  };

  getMap = () => {
    return this.#map;
  };

  getApp = () => {
    return this.#app;
  };
}
