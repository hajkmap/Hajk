var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      url: "",
      vectorSource: undefined,
      imageSource: undefined,
      filterFeatures: [],
      filterApplied: false,
      params: {
         service: "",
         version: "",
         request: "",
         typename: "",
         outputFormat: "",
         srsname: "",
         bbox: ""
      }
   },

   initialize: function () {
      LayerModel.prototype.initialize.call(this);
      var format = new ol.format.GeoJSON();
      this.stdStyle = new ol.style.Style({
         image: new ol.style.Circle({
            fill: new ol.style.Fill({
               color: 'rgba(244, 210, 66, 0.6)'
            }),
            stroke: new ol.style.Stroke({
               color: '#F4D242',
               width: 2
            }),
            radius: 5
         }),
         fill: new ol.style.Fill({
            color: 'rgba(244, 210, 66, 0.6)'
         }),
         stroke: new ol.style.Stroke({
            color: '#F4D242',
            width: 2
         })
      });

      this.vectorSource = new ol.source.Vector({
         loader: (extent) => { this.loadJSON(this.createUrl(extent)) },
         strategy: ol.loadingstrategy.bbox
      });

      this.imageSource = new ol.source.ImageVector({
         source: this.vectorSource,
         style: this.getStyle.bind(this)
      });

      this.on('change:filterApplied', function () {
         this.refresh();
      });

      this.layer = new ol.layer.Image({
         caption: this.get('caption'),
         name: this.get('name'),
         maxResolution: this.get('maxResolution') || 20,
         minResolution: this.get('minResolution') || 0.5,
         visible: this.get("visible"),
         source: this.imageSource
      });

      global.window[this.get('callbackFunction')] = (features) => {this.updateLayer(format.readFeatures(features))};

      if (this.get('filterList') && this.get('filterList').length > 0) {
         this.applyFilter();
      }

      this.set("queryable", true);
      this.set("type", "wfs");
   },

   getStyle: function (feature) {
       var style = this.get('style');

       var icon = this.get('icon'),
          filterApplied = this.get('filterApplied'),
          filterFeatures = this.get('filterFeatures'),
          showIcon = filterFeatures.length === 0 ||  _.find(filterFeatures, function (filterValue) {
            return filterValue === '' + feature.getProperties().spGid;
          }),
          style;

      if (showIcon || !filterApplied) {

         style = style.condition ? this.getConditionStyle(style, feature) :
                                   this.getIconStyle(style.icon);

         if (feature.getProperties().messages) {
            style = [new ol.style.Style({
                        image: new ol.style.Circle({
                           fill: new ol.style.Fill({
                              color: 'rgba(255, 0, 220, 0.66)'
                           }),
                           radius: z > 10 ? 10 / s : 10
                        })
                     })].concat(style);
         }

         return style;
      }
   },

   getIconStyle: function (iconSrc) {
      var zoom = this.get("map").getZoom(),
          //scale = 0.005 * Math.pow(zoom, 2.1);
          scale = 1;

      return iconSrc ?
         [new ol.style.Style({
            image: new ol.style.Icon({
               src: iconSrc,
               scale: scale
            })
         })] :
         [this.stdStyle]
   },

   getConditionStyle: function (styleConfig, feature) {

      var property = feature.getProperties()[styleConfig.condition.property],
          alternative = _.find(styleConfig.condition.alternatives || [], function (alt) { return property === alt.value; });

      if (alternative) {
         return this.getIconStyle(alternative.icon);
      } else  if (styleConfig.icon) {
         return this.getIconStyle(styleConfig.icon);
      }
      return [this.stdStyle];
   },

   getSource: function () {
      return this.vectorSource;
   },

   updateLayer: function (features) {
      this.getSource().addFeatures(features);
   },

   refresh: function () {
      this.imageSource.setStyle(this.imageSource.getStyle());
   },

   createUrl: function (extent) {
      var parameters = this.get('params');
      if (extent) {
        parameters.bbox = extent.join(',') + "," + parameters['srsname'];
      } else if (parameters.hasOwnProperty('bbox')) {
         delete parameters.bbox;
      }

      parameters = _.map(parameters, (value, key) => key.concat("=", value));
      parameters = parameters.join('&');

      return this.get('url') + '?' + parameters;
   },

   applyFilter: function () {
      var filterList = this.get('filterList').toArray(),
          filterIds = [];
      _.each(filterList, (filter) => {
         _.each (filter.attributes.features.features, (feature) => {
            filterIds.push(feature.gid);
         })
      });
      filterIds = _.uniq(filterIds);
      this.set('filterFeatures', filterIds);
      this.refresh();
   }
});
