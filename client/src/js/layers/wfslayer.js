var LayerModel = require('layers/layer');

module.exports = LayerModel.extend({

   defaults: {
      url: "",
      featureId: "FID",
      serverType: "geoserver",
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

   featureMap: {},

   addFeatures: function (data, format) {
      var features = []
      ,   parser;

      if (format === "wfs") {
         parser = new ol.format.WFS({
            gmlFormat: this.get('params').version === "1.0.0" ? new ol.format.GML2() : undefined
         });
      }

      if (format === "geojson") {
         parser = new ol.format.GeoJSON();
      }

      if (parser) {
         features = parser.readFeatures(data);
      }

      this.get("source").addFeatures(features);
   },

   loadAJAX: function (url) {
      $.get(url, (features) => {
         this.addFeatures(features, "wfs");
      });
   },

   initialize: function () {
      var source,
          layer;

      source = new ol.source.Vector({
         loader: (extent) => {
            if (this.get('loadType') === 'jsonp') {
               this.loadJSON(this.createUrl(extent));
            }
            if (this.get('loadType') === 'ajax') {
               this.loadAJAX(this.createUrl(extent, true));
            }
         },
         strategy: ol.loadingstrategy.all
      });

      layer = new ol.layer.Image({
         caption: this.get('caption'),
         name: this.get('name'),
         visible: this.get("visible"),
         source: new ol.source.ImageVector({
            source: source,
            style: (feature) => {
               var icon = this.get("icon");
               return [new ol.style.Style({
                  fill: new ol.style.Fill({
                     color: 'rgba(255, 255, 255, 0.6)'
                  }),
                  stroke: new ol.style.Stroke({
                     color: '#319FD3',
                     width: 1
                  }),
                  image: new ol.style.Icon({
                     src: icon,
                     scale: 1
                  })
               })];
            }
         })
      });

      if (this.get('loadType') === "jsonp") {
         global.window[this.get('callbackFunction')] = (response) => {
            this.addFeatures(response, "geojson");
         };
      }

      this.set("queryable", true);
      this.set("source", source);
      this.set("layer",layer);
      this.set("type", "wfs");
      LayerModel.prototype.initialize.call(this);
   },

   createUrl: function (extent, ll) {
      var props = Object.keys(this.get("params"))
      ,   url = this.get("url") + "?"
      ,   version = this.get('params')['version'];

      for (let i = 0; i < props.length; i++) {
         let key   = props[i];
         let value = "";

         if (key !== "bbox") {
            value = this.get("params")[key];
            url += key + '=' + value;
         } else {
            // value = extent.join(',');
            // if (version !== "1.0.0") {
            //    value += "," + this.get("params")['srsname'];
            // }
         }

         if (i !== props.length - 1) {
            url += "&";
         }
      }

      return url;
   }
});
