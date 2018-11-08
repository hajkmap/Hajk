class DummyModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.observer = settings.observer;
  }

  getMap() {
    return this.map;
  }
}

export default DummyModel;
