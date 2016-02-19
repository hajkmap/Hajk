var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      source: undefined,
      name: "highlight-wms",
      selectedLayer: undefined
   },

   initialize: function () {
      LayerModel.prototype.initialize.call(this);
      var source,
          selectInteraction;

      /*
      * Skapar en tom source som sedan kommer att fyllas på med den valda featuren
      */
      source = new ol.source.Vector({

      });

      this.set('source', source);

      this.layer = new ol.layer.Vector({
         visible: true,
         name: this.get('name'),
         source: this.get('source'),
         style: new ol.style.Style({
             stroke: new ol.style.Stroke({
               color: 'blue',
               width: 3
             }),
             fill: new ol.style.Fill({
               color: 'rgba(255, 255, 255, 0.3)'
             })
           })
      });

      this.set('selectInteraction', selectInteraction);
      this.set("queryable", false);
      this.set("visible", true);
      this.set("type", "highlight");
   },

   clearHighlight: function () {
      var source = this.get('source');

      source.clear();
   },

   addHighlight: function (feature) {
      var source = this.get('source');
      this.set('visible', true);
      if (source.getFeatures().length>0) {
         this.clearHighlight();
      }
      source.addFeature(feature);
   },

   setSelectedLayer: function (layer) {
     this.set('selectedLayer', layer);
     this.get('selectedLayer').on("change:visible", (visibility) => {
        this.selectedLayerChanged();
     });
    },

    selectedLayerChanged: function () {
      var visible = this.get('selectedLayer').get('visible');
          this.set('visible', visible);
    },
});
