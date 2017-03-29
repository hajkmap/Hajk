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
// https://github.com/hajkmap/Hajk

var ToolModel = require('tools/tool');
var SelectionModel = require('models/selection');
var arraySort = require('utils/arraysort');
var kmlWriter = require('utils/kmlwriter');

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
 * @property {string} exportUrl
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
  anchor: [
    16,
    32
  ],
  imgSize: [
    32,
    32
  ],
  maxZoom: 14,
  exportUrl: "",
  displayPopup: false,
  hits: []
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

    this.featureLayer.getSource().on('addfeature', evt => {
      evt.feature.setStyle(this.featureLayer.getStyle());
    });

    this.get('map').addLayer(this.featureLayer);

    if (this.get('selectionTools')) {
      this.set('selectionModel', new SelectionModel({
        map: shell.getMap().getMap(),
        layerCollection: shell.getLayerCollection()
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

  /**
   * @instance
   * @property {number} exportHitsFormId
   */
  exportHitsFormId: 1234,

  /**
   * Create a property filter
   * @instance
   * @param {object} props
   * @return {string} wfs-filter
   */
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

   if (multipleAttributes && props.value) {
     return `<ogc:Or>${conditions}</ogc:Or>`;
   } else {
     return conditions;
   }
  },

  isCoordinate: function (c) {
    return typeof c[0] === "number" && typeof c[1] === "number";
  },

  /**
   * Create a feature filter
   * @instance
   * @param {object} props
   * @return {string} wfs-filter
   */
  getFeatureFilter: function (features, props) {
    if (Array.isArray(features) && features.length > 0) {

      return features.reduce((str, feature) => {

        var posList = ""
        ,   operation = "Intersects"
        ,   coords = [];

        if (feature.getGeometry() instanceof ol.geom.Circle) {
          coords = ol.geom.Polygon.fromCircle(feature.getGeometry(), 96).getCoordinates();
        } else {
          coords = feature.getGeometry().getCoordinates();
        }

        if (this.isCoordinate(coords[0])) {
          posList = coords.map(c => c[0] + " " + c[1]).join(" ");
        }

        if (this.isCoordinate(coords[0][0])) {
          posList = coords[0].map(c => c[0] + " " + c[1]).join(" ");
        }

        if (this.isCoordinate(coords[0][0][0])) {
          posList = coords[0][0].map(c => c[0] + " " + c[1]).join(" ");
        }

        if (feature.operation === "Within") {
          operation = feature.operation;
        }

        str += `
            <ogc:${operation}>
              <ogc:PropertyName>${props.geometryField}</ogc:PropertyName>
              <gml:Polygon srsName="${props.srsName}">
              <gml:exterior>
                <gml:LinearRing>
                  <gml:posList>${posList}</gml:posList>
                </gml:LinearRing>
                </gml:exterior>
              </gml:Polygon>
            </ogc:${operation}>
        `;

        if (features.length > 1) {
          str = `<ogc:Or>${str}</ogc:Or>`;
        }

        return str;

      }, "");
    } else {
      return "";
    }
  },

  /**
   * Perform a WFS-search.
   * @instance
   * @param {object} props
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
        features = features.reduce((r, f) => {
          var found = this.get('features').find(feature =>
            f.getId() === feature.getId()
          );
          if (!found) {
            r.push(f);
          }
          return r;
        }, []);
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
         xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'
         outputFormat="${outputFormat}"
         maxFeatures="1000">
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
    var ovl = this.get('map').getOverlayById('popup-0');
    if (this.get('selectionModel')) {
      this.get('selectionModel').abort();
    }
    this.featureLayer.getSource().clear();
    this.set('items', []);
    if (ovl) {
      ovl.setPosition(undefined);
    }
  },

  /**
   * Translate infobox template
   * @instance
   * @param {string} information template
   * @param {object} object to translate
   * @return {string} markdown
   */
  translateInfoboxTemplate: function(information, properties) {
    (information.match(/\{.*?\}\s?/g) || []).forEach(property => {
        function lookup(o, s) {
          s = s.replace('{', '')
               .replace('}', '')
               .replace('export:', '')
               .trim()
               .split('.');

          switch (s.length) {
            case 1: return o[s[0]] || "";
            case 2: return o[s[0]][s[1]] || "";
            case 3: return o[s[0]][s[1]][s[2]] || "";
          }
        }
        information = information.replace(property, lookup(properties, property));
    });
    return information;
  },

  /**
   * Convert object to markdown
   * @instance
   * @param {object} object to transform
   * @return {string} markdown
   */
  objectAsMarkdown: function (o) {
    return Object
      .keys(o)
      .reduce((str, next, index, arr) =>
        /^geom$|^geometry$|^the_geom$/.test(arr[index]) ?
        str : str + `**${arr[index]}**: ${o[arr[index]]}\r`
      , "");
  },

  /**
   * Get information
   * @instance
   * @param {extern:ol.feature} feature
   * @return {string} information
   */
  getInformation: function(feature) {

    var info = feature.infobox || feature.getProperties();
    var content = "";

    if (typeof info === 'object')
      content = this.objectAsMarkdown(info);

    if (typeof info === 'string')
      content = this.translateInfoboxTemplate(info, feature.getProperties());

    return marked(content, { sanitize: false, gfm: true, breaks: true });
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
    ,   size   = map.getSize()
    ,   ovl    = map.getOverlayById('popup-0');

    this.set('hits', [spec.hit]);
    map.getView().fit(extent, {
      size: size,
      maxZoom: this.get('maxZoom')
    });

    this.featureLayer.getSource().clear();
    this.featureLayer.getSource().addFeature(spec.hit);

    if (ovl && this.get('displayPopup')) {
      $('#popup-content').html(this.getInformation(spec.hit));
      ovl.setPosition(map.getView().getCenter());
    }

    if (ovl && !this.get('displayPopup')) {
      ovl.setPosition(undefined);
    }

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

  append: function (spec) {

    var map    = this.get('map')
    ,   exist  = this.get('selectedIndices').find(item => item.group === spec.id && spec.index === item.index)
    ,   extent = spec.hit.getGeometry().getExtent()
    ,   size   = map.getSize()
    ,   ovl    = map.getOverlayById('popup-0');

    this.get('hits').push(spec.hit);

    map.getView().fit(extent, size, { maxZoom: this.get('maxZoom') });

    this.featureLayer.getSource().addFeature(spec.hit);

    if (ovl) {
      ovl.setPosition(undefined);
    }

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

  detach: function (spec) {

    var map    = this.get('map')
    ,   ovl    = map.getOverlayById('popup-0')
    ,   exist  = this.get('selectedIndices').find(item =>
                   item.group === spec.id &&
                   spec.index === item.index
                 );

    this.set('hits', this.get('hits').filter(hit =>
      hit.getId() !== spec.hit.getId()
    ));

    this.featureLayer.getSource().removeFeature(spec.hit);

    if (ovl) {
      ovl.setPosition(undefined);
    }

    if (this.get('selectedIndices') instanceof Array) {
      this.set('selectedIndices', this.get('selectedIndices').filter(f =>
        f.index !== spec.index &&
        f.id !== spec.id
      ));
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

  getKmlData: function () {
    var transformed = kmlWriter.transform(
      this.get('hits'),
      this.get('map').getView().getProjection().getCode(),
      "EPSG:4326"
    );
    return kmlWriter.createXML(transformed, "Export");
  },

  getExcelData: function () {

    var groups = {};

    this.get('hits').forEach(hit => {
      if (!groups.hasOwnProperty(hit.caption)) {
        groups[hit.caption] = [];
      }
      groups[hit.caption].push(hit);
    });

    return Object.keys(groups).map(group => {

      var columns = []
      ,   values = [];

      values = groups[group].map((hit) => {

        var attributes = hit.getProperties()
        ,   names = Object.keys(attributes);

        names = names.filter(name => {
          if (!hit.infobox) {
            return typeof attributes[name] === "string"  ||
                   typeof attributes[name] === "boolean" ||
                   typeof attributes[name] === "number";
          } else {
            let regExp = new RegExp(`{export:${name}}`);
            return (
              regExp.test(hit.infobox)
            );
          }
        });

        if (names.length > columns.length) {
          columns = names;
        }
        return columns.map(name => attributes[name] || null);
      });

      var e = {
        TabName: group,
        Cols: columns,
        Rows: values
      };

      return {
        TabName: group,
        Cols: columns,
        Rows: values
      };

    });
  },

  export: function (type) {

    var url = ""
    ,   data = {}
    ,   postData = ""
    ,   form   = document.createElement('form')
    ,   input  = document.createElement('input')
    ,   curr   = document.getElementById(this.exportHitsFormId)

    switch (type) {
      case 'kml':
        url = this.get('kmlExportUrl');
        data = this.getKmlData();
        postData = data;
        break;
      case 'excel':
        url = this.get('excelExportUrl');
        data = this.getExcelData();
        postData = JSON.stringify(data);
        break;
    }

    form.id = this.exportHitsFormId;
    form.method = "post";
    form.action = url;
    input.value = postData;
    input.name  = "json";
    input.type  = "hidden";
    form.appendChild(input);

    if (curr)
      document.body.replaceChild(form, curr);
    else
      document.body.appendChild(form);

    form.submit();
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
              features.forEach(feature => {
                feature.caption = searchProps.caption;
                feature.infobox = searchProps.infobox;
              });
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
      features = this.get('selectionModel').getFeatures();
      this.set('features', features);
    }

    if (value === "" && features.length === 0) return;

    sources = this.getSources();
    layers  = this.getLayers();

    this.set('hits', []);
    this.set('selectedIndices', []);
    this.featureLayer.getSource().clear();

    layers.forEach(layer => {
      var searchProps = layer.get('search');
      searchProps.geometryField = /wfsserver/.test(searchProps.url.toLowerCase()) ? "Shape" : "the_geom";
      searchProps.caption = layer.get('caption');
      searchProps.infobox = layer.get('infobox');
      addRequest.call(this, searchProps);
    });
    sources.forEach(source => {
      var searchProps = {
        url: (HAJK2.searchProxy || "") + source.url,
        caption: source.caption,
        infobox: source.infobox,
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
        anchor: this.get('anchor'),
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        src: this.get('markerImg'),
        imgSize: this.get('imgSize')
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
    this.set('toggled', !this.get('toggled'));
  },
};

/**
 * Search model module.<br>
 * Use <code>require('models/search')</code> for instantiation.
 * @module SearchModel-module
 * @returns {SearchModel}
 */
module.exports = ToolModel.extend(SearchModel);
