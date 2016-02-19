var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      url: '',
      projection: 'EPSG:3006',
      layer: '',
      opacity: 1,
      matrixSet: '3006',
      style: 'default',
      origin: [-1200000, 8500000],
      resolutions:[4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
      matrixIds: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
   },

   updateMapViewResolutions: function () {

      var map = this.get('shell').getMap().getMap(),
          view  = map.getView();

      map.setView(new ol.View({
         zoom: view.getZoom(),
         center: view.getCenter(),
         resolutions: this.get('resolutions'),
         projection: view.getProjection()
      }));
   },

   initialize: function () {
      LayerModel.prototype.initialize.call(this);

      this.layer = new ol.layer.Tile({
         name: this.get('name'),
         caption: this.get('caption'),
         visible: this.get('visible'),
         queryable: this.get('queryable'),
         opacity: this.get('opacity'),
         source: new ol.source.WMTS({
            format: 'image/png',
            wrapX: false,
            url: this.get('url'),
            layer: this.get('layer'),
            matrixSet: this.get('matrixSet'),
            style: this.get('style'),
            projection: this.get('projection'),
            tileGrid: new ol.tilegrid.WMTS({
               origin: this.get('origin'),
               resolutions: this.get('resolutions'),
               matrixIds: this.get('matrixIds')
            })
         })
      });


      this.on('change:shell', function (sender, shell) {
         this.updateMapViewResolutions();
      }, this);

      this.set("type", "wmts");
   },

});
