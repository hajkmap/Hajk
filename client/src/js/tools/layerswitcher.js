var ToolModel = require('tools/tool');

module.exports = ToolModel.extend({

	defaults: {
		type: 'LayerSwitcher',
		panel: 'LayerPanel',
		toolbar: 'bottom',
		icon: 'fa fa-bars icon',
      	title: 'Kartlager',
		visible: false,
		layerCollection: undefined
	},

	initialize: function (options) {
		ToolModel.prototype.initialize.call(this);
	},

	configure: function (shell) {
		this.set('layerCollection', shell.getLayerCollection());
  	},

	clicked: function (arg) {
		this.set('visible', true);
	}

});
