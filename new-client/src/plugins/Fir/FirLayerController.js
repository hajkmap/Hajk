import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

import {
  Fill,
  Stroke,
  Circle,
  Style,
  Icon,
  Circle as CircleStyle,
} from "ol/style";
import Feature from "ol/Feature.js";
import LinearRing from "ol/geom/LinearRing.js";
import {
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
} from "ol/geom.js";
import styles from "./FirStyles";
import * as jsts from "jsts";

class FirLayerController {
  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
    this.bufferValue = 0;
    this.initLayers();
    this.initListeners();

    this.setStyle1();
    this.setStyle2();
  }

  setStyle1() {
    var fill = new Fill({
      color: "rgba(255,255,255,0.4)",
    });
    var stroke = new Stroke({
      color: "#3399CC",
      width: 1.25 * 2,
    });
    this.styleOff = [
      new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
        fill: fill,
        stroke: stroke,
      }),
    ];
  }

  setStyle2() {
    var fill = new Fill({
      color: "rgba(255,255,255,0.4)",
    });
    var stroke = new Stroke({
      color: "red",
      width: 1.25 * 4,
    });
    this.styleOn = [
      new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
        fill: fill,
        stroke: stroke,
      }),
    ];
  }

  initLayers() {
    this.model.layers.feature = new VectorLayer({
      caption: "FIRSearchResultsLayer",
      name: "FIRSearchResultsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.highlight = new VectorLayer({
      caption: "FIRHighlightsLayer",
      name: "FIRHighlightsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      //style: this.getHighlightStyle(),
      // zIndex: 100,
    });

    this.model.layers.buffer = new VectorLayer({
      caption: "FIRBufferLayer",
      name: "FIRBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      // style: this.getFirBufferFeatureStyle(),
    });

    this.model.layers.draw = new VectorLayer({
      caption: "FIRDrawLayer",
      name: "FIRDrawLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      // style: this.getFirBufferFeatureStyle(),
    });

    this.model.layers.draw.getSource().on("addfeature", (e) => {
      e.feature.set("fir_type", "draw");
      this.bufferFeatures(this.bufferValue);
    });

    this.model.layers.hiddenBuffer = new VectorLayer({
      caption: "FIRHiddenSearchResultBufferLayer",
      name: "FIRHiddenSearchResultBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: false,
      // style: this.getFirBufferHiddenFeatureStyle(),
    });

    this.model.layers.label = new VectorLayer({
      caption: "FIRLabels",
      name: "FIRLabels",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      // style: this.getFirBufferHiddenFeatureStyle(),
    });

    this.model.layers.marker = new VectorLayer({
      caption: "FIRMarker",
      name: "FIRMarker",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.map.addLayer(this.model.layers.feature);
    this.model.map.addLayer(this.model.layers.highlight);
    this.model.map.addLayer(this.model.layers.buffer);
    this.model.map.addLayer(this.model.layers.draw);
    this.model.map.addLayer(this.model.layers.hiddenBuffer);
    this.model.map.addLayer(this.model.layers.label);
    this.model.map.addLayer(this.model.layers.marker);

    this.addMarker();
  }

  getLayer(name) {
    return this.model.layers[name];
  }

  initListeners() {
    this.observer.subscribe("fir.search.clear", this.handleClearSearch);
    this.observer.subscribe(
      "fir.search.results.delete",
      this.handleRemoveFeature
    );
    this.observer.subscribe(
      "fir.search.results.highlight",
      this.handleHighlight
    );
    this.observer.subscribe("fir.layers.showSearchArea", (data) => {
      this.model.layers.draw.setVisible(data.value);
      this.model.layers.buffer.setVisible(data.value);
    });
    this.observer.subscribe("fir.layers.showDesignation", (data) => {
      this.model.layers.label.setVisible(data.value);
    });

    let bufferValueChanged_tm = null;

    this.observer.subscribe("fir.layers.bufferValueChanged", (data) => {
      clearTimeout(bufferValueChanged_tm);
      bufferValueChanged_tm = setTimeout(() => {
        // throttle buffer updates
        this.bufferValue = data.value;
        this.bufferFeatures();
      }, 1000);
    });

    this.model.map.on("singleclick", this.handleFeatureClicks);
  }

  addMarker = () => {
    this.markerFeature = new Feature({ geometry: new Point([0, 0]) });
    const styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1.15],
        scale: 0.15,
        src: "marker.png",
      }),
    });
    this.markerFeature.setStyle(styleMarker);
    this.model.layers.marker.getSource().addFeature(this.markerFeature);
    this.model.layers.marker.setVisible(false);
  };

  addFeatures = (arr) => {
    if (!arr) {
      return;
    }
    this.model.layers.feature.getSource().addFeatures(arr);
    this.zoomToLayer(this.model.layers.feature);

    clearTimeout(this.renderDelay_tm);
    this.renderDelay_tm = setTimeout(() => {
      // Force rendering of buffer and label to next tick to enhance speed and prevent gui freeze.
      this.bufferFeatures();
      this.addFeatureLabels(arr);
    }, 250);
  };

  addFeatureLabels = (featureArr) => {
    let arr = [];

    featureArr.forEach((feature) => {
      let c = feature.clone();
      c.setStyle(styles.getLabelStyle(feature));
      arr.push(c);
    });
    this.model.layers.label.getSource().addFeatures(arr);
  };

  clearBeforeSearch = () => {
    this.model.layers.feature.getSource().clear();
    this.model.layers.buffer.getSource().clear();
    this.model.layers.highlight.getSource().clear();
    this.model.layers.label.getSource().clear();
    this.model.layers.marker.setVisible(false);
  };

  toggleHighlight = (feature) => {
    let f = this.model.layers.highlight
      .getSource()
      .getFeatureByUid(feature.ol_uid);
    this.model.layers.highlight.getSource().clear();
    this.model.layers.marker.setVisible(false);
    if (f) {
      this.observer.publish("fir.search.feature.deselected", f);
    } else {
      this.model.layers.highlight.getSource().addFeature(feature);
      this.observer.publish("fir.search.feature.selected", feature);
      this.markerFeature.setGeometry(
        new Point(feature.getGeometry().getInteriorPoint().getCoordinates())
      );
      this.model.layers.marker.setVisible(true);
    }
  };

  handleFeatureClicks = (e) => {
    let first = true;
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (first === true && layer === this.model.layers.feature && feature) {
        this.toggleHighlight(feature);
        first = false;
      }
    });
    if (first === true) {
      this.model.layers.marker.setVisible(false);
    }
  };

  handleHighlight = (data) => {
    this.model.layers.highlight.getSource().clear();
    if (data.feature && data.highlight === true) {
      this.toggleHighlight(data.feature);
    } else {
      this.model.layers.marker.setVisible(false);
    }
  };

  handleRemoveFeature = (uid) => {
    let feature = this.model.layers.feature.getSource().getFeatureByUid(uid);

    if (feature) {
      this.model.layers.feature.getSource().removeFeature(feature);
    }
  };

  handleClearSearch = (data) => {
    this.clearBeforeSearch();
    this.model.layers.draw.getSource().clear();
  };

  bufferFeatures = () => {
    const parser = new jsts.io.OL3Parser();
    parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon
    );

    this.getLayer("buffer").getSource().clear();

    if (this.bufferValue === 0) {
      return;
    }

    let _bufferFeatures = [];

    this.getLayer("draw")
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        let olGeom = feature.getGeometry();
        if (olGeom instanceof Circle) {
          olGeom = Polygon.fromCircle(olGeom, 0b10000000);
        }
        const jstsGeom = parser.read(olGeom);
        const bufferedGeom = jstsGeom.buffer(this.bufferValue);
        // bufferedGeom.union(jstsGeom);

        let bufferFeature = new Feature({
          geometry: parser.write(bufferedGeom),
        });
        bufferFeature.set("owner_ol_uid", feature.ol_uid);
        bufferFeature.set("fir_type", "buffer");

        _bufferFeatures.push(bufferFeature);
      });

    const targetSource = this.getLayer("buffer").getSource();
    targetSource.addFeatures(_bufferFeatures);
  };

  zoomToLayer = (layer) => {
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(() => {
      this._zoomToLayer(layer);
    }, 500);
  };

  _zoomToLayer = (layer) => {
    const source = layer.getSource();
    if (source.getFeatures().length <= 0) {
      return;
    }

    const extent = source.getExtent();
    const options = {
      maxZoom: this.model.app.config.mapConfig.map.maxZoom - 1,
      padding: [20, 20, 20, 20],
    };
    this.model.map.getView().fit(extent, options);
  };
}

export default FirLayerController;
