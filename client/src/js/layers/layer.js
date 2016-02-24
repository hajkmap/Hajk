var Legend = require('components/legend');
var LegendButton = require('components/legendbutton');
var LabelButton = require('components/labelpanel');

"use strict";

module.exports = Backbone.Model.extend({
   defaults: {
      name: "",
      caption: "",
      visible: true,
      layer: null,
      labelVisibility: false,
      label: undefined,
      labelFields: undefined
   },

   loadJSON: function (url) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;
      script.async = true;
      script.onload = () => { document.head.removeChild(script) };
      document.head.appendChild(script);
   },

   initialize: function () {
      this.initialState = _.clone(this.attributes);
      this.on('change:shell', function (sender, shell) {
         this.set("map", shell.get("map"));
      }, this);
   },

   setLabelVisibility: function (visibility) {
      this.set('labelVisibility', visibility);
   },

   getLabelVisibility: function () {
      return this.get('labelVisibility');
   },

   getLegend: function () {
      return this.get("legend");
   },

   getLabelFields: function () {
      return this.get('labelFields');
   },

   getName: function () {
      return this.get("name");
   },

   getCaption: function () {
      return this.get("caption");
   },

   getVisible: function () {
      return this.get("visible");
   },

   setVisible: function (visible) {
      this.set("visible", visible);
   },

   getLayer: function () {
     return this.layer || this.get("layer");
   },

   refresh: function () {
   },

   toJSON: function () {
      var json = _.clone(this.initialState);
      json.labelVisibility = this.get('labelVisibility');
      delete json.options;
      json.visible = this.get('visible');
      return json;
   },

   getSource: function () {

   },

   getGroup: function () {
      return this.get('group');
   },

   getLabelButton: function (settings) {
      var labelsVisible = this.getLabelVisibility();
      var props = {
         toggleLabels: () => { this.setLabelVisibility(!labelsVisible) },
         showLabels: labelsVisible,
         labelFields: this.getLabelFields()
      };
      return this.getLabelFields() ? React.createElement(LabelButton, props) : null;
   },

   getLegendComponents: function (settings) {

      var legendComponents = {
         legendButton: null,
         legendPanel: null
      };

      var legendProps = {
         showLegend: settings.legendExpanded,
         legends: this.getLegend(),
         layer: this.getLayer(),
         labelFields: this.getLabelFields(),
         labelVisibility: this.getLabelVisibility()
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

   getExtendedComponents: function (settings) {

      return {
         legend: this.getLegendComponents(settings),
         labelButton: this.getLabelButton(settings)
      }

   }
});


