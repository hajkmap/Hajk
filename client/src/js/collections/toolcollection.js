var Tool          = require('tools/tool'),
    LayerSwitcher = require('tools/layerswitcher'),
    InfoClick     = require('tools/infoclick'),
    SaveState     = require('tools/savestate'),
    Search        = require('tools/search'),
    Coordinates   = require('tools/coordinates'),
    Export        = require('tools/export'),
    Draw          = require('tools/draw'),
    Edit          = require('tools/edit'),
    Anchor        = require('tools/anchor');

module.exports = Backbone.Collection.extend({
  /**
   * Generates a model for this tool.
   * @param {object} args - arguments
   * @return {Tool} tool
   */
  model: function (args) {
      switch (args.type) {
        case "layerswitcher":
            return new LayerSwitcher(args.options);
        case "infoclick":
            return new InfoClick(args.options);
        case "savestate":
            return new SaveState(args.options);
        case "search":
            return new Search(args.options);
        case "coordinates":
            return new Coordinates(args.options);
        case "export":
            return new Export(args.options);
        case "draw":
            return new Draw(args.options);
        case "edit":
            return new Edit(args.options);
        case "anchor":
            return new Anchor(args.options);
        default:
            throw "tool not supported " + args.type;
      }
  },
  /**
   * Constructor method
   * @param {object} options
   * @param {object} args
   */
  initialize: function (tools, args) {
    this.shell = args.shell;
    _.defer(_.bind(function () {
      this.forEach(function (tool) { tool.set("shell", this.shell); }, this);
    }, this));
  },
  /**
   * Get the objects data state as json-friendly representation.
   * @return {object} state
   */
  toJSON: function () {
    var json = Backbone.Collection.prototype.toJSON.call(this);
    delete json.shell;
    _.each(this.models, (tool, i) => {
      json[i] = tool.toJSON();
    });
    return json;
  }
});
