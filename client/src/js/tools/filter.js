
var ToolModel = require('tools/tool');

module.exports = ToolModel.extend({

   defaults: {
      type: 'filter',
      panel: 'LayerPanel',
      visible: true,
      filterableLayers: [],
      lineurl: undefined,
      journeyurl: undefined,
      services: [],
      matchedServices: [],
      busLayer: undefined,
      stopsLayer: undefined,
      filterList: [],
      filterListChanged: false,
   },

	initialize: function (options) {
      ToolModel.prototype.initialize.call(this);
	},

  //anropas när verktyget kopplats till applikationen. lägger till referens till alla lager som är filterable.
   configure: function (shell) {
      var layers = shell.getLayerCollection().toArray();
      var filterable = [];
      var busLayer;
      var stopsLayer;
      var filterList;
      var list;

      $.getJSON(this.get('lineurl').concat('?callback=?')).done((lines) => {
         this.set('services', lines);
      });

      _.each(layers, (layer) => { if (layer && layer.getFilterable()) {filterable.push(layer)} });

      this.set('filterableLayers', filterable);

      _.each(filterable, (layer) => {if (layer.getName() == 'publicTrafic') busLayer = layer;});

      this.set('busLayer', busLayer);

      _.each(filterable, (layer) => {
         filterList = layer.getFilterList();

         _.each(filterList, (filter) => { this.get('filterList').push(filter) });

         layer.get('filterList').on('add', (m) => {
            list = _.clone(this.get('filterList'));
            list.push(m);
            this.set('filterList', list);
         });

         layer.get('filterList').on('remove', (m) => {
            list = _.clone(this.get('filterList'));
            list.splice(_.indexOf(list, m), 1);
            this.set('filterList', list);
         });

         layer.get('filterList').on('reset', (m) => {
            this.set('filterList', []);
         });
      });
   },

   //type ska vara hpl eller vehicles, num är linje/turnummer
   addFilter: function (options) {
      var layers = this.findLayer(options);

      if (layers.length>0){
         _.each(layers, (layer) => {layer.addFilter(options)});
      };
   },

   removeFilter: function (options) {
      var layers = this.findLayer(options);
      _.each(layers, (layer) => {layer.removeFilter(options)});
   },

   clearFilters: function () {
      var layers = this.get('filterableLayers');
      layers.forEach(function (layer) {
      layer.clearFilters();
      }, this);
   },

   findLayer: function (options) {
      var layers= this.get('filterableLayers'),
      matchedLayers = [],
      optionsLayer = options.layer;

      if (!optionsLayer) {
         optionsLayer = options.attributes.layer;
      }

      if (options.layer === 'stoparea') {
         _.each(this.get('filterableLayers'), (layer) => {
            if (layer.attributes.name.startsWith('stop')) {
               matchedLayers.push(layer);
            }
         });
      } else {
         _.each(layers, (layer) => {
            if (layer.getName() == optionsLayer) {
               matchedLayers.push(layer);
            }
         });
      }
      return matchedLayers;
   },

   getFilterList: function () {
      return this.get('filterList');
   },

   resetMatchedServices: function () {
      this.set('matchedServices', []);
   },

   handleUserInput: function (userInput) {

      var servicesToAdd = [];
      var lines = this.get('services');
      var journeys = this.get('busLayer').getUniqueJourneys();

      if (userInput && userInput.length > 0) {
         _
         .chain(lines)
         .filter((line) => line.name.startsWith(userInput))
         .each((line) => {
            servicesToAdd.push({
               type: 'linje',
               num: line.name,
               line: Number(line.name),
               journey: 0
            });
         });
         _
         .chain(journeys)
         .filter((journey) =>
            (journey.line + ' ' + journey.name).startsWith(userInput)
         )
         .each((journey) => {
            servicesToAdd.push({
               type: 'tur',
               num: journey.line + ' ' + journey.name,
               line: Number(journey.line),
               journey: Number(journey.name)
            });
         });
      }

      servicesToAdd.sort((a, b) => {
         if (a.line === b.line) {
            return (
               a.journey === b.journey ? 0 :
               a.journey > b.journey ? 1 : -1
            );
         }
         return a.line > b.line ? 1 : -1;
      });

      this.set('matchedServices', servicesToAdd);
   }
   });
