import WFS from 'ol/format/WFS';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import VectorSource from 'ol/source/Vector.js';
import {Circle, Style, Fill, Stroke} from 'ol/style.js';

var createFeature = function(coordinate) {
  var feature = new Feature({
    geometry: new Point(coordinate),
    name: '',
    population: 4000,
    rainfall: 500,
  });
  feature.setStyle(new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: 'black'
      }),
      stroke: new Stroke({
        color: [255, 0, 0],
        width: 2
      })
    })
  }));
  return feature;
}

class CollectorModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.vectorSource = new VectorSource({
      features: []
    });
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });
    this.olMap.addLayer(this.vectorLayer);
    this.url = settings.options.url;
    this.featureType = settings.options.featureType;
  }

  save(comment, success, error) {

    var coord = this.olMap.getView().getCenter();

    var wfs = new WFS({
      featureNS: this.url,
      featureType: this.featureType
    });

    var f = new Feature({
      text: comment,
      geometry: new Point(coord)
    });

    var inserts = [f];

    var node = wfs.writeTransaction(inserts, null, null, {
      featureNS: this.url,
      featureType: this.featureType
    });

    console.log("Write", node);

  }
}

export default CollectorModel;
