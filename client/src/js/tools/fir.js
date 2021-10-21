var ToolModel = require("tools/tool");
var FirSelectionModel = require("models/firselection");
var arraySort = require("utils/arraysort");
var kmlWriter = require("utils/kmlwriter");

var FirModelProperties = {
  type: "fir",
  panel: "firpanel",
  toolbar: "bottom",
  icon: "fa fa-home icon",
  title: "Fastighet",
  visible: false,
  value: "",
  filter: "",
  exaktMatching: true,
  filterVisibleActive: false,
  markerImg: "assets/icons/marker.png",
  base64Encode: false,
  instruction: "",
  instructionSokning: "",
  instructionHittaGrannar: "",
  instructionSkapaFastighetsforteckning: "",
  searchExpandedClassButton: "fa fa-angle-up clickable arrow pull-right",
  searchMinimizedClassButton: "fa fa-angle-down clickable arrow pull-right",
  anchor: [16, 32],
  imgSize: [32, 32],
  maxZoom: 14,
  kmlImportUrl: "/mapservice/import/kml",
  kmlExportUrl: "",
  firSelectionTools: false,
  //displayPopup: false,
  moveablePopup: false,
  //displayPopupBar: false,
  hits: [],
  popupOffsetY: 0,
  aliasDict: {},
  chosenColumns: [], //Fastighet:port83&84
  feature: undefined,
  hittaGrannar: false,
  backupItems: [],
  colorResult: "", //'rgba(255, 255, 0, 0.4)',
  colorResultStroke: "", //'rgba(0, 0, 0, 0.6)',
  colorHighlight: "", //'rgba(0, 0, 255, 0.5)',
  colorHighlightStroke: "", //'rgba(0, 0, 0, 0.6)',
  colorHittaGrannarBuffer: "", //'rgba(50, 200, 200, 0.4)',
  colorHittaGrannarBufferStroke: "", //'rgba(0, 0, 0, 0.2)',
  showLabels: true,
  infoKnappLogo: "",
  realEstateLayer: "",
  realEstateWMSLayer: "",
};

