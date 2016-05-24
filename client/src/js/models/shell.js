var MapModel = require('models/map');
var LayerCollection = require('collections/layers');
var ToolCollection = require('collections/tools');
var NavigationPanelModel = require("models/navigation");
/**
 * Backbone model class Shell
 * @class
 * @augments Backbone.Model
 */
var Shell = Backbone.Model.extend({
  /**
   * Creates a shell.
   *
   * @constructor
   * @param {object} options - Default options
   */
  initialize: function (config) {
    this.initialConfig = config;
    this.cid += '_map';
    if (config) {
      config.map.target = this.cid;
      _.each(config.projections || [], function (proj) {
        proj4.defs(proj.code, proj.definition);
        ol.proj.addProjection(new ol.proj.Projection({
          code: proj.code,
          extent: proj.extent,
          units: proj.units
        }));
      });
      this.set('canStart', true);
    } else {
      this.set('canStart', false);
    }
  },
  /**
   *
   *
   */
  configure: function () {
    var config = this.initialConfig;
    if (this.get('canStart')) {
      this.set('map', new MapModel(config.map));

      this.set('layerCollection', new LayerCollection(config.layers, { shell: this, mapConfig: config.map }));
      this.set('toolCollection', new ToolCollection(config.tools, { shell: this }));

      var panels = _.chain(this.get('toolCollection').toArray())
      .filter(function (tool) { return tool.get('panel'); })
      .map(function (panel) {
        return {
          type: panel.get('panel'),
          model: panel
        };
      }).value();
      this.set('navigation', new NavigationPanelModel({ panels: panels }));
    }
  },
  /**
   *
   *
   */
  getMap: function () {
    return this.get('map');
  },
  /**
   *
   *
   */
  getHubConnection: function () {
    return this.get('hubConnection');
  },
  /**
   *
   *
   */
  getLayerCollection: function () {
    return this.get('layerCollection');
  },
  /**
   *
   *
   */
  getToolCollection: function () {
    return this.get('toolCollection');
  },
  /**
   *
   *
   */
  getNavigation: function () {
    return this.get('navigation');
  },
  /**
   *
   *
   */
  toJSON: function () {
    var json = _.clone(this.initialConfig);
    json.layers = this.getLayerCollection().toJSON();
    json.map = this.getMap().toJSON();
    json.toolCollection = this.getToolCollection().toJSON();
    return JSON.stringify(json);
  },
  /**
   *
   *
   */
  setBookmarks: function (bookmarks) {
    this.set('bookmarks', bookmarks);
  },
  /**
   *
   *
   */
  getBookmarks: function () {
    return this.get('bookmarks');
  },
  /**
   *
   *
   */
  getConfig: function () {
    return this.get('config');
  },
  /**
   *
   *
   */
  setConfig: function (config) {
    this.set('config', config);
    this.set('configUpdated', new Date().getTime());
  }
});

module.exports = Shell;