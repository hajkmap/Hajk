import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import {Icon, Style} from 'ol/style.js';

const iconUrl = "http://giscloud.se/mapservice/assets/icons/marker.png";

var createFeature = function(coordinate) {  
  var feature = new Feature({
    geometry: new Point(coordinate),
    name: '',
    population: 4000,
    rainfall: 500,
  });
  feature.setStyle(new Style({
    image: new Icon({
      anchor: [0.5, 1],      
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1,
      src: iconUrl
    })
  }));
  return feature;
}

class CollectorModel {
  constructor(settings) {
    this.olMap = settings.map;    
    this.addMarker = this.addMarker.bind(this);
  }

  deactivate(type) {
    this.olMap.clicklock = false;
    this.olMap.un("singleclick", this.addMarker);
  }

  addMarker(evt) {
    var vectorSource = new VectorSource({
      features: [createFeature(evt.coordinate)]
    });

    var vectorLayer = new VectorLayer({
      source: vectorSource
    });

    this.olMap.addLayer(vectorLayer);  
  }

  activate(type, clicked) {          
    this.olMap.clicklock = true;
    this.olMap.on("singleclick", this.addMarker);
  }

  load(callback) {    
  }
}

export default CollectorModel;
