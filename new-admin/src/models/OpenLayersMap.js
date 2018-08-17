import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';

class OpenLayersMap {
  
  constructor(settings) {
    settings.config  = settings.config || {
      center: [0, 0],
      zoom: 0
    };
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      target: settings.target,
      view: new View({
        center: settings.config.center,
        zoom: settings.config.zoom
      })
    });
    this.onUpdate = settings.onUpdate;    
    this.onUpdate(this.getState());
    this.bindEvents();
  }
  
  bindEvents() {
    this.map.getView().on('change:center', () => {
      this.onUpdate(this.getState());
    });
  }

  getState() {
    return {
      center: this.map.getView().getCenter(),
      zoom: Math.round(this.map.getView().getZoom()),
      layers: ["1", "2", "3"]
    }
  }

  getMap() {
    return this.map;
  }

}

export default OpenLayersMap;