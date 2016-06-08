var ToolModel = require('tools/tool');

function arraySort(options) {

    function getTitle(hit, property) {
      if (Array.isArray(property)) {
        return property.map(item => hit.getProperties()[item]).join(', ');
      } else {
        return hit.getProperties()[property] || property
      }
    }
    // Sortera på nummer i sträng.
    // Tex Storgatan 9 < Storgatan 10
    function num(str) {
      var re = /\d+/
      ,   n  = re.exec(str)
      ;
      return n !== null ? parseInt(n) : -1
    }
    // Sortera på sträng
    // Tex Storgatan < Störgatan
    function str(str) {
      var re = /^[a-zA-ZåäöÅÄÖ\-:_ ]+/
      ,   s  = re.exec(str)
      ;
      return s != null ? s[0] : -1;
    }
    // Sortera på siffra efter nummer, eller siffra efter kolon.
    // Tex Storgatan 3A < Storgatan 3B
    // Tex Almlunden 1:42 < Almlunden 1:43
    function strnum(str) {
      var re = /(\d+)(:)?([a-zA-ZåäöÅÄÖ])?(\d+)?/
      ,   s  = re.exec(str)
      ;
      var r = s === null ? -1 : s[2] ? parseInt(s[4]) : s[3];
      return r;
    }
    // Jämför två strängar.
    function comparer(a, b) {
      var a_s = str(getTitle(a, options.index)) // Strängjämförare.
      ,   b_s = str(getTitle(b, options.index)) // Strängutmanare.
      ,   a_n = NaN // Nummerjämförare.
      ,   b_n = NaN // Nummerutmanare.
      ,   ans = NaN // Suffixutmanare.
      ,   bns = NaN // Suffixjämförare.
      ;

      // Hela strängen är samma.
      if (getTitle(a, options.index) === getTitle(b, options.index)) return 0;
      if (a_s > b_s) return  1;
      if (a_s < b_s) return -1;
      // Strängdelen är samma, jämför nummer.
      a_n = num(getTitle(a, options.index));
      b_n = num(getTitle(b, options.index));

      if (a_n > b_n) return 1;
      if (a_n < b_n) return -1;
      // Strängdelen och textdelen är samma,
      // jämför suffix.
      ans = strnum(getTitle(a, options.index));
      bns = strnum(getTitle(b, options.index));

      if (ans > bns) return 1;
      if (ans < bns) return -1;
      // Övriga matchningar sorteras alfabetiskt.
      return getTitle(a, options.index) > getTitle(b, options.index) ? 1 : -1;
    }

    return options.array.sort(comparer);
}

