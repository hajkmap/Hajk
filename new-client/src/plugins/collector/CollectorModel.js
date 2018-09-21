import WFS from 'ol/format/WFS';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';

class CollectorModel {
  constructor(settings) {
    this.olMap = settings.map;
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

    var request = new Request({
      url: this.url,
      method: 'post',
      data: node
    });

    fetch(request).then(data => {
      console.log(data);
    });

  }
}

export default CollectorModel;
