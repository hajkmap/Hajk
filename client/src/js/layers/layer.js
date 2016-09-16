"use strict";

var Legend = require('components/legend')
,   LegendButton = require('components/legendbutton');

/**
 * Layer model properties
 * @class LayerModelProperties
 */
var LayerModelProperties = {
  /** @property {string} name*/
  name: "",
  /** @property {string} caption*/
  caption: "",
  /** @property {boolean} visible*/
  visible: false,
  /** @property {external:ol.layer} layer*/
	layer: undefined
};

/**
 * Prototype for creating a layer.
 * @class Layer
 * @augments external:"Backbone.Model"
 */
var Layer = {
	/**
	 * @property {LayerModelPropertied} - default properties
	 */
	defaults: LayerModelProperties,
	/**
	 * Load JSON data from script tag.
	 * @param {string} url
	 * @return {undefined}
	 */
	loadJSON: function (url) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = url;
		script.async = true;
		script.onload = () => { document.head.removeChild(script) };
		document.head.appendChild(script);
	},
	/**
	 * Internal constructor method.
	 * @private
	 * @return {undefined}
	 */
	initialize: function () {
		this.initialState = _.clone(this.attributes);
		this.on('change:shell', function (sender, shell) {
			this.set("map", shell.get("map"));
		}, this);
	},
	/**
	 * Get label visibility.
	 * @return {boolean} visibility
	 */
	getLabelVisibility: function () {
		return this.get('labelVisibility');
	},
	/**
	 * Get label visibility.
	 * @return {LegendView} legend
	 */
	getLegend: function () {
		return this.get("legend");
	},
	/**
	 * Get name.
	 * @return {string} name
	 */
	getName: function () {
		return this.get("name");
	},
	/**
	 * Get caption.
	 * @return {string} caption
	 */
	getCaption: function () {
		return this.get("caption");
	},
	/**
	 * Get visible.
	 * @return {bool} visible
	 */
	getVisible: function () {
		return this.get("visible");
	},
	/**
	 * Get ol layer.
	 * @return {external:ol.layer} layer
	 */
	getLayer: function () {
		return this.layer || this.get("layer");
	},
	/**
	 * Set label visibility.
	 * @param {bool} visibility
	 * @return {undefined}
	 */
	setVisible: function (visible) {
		this.set("visible", visible);
	},
	/**
	 * Get flat JSON-friendly representation of this instance.
	 * @return {object} JSON-representation.
	 */
	toJSON: function () {
		var json = _.clone(this.initialState);
		delete json.options;
		json.visible = this.get('visible');
		return json;
	},
	/**
	 * Get legend components
	 * @return {external:ReactElement} components.
	 */
	getLegendComponents: function (settings) {

			var legendComponents = {
				legendButton: null,
				legendPanel: null
			};

			var legendProps = {
				showLegend: settings.legendExpanded,
				legends: this.getLegend(),
				layer: this.getLayer()
			};

			var legendButtonProps = {
				checked: settings.legendExpanded
			};

			if (this.getLegend()) {
				legendComponents.legendPanel = React.createElement(Legend, legendProps);
				legendComponents.legendButton = React.createElement(LegendButton, legendButtonProps);
			}

			return legendComponents;
	},
	/**
	 * Get extended components
	 * @deprecated
	 */
	getExtendedComponents: function (settings) {

			return {
				legend: this.getLegendComponents(settings)
			}

	}
};

/**
 * Layer module.<br>
 * Use <code>require('layer/layer')</code> for instantiation.
 * @module Layer-module
 * @returns {Layer}
 */
module.exports = Backbone.Model.extend(Layer);