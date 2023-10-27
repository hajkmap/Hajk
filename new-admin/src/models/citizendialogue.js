import { Model } from "backbone";
import $ from "jquery";
import X2JS from "x2js";
import { prepareProxyUrl } from "../utils/ProxyHelper";

const x2js = new X2JS({ attributePrefix: "" });

var citizendialogue = Model.extend({
  defaults: {
    layers: [],
  },

  getConfig: function (url, callback) {
    $.ajax(url, {
      success: (data) => {
        if (data.wfstlayers) {
          data.wfstlayers.sort((a, b) => {
            var d1 = parseInt(a.date, 10),
              d2 = parseInt(b.date, 10);
            return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
          });
        }
        this.set("layers", data.wfstlayers || []);
        if (callback) {
          callback(this.get("layers"));
        }
      },
    });
  },

  addLayer: function (layer, callback) {
    $.ajax({
      url: this.get("config").url_layer_settings,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      },
    });
  },

  updateLayer: function (layer, callback) {
    $.ajax({
      url: this.get("config").url_layer_settings,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(layer),
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      },
    });
  },

  removeLayer: function (layer, callback) {
    $.ajax({
      url: this.get("config").url_layer_settings + "/" + layer.id,
      method: "DELETE",
      contentType: "application/json",
      success: () => {
        callback(true);
      },
      error: () => {
        callback(false);
      },
    });
  },

  getLayerDescription: function (url, layer, callback) {
    url = prepareProxyUrl(url, this.get("config").url_proxy);
    $.ajax(url, {
      data: {
        service: "WFS",
        request: "describeFeatureType",
        // Not part of WFS 1.0.0/1.1.0 spec, but GeoServer supports it,
        // so we try it first. Later on we'll check if we got back JSON
        // or XML (e.g. QGIS Server will ignore outputFormat and return XML)
        // and handle it properly.
        outputFormat: "application/json",
        typename: layer,
      },
      success: (data, status, xhr) => {
        // We can't assume that we got back a JSON object! GeoServer will work,
        // but e.g. QGIS Server follows the WFS specification more strictly and
        // ignores the outputFormat value will return a XMLDocument.
        if (data instanceof XMLDocument) {
          const json = x2js.xml2js(xhr.responseText);

          // The array we want is nestled down a bit (at least it follows the WFS
          // specification so we can assume that properties exist).
          const properties =
            json.schema.complexType.complexContent.extension.sequence.element;
          const mapped = properties.map((e, index) => {
            return {
              index: index,
              hidden: Boolean(e.hidden),
              name: e.name,
              // Remove the 'gml:' part from the string, if it exists
              localType: e.type.includes(":") ? e.type.split(":")[1] : e.type,
              nillable: Boolean(e.nillable),
              // If 'type' already includes ':', don't prepend the 'xds:'
              type: e.type.includes(":") ? e.type : `xsd:${e.type}`,
              maxOccurs: Number.parseInt(e.maxOccurs) || 1,
              minOccurs: Number.parseInt(e.minOccurs) || 0,
            };
          });
          callback(mapped);
        } else if (data.featureTypes && data.featureTypes[0]) {
          // If the response wasn't XMLDocument, we assume it's GeoJSON
          callback(data.featureTypes[0].properties);
        } else {
          callback(false);
        }
      },
    });
  },

  parseWFSCapabilitesTypes: function (data) {
    var types = [];
    $(data)
      .find("FeatureType")
      .each((i, featureType) => {
        types.push({
          name: $(featureType).find("Name").first().get(0).textContent,
          title: $(featureType).find("Title").first().get(0).textContent,
        });
      });
    return types;
  },

  getWMSCapabilities: function (url, callback) {
    $.ajax(prepareProxyUrl(url, this.get("config").url_proxy), {
      data: {
        service: "WFS",
        request: "GetCapabilities",
      },
      success: (data) => {
        var response = this.parseWFSCapabilitesTypes(data);
        callback(response);
      },
      error: (data) => {
        callback(false);
      },
    });
  },
});

export default citizendialogue;
