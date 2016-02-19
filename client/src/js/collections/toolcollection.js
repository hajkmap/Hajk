var Tool          = require('tools/tool'),
    LayerSwitcher = require('tools/layerswitcher'),
    InfoClick     = require('tools/infoclick'),
    Filter        = require('tools/filter'),
    SaveState     = require('tools/savestate'),
    Search        = require('tools/search'),
    Coordinates   = require('tools/coordinates'),
    Export        = require('tools/export'),
    Draw          = require('tools/draw'),
    Anchor        = require('tools/anchor');

/**
 * Tool collection
 */
module.exports = Backbone.Collection.extend({

  model: function (args, event) {
      switch (args.type) {
        case "layerswitcher":
            return new LayerSwitcher(args.options);
        case "infoclick":
            return new InfoClick(args.options);
        case "filter":
            return new Filter(args.options);
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
        case "anchor":
            return new Anchor(args.options);
        default:
            throw "tool not supported " + args.type;
      }
  },

  initialize: function (tools, args) {
    this.shell = args.shell;
    _.defer(_.bind(function () {
      this.forEach(function (tool) { tool.set("shell", this.shell); }, this);
    }, this));
  },

  toJSON: function () {
    var json = Backbone.Collection.prototype.toJSON.call(this);
    delete json.shell;
    _.each(this.models, (tool, i) => {
      json[i] = tool.toJSON();
    });
    return json;
  }
});
