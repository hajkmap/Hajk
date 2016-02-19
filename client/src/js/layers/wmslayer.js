var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      url: "",
      projection: "EPSG:3006",
      serverType: 'geoserver',
      opacity: 1,
      params: {}
   },

   initialize: function () {
      LayerModel.prototype.initialize.call(this);
      if (this.get('singleTile')){
         this.layer = new ol.layer.Image({
            name: this.get('name'),
            visible: this.get('visible'),
            queryable: this.get('queryable'),
            caption: this.get('caption'),
            opacity: this.get("opacity"),
            source: new ol.source.ImageWMS({
               url: this.get('url'),
               params: this.get('params'),
               projection: this.get('projection'),
               serverType: this.get('serverType')
            })
         });
      } else {
         this.layer = new ol.layer.Tile({
            name: this.get('name'),
            visible: this.get('visible'),
            queryable: this.get('queryable'),
            caption: this.get('caption'),
            opacity: this.get("opacity"),
            source: new ol.source.TileWMS({
               url: this.get('url'),
               params: this.get('params'),
               projection: this.get('projection'),
               serverType: this.get('serverType')
            })
         });
      }
      this.set("wmsCallbackName", "wmscallback" + Math.floor(Math.random() * 1000) + 1);
      global.window[this.get("wmsCallbackName")] = _.bind(this.getFeatureInformationReponse, this);

      this.set("type", "wms");
   },

   validInfo: true,

   getFeatureInformation: function (params) {
      try {
         this.validInfo = true;
         this.featureInformationCallback = params.success;
         if (this.get("queryable")) {
            var url = this.getLayer()
                          .getSource()
                          .getGetFeatureInfoUrl(params.coordinate, params.resolution, params.projection, {
               'INFO_FORMAT': 'text/javascript',
               'FORMAT_OPTIONS': "callback:" + this.get("wmsCallbackName"),
               'callback': this.get("wmsCallbackName")
            });

            if (url) {
               $.ajax({
                  url: url,
                  dataType: 'jsonp',
                  jsonpCallback: this.get("wmsCallbackName")
               });
               return true;
            }
         }
      } catch (e) {
         params.error(e);
      }
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
