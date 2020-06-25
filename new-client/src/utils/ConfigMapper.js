import { Projection } from "ol/proj";

export default class ConfigMapper {
  constructor(proxy) {
    this.proxy = proxy;
  }

  mapWMSConfig(args, properties) {
    function getLegendUrl(layer) {
      let legendUrl = "";

      // If there's no legend URL specified, we'll need to get it from our WMS
      if (args.legend === "") {
        /**
         * A layer can have multiple styles, so when getting Legend Graphic, it's important
         * to get it for the currently selected style.
         */

        // First get index if we're dealing with array
        let getIndex =
          args.layersInfo !== null
            ? args.layersInfo.findIndex(l => l.id === layer)
            : null;
        // Next, use that index to grab correct style and save its name for later use
        let style =
          args.layersInfo !== null &&
          getIndex >= 0 &&
          args.layersInfo[getIndex].style;

        /**
         * GeoServer allows finer control over the legend appearance via the vendor parameter LEGEND_OPTIONS.
         * See: https://docs.geoserver.org/latest/en/user/services/wms/get_legend_graphic/index.html#controlling-legend-appearance-with-legend-options
         */
        // Use custom legend options if specified by admin
        const geoserverLegendOptions = properties.mapConfig.map.hasOwnProperty(
          "geoserverLegendOptions"
        )
          ? "LEGEND_OPTIONS=" + properties.mapConfig.map.geoserverLegendOptions
          : "";

        // TODO: Make width and height of WMS legend graphics customizable via admin
        const w = 30;
        const h = 30;
        legendUrl = `${proxy}${args.url}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=${w}&HEIGHT=${h}&LAYER=${layer}&STYLE=${style}&${geoserverLegendOptions}`;
      }
      // If there's a legend URL specified in admin, use it as is
      else {
        legendUrl = args.legend;
      }

      // If 'legend' URL doesn't start with "http", add "https://" prior 'legend', else let it be as is
      const protocol = /^http/.test(legendUrl) ? "" : "https://";
      return protocol + legendUrl;
    }

    function getLegends() {
      return args.layers.map(layer => {
        return {
          url: getLegendUrl(layer),
          description: "Teckenförklaring"
        };
      });
    }

    function mapLayersInfo(layersInfo, infobox) {
      if (Array.isArray(layersInfo)) {
        return layersInfo.reduce((layersInfoObject, layerInfo) => {
          layersInfoObject[layerInfo.id] = layerInfo;
          if (!layerInfo.legend) {
            layersInfoObject[layerInfo.id].legend = getLegendUrl(layerInfo.id);
          }
          if (infobox?.length) {
            layersInfoObject[layerInfo.id].infobox = infobox;
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
        //information: args.infobox,
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
          ...(args.cqlFilter && { CQL_FILTER: args.cqlFilter }), // nice way to add property only if needed
          FORMAT: args.imageFormat,
          INFO_FORMAT: args.infoFormat,
          VERSION: args.version || "1.1.1",
          [srsOrCrs]: projection || "EPSG:3006",
          TILED: args.tiled,
          STYLES: Array.isArray(args.layersInfo)
            ? args.layersInfo.map(l => l.style || "").join(",")
            : null
        },
        layersInfo: mapLayersInfo(args.layersInfo, args.infobox),
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow
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
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow
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
        filterable: args.filterable,
        information: args.infobox,
        icon: args.legend,
        symbolXOffset: args.symbolXOffset,
        symbolYOffset: args.symbolYOffset,
        pointSize: args.pointSize,
        filterComparer: args.filterComparer,
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
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow
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
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow
      }
    };

    return config;
  }
}
