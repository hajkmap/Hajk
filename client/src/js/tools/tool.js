/**
 * Backbone Class Tool
 * @class
 * @augments Backbone.Model
 */
var Tool = Backbone.Model.extend({
  /** */
  defaults: {
    /** */
    type: 'tool',
    /** */
    toolbar: undefined,
    /** */
    panel: undefined,
    /** */
    title: '',
    /** */
    icon: '',
    /** */
    collection: undefined,
    /** */
    navigation: undefined
  },
  /**
   * Creates a shell.
   *
   * @constructor
   * @param {object} options - Default options
   */
  initialize: function () {
    this.initialState =  _.clone(this.attributes);
    this.on("change:shell", function (sender, shell) {
      this.set('navigation', shell.get('navigation'));
      this.configure(shell);
    }, this);
  },
  /**
   *
   *
   */
  configure: function (shell) {
  },
  /**
   *
   *
   */
  clicked: function (arg) { },
  /**
   *
   *
   */
  toJSON: function () {
    var json = this.initialState;
    return json;
  }
});

module.exports = Tool;
