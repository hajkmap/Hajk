// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

var ToolModel = require('tools/tool');
var SelectionModel = require('models/selection')

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

/**
 * @typedef {Object} SearchModel~SearchModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 * @property {string} value
 * @property {boolean} force
 * @property {string} filter - Default: "*"
 * @property {string} filterVisible - Default: false
 * @property {string} markerImg - Default: "assets/icons/marker.png"
 * @property {number} maxZoom - Default: 14
 */
var SearchModelProperties = {
  type: 'search',
  panel: 'searchpanel',
  toolbar: 'bottom',
  icon: 'fa fa-search icon',
  title: 'Sök i kartan',
  visible: false,
  value: "",
  filter: "*",
  filterVisible: false,
  markerImg: "assets/icons/marker.png",
  maxZoom: 14
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SearchModel~SearchModelProperties} options - Default options
 */
var SearchModel = {
  /**
   * @instance
   * @property {SearchModel~SearchModelProperties} defaults - Default settings
   */
  defaults: SearchModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

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

    if (this.get('selectionTools')) {
      this.set('selectionModel', new SelectionModel({
        map: shell.getMap().getMap()
      }));
    }
  },

  /**
   * @instance
   * @property {XMLHttpRequest[]} requests
   */
  requests: [],

  /**
   * @instance
   * @property {external:"ol.layer"} featureLayer
   */
  featureLayer: undefined,

  getPropertyFilter: function (props) {
    var multipleAttributes = props.propertyName.split(',').length > 1;
    var conditions = props.propertyName.split(',').reduce((condition, property) => {
      if (props.value) {
        return condition += `
          <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
            <ogc:PropertyName>${property}</ogc:PropertyName>
            <ogc:Literal>*${props.value}*</ogc:Literal>
          </ogc:PropertyIsLike>`
     } else {
       return condition;
     }
   }, "");

   if (multipleAttributes) {
     return `<ogc:or>${conditions}</ogc:or>`;
   } else {
     return conditions;
   }
  },

  getFeatureFilter: function (features, props) {
    if (Array.isArray(features) && features.length > 0) {
      return features.reduce((str, feature) => {
        var coords = feature.getGeometry().getCoordinates()[0].map(c => c[0] + " " + c[1]).join(" ");
        return str += `
          <ogc:Intersects>
            <ogc:PropertyName>${props.geometryField}</ogc:PropertyName>
            <gml:Polygon srsName="${props.srsName}">
            <gml:exterior>
              <gml:LinearRing>
                <gml:posList>${coords}</gml:posList>
              </gml:LinearRing>
              </gml:exterior>
            </gml:Polygon>
          </ogc:Intersects>
        `;
      }, "");
    } else {
      return "";
    }
  },
  /**
   * Perform a WFS-search.
   * @instance
   * @param {object} props
   *
   */
  doWFSSearch: function (props) {
    var filters = ""
    ,   str = ""
    ,   featureFilter = ""
    ,   propertyFilter = ""
    ,   read = (result) => {
      var format
      ,   features = []
      ,   outputFormat = props.outputFormat;

      if (outputFormat === 'GML2')
        format = new ol.format.GML2({});
      else
        format = new ol.format.WFS({});

      if (!(result instanceof XMLDocument)) {
        if (result.responseText) {
          result = result.responseText;
        }
      }

      try {
        features = format.readFeatures(result);
      } catch (e) {
        console.error("Parsningsfel. Koordinatsystem kanske saknas i definitionsfilen? Mer information: ", e);
      }
      if (features.length === 0) {
        features = [];
      }
      props.done(features);
    };

    outputFormat = props.outputFormat;

    if (!outputFormat || outputFormat === '') {
      outputFormat = 'GML3'
    }

    propertyFilter = this.getPropertyFilter(props);
    featureFilter = this.getFeatureFilter(this.get('features'), props);

    if (featureFilter && propertyFilter) {
      filters = `
        <ogc:And>
          ${propertyFilter}
          ${featureFilter}
        </ogc:And>
      `;
    } else if (propertyFilter) {
      filters = propertyFilter;
    } else if (featureFilter) {
      filters = featureFilter;
    } else {
      filters = "";
    }

    str = `
     <wfs:GetFeature
         service = 'WFS'
         version = '1.1.0'
         xmlns:wfs = 'http://www.opengis.net/wfs'
         xmlns:ogc = 'http://www.opengis.net/ogc'
         xmlns:gml = 'http://www.opengis.net/gml'
         xmlns:esri = 'http://www.esri.com'
         xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'
         xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'>
         <wfs:Query typeName='feature:${props.featureType}' srsName='${props.srsName}'>
          <ogc:Filter>
            ${filters}
          </ogc:Filter>
         </wfs:Query>
      </wfs:GetFeature>`;

    var contentType = "text/xml"
    ,   data = str;

    this.requests.push(
      $.ajax({
        url: props.url,
        contentType: contentType,
        crossDomain: true,
        type: 'post',
        data: str,
        success: result => {
          read(result);
        },
        error: result => {
          if (result.status === 200) {
            read(result);
          } else {
            props.done([]);
          }
        }
      })
    );

  },

  /**
   * Abort current requests.
   * @instance
   */
  abort: function () {
    this.requests.forEach((request) => {
      request.abort();
    });
    this.requests = [];
  },

  /**
   * Clear result layer.
   * @instance
   *
   */
  clear: function() {
    if (this.get('selectionModel')) {
      this.get('selectionModel').abort();
    }
    this.featureLayer.getSource().clear();
    this.set('items', []);
  },

  /**
   * Focus map on feature.
   * @instance
   * @param {object} spec
   *
   */
  focus: function (spec) {
    var map    = this.get('map')
    ,   exist  = this.get('selectedIndices').find(item => item.group === spec.id)
    ,   extent = spec.hit.getGeometry().getExtent()
    ,   size   = map.getSize();

    map.getView().fit(extent, size, { maxZoom: this.get('maxZoom') });

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
   * Get searchable layers. By design, visible layers and layers set with the property search set.
   * @isntance
   * @return {Layer[]} layers
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
   * Get searchable sources.
   * @instance
   * @return {Array<{external:"ol.source"}>} searchable/choosen sources
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
   * @instance
   * @param {string} value
   * @param {function} done
   */
  search: function (done) {

    var value = this.get('value')
    ,   items = []
    ,   promises = []
    ,   layers
    ,   sources
    ,   features = []
    ;

    function addRequest(searchProps) {
      promises.push(new Promise((resolve, reject) => {
        this.doWFSSearch({
          value: value,
          url: searchProps.url,
          featureType: searchProps.featureType,
          propertyName: searchProps.propertyName,
          srsName: searchProps.srsName,
          outputFormat: searchProps.outputFormat,
          geometryField: searchProps.geometryField,
          done: features => {
            if (features.length > 0) {
              items.push({
                layer: searchProps.caption,
                displayName: searchProps.displayName,
                propertyName: searchProps.propertyName,
                hits: features
              });
            }
            resolve();
          }
        });
      }));
    }

    if (this.get('selectionTools')) {
      features = this.get('selectionModel').get('source').getFeatures();
      this.set('features', features);
    }

    if (value === "" && features.length === 0) return;

    sources = this.getSources();
    layers  = this.getLayers();

    this.set('selectedIndices', []);

    layers.forEach(layer => {
      var searchProps = layer.get('search');
      searchProps.geometryField = /wfsserver/.test(searchProps.url.toLowerCase()) ? "Shape" : "the_geom";
      searchProps.caption = layer.get('caption');
      addRequest.call(this, searchProps);
    });

    sources.forEach(source => {
      var searchProps = {
        url: (HAJK2.searchProxy || "") + source.url,
        caption: source.caption,
        featureType: source.layers[0].split(':')[1],
        propertyName: source.searchFields.join(','),
        displayName: source.displayFields ? source.displayFields : (source.searchFields[0] || "Sökträff"),
        srsName: this.get('map').getView().getProjection().getCode(),
        outputFormat: source.outputFormat,
        geometryField: source.geometryField
      };
      addRequest.call(this, searchProps);
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

  shouldRenderResult: function () {
    return !!(
      this.get('value') ||
      (
        this.get('selectionModel') &&
        this.get('selectionModel').hasFeatures()
      )
    );
  },

  /**
   * Get style for search hit layer.
   * @instance
   * @return {external:"ol.style"} style
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
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function () {
    this.set('visible', true);
  },
};

/**
 * Search model module.<br>
 * Use <code>require('models/search')</code> for instantiation.
 * @module SearchModel-module
 * @returns {SearchModel}
 */
module.exports = ToolModel.extend(SearchModel);
