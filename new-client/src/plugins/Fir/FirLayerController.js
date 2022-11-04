import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { IconMarker } from "./FirIcons";
import { Style, Icon } from "ol/style";
import Feature from "ol/Feature.js";
import HajkTransformer from "utils/HajkTransformer";
import { Point } from "ol/geom.js";
import FirStyles from "./FirStyles";
import { hfetch } from "utils/FetchWrapper";
import { GeoJSON } from "ol/format";

class FirLayerController {
  #HT;

  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
    this.bufferValue = 0;
    this.removeIsActive = false;
    this.ctrlKeyIsDown = false;
    this.previousFeatures = [];

    this.#HT = new HajkTransformer({
      projection: this.model.app.map.getView().getProjection().getCode(),
    });

    this.styles = new FirStyles(this.model);
    this.initLayers();
    this.initListeners();
  }

  initLayers() {
    this.model.layers.wmsRealEstate = this.model.map
      .getLayers()
      .getArray()
      .find(
        (layer) => layer.get("name") === this.model.config.wmsRealEstateLayer.id
      );

    if (!this.model.layers.wmsRealEstate) {
      console.warn(
        `FIR: wmsRealEstateLayer with id ${this.model.config.wmsRealEstateLayer.id} could not be found in map layers.`
      );
    }

    this.model.layers.feature = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRSearchResultsLayer",
      name: "FIRSearchResultsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.highlight = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRHighlightsLayer",
      name: "FIRHighlightsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.buffer = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRBufferLayer",
      name: "FIRBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRDrawLayer",
      name: "FIRDrawLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.draw.getSource().on("addfeature", (e) => {
      e.feature.set("fir_type", "draw");
      e.feature.setStyle(null); // use default style for now
      this.bufferFeatures(this.bufferValue);
    });

    this.model.layers.label = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRLabels",
      name: "FIRLabels",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.layers.marker = new VectorLayer({
      layerType: "system",
      zIndex: 5000,
      caption: "FIRMarker",
      name: "FIRMarker",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.model.map.addLayer(this.model.layers.buffer);
    this.model.map.addLayer(this.model.layers.feature);
    this.model.map.addLayer(this.model.layers.draw);
    this.model.map.addLayer(this.model.layers.highlight);
    this.model.map.addLayer(this.model.layers.label);
    this.model.map.addLayer(this.model.layers.marker);

    this.addMarker();
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
        this.model.layers.wmsRealEstate.setVisible(data.active);
        this.model.layers.wmsRealEstate.setOpacity(1.0);
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

    window.addEventListener("keydown", (e) => {
      if (e.key?.toLowerCase() === "control") {
        this.ctrlKeyIsDown = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (this.ctrlKeyIsDown && e.key?.toLowerCase() === "control") {
        this.ctrlKeyIsDown = false;
        this.handleFeatureClicksCancelled();
      }
    });
  }

  getLayer(name) {
    return this.model.layers[name];
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
        src: IconMarker(this.styles.getColor("highlightStroke")),
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

    if (options.clearPrevious === true) {
      this.previousFeatures = [];
    }

    arr.forEach((feature) => {
      if (
        this.previousFeatures.indexOf(
          feature.get(this.model.config.wmsRealEstateLayer.idField)
        ) > -1
      ) {
        feature.setStyle(this.styles.getPreviousResultStyle());
      } else {
        feature.setStyle(this.styles.getResultStyle());
      }
    });

    this.model.layers.feature.getSource().addFeatures(arr);
    if (options.zoomToLayer) {
      this.zoomToLayer(this.model.layers.feature);
    }

    // Force rendering of buffer and label to next tick to prevent gui freeze.
    // buffer is throttled for good reasons.
    clearTimeout(this.renderDelay_tm);
    this.renderDelay_tm = setTimeout(() => {
      this.bufferFeatures(options);
    }, 250);

    setTimeout(() => {
      this.addFeatureLabels(arr);
    }, 50);
  };

  removeFeature = (feature) => {
    this.handleRemoveFeature(feature.ol_uid);
    this.observer.publish("fir.search.remove", feature);
  };

  addFeatureLabels = (featureArr) => {
    let arr = [];

    featureArr.forEach((feature) => {
      let c = feature.clone();
      c.setStyle(this.styles.getLabelStyle(feature));
      c.set("owner_ol_uid", feature.ol_uid);
      arr.push(c);
    });
    this.model.layers.label.getSource().addFeatures(arr);
  };

  clearBeforeSearch = (options = { keepNeighborBuffer: false }, a) => {
    let previousFeatures = [];

    if (options.keepNeighborBuffer === true) {
      this.model.layers.feature
        .getSource()
        .getFeatures()
        .forEach((o) => {
          previousFeatures.push(
            o.get(this.model.config.wmsRealEstateLayer.idField)
          );
        });
    }

    this.previousFeatures = previousFeatures;
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
      clone.setStyle(this.styles.getHighlightStyle());
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
    if (!this.model.layers.wmsRealEstate) {
      return;
    }
    const view = this.model.map.getView();

    const url = this.model.layers.wmsRealEstate
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
          features = features.filter((feature) => {
            return feature.get(this.model.config.wmsRealEstateLayer.idField)
              ? true
              : false;
          });
          this.addFeatures(features, { zoomToLayer: false });
          this.observer.publish("fir.search.add", features);
        } catch (err) {
          console.warn(err);
        }
      });
  }

  handleFeatureClicks = (e) => {
    if (this.model.windowIsVisible !== true) {
      return;
    }
    let first = true;
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (first === true && layer === this.model.layers.feature && feature) {
        if (this.removeIsActive === true) {
          this.removeFeature(feature);
          this.model.layers.highlight.getSource().clear();
          this.model.layers.marker.setVisible(false);
        } else {
          this.toggleHighlight(feature);
        }
        first = false;
      }
    });
    if (first === true) {
      this.model.layers.marker.setVisible(false);
      // no feature was clicked, check realestate layer for features.
      if (this.model.layers.wmsRealEstate.getVisible() === true) {
        this.getFeaturesAtCoordinates(e.coordinate);
      }
    }
    if (e.originalEvent.ctrlKey === true) {
      // allow multiple add/removes
      return;
    }

    this.handleFeatureClicksCancelled();
  };

  handleFeatureClicksCancelled = () => {
    this.observer.publish("fir.search.results.addFeatureByMapClick", {
      active: false,
    });
    this.observer.publish("fir.search.results.removeFeatureByMapClick", {
      active: false,
    });
    this.removeIsActive = false;
    this.model.layers.wmsRealEstate.setVisible(false);
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
      const featureUID = feature.ol_uid;
      this.model.layers.feature.getSource().removeFeature(feature);
      let labelFeature = this.model.layers.label
        .getSource()
        .getFeatures()
        .find((f) => {
          return f.get("owner_ol_uid") === featureUID;
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
    if (this.bufferValue === 0) {
      if (options?.keepNeighborBuffer !== true) {
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
      let bufferFeature = this.#HT.getBuffered(feature, this.bufferValue);

      bufferFeature.set("owner_ol_uid", feature.ol_uid);
      bufferFeature.set("fir_type", "buffer");

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

export default FirLayerController;
