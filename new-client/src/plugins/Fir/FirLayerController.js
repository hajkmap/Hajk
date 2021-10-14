import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

import { Circle, Style, Icon } from "ol/style";
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
import { hfetch } from "utils/FetchWrapper";
import { GeoJSON } from "ol/format";
import * as jsts from "jsts";

class FirLayerController {
  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
    this.bufferValue = 0;
    this.removeIsActive = false;
    this.initLayers();
    this.initListeners();
  }

  initLayers() {
    const searchLayerId = "" + this.model.config.wmsRealEstateLayer.id;

    this.model.layers.realestateSearchLayer = this.model.map
      .getLayers()
      .getArray()
      .find((layer) => layer.get("name") === searchLayerId);

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
    });

    this.model.layers.buffer = new VectorLayer({
      caption: "FIRBufferLayer",
      name: "FIRBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw = new VectorLayer({
      caption: "FIRDrawLayer",
      name: "FIRDrawLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw.getSource().on("addfeature", (e) => {
      e.feature.set("fir_type", "draw");
      this.bufferFeatures(this.bufferValue);
    });

    this.model.layers.label = new VectorLayer({
      caption: "FIRLabels",
      name: "FIRLabels",
      source: new VectorSource(),
      queryable: false,
      visible: true,
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

    this.observer.subscribe("fir.layers.bufferValueChanged", (data) => {
      clearTimeout(this.bufferValueChanged_tm);
      this.bufferValueChanged_tm = setTimeout(() => {
        // throttle buffer updates, why punish the gpu.
        this.bufferValue = data.value;
        this.bufferFeatures();
      }, 1000);
    });

    this.model.map.on("singleclick", this.handleFeatureClicks);

    this.observer.subscribe(
      "fir.search.results.addFeatureByMapClick",
      (data) => {
        this.clickLock(data.active);
        this.model.layers.realestateSearchLayer.setVisible(data.active);
        this.removeIsActive = false;
      }
    );
    this.observer.subscribe(
      "fir.search.results.removeFeatureByMapClick",
      (data) => {
        this.clickLock(data.active);
        this.removeIsActive = data.active;
      }
    );
    this.observer.subscribe("fir.zoomToFeature", (feature) => {
      this.zoomToFeature(feature);
    });
  }

  clickLock(bLock) {
    this.model.map.clickLock[bLock === true ? "add" : "delete"](
      "fir-addremove-feature"
    );
  }

  addMarker = () => {
    this.markerFeature = new Feature({ geometry: new Point([0, 0]) });
    const styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1.18],
        scale: 0.15,
        src: "marker.svg",
      }),
    });
    this.markerFeature.setStyle(styleMarker);
    this.model.layers.marker.getSource().addFeature(this.markerFeature);
    this.model.layers.marker.setVisible(false);
  };

  addFeatures = (arr, options = { zoomToLayer: true }) => {
    if (!arr) {
      return;
    }

    arr.forEach((feature) => {
      feature.setStyle(styles.getResultStyle());
    });

    this.model.layers.feature.getSource().addFeatures(arr);
    if (options.zoomToLayer) {
      this.zoomToLayer(this.model.layers.feature);
    }

    clearTimeout(this.renderDelay_tm);
    this.renderDelay_tm = setTimeout(() => {
      // Force rendering of buffer and label to next tick to prevent gui freeze.
      this.bufferFeatures(options);
      this.addFeatureLabels(arr);
    }, 250);
  };

  removeFeature = (feature) => {
    this.handleRemoveFeature(feature.ol_uid);
    this.observer.publish("fir.search.remove", feature);
  };

  addFeatureLabels = (featureArr) => {
    let arr = [];

    featureArr.forEach((feature) => {
      let c = feature.clone();
      c.setStyle(styles.getLabelStyle(feature));
      c.set("owner_ol_uid", feature.ol_uid);
      arr.push(c);
    });
    this.model.layers.label.getSource().addFeatures(arr);
  };

  clearBeforeSearch = (options = { keepNeighborBuffer: false }) => {
    this.model.layers.feature.getSource().clear();
    this.model.layers.highlight.getSource().clear();
    this.model.layers.label.getSource().clear();
    this.model.layers.marker.setVisible(false);

    if (options.keepNeighborBuffer === false) {
      const source = this.model.layers.buffer.getSource();
      const featuresToRemove = source
        .getFeatures()
        .filter((f) => f.get("fir_origin") === "neighbor");
      featuresToRemove.forEach((f) => {
        source.removeFeature(f);
      });
    }
  };

  toggleHighlight = (feature) => {
    let f = this.model.layers.highlight
      .getSource()
      .getFeatures()
      .find((a) => feature.ol_uid === a.get("owner_ol_uid"));

    this.model.layers.highlight.getSource().clear();
    this.model.layers.marker.setVisible(false);
    if (f) {
      this.observer.publish("fir.search.feature.deselected", feature);
    } else {
      let clone = feature.clone();
      clone.setStyle(styles.getHighlightStyle());
      clone.set("owner_ol_uid", feature.ol_uid);
      this.model.layers.highlight.getSource().addFeature(clone);
      this.observer.publish("fir.search.feature.selected", feature);
      this.markerFeature.setGeometry(
        new Point(feature.getGeometry().getInteriorPoint().getCoordinates())
      );
      this.model.layers.marker.setVisible(true);
    }
  };

  getFeaturesAtCoordinates(coordinate) {
    if (!this.model.layers.realestateSearchLayer) {
      return;
    }
    const view = this.model.map.getView();

    const url = this.model.layers.realestateSearchLayer
      .getSource()
      .getFeatureInfoUrl(
        coordinate,
        view.getResolution(),
        view.getProjection().getCode(),
        {
          INFO_FORMAT: "application/json",
        }
      );

    hfetch(url)
      .then((response) => {
        return response ? response.json() : null;
      })
      .then((data) => {
        try {
          let features = new GeoJSON().readFeatures(data);
          this.addFeatures(features, { zoomToLayer: false });
          this.observer.publish("fir.search.add", features);
        } catch (err) {
          console.warn(err);
        }
      });
  }

  handleFeatureClicks = (e) => {
    let first = true;
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (first === true && layer === this.model.layers.feature && feature) {
        if (this.removeIsActive === true) {
          this.removeFeature(feature);
        } else {
          this.toggleHighlight(feature);
        }
        first = false;
      }
    });
    if (first === true) {
      this.model.layers.marker.setVisible(false);
      // no feature was clicked, check realestate layer for features.
      if (this.model.layers.realestateSearchLayer.getVisible() === true) {
        this.getFeaturesAtCoordinates(e.coordinate);
      }
    }
    this.observer.publish("fir.search.results.addFeatureByMapClick", {
      active: false,
    });
    this.observer.publish("fir.search.results.removeFeatureByMapClick", {
      active: false,
    });
    this.removeIsActive = false;
    this.model.layers.realestateSearchLayer.setVisible(false);
    this.clickLock(false);
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
    const feature = this.model.layers.feature.getSource().getFeatureByUid(uid);
    if (feature) {
      this.model.layers.feature.getSource().removeFeature(feature);
      let labelFeature = this.model.layers.label
        .getSource()
        .getFeatures()
        .find((f) => {
          return f.get("owner_ol_uid") === feature.ol_uid;
        });
      if (labelFeature) {
        this.model.layers.label.getSource().removeFeature(labelFeature);
      }
      const highlightFeature = this.model.layers.highlight
        .getSource()
        .getFeatureByUid(uid);
      if (highlightFeature) {
        this.model.layers.highlight.getSource().removeFeature(highlightFeature);
        this.model.layers.marker.setVisible(false);
      }
    }
  };

  handleClearSearch = (data) => {
    this.clearBeforeSearch();
    this.model.layers.draw.getSource().clear();
    this.model.layers.buffer.getSource().clear();
  };

  bufferFeatures = (options) => {
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

    if (this.bufferValue === 0) {
      if (!options.keepNeighborBuffer || options.keepNeighborBuffer !== true) {
        this.getLayer("buffer").getSource().clear();
      }
      return;
    }

    let drawFeatures = this.getLayer("draw").getSource().getFeatures();

    if (drawFeatures.length > 0) {
      this.getLayer("buffer").getSource().clear();
    }

    let _bufferFeatures = [];

    drawFeatures.forEach((feature) => {
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

  _getZoomOptions = () => {
    return {
      maxZoom: this.model.app.config.mapConfig.map.maxZoom - 2,
      padding: [20, 20, 20, 20],
    };
  };

  zoomToFeature = (feature) => {
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(() => {
      this._zoomToFeature(feature);
    }, 500);
  };

  _zoomToFeature = (feature) => {
    if (!feature) {
      return;
    }

    const extent = feature.getGeometry().getExtent();
    this.model.map.getView().fit(extent, this._getZoomOptions());
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
    this.model.map.getView().fit(extent, this._getZoomOptions());
  };
}

export default FirLayerController;
