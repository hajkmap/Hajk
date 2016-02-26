var ToolModel = require('tools/tool');

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
    this.exportMap((href) => {

      $.ajax({
        url: this.get('url'),
        type: 'post',
        contentType: 'text/plain',
        data: `pdf;${options.size.x};${options.size.y};${options.format};${options.orientation};${encodeURIComponent(href)}`,
        success: response => {
          var anchor = $('<a>Hämta</a>').attr({
            href: response,
            target: '_blank',
            download: 'karta.pdf'
          });

          callback(anchor);
        }
      });
    }, options.size);
  },
  /*
   * @desc Handle click event on toolbar button.
   */
  clicked: function () {
    this.set('visible', true);
  }
});
