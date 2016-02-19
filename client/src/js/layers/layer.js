var Legend = require('components/legend');
var LegendButton = require('components/legendbutton');
var FilterButton = require('components/filterbutton');
var LabelButton = require('components/labelpanel');
var FilterItem = require('components/filteritem');

"use strict";

module.exports = Backbone.Model.extend({
   defaults: {
      name: "",
      caption: "",
      visible: true,
      layer: null,
      labelVisibility: false,
      label: undefined,
      labelFields: undefined,
      filerable: undefined,
      filterList: [],
      filterApplied: false,
      filtered: false,
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

      this.on("change:visible", function () {
         if (this.getLayer()) {
            this.getLayer().setVisible(this.getVisible());
         }
      }, this);

      //Om konfiguratiuonen innehåller en filterLista så skapa upp den, annars; skapa standard.
      if (this.get('filterList') && this.get('filterList').length > 0) {
         this.set('filterList', new Backbone.Collection(this.get('filterList')));
      } else {
         this.set('filterList', new Backbone.Collection([]));
      }
   },

   setLabelVisibility: function (visibility) {
      this.set('labelVisibility', visibility);
   },

   addFilter: function (options) {
      var url = this.get('filterServiceUrl') + options.num + '?callback=?',
         promise,
         loadFinished = false;

      $('body').css({cursor: 'wait'});

      promise = new Promise ((resolve, reject) => {
         if (this.get('filterServiceUrl')) {
            $.getJSON(url, function (data) {options.features = data; resolve();});
         } else {
            resolve();
         }
      });

      promise.then(() => {
            this.get('filterList').add(options);
            this.set('filterApplied', true);
            this.set('filtered', true);
            this.applyFilter();  //Detta är en metod som ligger överlagrad i wfslayer då man måste säga åt lagret att förändras.
            $('body').css({cursor: 'default'});
         }
      );
   },

   removeFilter: function (options) {
      var filterList = this.get('filterList');

      filterList.remove(options);

      if (filterList.length === 0) {
         this.set('filterApplied', false);
         this.set('filtered', false);
      }
      this.applyFilter();
   },

   clearFilters: function () {
      var filterList = this.get('filterList');
      filterList.reset();
      if (filterList.length === 0) {
         this.set('filterApplied', false);
         this.set('filtered', false);
      }
      this.applyFilter();
   },

   toggleFilter: function (e) {
      var filterApplied = this.get('filterApplied');

      e.stopPropagation();
      this.set('filterApplied', !filterApplied);
   },

   applyFilter: function () {
      return false;
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

   getFilterApplied: function () {
      return this.get('filterApplied');
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

   getFilterable: function () {
      return this.get('filterable');
   },

   getFilterList: function () {
      return this.get('filterList').toArray();
   },

   getFiltered: function () {
      return this.get('filtered');
   },
   refresh: function () {

   },
   toJSON: function () {
      var json = _.clone(this.initialState);

      json.labelVisibility = this.get('labelVisibility');
      json.filterList = this.get('filterList').toJSON();
      json.filtered = this.get('filtered');
      json.filterApplied = this.get('filterApplied');

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

   getFilterButton: function (settings) {

      var filterButton = null;
      var toggleFilter = settings.toggleFilter ? settings.toggleFilter : this.toggleFilter.bind(this)

      var props = {
         canFilter: this.getFilterable(),
         filtered: this.getFiltered(),
         applied: this.getFilterApplied(),
         clicked: (e) => {
            toggleFilter(e)
         }
      };

      if (this.getFilterable()) {
         filterButton = React.createElement(FilterButton, props);
      }

      return filterButton;
   },

   getFilterListComponent: function (settings) {
      var filters = this.getFilterList();
      var removeFilter = settings.removeFilter ? settings.removeFilter : this.removeFilter.bind(this);

      var filterList = _.map(filters, (filter, index) => {
         var props = {
            key: index,
            filter: filter,
            removeFilter: () => {
               removeFilter(filter)
            }
         };
         return React.createElement(FilterItem, props);
      });

      return filterList;
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
         labelVisibility: this.getLabelVisibility(),
         filterList: this.getFilterList(),
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
         filterButton: this.getFilterButton(settings),
         labelButton: this.getLabelButton(settings),
         filterList: this.getFilterListComponent(settings)
      }

   }
});


