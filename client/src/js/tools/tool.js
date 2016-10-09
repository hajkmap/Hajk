/**
 * @typedef {Object} ToolModel~ToolModelProperties
 * @property {string} type
 * @property {string} toolbar
 * @property {string} panel
 * @property {string} title
 * @property {string} icon
 * @property {ToolCollection} collection
 * @property {NavigationModel} navigation
 */
var ToolModelProperties = {
  type: 'tool',
  toolbar: undefined,
  panel: undefined,
  title: '',
  icon: '',
  collection: undefined,
  navigation: undefined
};

/**
 * Base prototype for creating a tool
 * @class
 * @augments {Backbone.Model}
 */
var ToolModel = {
  /**
   * @instance
   * @property {ToolModel~ToolModelProperties} defaults - Default settings
   */
  defaults: ToolModelProperties,

  initialize: function () {
    this.initialState =  _.clone(this.attributes);
    this.on("change:shell", (sender, shell) => {
      this.set('navigation', shell.get('navigation'));
      this.configure(shell);
    });
  },

  configure: function (shell) {
  },

  /**
   * Not implemented by base prototype.
   * @instance
   */
  clicked: function (arg) { },
  /**
   * Get JSON-representation of this instance.
   * @instance
   */
  toJSON: function () {
    var json = this.initialState;
    return json;
  }
};

/**
 * Search model module.<br>
 * Use <code>require('models/tool')</code> for instantiation.
 * @module ToolModel-module
 * @returns {ToolModel}
 */
module.exports = Backbone.Model.extend(ToolModel);
