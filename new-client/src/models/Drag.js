import { Pointer } from "ol/interaction";

class Drag extends Pointer {
  constructor() {
    super();
    Pointer.call(this, {
      handleDownEvent: this.handleDownEvent,
      handleDragEvent: this.handleDragEvent,
      handleMoveEvent: this.handleMoveEvent,
      handleUpEvent: this.handleUpEvent
    });

    this.coordinate_ = null;

    this.cursor_ = "pointer";

    this.feature_ = null;

    this.layer_ = null;

    this.previousCursor_ = undefined;

    this.acceptedLayers = {
      "preview-layer": true
    };
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  addAcceptedLayer(layerName) {
    this.acceptedLayers[layerName] = layerName;
  }

  removeAcceptedLayer(layerName) {
    delete this.acceptedLayers[layerName];
  }

  isDraggable(layer) {
    return layer
      ? this.acceptedLayers.hasOwnProperty(layer.getProperties().name) ||
          layer.dragLocked === false
      : true;
  }

  handleDownEvent(evt) {
    var map = evt.map,
      feature;

    this.layer_ = undefined;

    feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      this.layer_ = layer;
      return feature;
    });

    if (feature && this.isDraggable(this.layer_)) {
      this.coordinate_ = evt.coordinate;
      this.feature_ = feature;
    } else {
      if (this.layer_) {
        this.layer_.dragLocked = true;
      }
      feature = false;
      this.feature_ = false;
    }

    return !!feature;
  }

  handleDragEvent(evt) {
    var deltaX = 0,
      deltaY = 0;

    if (this.paused) {
      return;
    }

    deltaX = evt.coordinate[0] - this.coordinate_[0];
    deltaY = evt.coordinate[1] - this.coordinate_[1];

    this.coordinate_[0] = evt.coordinate[0];
    this.coordinate_[1] = evt.coordinate[1];

    if (this.layer_ && this.layer_.getProperties().name !== "highlight-wms") {
      this.feature_.getGeometry().translate(deltaX, deltaY);
    }
  }

  handleMoveEvent(evt) {
    if (this.cursor_) {
      var map = evt.map,
        feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          return feature;
        }),
        element = evt.map.getTargetElement();

      if (feature && feature.getProperties().user === true) {
        if (element.style.cursor !== this.cursor_) {
          this.previousCursor_ = element.style.cursor;
          element.style.cursor = this.cursor_;
        }
      } else if (this.previousCursor_ !== undefined) {
        element.style.cursor = this.previousCursor_;
        this.previousCursor_ = undefined;
      }
    }
  }

  handleUpEvent(evt) {
    this.coordinate_ = null;
    this.feature_ = null;
    return false;
  }
}

export default Drag;
