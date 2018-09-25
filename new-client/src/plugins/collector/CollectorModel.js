import {WFS, GML} from 'ol/format';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';

class CollectorModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.url = settings.options.url;
    this.featureType = settings.options.featureType;
  }

  /**
   * Save changes.
   * Send WFS-transactional request.
   * @param {object} props
   * @param function success | (text)
   * @param function error | (text)
   */
  save(props, success, error) {

    const coord = this.olMap.getView().getCenter();

    const wfs = new WFS();
    const gml = new GML({
      featureNS: this.url,
      featureType: this.featureType,
      srsName: this.olMap.getView().getProjection().getCode()
    });

    const f = new Feature({
      text: props.comment,
      visible: props.displayPlace
    });
    if (!props.generic) {
      f.setGeometryName("geom");
      f.setGeometry(new Point(coord));
    }

    const inserts = [f];
    const node = wfs.writeTransaction(inserts, null, null, gml);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      method: 'POST',
      headers:{
        'Content-Type': 'text/xml'
      },
      body: xmlString
    };

    fetch(this.url, request)
      .then(reponse => {
        reponse
          .text()
          .then(t => {
            var mapLayer = this.olMap
              .getLayers()
              .getArray()
              .find(layer =>
                layer.getProperties &&
                layer.getProperties().featureType === this.featureType
              );
            if (mapLayer) {
              mapLayer.getSource().clear();
            }
            success(wfs.readTransactionResponse(t));
          });
      })
      .catch(err => {
        error(err);
      });
  }
}

export default CollectorModel;
