class DummyModel {
  constructor(settings) {
    this.olMap = settings.map;
  }

  getMap() {
    return this.olMap;
  }
}

export default DummyModel;
