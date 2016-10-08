
var ToolModel = require('tools/tool');

/**
 * @typedef {Object} AnchorModel~AnchorModelProperties
 * @property {string} type -Default: anchor
 * @property {string} panel -Default: anchorpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 * @property {string} anchor - Default: ''
 */
var AnchorModelProperties = {
  type: 'anchor',
  panel: 'anchorpanel',
  toolbar: 'bottom',
  icon: 'fa fa-link icon fa-flip-horizontal',
  title: 'Länk',
  visible: false,
  shell: undefined,
  anchor: ""
}

/**
 * @description
 *
 *  Prototype for creating an anchor model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {AnchorModel~AnchorModelProperties} options - Default options
 */
var AnchorModel = {
  /**
   * @instance
   * @property {AnchorModel~AnchorModelProperties} defaults - Default settings
   */
  defaults: AnchorModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {

    this.set('map', shell.getMap());
    this.set('layers', shell.getLayerCollection());
    this.set(
      'layerswitcher',
      shell.getToolCollection()
           .find(tool =>
              tool.get('type') === 'layerswitcher'
            )
    );
  },

  /**
   * Generate an anchor string which represents the current state of the map.
   * @instance
   * @return {string} anchor
   */
  generate: function () {

    var a = document.location.protocol + "//" + document.location.host + document.location.pathname
    ,   map = this.get("map")
    ,   olMap = map.getMap()
    ,   layers = this.get("layers")

    ,   c = olMap.getView().getCenter()
    ,   z = olMap.getView().getZoom()
    ,   x = c[0]
    ,   y = c[1]
    ,   l = layers.filter(layer => layer.getVisible() === true)
                  .map(layer => encodeURIComponent(layer.getName())).join(',');

    a += `?x=${x}&y=${y}&z=${z}&l=${l}`;
    this.set("anchor", a);

    return a;
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
  clicked: function () {
    this.set('visible', true);
  }
};

/**
 * Anchor model module.<br>
 * Use <code>require('models/anchor')</code> for instantiation.
 * @module AnchorModel-module
 * @returns {AnchorModel}
 */
module.exports = ToolModel.extend(AnchorModel);
