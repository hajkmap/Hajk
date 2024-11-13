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
            ? args.layersInfo.findIndex((l) => l.id === layer)
            : null;
        // Next, use that index to grab correct style and save its name for later use
        let style =
          args.layersInfo !== null &&
          getIndex >= 0 &&
          args.layersInfo[getIndex].style;

        let geoserverLegendOptions = "";

        if (args.serverType === "geoserver") {
          /**
           * GeoServer allows finer control over the legend appearance via the vendor parameter LEGEND_OPTIONS.
           * See: https://docs.geoserver.org/latest/en/user/services/wms/get_legend_graphic/index.html#controlling-legend-appearance-with-legend-options
           */
          // Use custom legend options if specified by admin
          geoserverLegendOptions = properties.mapConfig.map.hasOwnProperty(
            "geoserverLegendOptions"
          )
            ? "&LEGEND_OPTIONS=" +
              properties.mapConfig.map.geoserverLegendOptions
            : "";
        }

        // If layers URL already includes a query string separator (ie question mark), we want
        // to append the remaining values with &.
        const theGlue = args.url.includes("?") ? "&" : "?";

        // There might be a custom get-map url specified. The customGetMapUrl naming is a bit
        // confusing, since this custom url should not only be used for getMap-requests... The custom
        // url should be used for all requests, and the 'ordinary' url (args.url) should only be used
        // for the getCapabilities-request (used in admin). The custom url is used as a work around so
        // that problems linked to reverse-proxies can be avoided.
        // Let's check if there is a custom url, and if there is we'll use that one instead of the 'ordinary' url:
        const baseUrl = args.customGetMapUrl || args.url;
        // Then we can create the legend-url by combining all the necessary search-params end so on...
        legendUrl = `${proxy}${baseUrl}${theGlue}SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer}&STYLE=${style}${geoserverLegendOptions}`;
      }
      // If there's a legend URL specified in admin, use it as is
      else {
        legendUrl = args.legend;
      }

      return legendUrl;
    }

    function getLegends() {
      return args.layers.map((layer) => {
        return {
          url: getLegendUrl(layer),
          description: "Teckenförklaring",
        };
      });
    }

    /**
     * Returns OpenLayers server type string, given Hajk server type as input.
     * Certain Hajk server types are used only for admin interface and configuration switching,
     * but being treated as a common OL server-type in the client.
     * @param hajkServerType Hajk server type from config
     * @returns OpenLayers server type as string
     */
    function getOpenLayersServerType(hajkServerType) {
      if (!hajkServerType) {
        return null;
      }
      switch (hajkServerType) {
        case "geowebcache-standalone":
          return "geoserver";
        case "arcgis":
          return "mapserver";
        default:
          return hajkServerType;
      }
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
        extent: properties.mapConfig.map.extent,
      });
    }

    // In the GetMap operation the srs parameter is called crs in 1.3.0,
    // see: https://docs.geoserver.org/latest/en/user/services/wms/basics.html#differences-between-wms-versions
    const srsOrCrs = args.version === "1.3.0" ? "CRS" : "SRS";

    if (args.minZoom === 0 && args.maxZoom === 0) {
      // backend returns 0 if not set in past
      args.minZoom = undefined;
      args.maxZoom = undefined;
    }

    let config = {
      type: "wms",
      options: {
        id: args.id,
        url:
          (this.proxy || "") +
          (this.getPotentialCustomUrl(args.customGetMapUrl) || args.url),
        name: args.id, // FIXME: Should this be "args.caption"?
        layerType: args.layerType,
        caption: args.caption,
        visible: args.visibleAtStart,
        opacity: args.opacity || 1,
        zIndex: args.drawOrder || 0,
        maxZoom: args.maxZoom,
        minZoom: args.minZoom,
        minMaxZoomAlertOnToggleOnly: args.minMaxZoomAlertOnToggleOnly,
        infoClickSortType: args.infoClickSortType,
        infoClickSortDesc: args.infoClickSortDesc,
        infoClickSortProperty: args.infoClickSortProperty,
        information: args.infobox,
        resolutions: properties.mapConfig.map.allResolutions,
        projection: projection || "EPSG:3006",
        origin: properties.mapConfig.map.origin,
        extent: properties.mapConfig.map.extent,
        singleTile: args.singleTile || false,
        hidpi: args.hidpi,
        useCustomDpiList: args.useCustomDpiList,
        customDpiList: args.customDpiList,
        customRatio: args.customRatio,
        imageFormat: args.imageFormat || "image/png",
        serverType: getOpenLayersServerType(args.serverType),
        crossOrigin: properties.mapConfig.map.crossOrigin || "anonymous",
        attribution: args.attribution,
        showAttributeTableButton: args.showAttributeTableButton,
        searchUrl: args.searchUrl,
        searchPropertyName: args.searchPropertyName,
        searchDisplayName: args.searchDisplayName,
        searchShortDisplayName: args.searchShortDisplayName,
        searchOutputFormat: args.searchOutputFormat,
        searchGeometryField: args.searchGeometryField,
        legend: getLegends(),
        legendIcon: args.legendIcon,
        params: {
          LAYERS: args.layers.join(","),
          ...(args.cqlFilter && { CQL_FILTER: args.cqlFilter }), // nice way to add property only if needed
          FORMAT: args.imageFormat,
          INFO_FORMAT: args.infoFormat,
          VERSION: args.version || "1.1.1",
          [srsOrCrs]: projection || "EPSG:3006",
          TILED: args.tiled,
          STYLES: Array.isArray(args.layersInfo)
            ? args.layersInfo.map((l) => l.style || "").join(",")
            : null,
        },
        layersInfo: mapLayersInfo(args.layersInfo, args.infobox),
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOpenDataLink: args.infoOpenDataLink,
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow,
        timeSliderStart: args.timeSliderStart,
        timeSliderEnd: args.timeSliderEnd,
        visibleAtStartSubLayers: args.visibleAtStartSubLayers,
        rotateMap: args.rotateMap || "n",
      },
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
        srsName: properties.mapConfig.map.projection || "EPSG:3006",
        serverType: config.options.serverType,
      };
    }

    return config;
  }

  // There might be a custom getMap-url provided in the config. If there
  // is, we have to make sure to override the url-value with the custom getMap-url.
  // See #345 for more information.
  getPotentialCustomUrl(customGetMapUrl) {
    return customGetMapUrl?.trim().length > 0 ? customGetMapUrl : null;
  }

  mapWMTSConfig(args, properties) {
    if (args.minZoom === 0 && args.maxZoom === 0) {
      args.minZoom = undefined;
      args.maxZoom = undefined;
    }

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
        zIndex: args.drawOrder || 0,
        maxZoom: args.maxZoom,
        minZoom: args.minZoom,
        format: "image/png",
        crossOrigin: properties.mapConfig.map.crossOrigin || "anonymous",
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
        legendIcon: args.legendIcon,
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOpenDataLink: args.infoOpenDataLink,
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow,
        timeSliderStart: args.timeSliderStart,
        timeSliderEnd: args.timeSliderEnd,
        rotateMap: args.rotateMap || "n",
      },
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
        zIndex: args.drawOrder || 0,
        queryable: args.queryable !== false,
        extent: args.extent,
        projection: args.projection,
        rotateMap: args.rotateMap || "n",
      },
    };

    return config;
  }

  mapVectorConfig(args) {
    var config = {
      type: "vector",
      options: {
        attribution: args.attribution,
        caption: args.caption,
        content: args.content,
        dataFormat: args.dataFormat,
        fillColor: args.fillColor,
        filterable: args.filterable,
        filterAttribute: args.filterAttribute,
        filterComparer: args.filterComparer,
        filterValue: args.filterValue,
        icon: args.icon,
        id: args.id,
        infoOwner: args.infoOwner,
        information: args.infobox,
        displayFields: args.displayFields,
        secondaryLabelFields: args.secondaryLabelFields,
        shortDisplayFields: args.shortDisplayFields,
        infoclickIcon: args.infoclickIcon,
        infoText: args.infoText,
        infoTitle: args.infoTitle,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOpenDataLink: args.infoOpenDataLink,
        infoVisible: args.infoVisible || false,
        infoClickSortType: args.infoClickSortType,
        infoClickSortDesc: args.infoClickSortDesc,
        infoClickSortProperty: args.infoClickSortProperty,
        layerType: args.layerType,
        legend: [
          {
            url: args.legend,
            description: args.caption,
          },
        ],
        legendIcon: args.legendIcon,
        lineColor: args.lineColor,
        lineStyle: args.lineStyle,
        lineWidth: args.lineWidth,
        maxZoom: args.maxZoom,
        minZoom: args.minZoom,
        name: args.id,
        opacity: args.opacity,
        params: {
          service: "WFS",
          request: "GetFeature",
          version: args.version || "1.1.0",
          outputFormat:
            args.dataFormat === "GeoJSON" // If GeoJSON,
              ? "application/json" // set correct outputFormat (see https://docs.geoserver.org/latest/en/user/services/wfs/outputformats.html)
              : args.version === "1.0.0" // else (if dataFormat is not GeoJSON), check which WFS version we have and
                ? "GML2" // use the GML2 parser for WFS 1.0.0, or
                : "GML3", // GML3 for version > 1.0.0 (again, see above link).
          typename: args.layer,
          srsname: args.projection,
          bbox: "",
        },
        pointSize: args.pointSize,
        projection: args.projection,
        queryable: args.queryable,
        sldStyle: args.sldStyle,
        sldText: args.sldText,
        sldUrl: args.sldUrl,
        symbolXOffset: args.symbolXOffset,
        symbolYOffset: args.symbolYOffset,
        url: args.url,
        visible: args.visibleAtStart,
        timeSliderStart: args.timeSliderStart,
        timeSliderEnd: args.timeSliderEnd,
        zIndex: args.drawOrder || 0,
        rotateMap: args.rotateMap || "n",
      },
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
          LAYERS: "show:" + args.layers.join(","),
        },
        legend: [
          {
            url: getLegendUrl(args),
            description: "Teckenförklaring",
          },
        ],
        infoVisible: args.infoVisible || false,
        infoTitle: args.infoTitle,
        infoText: args.infoText,
        infoUrl: args.infoUrl,
        infoUrlText: args.infoUrlText,
        infoOpenDataLink: args.infoOpenDataLink,
        infoOwner: args.infoOwner,
        hideExpandArrow: args.hideExpandArrow,
        timeSliderStart: args.timeSliderStart,
        timeSliderEnd: args.timeSliderEnd,
        zIndex: args.drawOrder || 0,
        rotateMap: args.rotateMap || "n",
      },
    };

    return config;
  }
}