var FirModel = {
  defaults: FirModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {
    //this.set('displayPopupBar', this.get('displayPopup'));
    this.set("layerCollection", shell.getLayerCollection());
    this.set("map", shell.getMap().getMap());

    this.firFeatureLayer = new ol.layer.Vector({
      caption: "FIRSökresltat",
      name: "fir-search-vector-layer",
      source: new ol.source.Vector(),
      queryable: true,
      visible: true,
    });

    this.firFeatureLayer.getSource().on("addfeature", (evt) => {
      evt.feature.setStyle(
        new ol.style.Style({
          fill: new ol.style.Fill({
            color: this.get("colorResult"), //'rgba(255, 26, 179, 0.4)'
          }),
          stroke: new ol.style.Stroke({
            color: this.get("colorResultStroke"),
            width: 4,
          }),
          image: new ol.style.Icon({
            anchor: this.get("anchor"),
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            src: this.get("markerImg"),
            imgSize: this.get("imgSize"),
          }),
          text: new ol.style.Text({
            font: "12px Calibri,sans-serif",
            fill: new ol.style.Fill({ color: "#000" }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 2,
            }),
            // get the text from the feature - `this` is ol.Feature
            // and show only under certain resolution
            text: this.get("showLabels")
              ? evt.feature.get(this.get("realEstateLayer").labelField)
              : "",
          }),
        })
      );
      //evt.feature.setStyleFunction(this.firFeatureLayer.getStyle);
    });

    this.get("map").addLayer(this.firFeatureLayer);

    this.highlightResultLayer = new ol.layer.Vector({
      caption: "FIRHighlight",
      name: "fir-highlight-vector-layer",
      source: new ol.source.Vector(),
      queryable: false,
      visible: true,
      //style: this.getHighlightStyle(),
      zIndex: 100,
    });

    this.highlightResultLayer.getSource().on("addfeature", (evt) => {
      //evt.feature.setStyle(this.highlightResultLayer.getStyle());

      evt.feature.setStyle(
        new ol.style.Style({
          fill: new ol.style.Fill({
            color: this.get("colorHighlight"),
          }),
          stroke: new ol.style.Stroke({
            color: this.get("colorHighlightStroke"),
            width: 4,
          }),
          image: new ol.style.Icon({
            anchor: this.get("anchor"),
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            src: this.get("markerImg"),
            imgSize: this.get("imgSize"),
          }),
          text: new ol.style.Text({
            font: "12px Calibri,sans-serif",
            fill: new ol.style.Fill({ color: "#000" }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 2,
            }),
            text: this.get("showLabels")
              ? evt.feature.get(this.get("realEstateLayer").labelField)
              : "",
          }),
        })
      ); //getStyle?
    });

    this.highlightResultLayer.getSource().on("removefeature", (evt) => {
      evt.feature.setStyle(
        new ol.style.Style({
          fill: new ol.style.Fill({
            color: this.get("colorResult"), //'rgba(255, 26, 179, 0.4)'
          }),
          stroke: new ol.style.Stroke({
            color: this.get("colorResultStroke"),
            width: 4,
          }),
          image: new ol.style.Icon({
            anchor: this.get("anchor"),
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            src: this.get("markerImg"),
            imgSize: this.get("imgSize"),
          }),
          text: new ol.style.Text({
            font: "12px Calibri,sans-serif",
            fill: new ol.style.Fill({ color: "#000" }),
            stroke: new ol.style.Stroke({
              color: "#fff",
              width: 2,
            }),
            // get the text from the feature - `this` is ol.Feature
            // and show only under certain resolution
            text: this.get("showLabels")
              ? evt.feature.get(this.get("realEstateLayer").labelField)
              : "",
          }),
        })
      ); //getStyle?
    });

    this.get("map").addLayer(this.highlightResultLayer);

    this.firBufferFeatureLayer = new ol.layer.Vector({
      caption: "FIRSökresltatBuffer",
      name: "fir-buffer-search-vector-layer",
      source: new ol.source.Vector(),
      queryable: false,
      visible: true,
      style: this.getFirBufferFeatureStyle(),
    });

    this.firBufferFeatureLayer.getSource().on("addfeature", (evt) => {
      evt.feature.setStyle(this.firBufferFeatureLayer.getStyle());
    });

    this.get("map").addLayer(this.firBufferFeatureLayer);

    this.firBufferHiddenFeatureLayer = new ol.layer.Vector({
      caption: "FIRHiddenSökresltatBuffer",
      name: "fir-buffer-hidden-search-vector-layer",
      source: new ol.source.Vector(),
      queryable: false,
      visible: false,
      style: this.getFirBufferHiddenFeatureStyle(),
    });

    this.firBufferHiddenFeatureLayer.getSource().on("addfeature", (evt) => {
      evt.feature.setStyle(this.firBufferHiddenFeatureLayer.getStyle());
    });

    this.get("map").addLayer(this.firBufferHiddenFeatureLayer);

    if (this.get("firSelectionTools")) {
      this.set(
        "firSelectionModel",
        new FirSelectionModel({
          map: shell.getMap().getMap(),
          layerCollection: shell.getLayerCollection(),
        })
      );
    }
  },

  clickedOnMap: function (event) {
    if (this.get("plusActive") || this.get("minusActive")) {
      return;
    }

    // check if clicked on feature in firResultLayer, then expand in result list
    var that = this;
    this.get("map").forEachFeatureAtPixel(
      event.pixel,
      function (feature, layer) {
        if (layer !== null && layer.get("caption") === "FIRSökresltat") {
          // var get id
          var hitId = 0;
          var group = 0;
          var nyckelHighLight = feature.get(
            that.get("realEstateLayer").fnrField
          );
          var omradeHighLight = feature.get(
            that.get("realEstateLayer").omradeField
          );
          for (var i = 0; i < that.get("items")[group].hits.length; i++) {
            var currentNyckel = that
              .get("items")
              [group].hits[i].get(that.get("realEstateLayer").fnrField);
            var currentOmrade = that
              .get("items")
              [group].hits[i].get(that.get("realEstateLayer").omradeField);
            if (
              nyckelHighLight === currentNyckel &&
              omradeHighLight === currentOmrade
            ) {
              hitId = i;
              break;
            }
          }

          var clickedonId = "hit-" + hitId + "-group-0";

          var hitObject = $("#" + clickedonId);
          var currentHitId = "#info-hit-" + hitId + "-group-0";
          var infoHitObject = $(currentHitId);

          // Ta bort blå färg
          if (that.get("previousViewed") == clickedonId) {
            that.highlightResultLayer.getSource().clear();
            if (hitObject.hasClass("selected")) {
              hitObject.toggleClass("selected");
            }
            if (infoHitObject.is(":visible")) {
              infoHitObject.toggle();
            }
            that.set("previousViewed", undefined);
            return;
          } else {
            if (!hitObject.hasClass("selected")) {
              hitObject.toggleClass("selected");
            }
            $("#" + that.get("previousViewed")).toggleClass("selected");
            $("#info-" + that.get("previousViewed")).toggle();
            that.set("previousViewed", clickedonId);
          }

          if (!infoHitObject.is(":visible")) {
            infoHitObject.toggle();
          }
          that.highlightResultLayer.getSource().clear();
          that.highlightResultLayer.getSource().addFeature(feature);

          window.location.hash = clickedonId;
        }
      }
    );
  },

  /**
   * @instance
   * @property {XMLHttpRequest[]} requests
   */
  requests: [],

  /**
   * @instance
   * @property {external:"ol.layer"} firFeatureLayer
   */
  firFeatureLayer: undefined,

  /**
   * @instance
   * @property {external:"ol.layer"} highlightResultLayer
   */
  highlightResultLayer: undefined,

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
    var multipleAttributes = props.propertyName.split(",").length > 1;
    var conditions = props.propertyName
      .split(",")
      .reduce((condition, property) => {
        /*  if (props.value == null){
                return condition;
            } */
        props.value.indexOf("\\") >= 0
          ? (props.value = props.value.replace(/\\/g, "\\\\"))
          : props.value;

        //check if it's exakt/lika sökning
        var exaktMatching = props.exaktMatching;
        var wildcard;
        if (exaktMatching) {
          wildcard = "";
        } else {
          wildcard = "*";
        }

        if (props.value) {
          return (condition += `
          <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
            <ogc:PropertyName>${property}</ogc:PropertyName>
            <ogc:Literal>${props.value}${wildcard}</ogc:Literal>
          </ogc:PropertyIsLike>`);
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
        var posList = "",
          operation = "Intersects",
          coords = [],
          objektType = "",
          interiorList = "";

        if (feature.getGeometry() instanceof ol.geom.Circle) {
          coords = ol.geom.Polygon.fromCircle(
            feature.getGeometry(),
            96
          ).getCoordinates();
        } else {
          coords = feature.getGeometry().getCoordinates();
        }

        var found = false;

        if (
          feature.getGeometryName() === "Point" ||
          feature.getGeometryName() === "LineString" ||
          feature.getGeometryName() === "geometry"
        ) {
          // buffer points, linestrings and all kml imported values a bit since geoserver wants polygons !!!
          coords = this.bufferPoint(feature);
        }

        if (this.isCoordinate(coords[0])) {
          posList = coords.map((c) => c[0] + " " + c[1]).join(" ");
          found = true;
        }

        if (!found && this.isCoordinate(coords[0][0])) {
          posList = coords[0].map((c) => c[0] + " " + c[1]).join(" ");
          // add interiors as well
          var prefix =
            "\n                <gml:interior>\n                  <gml:LinearRing>\n                    <gml:posList>";
          var suffix =
            "</gml:posList>\n                  </gml:LinearRing>\n                </gml:interior>";
          if (coords.length > 1) {
            for (var i = 1; i < coords.length; i++) {
              interiorList += prefix;
              interiorList += coords[i].map((c) => c[0] + " " + c[1]).join(" ");
              interiorList += suffix;
            }
          }
          found = true;
        }

        if (!found && this.isCoordinate(coords[0][0][0])) {
          posList = coords[0][0].map((c) => c[0] + " " + c[1]).join(" ");
          found = true;
        }

        if (feature.operation === "Within") {
          operation = feature.operation;
        }

        var distance = "";
        if (this.get("hittaGrannar")) {
          operation = "DWithin";
          distance = this.get("bufferLength"); // Need to write correct
          distance =
            '<ogc:Distance units="meter">' + distance + "</ogc:Distance>";
        }

        //gml:polygon -> objektType
        str += `
            <ogc:${operation}>
              <ogc:PropertyName>${props.geometryField}</ogc:PropertyName>
              <gml:Polygon srsName="${props.srsName}">
                <gml:exterior>
                  <gml:LinearRing>
                    <gml:posList>${posList}</gml:posList>
                  </gml:LinearRing>
                </gml:exterior>${interiorList}
              </gml:Polygon>
              ${distance}
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

  bufferPoint: function (feature) {
    var parser = new jsts.io.OL3Parser();
    var bufferLength = 0.01;

    var jstsGeom = parser.read(feature.getGeometry());

    // create a buffer of the required meters around each line
    var buffered = jstsGeom.buffer(bufferLength);

    // create a new feature and add in a new layer that has highlightstyle
    var buffer = new ol.Feature();

    // convert back from JSTS and replace the geometry on the feature
    buffer.setGeometry(parser.write(buffered)); // change this to new feature

    return buffer.getGeometry().getCoordinates();
  },

  /**
   * Perform a WFS-search.
   * @instance
   * @param {object} props
   */
  doWFSSearch: function (props) {
    var filters = "",
      str = "",
      featureFilter = "",
      propertyFilter = "",
      read = (result) => {
        //parses the XML result
        var format,
          features = [],
          outputFormat = props.outputFormat;
        if (outputFormat === "GML2") {
          format = new ol.format.GML2({});
        } else {
          format = new ol.format.WFS({});
        }

        if (!(result instanceof XMLDocument)) {
          if (result.responseText) {
            result = result.responseText;
          }
        }

        try {
          features = format.readFeatures(result);
          features = features.reduce((r, f) => {
            if (this.get("firSelectionTools")) {
              let found = this.get("features").find(
                (feature) => f.getId() === feature.getId()
              );
              if (!found || this.get("hittaGrannar")) {
                r.push(f);
              }
            } else {
              r.push(f);
            }
            return r;
          }, []);
        } catch (e) {
          console.error(
            "Parsningsfel. Koordinatsystem kanske saknas i definitionsfilen? Mer information: ",
            e
          );
        }
        if (features.length === 0) {
          features = [];
        }
        props.done(features);
      };

    outputFormat = props.outputFormat;

    if (!outputFormat || outputFormat === "") {
      outputFormat = "GML3";
    }

    propertyFilter = this.getPropertyFilter(props);
    if (props.enableFilter) {
      featureFilter = this.getFeatureFilter(this.get("features"), props);
    } else {
      featureFilter = "";
    }

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
    } else if (props.sameNameFilter) {
      filters = props.sameNameFilter;
    } else {
      filters = "";
    }

    var typeName = `'${props.featureType}'`;
    if (!typeName.includes(":")) {
      // If no namespace, add "feature:"
      typeName = `'feature:${props.featureType}'`;
    }

    str =
      `
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
         maxFeatures= "${this.get("realEstateLayer").maxFeatures}">
         <wfs:Query typeName=` +
      typeName +
      ` srsName='${props.srsName}'>
          <ogc:Filter>
            ${filters}
          </ogc:Filter>
         </wfs:Query>
      </wfs:GetFeature>`;

    var contentType = "text/xml",
      data = str;

    const _xhrFields =
      props.withCredentials === true ? { withCredentials: true } : null;

    this.requests.push(
      $.ajax({
        url: props.url,
        contentType: contentType,
        xhrFields: _xhrFields,
        type: "post",
        data: str,
        success: (result) => {
          read(result);
        },
        error: (result) => {
          if (result.status === 200) {
            read(result);
          } else {
            props.done([]);
          }
        },
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
  clear: function () {
    var ovl = this.get("map").getOverlayById("popup-0");
    if (this.get("firSelectionModel")) {
      this.get("firSelectionModel").abort();
    }
    this.firFeatureLayer.getSource().clear();
    this.highlightResultLayer.getSource().clear();
    this.firBufferFeatureLayer.getSource().clear();
    this.firBufferHiddenFeatureLayer.getSource().clear();
    this.set("items", []);
    this.set("barItems", []);
    if (ovl) {
      ovl.setPosition(undefined);
    }

    //plusminusLayer
    var map = this.get("map");
    map.getLayers().forEach((layer) => {
      if (layer.get("caption") == this.get("realEstateWMSLayerCaption")) {
        layer.setVisible(false);
      }
    });
  },

  /**
   * Translate infobox template
   * @instance
   * @param {string} information template
   * @param {object} object to translate
   * @return {string} markdown
   */
  translateInfoboxTemplate: function (information, properties) {
    (information.match(/\{.*?\}\s?/g) || []).forEach((property) => {
      function lookup(o, s) {
        s = s
          .replace("{", "")
          .replace("}", "")
          .replace("export:", "")
          .replace(/ as .*/, "")
          .trim()
          .split(".");

        switch (s.length) {
          case 1:
            return o[s[0]] || "";
          case 2:
            return o[s[0]][s[1]] || "";
          case 3:
            return o[s[0]][s[1]][s[2]] || "";
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
    return Object.keys(o).reduce(
      (str, next, index, arr) =>
        /^geom$|^geometry$|^the_geom$/.test(arr[index])
          ? str
          : str + `**${arr[index]}**: ${o[arr[index]]}\r`,
      ""
    );
  },

  /**
   * Get information
   * @instance
   * @param {extern:ol.feature} feature
   * @return {string} information
   */
  getInformation: function (feature) {
    var info = feature.infobox || feature.getProperties();
    var content = "";

    if (typeof info === "object") {
      content = this.objectAsMarkdown(info);
    }

    if (typeof info === "string") {
      content = this.translateInfoboxTemplate(info, feature.getProperties());
    }

    return marked(content, { sanitize: false, gfm: true, breaks: true });
  },

  /**
   * Check if this device supports touch.
   * @instance
   */
  isTouchDevice: function () {
    try {
      document.createEvent("TouchEvent");
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Enable scroll on infowindow
   * @instance
   * @param {DOMelement} elm
   */
  enableScroll: function (elm) {
    if (this.isTouchDevice()) {
      var scrollStartPos = 0;
      elm.addEventListener(
        "touchstart",
        function (event) {
          scrollStartPos = this.scrollTop + event.touches[0].pageY;
        },
        false
      );
      elm.addEventListener(
        "touchmove",
        function (event) {
          this.scrollTop = scrollStartPos - event.touches[0].pageY;
        },
        false
      );
    }
  },

  /**
   * Focus map on feature.
   * @instance
   * @param {object} spec
   *
   */
  focus: function (spec, isBar) {
    // Should change feature style (if this  is possible) of the one was clicked.
    // If a previous was clicked (can be stored in model). Change back the style to blue
    // After changing previous, save the current as the future previous
    function isPoint(coord) {
      if (coord.length === 1) {
        coord = coord[0];
      }
      return (coord.length === 2 || coord.length === 3) &&
        typeof coord[0] === "number" &&
        typeof coord[1] === "number"
        ? [coord[0], coord[1]]
        : false;
    }

    if (!(this.get("selectedIndices") instanceof Array)) {
      this.set("selectedIndices", []);
    }

    var map = this.get("map"),
      exist = this.get("selectedIndices").find(
        (item) => item.group === spec.id
      ), //selectedIndices is undefined
      extent = spec.hit.getGeometry().getExtent(),
      size = map.getSize(),
      offsetY = 0;

    this.set("hits", [spec.hit]);
    map.getView().fit(extent, {
      size: size,
      maxZoom: this.get("maxZoom"),
    });

    this.highlightResultLayer.getSource().addFeature(spec.hit);

    if (exist) {
      exist.index = spec.index;
    } else {
      this.get("selectedIndices").push({
        index: spec.index,
        group: spec.id,
      });
    }
  },

  append: function (spec) {
    var map = this.get("map"),
      exist = this.get("selectedIndices").find(
        (item) => item.group === spec.id && spec.index === item.index
      ),
      extent = spec.hit.getGeometry().getExtent(),
      size = map.getSize();

    this.get("hits").push(spec.hit);

    map.getView().fit(extent, size, { maxZoom: this.get("maxZoom") });

    //this.firFeatureLayer.getSource().addFeature(spec.hit);
    this.highlightResultLayer.getSource().addFeature(spec.hit);

    if (!(this.get("selectedIndices") instanceof Array)) {
      this.set("selectedIndices", []);
    }

    if (exist) {
      exist.index = spec.index;
    } else {
      this.get("selectedIndices").push({
        index: spec.index,
        group: spec.id,
      });
    }
  },

  detach: function (spec) {
    var map = this.get("map"),
      ovl = map.getOverlayById("popup-0"),
      exist = this.get("selectedIndices").find(
        (item) => item.group === spec.id && spec.index === item.index
      );

    this.set(
      "hits",
      this.get("hits").filter((hit) => hit.getId() !== spec.hit.getId())
    );

    this.firFeatureLayer.getSource().removeFeature(spec.hit);

    if (ovl) {
      ovl.setPosition(undefined);
    }

    if (this.get("selectedIndices") instanceof Array) {
      this.set(
        "selectedIndices",
        this.get("selectedIndices").filter(
          (f) => f.index !== spec.index && f.id !== spec.id
        )
      );
    }
  },

  /**
   * Get searchable layers.
   * @isntance
   * @return {Layer[]} layers
   */
  getLayers: function () {
    var filter = (layer) => {
      var criteria = this.get("filter");
      var visible = this.get("filterVisibleActive");
      var searchable = layer.get("searchUrl");
      return (
        (searchable && (visible ? layer.get("visible") : false)) ||
        layer.get("id") === criteria
      );
    };

    return this.get("layerCollection").filter(filter);
  },

  /**
   * Get searchable sources.
   * @instance
   * @return {Array<{external:"ol.source"}>} searchable/choosen sources
   */
  getSources: function () {
    var filter = (source) => {
      var criteria = this.get("filter");
      return criteria === "*" ? true : criteria === source.caption;
    };
    return this.get("sources").filter(filter);
  },

  /**
   * Get searchable layers. By design, visible layers and layers set with the property search set.
   * @isntance
   * @return {Layer[]} layers
   */
  getHitsFromItems: function () {
    var hits = [];
    if (this.get("hits").length === 0) {
      this.get("items").map((item) => {
        item.hits.forEach((hit, i) => {
          hit.setStyle(this.firFeatureLayer.getStyle());
          hits.push(hit);
        });
      });
    }
    return hits;
  },

  /**
   * Get kml data-object for export.
   * @isntance
   * @return {string} xml-string
   */
  getKmlData: function () {
    var exportItems =
      this.get("hits").length > 0 ? this.get("hits") : this.getHitsFromItems();

    var transformed = kmlWriter.transform(
      exportItems,
      this.get("map").getView().getProjection().getCode(),
      "EPSG:4326"
    );
    return kmlWriter.createXML(transformed, "Export");
  },

  /**
   * Get excel data-object for export.
   * @isntance
   * @return {Object} excelData
   */
  getExcelData: function () {
    var nycklar = [],
      exportItems =
        this.get("items")[0].hits.length > 0
          ? this.get("items")[0].hits
          : this.getHitsFromItems();

    if (exportItems.length > 1 && _.isEqual(exportItems[0], exportItems[1])) {
      // Ensure we don't have duplicate first items (happens when user selects items to export manually)
      exportItems.shift();
    }

    exportItems.forEach((hit) => {
      if (
        nycklar.indexOf(hit.get(this.get("realEstateLayer").fnrField) > -1) &&
        hit.get(this.get("realEstateLayer").fnrField) !== undefined
      ) {
        nycklar.push(hit.get(this.get("realEstateLayer").fnrField));
      }
    });

    var param = {};
    param["samfallighet"] =
      this.get("chosenColumns").indexOf("samfallighet") != -1;
    param["ga"] = this.get("chosenColumns").indexOf("ga") != -1;
    param["rattighet"] = this.get("chosenColumns").indexOf("rattighet") != -1;
    param["persnr"] = this.get("chosenColumns").indexOf("persnr") != -1;
    param["taxerad_agare"] =
      this.get("chosenColumns").indexOf("taxerad_agare") != -1;
    param["fastighet_utskick"] =
      this.get("chosenColumns").indexOf("fastighet_utskick") != -1;

    return { fnr: nycklar, param: param };
  },

  export: function (type) {
    var url = "",
      data = {},
      postData = "";
    postData = [];

    switch (type) {
      case "kml":
        url = this.get("kmlExportUrl");
        data = this.getKmlData();
        postData = data;
        break;
      case "excel":
        url = this.get("excelExportUrl");
        data = this.getExcelData();
        data = JSON.stringify(data);
        break;
    }

    this.set("downloading", true);

    if (this.get("base64Encode")) {
      postData = btoa(postData);
    }

    $.ajax({
      url: url,
      method: "post",
      data: {
        json: data,
        //'{ "fnr": ["130136787","130129850","130132945","130139213"] }'  //'{ "fnr": [' + data +'] }' //'{ "fnr": ["130136787","130129850","130132945","130139213"] }' //postData
      },
      format: "json",
      success: (url) => {
        this.set("downloading", false);
        this.set("url", url);
      },
      error: (err) => {
        this.set("downloading", false);
        alert(
          "Datamängden är för stor. Det går inte att exportera så många träffar. Begränsa ditt sökresultat."
        );
      },
    });
  },

  /**
   * Lookup searchable layers in loaded LayerCollection.
   * Stacks requests as promises and resolves when all requests are done.
   * @instance
   * @param {string} value
   * @param {function} done
   */
  search: function (done, isBar) {
    var value = this.get("value"),
      items = [],
      promises = [],
      layers,
      sources,
      features = [];
    if (this.get("hittaGrannar")) {
      value = "";
    }

    function addRequest(searchProps) {
      promises.push(
        new Promise((resolve, reject) => {
          this.doWFSSearch({
            value: value,
            url: searchProps.url,
            featureType: searchProps.featureType,
            propertyName: searchProps.propertyName,
            srsName: searchProps.srsName,
            outputFormat: searchProps.outputFormat,
            geometryField: searchProps.geometryField,
            enableFilter: true,
            exaktMatching: this.get("exaktMatching"),
            withCredentials: searchProps.withCredentials,
            done: (features) => {
              if (features.length > 0) {
                features.forEach((feature) => {
                  feature.caption = searchProps.caption;
                  feature.infobox = searchProps.infobox;
                  try {
                    feature.aliasDict = JSON.parse(searchProps.aliasDict);
                  } catch (e) {
                    feature.aliasDict = undefined;
                  }
                });
                items.push({
                  layer: searchProps.caption,
                  displayName: searchProps.displayName,
                  propertyName: searchProps.propertyName,
                  hits: features,
                });
              }
              resolve();
            },
          });
        })
      );
    }

    if (this.get("firSelectionTools")) {
      features = this.get("firSelectionModel").getFeatures();
      this.set("features", features);
    }

    var backupFilter = this.get("filter");
    var inHittaGrannar = this.get("hittaGrannar");
    if (inHittaGrannar) {
      features = this.firBufferHiddenFeatureLayer.getSource().getFeatures();
      this.set("features", features);
      this.set("filter", this.get("realEstateLayerCaption"));
    }

    if (value === "" && features.length === 0) return;

    sources = this.getSources();
    layers = this.getLayers();

    if (inHittaGrannar) {
      this.set("filter", backupFilter);
    }

    this.set("hits", []);
    this.set("selectedIndices", []);
    this.firFeatureLayer.getSource().clear();

    layers.forEach((layer) => {
      layer
        .get("params")
        .LAYERS.split(",")
        .forEach((featureType) => {
          var searchProps = {
            url: (HAJK2.searchProxy || "") + layer.get("searchUrl"),
            caption: layer.get("caption"),
            infobox: layer.get("infobox"),
            aliasDict: layer.get("aliasDict"),
            featureType: featureType,
            propertyName: layer.get("searchPropertyName"),
            displayName: layer.get("searchDisplayName"),
            srsName: this.get("map").getView().getProjection().getCode(),
            outputFormat: layer.get("searchOutputFormat"),
            geometryField: layer.get("searchGeometryField"),
            omradeField: layer.get(this.get("realEstateLayer").omradeField),
            withCredentials: layer.get("withCredentials"),
          };
          addRequest.call(this, searchProps);
        });
    });

    sources.forEach((source) => {
      var searchProps = {
        url: (HAJK2.searchProxy || "") + source.url,
        caption: source.caption,
        infobox: source.infobox,
        aliasDict: source.aliasDict,
        featureType: source.layers[0].split(":")[1],
        propertyName: source.searchFields.join(","),
        displayName: source.displayFields
          ? source.displayFields
          : source.searchFields[0] || "Sökträff",
        srsName: this.get("map").getView().getProjection().getCode(),
        outputFormat: source.outputFormat,
        geometryField: source.geometryField,
        withCredentials: source.withCredentials,
      };
      addRequest.call(this, searchProps);
    });

    Promise.all(promises).then(() => {
      items.forEach(function (item) {
        item.hits = arraySort({
          array: item.hits,
          index: item.displayName,
        });
      });
      items = items.sort((a, b) => (a.layer > b.layer ? 1 : -1));
      this.set("items", items);

      if (done) {
        this.set("hittaGrannar", false);
        done({
          status: "success",
          items: items,
        });
      }
    });
  },

  findWithSameNames: function (nycklar, layer, useOmrade) {
    var backupFilter = this.get("filter");
    this.set("filter", this.get("realEstateLayerCaption"));
    var sources = this.getSources();
    this.set("filter", backupFilter);
    var promises = [];

    sources.forEach((source) => {
      var searchProps = {
        url: (HAJK2.searchProxy || "") + source.url,
        caption: source.caption,
        infobox: source.infobox,
        aliasDict: source.aliasDict,
        featureType: source.layers[0].split(":")[1],
        propertyName: source.searchFields.join(","),
        displayName: source.displayFields
          ? source.displayFields
          : source.searchFields[0] || "Sökträff",
        srsName: this.get("map").getView().getProjection().getCode(),
        outputFormat: source.outputFormat,
        geometryField: source.geometryField,
        withCredentials: source.withCredentials,
      };

      var sameNameFilter = "";
      // Add initial or
      for (var i = 0; i < nycklar.length - 1; i++) {
        sameNameFilter += "<ogc:Or>";
      }

      var prefixNyckel =
        (useOmrade ? "<ogc:And>" : "") +
        '<ogc:PropertyIsEqualTo matchCase="false" wildCard="*" singleChar="." escapeChar="!">\n' +
        "            <ogc:PropertyName>" +
        this.get("realEstateLayer").fnrField +
        "</ogc:PropertyName>\n" +
        "            <ogc:Literal>";
      var suffixNyckel =
        "</ogc:Literal>\n" + "          </ogc:PropertyIsEqualTo>";
      var prefixOmrade =
        '<ogc:PropertyIsEqualTo matchCase="false" wildCard="*" singleChar="." escapeChar="!">\n' +
        "            <ogc:PropertyName>" +
        this.get("realEstateLayer").omradeField +
        "</ogc:PropertyName>\n" +
        "            <ogc:Literal>";
      var suffixOmrade =
        "</ogc:Literal>\n" + "          </ogc:PropertyIsEqualTo></ogc:And>";

      sameNameFilter += prefixNyckel + nycklar[0][0] + suffixNyckel;
      if (useOmrade) {
        sameNameFilter += prefixOmrade + nycklar[0][1] + suffixOmrade;
      }

      for (var i = 1; i < nycklar.length; i++) {
        sameNameFilter += prefixNyckel + nycklar[i][0] + suffixNyckel;
        if (useOmrade) {
          sameNameFilter += prefixOmrade + nycklar[i][1] + suffixOmrade;
        }
        sameNameFilter += "</ogc:Or>";
      }

      promises.push(
        new Promise((resolve, reject) => {
          this.doWFSSearch({
            value: "",
            url: searchProps.url,
            featureType: searchProps.featureType,
            propertyName: searchProps.propertyName,
            srsName: searchProps.srsName,
            outputFormat: searchProps.outputFormat,
            geometryField: searchProps.geometryField,
            enableFilter: false,
            exaktMatching: true,
            sameNameFilter: sameNameFilter,
            withCredentials: searchProps.withCredentials,
            done: (features) => {
              if (features.length > 0) {
                features.forEach((feature) => {
                  feature.caption = searchProps.caption;
                  feature.infobox = searchProps.infobox;
                  try {
                    feature.aliasDict = JSON.parse(searchProps.aliasDict);
                  } catch (e) {
                    feature.aliasDict = undefined;
                  }
                  this.get("items").map((group) => {
                    if (group.layer === source.caption) {
                      var found = false;
                      group.hits.forEach((hit) => {
                        if (
                          feature.get(this.get("realEstateLayer").fnrField) ===
                            hit.get(this.get("realEstateLayer").fnrField) &&
                          feature.get(
                            this.get("realEstateLayer").omradeField
                          ) === hit.get(this.get("realEstateLayer").omradeField)
                        ) {
                          found = true;
                        }
                      });

                      if (!found) {
                        group.hits.push(feature);
                        this.firFeatureLayer.getSource().addFeature(feature);
                      }
                    }
                  });
                });
              }
              resolve();
            },
          });
        })
      );
    });

    return promises;
  },

  findWithSameNyckel: function (keys, items) {
    var sources = this.getSources();
    var promises = [];

    if (typeof keys === "undefined" || keys.length == 0) {
      return [];
    }

    this.get("sources").forEach((source) => {
      if (source.caption === this.get("realEstateLayerCaption")) {
        var searchProps = {
          url: (HAJK2.searchProxy || "") + source.url,
          caption: source.caption,
          infobox: source.infobox,
          aliasDict: source.aliasDict,
          featureType: source.layers[0].split(":")[1],
          propertyName: source.searchFields.join(","),
          displayName: source.displayFields
            ? source.displayFields
            : source.searchFields[0] || "Sökträff",
          srsName: this.get("map").getView().getProjection().getCode(),
          outputFormat: source.outputFormat,
          geometryField: source.geometryField,
          withCredentials: source.withCredentials,
        };

        var sameNameFilter = "";
        // Add initial or
        for (var i = 0; i < keys.length - 1; i++) {
          sameNameFilter += "<ogc:Or>";
        }

        var prefixNyckel =
          '<ogc:PropertyIsEqualTo matchCase="false" wildCard="*" singleChar="." escapeChar="!">\n' +
          "            <ogc:PropertyName>" +
          this.get("realEstateLayer").fnrField +
          "</ogc:PropertyName>\n" +
          "            <ogc:Literal>";
        var suffixNyckel =
          "</ogc:Literal>\n" + "          </ogc:PropertyIsEqualTo>";

        sameNameFilter += prefixNyckel + keys[0][0] + suffixNyckel;

        for (var i = 1; i < keys.length; i++) {
          sameNameFilter += prefixNyckel + keys[i][0] + suffixNyckel;
          sameNameFilter += "</ogc:Or>";
        }

        promises.push(
          new Promise((resolve, reject) => {
            this.doWFSSearch({
              value: "",
              url: searchProps.url,
              featureType: searchProps.featureType,
              propertyName: searchProps.propertyName,
              srsName: searchProps.srsName,
              outputFormat: searchProps.outputFormat,
              geometryField: searchProps.geometryField,
              enableFilter: false,
              exaktMatching: true,
              sameNameFilter: sameNameFilter,
              withCredentials: searchProps.withCredentials,
              done: (features) => {
                if (features.length > 0) {
                  features.forEach((feature) => {
                    feature.caption = searchProps.caption;
                    feature.infobox = searchProps.infobox;
                    try {
                      feature.aliasDict = JSON.parse(searchProps.aliasDict);
                    } catch (e) {
                      feature.aliasDict = undefined;
                    }
                  });
                  items.push({
                    layer: searchProps.caption,
                    displayName: searchProps.displayName,
                    propertyName: searchProps.propertyName,
                    hits: features,
                  });
                }
                resolve();
              },
            });
          })
        );
      }
    });
    return promises;
  },

  firstStage: function (done) {
    /*   if(!this.props.model.get("hittaGrannar")){
            this.props.model.firBufferFeatureLayer.getSource().clear();
        }
        */
    var sources = this.getSources();
    var promises = [];
    var value = this.get("value");
    var items = [];
    var features = [];

    if (this.get("firSelectionTools")) {
      features = this.get("firSelectionModel").getFeatures();
      this.set("features", features);
    }

    sources.forEach((source) => {
      var searchProps = {
        url: (HAJK2.searchProxy || "") + source.url,
        caption: source.caption,
        infobox: source.infobox,
        aliasDict: source.aliasDict,
        featureType: source.layers[0].split(":")[1],
        propertyName: source.searchFields.join(","),
        displayName: source.displayFields
          ? source.displayFields
          : source.searchFields[0] || "Sökträff",
        srsName: this.get("map").getView().getProjection().getCode(),
        outputFormat: source.outputFormat,
        geometryField: source.geometryField,
        withCredentials: source.withCredentials,
      };

      if (value === "" && features.length === 0) return;

      promises.push(
        new Promise((resolve, reject) => {
          this.doWFSSearch({
            value: value,
            url: searchProps.url,
            featureType: searchProps.featureType,
            propertyName: searchProps.propertyName,
            srsName: searchProps.srsName,
            outputFormat: searchProps.outputFormat,
            geometryField: searchProps.geometryField,
            enableFilter: true,
            exaktMatching: this.get("exaktMatching"),
            withCredentials: searchProps.withCredentials,
            done: (features) => {
              var keys = [];
              if (features.length > 0) {
                var omradeField = "";
                var fnrField = "";
                this.get("sources").forEach((source) => {
                  if (source.caption === this.get("filter")) {
                    return this.get("layers").forEach((layer) => {
                      if (layer.id === source.id) {
                        fnrField = layer.fnrField;
                        omradeField = layer.omradeField;
                      }
                    });
                  }
                });

                features.forEach((feature) => {
                  keys.push([feature.get(fnrField), feature.get(omradeField)]);
                  //this.firFeatureLayer.getSource().addFeature(feature); // TODO Should be done only for addresspunkter
                });
              }

              var childPromises = this.findWithSameNyckel(keys, items);
              Promise.all(childPromises).then(() => {
                resolve();
              });
            },
          });
        })
      );
    });

    Promise.all(promises).then(() => {
      items.forEach(function (item) {
        item.hits = arraySort({
          array: item.hits,
          index: item.displayName,
        });
      });
      items = items.sort((a, b) => (a.layer > b.layer ? 1 : -1));
      this.set("items", items);

      if (done) {
        done({
          status: "success",
          items: items,
        });
      }
    });
  },

  shouldRenderResult: function () {
    return !!(
      this.get("value") ||
      (this.get("firSelectionModel") &&
        this.get("firSelectionModel").hasFeatures() &&
        this.get("searchTriggered"))
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
        color: this.get("colorResult"), //'rgba(255, 26, 179, 0.4)'
      }),
      stroke: new ol.style.Stroke({
        color: this.get("colorResultStroke"),
        width: 4,
      }),
      image: new ol.style.Icon({
        anchor: this.get("anchor"),
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        src: this.get("markerImg"),
        imgSize: this.get("imgSize"),
      }),
      text: new ol.style.Text({
        font: "12px Calibri,sans-serif",
        fill: new ol.style.Fill({ color: "#000" }),
        stroke: new ol.style.Stroke({
          color: "#fff",
          width: 2,
        }),
        // get the text from the feature - `this` is ol.Feature
        // and show only under certain resolution
        text: this.get("text"),
      }),
    });
  },

  /**
   * Get style for search buffer hit layer.
   * @instance
   * @return {external:"ol.style"} style
   *
   */
  getBufferStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(255, 26, 179, 0.4)", //this.get("colorBuffer")//'rgba(255, 26, 179, 0.4)'
      }),
      stroke: new ol.style.Stroke({
        color: "rgba(0, 0, 0, 0.4)",
        width: 4,
      }),
      image: new ol.style.Icon({
        anchor: this.get("anchor"),
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        src: this.get("markerImg"),
        imgSize: this.get("imgSize"),
      }),
    });
  },

  getFirBufferFeatureStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: this.get("colorHittaGrannarBuffer"), //'rgba(255, 26, 179, 0.4)'
      }),
      stroke: new ol.style.Stroke({
        color: this.get("colorHittaGrannarBuffer"),
        width: 4,
      }),
      image: new ol.style.Icon({
        anchor: this.get("anchor"),
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        src: this.get("markerImg"),
        imgSize: this.get("imgSize"),
      }),
    });
  },

  getFirBufferHiddenFeatureStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: "rgba(0, 0, 0, 0.0)",
      }),
      stroke: new ol.style.Stroke({
        color: "rgba(0, 0, 0, 0.0)",
        width: 4,
      }),
      image: new ol.style.Icon({
        anchor: this.get("anchor"),
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        src: this.get("markerImg"),
        imgSize: this.get("imgSize"),
      }),
    });
  },

  /**
   * Get style for marked search result and manual click
   * @instance
   * @return {external:"ol.style"} style
   *
   */
  getHighlightStyle: function () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: this.get("colorHighlight"),
      }),
      stroke: new ol.style.Stroke({
        color: this.get("colorHighlightStroke"),
        width: 4,
      }),
      image: new ol.style.Icon({
        anchor: this.get("anchor"),
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        src: this.get("markerImg"),
        imgSize: this.get("imgSize"),
      }),
    });
  },

  updateLabelVisibility: function () {
    this.firFeatureLayer
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        feature.setStyle(
          new ol.style.Style({
            fill: new ol.style.Fill({
              color: this.get("colorResult"), //'rgba(255, 26, 179, 0.4)'
            }),
            stroke: new ol.style.Stroke({
              color: this.get("colorResultStroke"),
              width: 4,
            }),
            image: new ol.style.Icon({
              anchor: this.get("anchor"),
              anchorXUnits: "pixels",
              anchorYUnits: "pixels",
              src: this.get("markerImg"),
              imgSize: this.get("imgSize"),
            }),
            text: new ol.style.Text({
              font: "12px Calibri,sans-serif",
              fill: new ol.style.Fill({ color: "#000" }),
              stroke: new ol.style.Stroke({
                color: "#fff",
                width: 2,
              }),
              // get the text from the feature - `this` is ol.Feature
              // and show only under certain resolution
              text: this.get("showLabels")
                ? feature.get(this.get("realEstateLayer").labelField)
                : "",
            }),
          })
        );
      });
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
  clicked: function (arg) {
    this.set("visible", true);
    this.set("toggled", !this.get("toggled"));
  },
};

module.exports = ToolModel.extend(FirModel);
