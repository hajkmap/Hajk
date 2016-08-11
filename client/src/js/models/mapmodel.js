var Drag = function() {

  ol.interaction.Pointer.call(this, {
    handleDownEvent: Drag.prototype.handleDownEvent,
    handleDragEvent: Drag.prototype.handleDragEvent,
    handleMoveEvent: Drag.prototype.handleMoveEvent,
    handleUpEvent: Drag.prototype.handleUpEvent
  });

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.coordinate_ = null;

  /**
   * @type {string|undefined}
   * @private
   */
  this.cursor_ = 'pointer';

  /**
   * @type {ol.Feature}
   * @private
   */
  this.feature_ = null;

  /**
   * @type {ol.Layer}
   * @private
   */
  this.layer_ = null;

  /**
   * @type {string|undefined}
   * @private
   */
  this.previousCursor_ = undefined;
};

ol.inherits(Drag, ol.interaction.Pointer);

/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
Drag.prototype.handleDownEvent = function(evt) {
  var map = evt.map
  ,   feature;

  this.layer_ = undefined;

  feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    this.layer_ = layer;
    return feature;
  });

  if (feature) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
  }

  if (this.layer_ &&
      (this.layer_.getProperties().name === 'search-vector-layer' ||
       this.layer_.getProperties().name === 'highlight-wms' ||
       this.layer_.dragLocked === true
      )) {
    return false;
  }

  return !!feature;
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 */
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


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
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


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `false` to stop the drag sequence.
 */
Drag.prototype.handleUpEvent = function(evt) {
  this.coordinate_ = null;
  this.feature_ = null;
  return false;
};

/**
 * Backbone Class Map Model
 * @class
 * @augments Backbone.Model
 */
var MapModel = Backbone.Model.extend({
  /** @property {object} defaults - Default settings */
  defaults: {
    /** @property {Array<number>} center - Center of map. Default: [0, 0] */
    center: [0, 0],
    /** @property {number} zoom - Default: 1 */
    zoom: 1,
    /** @property {number} maxZoom - Default: 15  */
    maxZoom: 15,
    /** @property {number} minZoom - Default: 1  */
    minZoom: 1,
    /** @property {string} target - Default: map*/
    target: "map",
    /** @property {string} projectionCode - Default: EPSG:3006 */
    projection: "EPSG:3006",
    /** @property {minZoom} zoom  */
    ol: undefined,
    /** @property {minZoom} zoom  */
    clicked: undefined
  },
  /**
   * Creates a map model.
   *
   * @constructor
   * @param {object} options - Default options
   */
  initialize: function (options) {
    this.initialState =  _.clone(this.attributes);
    var map = new ol.Map({
      interactions: ol.interaction.defaults().extend([new Drag()]),
      target: this.get("target"),
      layers: [],
      controls: [new ol.control.Zoom(),  new ol.control.ScaleLine()],
      view: new ol.View({
        zoom: this.get("zoom"),
        center: this.get("center"),
        projection: this.get("projection"),
        minZoom: this.get("minZoom"),
        maxZoom: this.get("maxZoom")
      })
    });

    this.set("ol", map);
  },
  /**
   * Get openlayers map instance.
   * @return {object} map
   */
  getMap: function () {
    return this.get("ol");
  },
  /**
   * Get current zoom level
   * @return {number} zoom level
   */
  getZoom: function () {
    return this.getMap().getView().getZoom();
  },
  /**
   * Get EPSG code.
   * @return {number} EPSG-code
   */
  getCRS: function () {
    return this.getMap().getView().getProjection().getCode();
  },
  /**
   * Get JSON representation.
   * @return {string} JSON-representation
   */
  toJSON: function () {
    var json = this.initialState;
    json.zoom = this.getMap().getView().getZoom();
    json.center = this.getMap().getView().getCenter();
    return json;
  }
});

module.exports = MapModel;
