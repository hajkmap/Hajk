import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { IconMarker } from "../Fir/FirIcons";
import { Fill, Stroke, Style, Circle, Icon } from "ol/style";
import Feature from "ol/Feature.js";
import HajkTransformer from "../../utils/HajkTransformer";
import { Point } from "ol/geom.js";
import FirStyles from "../Fir/FirStyles";

class KirLayerController {
  #HT;

  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
    this.bufferValue = 0;
    this.removeIsActive = false;
    this.ctrlKeyIsDown = false;

    this.#HT = new HajkTransformer({
      projection: this.model.app.map.getView().getProjection().getCode(),
    });

    this.styles = new FirStyles(this.model);
    this.initLayers();
    this.initListeners();
  }

  initLayers() {
    this.model.layers.buffer = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "KIRBufferLayer",
      name: "KIRBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "KIRDrawLayer",
      name: "KIRDrawLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw.getSource().on("addfeature", (e) => {
      e.feature.set("kir_type", "draw");
      e.feature.setStyle(null); // use default style for now
      this.bufferFeatures(this.bufferValue);
    });

    this.model.layers.features = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "KIRFeatures",
      name: "KIRFeatures",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.marker = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "KIRMarker",
      name: "KIRMarker",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.map.addLayer(this.model.layers.buffer);
    this.model.map.addLayer(this.model.layers.draw);
    this.model.map.addLayer(this.model.layers.features);
    this.model.map.addLayer(this.model.layers.marker);

    this.addMarker();
  }

  initListeners() {
    this.observer.subscribe("kir.search.results.mark", this.mark);

    this.observer.subscribe("kir.search.clear", this.handleClearSearch);
    this.observer.subscribe(
      "kir.search.results.delete",
      this.handleRemoveFeature
    );

    this.observer.subscribe("kir.layers.showSearchArea", (data) => {
      this.model.layers.draw.setVisible(data.value);
      this.model.layers.buffer.setVisible(data.value);
    });

    this.observer.subscribe("kir.layers.bufferValueChanged", (data) => {
      clearTimeout(this.bufferValueChanged_tm);
      this.bufferValueChanged_tm = setTimeout(() => {
        // throttle buffer updates, why punish the gpu.
        this.bufferValue = data.value;
        this.bufferFeatures();
      }, 1000);
    });

    this.model.map.on("singleclick", this.handleFeatureClicks);

    this.observer.subscribe("kir.zoomToFeature", (feature) => {
      this.zoomToFeature(feature);
    });
  }

  getLayer(name) {
    return this.model.layers[name];
  }

  mark = (data) => {
    if (data.open) {
      const point = new Point(data.feature.getGeometry().getCoordinates());
      this.markerFeature.setGeometry(point);
      this.markerFeatureBg.setGeometry(point);
    }
    this.model.layers.marker.setVisible(data.open);
  };

  addMarker = () => {
    this.markerFeature = new Feature({ geometry: new Point([0, 0]) });
    const styleMarker = new Style({
      zIndex: 1,
      image: new Icon({
        anchor: [0.5, 1.18],
        scale: 0.15,
        src: IconMarker(this.styles.getColor("highlightStroke")),
      }),
    });
    this.markerFeature.setStyle(styleMarker);

    this.markerFeatureBg = new Feature({ geometry: new Point([0, 0]) });
    const styleMarkerBg = new Style({
      zIndex: 0,
      image: new Circle({
        fill: new Fill({
          color: "rgba(255,255,0,0.0)",
        }),
        stroke: new Stroke({
          color: "rgba(0,255,0,0.3)",
          width: 10,
        }),
        radius: 10,
      }),
    });

    this.markerFeatureBg.setStyle(styleMarkerBg);

    this.model.layers.marker.getSource().addFeature(this.markerFeatureBg);
    this.model.layers.marker.getSource().addFeature(this.markerFeature);
    this.model.layers.marker.setVisible(false);
  };

  addFeatures = (arr, options = { zoomToLayer: true }) => {
    if (!arr) {
      return;
    }

    arr.forEach((feature) => {
      feature.setStyle(this.styles.getPointStyle());
      feature.set("kir_type", "feature");
    });

    this.model.layers.features.getSource().addFeatures(arr);
    if (options.zoomToLayer) {
      this.zoomToLayer(this.model.layers.features);
    }

    // Force rendering of buffer to next tick to prevent gui freeze.
    // buffer is throttled for good reasons.
    clearTimeout(this.renderDelay_tm);
    this.renderDelay_tm = setTimeout(() => {
      this.bufferFeatures(options);
    }, 250);
  };

  removeFeature = (feature) => {
    this.handleRemoveFeature(feature.ol_uid);
    this.observer.publish("kir.search.remove", feature);
  };

  clearBeforeSearch = () => {
    this.model.layers.features.getSource().clear();
    this.model.layers.marker.setVisible(false);
  };

  handleFeatureClicks = (e) => {
    if (this.model.windowIsVisible !== true) {
      return;
    }
    let featureFound = null;
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!featureFound && layer === this.model.layers.features && feature) {
        featureFound = feature;
      }
    });

    if (featureFound) {
      this.mark({ open: true, feature: featureFound });
      this.observer.publish("kir.search.feature.selected", featureFound);
    } else {
      this.mark({ open: false, feature: featureFound });
    }
  };

  handleRemoveFeature = (uid) => {
    const feature = this.model.layers.features.getSource().getFeatureByUid(uid);
    if (feature) {
      this.model.layers.features.getSource().removeFeature(feature);
    }
  };

  handleClearSearch = (data) => {
    this.clearBeforeSearch();
    this.model.layers.draw.getSource().clear();
    this.model.layers.buffer.getSource().clear();
  };

  bufferFeatures = (options) => {
    if (!this.bufferValue) {
      this.getLayer("buffer").getSource().clear();
      return;
    }

    let drawFeatures = this.getLayer("draw").getSource().getFeatures();

    if (drawFeatures.length > 0) {
      this.getLayer("buffer").getSource().clear();
    }

    let _bufferFeatures = [];

    drawFeatures.forEach((feature) => {
      let bufferFeature = this.#HT.getBuffered(feature, this.bufferValue);

      bufferFeature.set("owner_ol_uid", feature.ol_uid);
      bufferFeature.set("kir_type", "buffer");

      _bufferFeatures.push(bufferFeature);
    });

    const targetSource = this.getLayer("buffer").getSource();
    targetSource.addFeatures(_bufferFeatures);
  };

  #getZoomOptions = () => {
    return {
      maxZoom: this.model.app.config.mapConfig.map.maxZoom - 2,
      padding: [20, 20, 20, 20],
    };
  };

  zoomToFeature = (feature) => {
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(() => {
      this.#zoomToFeature(feature);
    }, 500);
  };

  #zoomToFeature = (feature) => {
    if (!feature) {
      return;
    }

    const extent = feature.getGeometry().getExtent();
    this.model.map.getView().fit(extent, this.#getZoomOptions());
  };

  zoomToLayer = (layer) => {
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(() => {
      this.#zoomToLayer(layer);
    }, 500);
  };

  #zoomToLayer = (layer) => {
    const source = layer.getSource();
    if (source.getFeatures().length <= 0) {
      return;
    }

    const extent = source.getExtent();
    this.model.map.getView().fit(extent, this.#getZoomOptions());
  };
}

export default KirLayerController;
