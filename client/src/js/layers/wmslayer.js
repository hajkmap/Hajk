var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      url: "",
      projection: "EPSG:3007",
      serverType: 'geoserver',
      opacity: 1,
      status: "ok",
      params: {}
   },

   initialize: function () {
      LayerModel.prototype.initialize.call(this);

      var source = {
         url: this.get('url'),
         params: this.get('params'),
         projection: this.get('projection'),
         serverType: this.get('serverType'),
         imageFormat: this.get('imageFormat')
      };

      if (this.get('params').TILED) {         
         source.tileGrid = new ol.tilegrid.TileGrid({
           resolutions: this.get('resolutions'),
           origin: this.get('origin')
         }),
         source.extent = this.get('tiled')
      }

      if (this.get('singleTile')) {
         this.layer = new ol.layer.Image({
            name: this.get('name'),
            visible: this.get('visible'),
            queryable: this.get('queryable'),
            caption: this.get('caption'),
            opacity: this.get("opacity"),
            source: new ol.source.ImageWMS(source)
         });
      } else {
         this.layer = new ol.layer.Tile({
            name: this.get('name'),
            visible: this.get('visible'),
            queryable: this.get('queryable'),
            caption: this.get('caption'),
            opacity: this.get("opacity"),
            source: new ol.source.TileWMS(source)
         });
      }

      this.set("wmsCallbackName", "wmscallback" + Math.floor(Math.random() * 1000) + 1);
      global.window[this.get("wmsCallbackName")] = _.bind(this.getFeatureInformationReponse, this);

      this.layer.getSource().on('tileloaderror', e => {
         this.tileLoadError();
      });

      this.layer.getSource().on('tileloadend', e => {
         this.tileLoadOk();
      });

      this.layer.on('change:visible', (e) => {
         if (!this.get('visible')) {
            this.tileLoadOk();
         }
      });

      this.set("type", "wms");

   },

   validInfo: true,

   getFeatureInformation: function (params) {
      var url;
      try {

         this.validInfo = true;
         this.featureInformationCallback = params.success;

         url = this.getLayer()
            .getSource()
            .getGetFeatureInfoUrl(
               params.coordinate,
               params.resolution,
               params.projection,
               {
                  'INFO_FORMAT': 'application/json'                  
               }
            );

         if (url) {
            if (HAJK2.searchProxy) {
               url = encodeURIComponent(url);
            }
            var request = $.ajax({
               url: HAJK2.searchProxy + url,               
               success: (data) => {                  
                  var features = new ol.format.GeoJSON().readFeatures(data);
                  this.featureInformationCallback(features, this.getLayer());
               }            
            });
            request.error(params.error);
         }
      } catch (e) {
         params.error(e);
      }

   },

   tileLoadError: function () {
      this.set("status", "loaderror");
   },

   tileLoadOk: function () {
      this.set("status", "ok");
   },

   getFeatureInformationReponse: function (response, xhr) {
      try {
         var features = new ol.format.GeoJSON().readFeatures(response);
         this.featureInformationCallback(features, this.getLayer());
      } catch (e) {
         console.error(e);
      }
   }

});
