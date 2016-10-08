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

/**
 * @typedef {Object} MapModel~MapModelProperties
 * @property {Array<{number}>} center - Center of map. Default: [0, 0]
 * @property {number} zoom - Default: 1
 * @property {number} minZoom - Default: 15
 * @property {string} target - Default: map
 * @property {string} projectionCode - Default: EPSG:3006
 * @property {object} ol
 * @property {bool} clicked
 */
var MapModelProperties = {
  center: [0, 0],
  zoom: 1,
  maxZoom: 15,
  minZoom: 1,
  target: "map",
  projection: "EPSG:3006",
  ol: undefined,
  clicked: undefined
};

/**
 * Prototype for creating a map.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {MapModel~MapModelProperties} options - Default options
 */
var MapModel = {
  /**
   * These are the default properties, can me augmentet, has default values.
   * @instance
   * @property {MapModel~MapModelProperties} defaults - Default settings
   */
  defaults: MapModelProperties,

  initialize: function (options) {
    this.initialState =  _.clone(this.attributes);
    var map = new ol.Map({
      interactions: ol.interaction.defaults().extend([new Drag()]),
      target: this.get("target"),
      layers: [],
      controls: [new ol.control.Zoom(),  new ol.control.ScaleLine()],
      view: new ol.View({
        zoom: this.get("zoom"),
        units: 'm',
        resolutions: this.get('resolutions'),
        center: this.get("center"),
        projection: this.get("projection")
      })
    });

    this.set("ol", map);
  },
  /**
   * Get openlayers map instance.
   * @instance
   * @return {object} map
   */
  getMap: function () {
    return this.get("ol");
  },
  /**
   * Get current zoom level
   * @instance
   * @return {number} zoom level
   */
  getZoom: function () {
    return this.getMap().getView().getZoom();
  },
  /**
   * Get EPSG code.
   * @instance
   * @return {number} EPSG-code
   */
  getCRS: function () {
    return this.getMap().getView().getProjection().getCode();
  },
  /**
   * Get JSON representation.
   * @instance
   * @return {string} JSON-representation
   */
  toJSON: function () {
    var json = this.initialState;
    json.zoom = this.getMap().getView().getZoom();
    json.center = this.getMap().getView().getCenter();
    return json;
  }
};

/**
 * Map model module.<br>
 * Use <code>require('models/map')</code> for instantiation.
 * @module MapModel-module
 * @returns {MapModel}
 */
module.exports = Backbone.Model.extend(MapModel);
