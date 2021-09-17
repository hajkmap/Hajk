import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

import { Fill, Stroke, Circle, Style } from "ol/style";
class FirLayerController {
  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
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
      zIndex: 100,
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

    this.model.layers.hiddenBuffer = new VectorLayer({
      caption: "FIRHiddenSearchResultBufferLayer",
      name: "FIRHiddenSearchResultBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: false,
      // style: this.getFirBufferHiddenFeatureStyle(),
    });

    this.model.map.addLayer(this.model.layers.feature);
    this.model.map.addLayer(this.model.layers.highlight);
    this.model.map.addLayer(this.model.layers.buffer);
    this.model.map.addLayer(this.model.layers.draw);
    this.model.map.addLayer(this.model.layers.hiddenBuffer);
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

    this.model.map.on("singleclick", this.handleFeatureClicks);
  }

  addFeatures = (arr) => {
    if (!arr) {
      return;
    }
    this.model.layers.feature.getSource().addFeatures(arr);
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(this.zoomToFit, 500);
  };

  clearBeforeSearch = () => {
    this.model.layers.feature.getSource().clear();
    this.model.layers.highlight.getSource().clear();
  };

  toggleHighlight = (feature) => {
    let f = this.model.layers.highlight
      .getSource()
      .getFeatureByUid(feature.ol_uid);
    this.model.layers.highlight.getSource().clear();
    if (f) {
      this.observer.publish("fir.search.feature.deselected", f);
    } else {
      this.model.layers.highlight.getSource().addFeature(feature);
      this.observer.publish("fir.search.feature.selected", feature);
    }
  };

  handleFeatureClicks = (e) => {
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (layer === this.model.layers.feature && feature) {
        this.toggleHighlight(feature);
      }
    });
  };

  handleHighlight = (data) => {
    this.model.layers.highlight.getSource().clear();
    if (data.feature && data.highlight === true) {
      this.toggleHighlight(data.feature);
      // this.model.layers.highlight.getSource().addFeature(data.feature);
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

  zoomToFit = () => {
    const source = this.model.layers.feature.getSource();
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
