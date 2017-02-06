var Drag = function() {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: Drag.prototype.handleDownEvent,
    handleDragEvent: Drag.prototype.handleDragEvent,
    handleMoveEvent: Drag.prototype.handleMoveEvent,
    handleUpEvent: Drag.prototype.handleUpEvent
  });

  this.coordinate_ = null;

  this.cursor_ = 'pointer';

  this.feature_ = null;

  this.layer_ = null;

  this.previousCursor_ = undefined;
};

ol.inherits(Drag, ol.interaction.Pointer);

Drag.prototype.isDraggable = function (layer) {
  var accepted = {
    'draw-layer': true,
    'preview-layer': true
  };
  return layer ? accepted.hasOwnProperty(layer.getProperties().name) : true;
};

Drag.prototype.handleDownEvent = function (evt) {
  var map = evt.map
  ,   feature;

  this.layer_ = undefined;

  feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    this.layer_ = layer;
    return feature;
  });

  if (feature && this.isDraggable(this.layer_)) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
  } else {
    if (this.layer_)
      this.layer_.dragLocked = true;
    feature = false;
    this.feature_ = false;
  }

  return !!feature;

};

Drag.prototype.handleDragEvent = function(evt) {
  var map = evt.map
  ,   deltaX = 0
  ,   deltaY = 0
  ,   geometry;

  deltaX = evt.coordinate[0] - this.coordinate_[0];
  deltaY = evt.coordinate[1] - this.coordinate_[1];

  this.coordinate_[0] = evt.coordinate[0];
  this.coordinate_[1] = evt.coordinate[1];

  if (this.layer_ &&  this.layer_.getProperties().name !== 'highlight-wms') {
    this.feature_.getGeometry().translate(deltaX, deltaY);
  }
};

Drag.prototype.handleMoveEvent = function(evt) {

  if (this.cursor_) {
    var featureLayer = ""
    ,   map = evt.map
    ,   feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                    featureLayer = layer;
                    return feature;
                  })
    ,   element = evt.map.getTargetElement();

    if (feature && feature.getProperties().user === true) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
};

Drag.prototype.handleUpEvent = function(evt) {
  this.coordinate_ = null;
  this.feature_ = null;
  return false;
};

module.exports = Drag;
