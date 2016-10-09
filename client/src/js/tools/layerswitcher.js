var ToolModel = require('tools/tool');

/**
 * @typedef {Object} LayerSwitcherModel~LayerSwitcherModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Skriv ut
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-bars icon
 * @property {string} title - Default: Kartlager
 * @property {boolean} visible - Default: false
 * @property {LayerCollection} layerCollection - Default: undefined
 * @property {boolean} backgroundSwitcherMode - Default: hidden
 */
var LayerSwitcherModelProperties = {
  type: 'layerswitcher',
  panel: 'LayerPanel',
  toolbar: 'bottom',
  icon: 'fa fa-bars icon',
  title: 'Kartlager',
  visible: false,
  layerCollection: undefined,
  backgroundSwitcherMode: 'hidden',
};

/**
 * Prototype for creating a layerswitcher model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LayerSwitcherModel~LayerSwitcherModelProperties} options - Default options
 */
var LayerSwitcherModel = {
  /**
   * @instance
   * @property {LayerSwitcherModel~LayerSwitcherModelProperties} defaults - Default settings
   */
  defaults: LayerSwitcherModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
    this.setToggled(options.groups);
  },

  configure: function (shell) {
    this.set('layerCollection', shell.getLayerCollection());
  },

  /**
   * Set checked group toggles property based on the layers visibility.
   * @instance
   * @param {object[]} groups
   */
  setToggled: function recursive(groups) {
    groups.forEach(group => {
      this.set("group_" + group.id, group.toggled ? "visible" : "hidden");
      if (group.hasOwnProperty('groups')) {
        recursive.call(this, group.groups);
      }
    });
  },

  /**
   * Export the map as a PDF-file
   * @instance
   * @return {Layer[]} base layers
   */
  getBaseLayers: function () {
    var baseLayers = [];

    this.get('baselayers').forEach(id => {
      var layer = this.get('layerCollection').find(layer => layer.id === id);
      if (layer) {
        baseLayers.push(layer);
      }
    });
    return baseLayers;
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function (arg) {
    this.set('visible', true);
  }
};

/**
 * Layer switcher model module.<br>
 * Use <code>require('models/layerswitcher')</code> for instantiation.
 * @module LayerSwitcherModel-module
 * @returns {LayerSwitcher}
 */
module.exports = ToolModel.extend(LayerSwitcherModel);
