export default class MapViewModel {
  constructor(settings) {
    this.localObserver = settings.localObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", this.flyTo);
  };

  flyTo = ({ center, zoom }) => {
    const duration = 1500;
    this.map.getView().animate({
      zoom: zoom,
      center: center,
      duration: duration
    });
  };
}
