import { Projection } from "ol/proj";

export default class ConfigMapper {
  constructor(proxy) {
    this.proxy = proxy;
  }

  mapWMSConfig(args, properties) {
    function getLegendUrl(layer) {
      var legend = "";
      // If property exists in map settings, use specified legend options (font, color, size, etc)
      let geoserverLegendOptions = "";
      if (properties.mapConfig.map.hasOwnProperty("geoserverLegendOptions")) {
        geoserverLegendOptions =
          "legend_options=" + properties.mapConfig.map.geoserverLegendOptions;
      }

      var w = 60;
      var h = 60;

      if (args.layers.length > 1) {
        w = 30;
        h = 30;
      }

      if (args.legend === "") {
        legend = `${proxy}${
          args.url
        }?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=${w}&HEIGHT=${h}&LAYER=${layer}&${geoserverLegendOptions}`;
      }

      var protocol = /^http/.test(legend) ? "" : "https://";
      return protocol + legend;
    }

    function getLegends() {
      return args.layers.map(layer => {
        return {
          url: getLegendUrl(layer),
          description: "Teckenförklaring"
        };
      });
    }

    function mapLayersInfo(layersInfo) {
      if (Array.isArray(layersInfo)) {
        return layersInfo.reduce((layersInfoObject, layerInfo) => {
          layersInfoObject[layerInfo.id] = layerInfo;
          if (!layerInfo.legend) {
            layersInfoObject[layerInfo.id].legend = getLegendUrl(layerInfo.id);
          }
          return layersInfoObject;
        }, {});
      }
    }

    let proxy = this.proxy || "";

    // We can not assume that args.projection is sat,
    // and if it's not, we should fall back to map config's projection.
    let projection =
      args.projection !== null
        ? args.projection
        : properties.mapConfig.map.projection;

    // WMS 1.3.0 requires a custom Projection object, as we need to specify 'axisOrientation'
    if (args.version === "1.3.0") {
      // Create a new Projection
      let projCode = projection;
      projection = new Projection({
        code: projCode,
        axisOrientation: "neu",
        extent: properties.mapConfig.map.extent
      });
    }

    // In the GetMap operation the srs parameter is called crs in 1.3.0,
    // see: https://docs.geoserver.org/latest/en/user/services/wms/basics.html#differences-between-wms-versions
    const srsOrCrs = args.version === "1.3.0" ? "CRS" : "SRS";
    let config = {
      type: "wms",
      options: {
        id: args.id,
        url: (this.proxy || "") + args.url,
        name: args.id, // FIXME: Should this be "args.caption"?
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        opacity: args.opacity || 1,
        queryable: args.queryable !== false,
        information: args.infobox,
        resolutions: properties.mapConfig.map.resolutions,
        projection: projection || "EPSG:3006",
        origin: properties.mapConfig.map.origin,
        extent: properties.mapConfig.map.extent,
        singleTile: args.singleTile || false,
        imageFormat: args.imageFormat || "image/png",
        serverType: args.serverType || "geoserver",
        attribution: args.attribution,
        searchUrl: args.searchUrl,
        searchPropertyName: args.searchPropertyName,
        searchDisplayName: args.searchDisplayName,
        searchOutputFormat: args.searchOutputFormat,
        searchGeometryField: args.searchGeometryField,
        legend: getLegends(),
        params: {
          LAYERS: args.layers.join(","),
          FORMAT: args.imageFormat,
          INFO_FORMAT: args.infoFormat,
          VERSION: args.version || "1.1.1",
          [srsOrCrs]: projection || "EPSG:3006",
          TILED: args.tiled,
          STYLES: Array.isArray(args.layersInfo)
            ? args.layersInfo.map(l => l.style || "").join(",")
            : null
        },
        layersInfo: mapLayersInfo(args.layersInfo),
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner
      }
    };

    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        url: (this.proxy || "") + args.url.replace("wms", "wfs"),
        featureType:
          args.layers[0].split(":")[1] || args.layers[0].split(":")[0],
        propertyName: args.searchFields.join(","),
        displayName: args.displayFields
          ? args.displayFields
          : args.searchFields[0] || "Sökträff",
        srsName: properties.mapConfig.map.projection || "EPSG:3006"
      };
    }

    return config;
  }

  mapExtendedWMSConfig(args, properties) {
    const createLegendConfig = (url, layer) => {
      let strippedUrl = url ? url.split("?")[0] : args.url;
      let legendUrl = `${strippedUrl}?REQUEST=GetLegendGraphic&VERSION=${
        args.version
      }&FORMAT=image/png&WIDTH=32&HEIGHT=32&LAYER=${layer.name}&STYLE=${
        layer.style
      }&legend_options=forceLabels:on`;
      let protocol = /^http/.test(legendUrl) ? "" : "https://";

      return {
        url: protocol + legendUrl,
        description: layer.name
      };
    };

    var config = {
      type: args.type,
      options: {
        id: args.id,
        url: (this.proxy || "") + args.url,
        name: args.id,
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        opacity: 1,
        queryable: true,
        information: args.infobox,
        resolutions: properties.mapConfig.map.resolutions,
        projection:
          args.projection || properties.mapConfig.map.projection || "EPSG:3006",
        origin: properties.mapConfig.map.origin,
        extent: properties.mapConfig.map.extent,
        singleTile: args.singleTile || false,
        imageFormat: args.imageFormat || "image/png",
        serverType: args.serverType || "geoserver",
        attribution: args.attribution,
        legend: args.layers.map(l => createLegendConfig(args.legend, l)),
        layersconfig: args.layers,
        params: {
          LAYERS: args.layers
            .map(function(l) {
              return l.name;
            })
            .join(","),
          STYLES: args.layers
            .map(function(l) {
              return l.style || "";
            })
            .join(","),
          FORMAT: args.imageFormat,
          // Openlayers stödjer ej SWEREF 99  i wms verion 1.3.0
          // Vi har överlagring av funktion för tile men inte för single tile
          VERSION: args.singleTile || false ? "1.1.0" : args.version,
          TILED: args.tiled,
          INFO_FORMAT: args.infoFormat
        },
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner
      }
    };

    if (args.searchFields && args.searchFields[0]) {
      config.options.search = {
        url: (this.proxy || "") + args.url.replace("wms", "wfs"),
        featureType:
          args.layers[0].split(":")[1] || args.layers[0].split(":")[0],
        propertyName: args.searchFields.join(","),
        displayName: args.displayFields
          ? args.displayFields
          : args.searchFields[0] || "Sökträff",
        srsName: properties.mapConfig.map.projection || "EPSG:3006"
      };
    }
    return config;
  }

  mapWMTSConfig(args, properties) {
    var config = {
      type: "wmts",
      options: {
        id: args.id,
        name: args.id,
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart !== false,
        extent: properties.mapConfig.map.extent,
        queryable: false,
        opacity: args.opacity || 1,
        format: "image/png",
        wrapX: false,
        url: args.url,
        layer: args.layer,
        matrixSet: args.matrixSet,
        style: args.style,
        projection: args.projection,
        origin: args.origin,
        resolutions: args.resolutions,
        matrixIds: args.matrixIds,
        attribution: args.attribution,
        legend: args.legend,
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner
      }
    };
    return config;
  }

  mapDataConfig(args) {
    var config = {
      type: "data",
      options: {
        id: args.id,
        url: (this.proxy || "") + args.url,
        name: args.id,
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        opacity: 1,
        queryable: args.queryable !== false,
        extent: args.extent,
        projection: args.projection
      }
    };

    return config;
  }

  mapVectorConfig(args) {
    var config = {
      type: "vector",
      options: {
        id: args.id,
        dataFormat: args.dataFormat,
        name: args.id,
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        opacity: args.opacity,
        serverType: "arcgis",
        loadType: "ajax",
        projection: args.projection,
        fillColor: args.fillColor,
        lineColor: args.lineColor,
        lineStyle: args.lineStyle,
        lineWidth: args.lineWidth,
        url: args.url,
        queryable: args.queryable,
        information: args.infobox,
        icon: args.legend,
        symbolXOffset: args.symbolXOffset,
        symbolYOffset: args.symbolYOffset,
        pointSize: args.pointSize,
        filterAttribute: args.filterAttribute,
        filterValue: args.filterValue,
        labelAlign: args.labelAlign,
        labelBaseline: args.labelBaseline,
        labelSize: args.labelSize,
        labelOffsetX: args.labelOffsetX,
        labelOffsetY: args.labelOffsetY,
        labelWeight: args.labelWeight,
        labelFont: args.labelFont,
        labelFillColor: args.labelFillColor,
        labelOutlineColor: args.labelOutlineColor,
        labelOutlineWidth: args.labelOutlineWidth,
        labelAttribute: args.labelAttribute,
        showLabels: args.showLabels,
        featureId: "FID",
        legend: [
          {
            url: args.legend,
            description: args.caption
          }
        ],
        params: {
          service: "WFS",
          version: "1.1.0",
          request: "GetFeature",
          typename: args.layer,
          srsname: args.projection,
          bbox: ""
        },
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner
      }
    };

    return config;
  }

  mapArcGISConfig(args) {
    function getLegendUrl() {
      if (!Array.isArray(args.legend)) {
        if (/^data/.test(args.legend)) {
          args.legend = args.legend.split("#");
        } else if (!/^http/.test(args.legend)) {
          args.legend = "https://" + args.legend;
        }
      }
      return args.legend;
    }

    var config = {
      type: "arcgis",
      options: {
        id: args.id,
        url: args.url,
        name: args.id,
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        queryable: args.queryable !== false,
        singleTile: args.singleTile !== false,
        extent: args.extent,
        information: args.infobox,
        projection: args.projection,
        opacity: args.opacity,
        attribution: args.attribution,
        params: {
          LAYERS: "show:" + args.layers.join(",")
        },
        legend: [
          {
            url: getLegendUrl(args),
            description: "Teckenförklaring"
          }
        ],
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner
      }
    };

    return config;
  }
}
