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
    /** @property {number} maxZoon - Default: 15  */
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
      target: this.get("target"),
      layers: [],
      controls: [new ol.control.Zoom(),  new ol.control.ScaleLine()],
      view: new ol.View({
        zoom: this.get("zoom"),
        center: this.get("center"),
        projection: this.get("projection")
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
