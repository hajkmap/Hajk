var ToolModel = require('tools/tool');

String.prototype.toHex = function() {
  if (/^#/.test(this)) return this;
  var hex = (
    "#" +
    this.match(/\d+(\.\d+)?/g)
        .splice(0, 3)
        .map(i => {
          var v =  parseInt(i, 10).toString(16);
          if (parseInt(i) < 16) {
            v = "0" + v;
          }
          return v;
        })
        .join("")
  );
  return hex;
}

String.prototype.toOpacity = function() {
  return parseFloat(this.match(/\d+(\.\d+)?/g).splice(3, 1)[0]);
}

module.exports = ToolModel.extend({
  /*
   * @desc Default settings.
   * @property defaults
   */
  defaults: {
    type: 'export',
    panel: 'exportpanel',
    title: 'Exportera karta',
    toolbar: 'bottom',
    icon: 'fa fa-download icon',
    copyright: "© Lantmäteriverket i2009/00858"
  },
  /*
   * @desc Configure the tool before first use.
   * @param {Backbone.Model} shell
   */
  configure: function (shell) {
    this.set('olMap', shell.getMap().getMap());
    this.addPreviewLayer();
  },

  addPreviewLayer: function () {
    this.previewLayer = new ol.layer.Vector({
      source: new ol.source.Vector()
    });
    this.get('olMap').addLayer(this.previewLayer);
  },

  removePreview: function () {
    this.set('previewFeature', undefined);
    this.previewLayer.getSource().clear();
  },

  getPreviewFeature: function () {
    return this.get('previewFeature')
  },

  addPreview: function (scale, paper, center) {

    var dpi = 25.4 / 0.28
    ,   ipu = 39.37
    ,   w = paper.width / dpi / ipu * scale / 2
    ,   y = paper.height / dpi  / ipu * scale / 2
    ,   coords = [
          [
            [center[0] - w, center[1] - y],
            [center[0] - w, center[1] + y],
            [center[0] + w, center[1] + y],
            [center[0] + w, center[1] - y],
            [center[0] - w, center[1] - y]
          ]
        ]
    ,   feature = new ol.Feature({
        geometry: new ol.geom.Polygon(coords)
      })
    ;

    this.removePreview();
    this.set('previewFeature', feature);
    this.previewLayer.getSource().addFeature(feature);

  },

  /*
   * @desc Make a clone of a canvas element.
   * @param {DOMElement} oldCcanvas
   * @return {DOMElement} newCanvas
   */
  cloneCanvas: function (oldCanvas, size) {
    var newCanvas = document.createElement('canvas')
    ,   context = newCanvas.getContext('2d');

    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    context.drawImage(oldCanvas, 0, 0);
    return newCanvas;
  },
  /*
   * @desc Generate scalebar HTML. Clone from map.
   * @param {DOMElement} oldCcanvas
   * @return {DOMElement} newCanvas
   */
  generateScaleBar: function() {

    var elem  = document.querySelector('.ol-scale-line').outerHTML
    ,   clone = $(elem)
    ,   html  = ''
    ,   data;

    clone.css({
      "width": $('.ol-scale-line-inner').width() + 4,
      "border-radius": "0px",
      "padding": "4px",
      "background": "white"
    });

    clone.find('.ol-scale-line-inner').css({
      "border-right-width": "1px",
      "border-bottom-width": "1px",
      "border-left-width": "1px",
      "border-style": "none solid solid",
      "border-right-color": "rgb(0, 0, 0)",
      "border-bottom-color": "rgb(0, 0, 0)",
      "border-left-color": "rgb(0, 0, 0)",
      "color": "rgb(0, 0, 0)",
      "font-size": "10px",
      "text-align": "center",
      "margin": "1px"
    });

    elem = clone.get(0).outerHTML;

    html = `<div xmlns='http://www.w3.org/1999/xhtml'>
          ${elem}
        </div>`;

    data = `data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='50'>
          <foreignObject width='100%' height='100%'>
            ${html}
          </foreignObject>
        </svg>`;

    return data;
  },

  findWMS: function () {

    var exportable = layer =>
      layer instanceof ol.layer.Tile && (
      layer.getSource() instanceof ol.source.TileWMS ||
      layer.getSource() instanceof ol.source.ImageWMS) &&
      layer.getVisible();

    var formatUrl = url =>
      /^\//.test(url) ?
      (window.location.protocol + "//" + window.location.host + url) :
      url;

    return this.get('olMap')
      .getLayers()
      .getArray()
      .filter(exportable)
      .map((layer, i) => {
        return {
          url: formatUrl(layer.getSource().getUrls()[0]),
          layers: layer.getSource().getParams()["LAYERS"].split(','),
          zIndex: i,
          workspacePrefix: null,
          coordinateSystemId: this.get('olMap').getView().getProjection().getCode().split(':')[1]
        }
      });
  },

  findVector: function () {

    var drawLayer = this.get('olMap').getLayers().getArray().find(layer => layer.get('name') === 'draw-layer');

    function asObject(style) {

      if (Array.isArray(style)) {
        if (style.length === 2) {
          style = style[1];
        }
        if (style.length === 1) {
          style = style[0];
        }
      }

      var fillColor = "#FC345C"
      ,   fillOpacity =  0.5
      ,   strokeColor = "#FC345C"
      ,   strokeOpacity = 1
      ,   strokeWidth = 3
      ,   strokeLinecap = "round"
      ,   strokeDashstyle =  "solid"
      ,   pointRadius =  10
      ,   pointFillColor = "#FC345C"
      ,   labelAlign =  "cm"
      ,   labelOutlineColor = "white"
      ,   labelOutlineWidth = 3
      ,   fontSize =  "16"
      ,   fontColor =  "#FFFFFF";

      if (style.getFill()) {
        fillColor = style.getFill().getColor().toHex();
        fillOpacity = style.getFill().getColor().toOpacity();
      }

      if (style.getStroke()) {

        strokeColor = style.getStroke().getColor().toHex();
        strokeWidth = style.getStroke().getWidth() || 3;
        strokeLinecap = style.getStroke().getLineCap() || "round";
        strokeDashstyle = style.getStroke().getLineDash() ?
                          style.getStroke().getLineDash()[0] === 12 ?
                          "dash" : "dot": "solid";
      }

      if (style.getImage()) {
        pointRadius = style.getImage().getRadius();
        if (style.getImage() instanceof ol.style.Circle) {
          pointFillColor = style.getImage().getFill().getColor().toHex();
        }
      }

      return {
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeWidth: strokeWidth,
        strokeLinecap: strokeLinecap,
        strokeDashstyle: strokeDashstyle,
        pointRadius: pointRadius,
        pointFillColor: pointFillColor,
        labelAlign: labelAlign,
        labelOutlineColor: labelOutlineColor,
        labelOutlineWidth: labelOutlineWidth,
        fontSize: fontSize,
        fontColor: fontColor
      }
    }

    function as2DPairs(coordinates) {
      return (
        coordinates
        .toString()
        .split(',')
        .map(i => parseFloat(i))
        .reduce((r, n, i, a) => {
          if (i % 2 !== 0) {
            r.push([a[i - 1], a[i]]);
          }
          return r;
        }, [])
      );
    }

    function generate(features) {

      function getText(feature) {
        if (feature.getProperties()) {
          if (feature.getProperties().type == "Text") {
            return feature.getProperties().description;
          }
        }
        if (feature.getStyle()[1] &&
            feature.getStyle()[1].getText() &&
            feature.getStyle()[1].getText().getText()) {
          return feature.getStyle()[1].getText().getText();
        }
      }

      return [{
        features: features.map((feature) => {
          return {
            type: feature.getProperties().type,
            attributes: {
              text: getText(feature),
              style: asObject(feature.getStyle())
            },
            coordinates: as2DPairs(feature.getGeometry().getCoordinates())
          }
        })
      }]
    }

    return generate(drawLayer.getSource().getFeatures());
  },
  /*
   * @desc Clone map canvas and add copyright.
   *       Call the toDataUrl to produce a Base64-encoded image url.
   *       Create a download anchor and trigger click to prevent popup.
   * @param {function} callback
   */
  exportMap: function(callback, size) {
    var map = this.get('olMap');
    map.once('postcompose', (event) => {
      var href
      ,   anchor
      ,   canvas
      ,   context
      ,   exportImage
      ;
      canvas = this.cloneCanvas(event.context.canvas, size);
      context = canvas.getContext('2d');
      context.textBaseline = 'bottom';
      context.font = '12px sans-serif';
      if (!size.x) {
        context.fillText(this.get('copyright'), 10, 25);
      }
      var img = new Image();
      img.src = this.generateScaleBar();
      img.onload = function() {
        context.drawImage(img, (size.x + 10) || 10, (size.y + size.height - 30) || (canvas.height - 30));
        href = canvas.toDataURL('image/png');
        href = href.split(';')[1].replace('base64,','');
        callback(href);
      }
    });
    map.renderSync();
  },
  /*
   * @desc Send request to export image.
   * @param {function} callback
   */
  exportImage: function(callback) {
    this.exportMap((href) => {
      $.ajax({
        url: this.get('url'),
        type: 'post',
        contentType: 'text/plain',
        data: 'image;' + encodeURIComponent(href),
        success: response => {
          var anchor = $('<a>Hämta</a>').attr({
            href: response,
            target: '_blank',
            download: 'karta.png'
          });
          callback(anchor);
        }
      });
    }, {});
  },
  /*
   * @desc Send request to export image.
   * @param {function} callback
   */
  exportPDF: function(options, callback) {
    var extent = this.previewLayer.getSource().getFeatures()[0].getGeometry().getExtent()
    ,   left   = extent[0]
    ,   right  = extent[2]
    ,   bottom = extent[1]
    ,   top    = extent[3]
    ,   scale  = options.scale
    ,   dpi    = options.resolution
    ,   data   = {
      wmsLayers: [],
      vectorLayers: [],
      size: null,
      resolution: options.resolution,
      bbox: null
    };

    data.vectorLayers = this.findVector() || [];
    data.wmsLayers = this.findWMS() || [];

    dx = Math.abs(left - right);
    dy = Math.abs(bottom - top);

    data.size = [
      parseInt(100 * (dx / scale) * dpi),
      parseInt(100 * (dy / scale) * dpi)
    ];

    data.bbox = [left, right, bottom, top];
    data.orientation = options.orientation;
    data.format = options.format;
    data.scale = options.scale;

    $.ajax({
      type: "post",
      url: "/mapservice/export/pdf",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: rsp => {
        callback(rsp);
      },
      error: rsp => {
        callback(rsp);
      }
    });

  },
  /*
   * @desc Handle click event on toolbar button.
   */
  clicked: function () {
    this.set('visible', true);
  }
});