module.exports = ToolModel.extend({
  /**
   * @property defaults {object}
   */
  defaults: {
    type: 'search',
    panel: 'searchpanel',
    toolbar: 'bottom',
    icon: 'fa fa-search icon',
    title: 'Sök i kartan',
    visible: false,
    value: "",
    settings: ["Allt"],
    filter: "*",
    filterVisible: false,
    markerImg: "assets/icons/marker.png"
  },
  /**
   * @property requests {[$AjaxRequest]}
   */
  requests: [],
  /**
   * Property: {ol.layer.Vector} featureLayer
   *
   */
  featureLayer: undefined,
  /**
   * Perform a WFS-search.
   *
   * @params: {object} props
   * @returns: undefined
   *
   */
  doWFSSearch: function (props) {

    var filters = props.propertyName.split(',').map((property) =>
      `<ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
         <ogc:PropertyName>${property}</ogc:PropertyName>
         <ogc:Literal>*${props.value}*</ogc:Literal>
       </ogc:PropertyIsLike>`
    ).join('');

    var str = `
      <wfs:GetFeature
        xmlns:wfs="http://www.opengis.net/wfs"
        service="WFS"
        version="1.1.0"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
        maxFeatures="100">
        <wfs:Query typeName="feature:${props.featureType}" srsName="${props.srsName}">
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:Or>
              ${filters}
            </ogc:Or>
          </ogc:Filter>
        </wfs:Query>
      </wfs:GetFeature>
    `;

    var contentType = "text/xml";
    var data = str;

    this.requests.push(
      $.ajax({
        url: props.url,
        contentType: contentType,
        crossDomain: true,
        type: 'post',
        data: str,
        success: result => {
          var format,
            features = [];

          format = new ol.format.WFS({});

          // The readFeatures method throws if the srsName is not found in the map.
          try {
            features = format.readFeatures(result);
          } catch (e) {
            console.error("Koordinatsystem saknas i definitionsfilen.");
          }

          if (features.length === 0) {
            features = [];
          }
          props.done(features);
        },
        error: result => {
          props.done([]);
        }
      })
    );
  },
  /**
   * Abort current requests.
   *
   * @params:
   * @returns: undefined
   *
   */
  abort: function () {
    this.requests.forEach((request) => {
      request.abort();
    });
    this.requests = [];
  },
  /**
   * Clear result layer.
   *
   * @params:
   * @returns: undefined
   *
   */
  clear: function() {
    this.featureLayer.getSource().clear();
    this.set('items', []);
  },
  /**
   * @desc: Focus map on feature.
   * @param: spec {object}
   * @return: undefined
   *
   */
  focus: function (spec) {

    var map    = this.get('map')
    ,   exist  = this.get('selectedIndices').find(item => item.group === spec.id)
    ,   extent = spec.hit.getGeometry().getExtent()
    ,   size   = map.getSize();

    map.getView().fit(extent, size, { maxZoom: 16 });

    this.featureLayer.getSource().clear();
    this.featureLayer.getSource().addFeature(spec.hit);

    if (!this.get('selectedIndices') instanceof Array) {
      this.set('selectedIndices', []);
    }

    if (exist) {
      exist.index = spec.index;
    } else {
      this.get('selectedIndices').push({
        index: spec.index,
        group: spec.id
      });
    }
  },
  /**
   *
   */
  getLayers: function () {
    var filter = (layer) => {
      var criteria = this.get('filter');
      var visible  = this.get('filterVisible');
      var searchable = layer.get('search');
      return criteria === '*' ?
             (searchable && (visible ? layer.get('visible') : true)) :
             (searchable && (visible ? layer.get('visible') : true) && layer.get('id') === criteria);
    };
    return this.get('layerCollection').filter(filter);
  },
  /**
   *
   */
  getSources: function () {  
    var filter = (source) => {
      var criteria = this.get('filter');          
      return criteria === '*' ? true : criteria === source.caption;
    }
    return this.get('sources').filter(filter);
  },
  /**
   * Lookup searchable layers in loaded LayerCollection.
   * Stacks requests as promises and resolves when all requests are done.
   *
   * @params: {string} value, {function} done
   * @returns: undefined
   *
   */
  search: function (done) {

    var value = this.get('value');
    var items = [];
    var promises = [];
    var layers;
    var sources;

    if (value === "") return;

    sources= this.getSources();
    layers = this.getLayers();

    this.set('selectedIndices', []);    

    layers.forEach(layer => {
      promises.push(new Promise((resolve, reject) => {
        var searchProps = layer.get('search');
        this.doWFSSearch({
          value: value,
          url: searchProps.url,
          featureType: searchProps.featureType,
          propertyName: searchProps.propertyName,
          srsName: searchProps.srsName,
          done: features => {
            if (features.length > 0) {
              items.push({
                layer: layer.get('caption'),
                displayName: searchProps.displayName,
                propertyName: searchProps.propertyName,
                hits: features
              });
            }
            resolve();
          }
        });
      }));
    });

    sources.forEach(source => {

      var searchProps = {
        "url": (HAJK2.searchProxy || "") + source.url,
        "featureType": source.layers[0].split(':')[1],
        "propertyName": source.searchFields.join(','),
        "displayName": source.displayFields ? source.displayFields : (source.searchFields[0] || "Sökträff"),
        "srsName": this.get('map').getView().getProjection().getCode()
      };    

      promises.push(new Promise((resolve, reject) => {        
        this.doWFSSearch({
          value: value,
          url: searchProps.url,
          featureType: searchProps.featureType,
          propertyName: searchProps.propertyName,
          srsName: searchProps.srsName,
          done: features => {
            if (features.length > 0) {
              items.push({
                layer: source.caption,
                displayName: searchProps.displayName,
                propertyName: searchProps.propertyName,
                hits: features
              });
            }
            resolve();
          }
        });
      }));
    });

    Promise.all(promises).then(() => {

      items.forEach(function (item) {
        item.hits = arraySort({
          array: item.hits,
          index: item.displayName
        });
      });

      items = items.sort((a, b) => a.layer > b.layer ? 1 : -1);

      this.set('items', items);

      if (done) {
        done({
          status: "success",
          items: items
        });
      }

    });
  },
  /**
   * Constructor method.
   *
   * @params: <object> options
   * @returns: undefined
   *
   */
  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },
  /**
   * Configure the tool before first use.
   *
   * @params: {Backbone.Model} shell
   * @returns: undefined
   *
   */
  configure: function (shell) {
    this.set('layerCollection', shell.getLayerCollection());
    this.set('map', shell.getMap().getMap());
    this.featureLayer = new ol.layer.Vector({
      caption: 'Sökträff',
      name: 'search-vector-layer',
      source: new ol.source.Vector(),
      queryable: true,
      visible: true,
      style: this.getStyle()
    });

    this.get('map').addLayer(this.featureLayer);
  },
  /**
   * Handle click event on toolbar button.
   *
   * @params:
   * @returns: undefined
   *
   */
  clicked: function () {
    this.set('visible', true);
  },
  /**
   * Get style for search hit layer.
   *
   * @params:
   * @returns: undefined
   *
   */
  getStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.6)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.6)',
        width: 4
      }),
      image: new ol.style.Icon({
        anchor: [0.5, 32],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: this.get('markerImg'),
        imgSize: [32, 32]
      })
    })
  }
});
