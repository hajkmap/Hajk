export default class FirModel {
  constructor(settings) {
    this.state = {
      searchResults: [],
      modifiedSearchResults: [],
    };

    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;

    this.layers = {
      feature: null,
      highlight: null,
      buffer: null,
      draw: null,
      hiddenBuffer: null,
    };
  }

  getMap() {
    return this.map;
  }
}
