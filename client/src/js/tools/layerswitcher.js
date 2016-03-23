var ToolModel = require('tools/tool');

module.exports = ToolModel.extend({

    defaults: {
      type: 'layerswitcher',
      panel: 'LayerPanel',
      toolbar: 'bottom',
      icon: 'fa fa-bars icon',
      title: 'Kartlager',
      visible: false,
      layerCollection: undefined,
      selectedTheme: 2
    },

    setToggled: function recursive(groups) {
      groups.forEach(group => {
        this.set("group_" + group.id, group.toggled ? "visible" : "hidden");
        if (group.hasOwnProperty('groups')) {
          recursive.call(this, group.groups);
        }
      });
    },

    initialize: function (options) {
      ToolModel.prototype.initialize.call(this);
      this.setToggled(options.groups);
    },

    getBaseLayers: function () {
      return this.get('layerCollection').filter(layer =>
        this.get('baselayers').find(baselayer =>
          baselayer === layer.id
        )
      )
    },

    configure: function (shell) {
      this.set('layerCollection', shell.getLayerCollection());
    },

    clicked: function (arg) {
      this.set('visible', true);
    }

});
