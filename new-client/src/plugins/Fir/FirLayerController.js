import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";

class FirLayerController {
  constructor(model, observer) {
    this.model = model;
    this.observer = observer;
    this.initLayers();
    this.initListeners();
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
    this.featureLayer.getSource().addFeatures(arr);
    clearTimeout(this.zoomTimeout);
    this.zoomTimeout = setTimeout(this.zoomToFit, 500);
  };

  clearBeforeSearch = () => {
    this.featureLayer.getSource().clear();
    this.highlightLayer.getSource().clear();
  };

  toggleHighlight = (feature) => {
    let f = this.highlightLayer.getSource().getFeatureByUid(feature.ol_uid);
    this.highlightLayer.getSource().clear();
    if (f) {
      this.observer.publish("fir.search.feature.deselected", feature);
    } else {
      this.highlightLayer.getSource().addFeature(feature);
      this.observer.publish("fir.search.feature.selected", feature);
    }
  };

  handleFeatureClicks = (e) => {
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (layer === this.featureLayer && feature) {
        this.toggleHighlight(feature);
      }
    });
  };

  handleHighlight = (data) => {
    this.highlightLayer.getSource().clear();
    if (data.feature && data.highlight === true) {
      this.highlightLayer.getSource().addFeature(data.feature);
    }
  };

  handleRemoveFeature = (uid) => {
    let feature = this.featureLayer.getSource().getFeatureByUid(uid);

    if (feature) {
      this.featureLayer.getSource().removeFeature(feature);
    }
  };

  handleClearSearch = (data) => {
    this.clearBeforeSearch();
    // console.log(data);
  };

  zoomToFit = () => {
    const source = this.featureLayer.getSource();
    if (source.getFeatures().length <= 0) {
      return;
    }

    const extent = source.getExtent();
    const options = {
      maxZoom: this.model.app.config.mapConfig.map.maxZoom,
      padding: [20, 20, 20, 20],
    };
    this.model.map.getView().fit(extent, options);
  };

  initLayers() {
    this.featureLayer = new VectorLayer({
      caption: "FIRSearchResultsLayer",
      name: "FIRSearchResultsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
    });

    this.highlightLayer = new VectorLayer({
      caption: "FIRHighlightsLayer",
      name: "FIRHighlightsLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      //style: this.getHighlightStyle(),
      zIndex: 100,
    });

    this.bufferLayer = new VectorLayer({
      caption: "FIRBufferLayer",
      name: "FIRBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: true,
      // style: this.getFirBufferFeatureStyle(),
    });

    this.hiddenBufferLayer = new VectorLayer({
      caption: "FIRHiddenSearchResultBufferLayer",
      name: "FIRHiddenSearchResultBufferLayer",
      source: new VectorSource(),
      queryable: false,
      visible: false,
      // style: this.getFirBufferHiddenFeatureStyle(),
    });

    this.model.map.addLayer(this.featureLayer);
    this.model.map.addLayer(this.highlightLayer);
    this.model.map.addLayer(this.bufferLayer);
    this.model.map.addLayer(this.hiddenBufferLayer);
  }
}

export default FirLayerController;
