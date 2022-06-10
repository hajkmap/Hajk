import React from "react";
import { Component } from "react";
import $ from "jquery";
import { hfetch } from "utils/FetchWrapper";

var solpop;

const defaultState = {
  load: false,
  imageLoad: false,
  capabilities: false,
  validationErrors: [],
  layers: [],
  addedLayers: [],
  addedLayersInfo: {},
  id: "",
  caption: "",
  internalLayerName: "",
  content: "",
  date: "Fylls i per automatik",
  legend: "",
  legendIcon: "",
  owner: "",
  url: "",
  customGetMapUrl: "",
  opacity: 1.0,
  maxZoom: -1,
  minZoom: -1,
  minMaxZoomAlertOnToggleOnly: false,
  tiled: false,
  showAttributeTableButton: false,
  singleTile: false,
  hidpi: true,
  useCustomDpiList: false,
  customDpiList: [
    { "pxRatio": 0, "dpi": 90 },
    { "pxRatio": 2, "dpi": 180 },
    { "pxRatio": 3, "dpi": 270 }
  ],
  customRatio: 0,
  imageFormat: "",
  serverType: "geoserver",
  drawOrder: 1,
  layerType: "WMS",
  attribution: "",
  infoVisible: false,
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoUrlText: "",
  infoOwner: "",
  timeSliderVisible: false,
  timeSliderStart: "",
  timeSliderEnd: "",
  solpopup: solpop,
  capabilitiesList: [],
  version: "1.1.0",
  projection: "",
  infoFormat: "",
  infoClickSortProperty: "",
  infoClickSortType: "string",
  infoClickSortDesc: true,
  infoclickIcon: "",
  hideExpandArrow: false,
  style: [],
  workspaceList: [],
};

const supportedProjections = [
  "EPSG:3006",
  "EPSG:3007",
  "EPSG:3008",
  "EPSG:3009",
  "EPSG:3010",
  "EPSG:3011",
  "EPSG:3012",
  "EPSG:3013",
  "EPSG:3014",
  "EPSG:3015",
  "EPSG:3016",
  "EPSG:3017",
  "EPSG:3018",
  "EPSG:3021",
  "EPSG:4326",
  "EPSG:3857",
  "CRS:84",
];

const supportedInfoFormats = [
  "application/json",
  "text/xml",
  "application/geojson",
];

const supportedImageFormats = [
  "image/png",
  "image/png8",
  "image/png; mode=8bit",
  "image/jpeg",
  "image/vnd.jpeg-png",
  "image/vnd.jpeg-png8",
];

/**
 *
 */
class WMSLayerForm extends Component {
  componentDidMount() {
    let _state = { ...defaultState };
    _state.url = this.props.url;
    this.setState(_state);

    this.props.model.on("change:select-image", () => {
      this.setState({
        legend: this.props.model.get("select-image"),
      });
      this.validateField("select-image");
    });
    this.props.model.on("change:select-legend-icon", () => {
      this.setState({
        legendIcon: this.props.model.get("select-legend-icon"),
      });
      this.validateField("select-legend-icon");
    });


  }

  componentWillUnmount() {
    this.props.model.off("change:legend");
    this.props.model.off("change:select-legend-icon");
  }

  constructor() {
    super();
    this.state = { ...defaultState };
    this.layer = {};
  }

  reset() {
    this.setState({ ...defaultState });
  }

  loadLegend(e) {
    $("#select-image").attr("caller", "select-image");
    $("#select-image").trigger("click");
  }

  loadLegendIcon(e) {
    $("#select-legend-icon").attr("caller", "select-legend-icon");
    $("#select-legend-icon").trigger("click");
  }

  loadLayersInfoLegendIcon(e) {
    $("#select-layers-info-legend-icon").attr(
      "caller",
      "select-layers-info-legend-icon"
    );
    $("#select-layers-info-legend-icon").trigger("click");
  }

  renderLayerList() {
    let layers = this.renderLayersFromCapabilites();
    let tr =
      layers === null ? (
        <tr>
          <td colSpan="4">Klicka på Ladda-knappen för att se lagerlista</td>
        </tr>
      ) : (
        layers
      );
    return <tbody>{tr}</tbody>;
  }

  validateLayers(opts) {
    // If only one layer is selected, use title and abstract.
    if (
      this.state.addedLayers.length === 1 &&
      this.state.caption.length === 0
    ) {
      this.setState({
        caption: opts.title,
        infoText: opts.abstract,
      });
    } else if (this.state.addedLayers.length === 0) {
      this.setState({
        caption: "",
        infoText: "",
      });
    }
    this.validateField("layers");
  }

  appendLayer(e, checkedLayer, opts = {}) {
    if (e.target.checked === true) {
      let addedLayersInfo = { ...this.state.addedLayersInfo };

      // Let's find checked layers projection and pre-select it
      const foundCrs = this.state.capabilitiesList[
        "0"
      ].Capability.Layer.Layer.find((l) => {
        return l.Name === checkedLayer;
      });
      // Proceed only if this is the first layer to be added (else we risk overwriting existing user selection of projection).
      // Also, make sure that CRS property really exists before proceeding.
      if (
        foundCrs !== undefined &&
        foundCrs.hasOwnProperty("CRS") &&
        Object.keys(this.state.addedLayers).length === 0 &&
        this.state.addedLayers.constructor === Object
      ) {
        let projection;
        // Sometimes a layer announces multiple CRSs, and we need to handle that too
        if (Array.isArray(foundCrs.CRS)) {
          foundCrs.CRS.forEach((crs) => {
            if (supportedProjections.indexOf(crs) !== -1) projection = crs;
          });
        }
        // Or sometimes just one CRS is announced and our job is easier
        else {
          projection = foundCrs.CRS;
        }
        this.setState({ projection });
      }

      if (opts.children) {
        /**
         * TODO: If we're dealing with Named Tree type, we must ensure
         * that the group itself is unchecked (not added to the "green list"),
         * while its children must be checked and added. Vice versa on uncheck.
         * Below is an attempt:
         **/
        /**
         * The approach below didn't work out due to a racing scenario (setState
         * is async). Before we're done setting state, the loop is done, resulting
         * in only the last <input> being checked.
         *
         * This must be solved, but to get this working for now, we can inform the
         * user to preform the correct selection manually.
         **/
        // // Fake event
        // let e = {
        //   target: {
        //     checked: true
        //   }
        // };
        // opts.children.forEach(childLayer => {
        //   let trueTitle = childLayer.hasOwnProperty("Title")
        //     ? childLayer.Title
        //     : "";
        //   let abstract = childLayer.hasOwnProperty("Abstract")
        //     ? childLayer.Abstract
        //     : "";
        //   let o = {
        //     title: trueTitle,
        //     abstract: abstract,
        //     children: childLayer.Layer
        //   };
        //   this.appendLayer(e, childLayer.Name, o);
        // });

        // Temporary solution, until we manage it properly
        let message = `Det valda lagret (${checkedLayer}) är en lagergrupp som består av följande underlager:\n
        ${opts.children.map((ch) => ch.Title).join(", ")}\n
        I dagsläget saknar Hajk funktionaliteten att automatiskt lägga till underlagren, men du kan enkelt göra det själv genom att kryssa för underlagren vars namn du ser ovan. \n
        Se även till att avmarkera själva lagergruppen (${checkedLayer}), för den behöver du inte ha om du lägger till dess underlager.`;

        this.props.parent.setState({
          alert: true,
          alertMessage: message,
          caption: "Valt lager är en lagergrupp",
        });
        // End of temporary solution
      }

      addedLayersInfo[checkedLayer] = {
        id: checkedLayer,
        caption: "",
        legend: "",
        legendIcon: "",
        infobox: "",
        style: "",
        queryable: "",
        infoclickIcon: "",
      };
      this.setState(
        {
          addedLayers: [...this.state.addedLayers, checkedLayer],
          addedLayersInfo: addedLayersInfo,
        },
        () => this.validateLayers(opts)
      );
    } else {
      let addedLayersInfo = { ...this.state.addedLayersInfo };
      delete addedLayersInfo[checkedLayer];
      this.setState(
        {
          addedLayersInfo: addedLayersInfo,
          addedLayers: this.state.addedLayers.filter(
            (layer) => layer !== checkedLayer
          ),
        },
        () => this.validateLayers(opts)
      );
    }
  }

  /**
   * By default this method looks in the Capabilities document
   * for a layer with name that matches layerName. If a layer contains
   * another property named Layer (which means it basically is a group
   * with sublayer), this method is called recursively, still looking
   * for a layer with layerName but now looking inside the subgroup
   * instead of Capabilities document.
   * @param {String} layerName
   * @param {Array} arrayToSearchIn
   */
  findInCapabilities(
    layerName,
    arrayToSearchIn = this.state.capabilities.Capability.Layer.Layer
  ) {
    let match = null;
    match = arrayToSearchIn.find((l) => {
      if (l.hasOwnProperty("Layer")) {
        return this.findInCapabilities(layerName, l.Layer);
      }
      return l.Name === layerName;
    });
    return match;
  }

  renderLayerInfoInput(layerInfo) {
    var currentLayer = this.findInCapabilities(layerInfo.id);
    var imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;

    this.setState({
      style: currentLayer.Style || [],
    });

    let addedLayersInfo = this.state.addedLayersInfo;
    addedLayersInfo[layerInfo.id].styles = currentLayer.Style;
    this.setState({
      addedLayersInfo: addedLayersInfo,
    });

    let styles = layerInfo.styles
      ? layerInfo.styles.map((style, i) => (
          <option key={`style_${style.Name}_${i}`} value={style.Name}>
            {style.Name}
          </option>
        ))
      : null;

    return (
      <div class="layerDialog">
        <div class="form-row split3070">
          <div>
            <label>Visningsnamn</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              value={layerInfo.caption}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].caption = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
              type="text"
            />
            </div>
        </div>
        <div class="form-row">
          <div>
            <label>Inforuta</label>
          </div>

            <textarea
              class="infoClick"
              style={{ width: "100%" }}
              value={layerInfo.infobox}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].infobox = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
              type="text"
            />

        </div>
        <div class="form-row split0">
          <div>
            <label>Teckenförklaringsikon</label>
          </div>
          <div>
            <input
              style={{marginRight: "5px"}}
              type="text"
              value={layerInfo.legendIcon}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].legendIcon = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
            <span
              onClick={(e) => {
                this.props.model.on(
                  "change:select-layers-info-legend-icon",
                  () => {
                    this.validateField("select-layers-info-legend-icon");
                    let addedLayersInfo = this.state.addedLayersInfo;
                    addedLayersInfo[layerInfo.id].legendIcon =
                      this.props.model.get("select-layers-info-legend-icon");
                    this.setState(
                      {
                        addedLayersInfo: addedLayersInfo,
                      },
                      () => {
                        this.renderLayerInfoDialog(layerInfo);
                        this.props.model.off(
                          "change:select-layers-info-legend-icon"
                        );
                      }
                    );
                  }
                );
                this.loadLayersInfoLegendIcon(e);
              }}
              className="btn btn-default"
            >
              Välj fil {imageLoader}
            </span>
          </div>
        </div>

        <div class="form-row split0">
          <div>
            <label>Stil</label>
          </div>
          <div>
            <select
              value={layerInfo.style}
              className="control-fixed-width"
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].style = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            >
              <option value={""}>{"<default>"}</option>
              {styles}
            </select>
          </div>
        </div>

        <div className="separator">Infoclick</div>

        <div class="form-row split0">
          <div>
            <label>Infoklick</label>
          </div>
          <div>
            <input
              id="infoclickable"
              type="checkbox"
              checked={layerInfo.queryable}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].queryable = e.target.checked;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
        <div class="form-row split0">
          <div>
            <label>Infoclick-ikon</label> (
            <a
              href="https://fonts.google.com/icons?selected=Material+Icons"
              target="_blank"
              rel="noopener noreferrer"
            >
              lista
            </a>
            )
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              value={layerInfo.infoclickIcon}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].infoclickIcon = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
              type="text"
            />
          </div>
        </div>

        <div className="separator">Infoclick och sökning</div>

        <div class="form-row split50">
          <div>
            <label>Visningsfält (i resultatlistan)</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchDisplayName}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchDisplayName = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
        <div class="form-row split50">
          <div>
            <label>Sekundära visningsfält (i resultatlistan)</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.secondaryLabelFields}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].secondaryLabelFields =
                  e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
        <div class="form-row split50">
          <div>
            <label>Kort visningsfält (etikett i kartan)</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchShortDisplayName}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchShortDisplayName =
                  e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>

        <div className="separator">Sökning</div>

        <div class="form-row split3070">
          <div>
            <label>Url</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchUrl}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchUrl = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
        <div class="form-row split3070">
          <div>
            <label>Sökfält</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchPropertyName}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchPropertyName = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>

        <div class="form-row split3070">
          <div>
            <label>Utdataformat</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchOutputFormat}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchOutputFormat = e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
        <div class="form-row split3070">
          <div>
            <label>Geometrifält</label>
          </div>
          <div>
            <input
              style={{ width: "100%" }}
              type="text"
              value={layerInfo.searchGeometryField}
              onChange={(e) => {
                let addedLayersInfo = this.state.addedLayersInfo;
                addedLayersInfo[layerInfo.id].searchGeometryField =
                  e.target.value;
                this.setState(
                  {
                    addedLayersInfo: addedLayersInfo,
                  },
                  () => {
                    this.renderLayerInfoDialog(layerInfo);
                  }
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  renderLayerInfoDialog(layerInfo) {
    this.props.parent.setState({
      alert: true,
      alertMessage: this.renderLayerInfoInput(layerInfo),
      contentType: "react",
      caption: "Inställningar för lager",
    });
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(
        {
          target: {
            checked: false,
          },
        },
        layer
      );
      // Don't assume there is something to uncheck - the layer might have been deleted from WMS server,
      // and hence non existing in layers list and impossible to uncheck.
      if (
        this.refs[layer] !== undefined &&
        this.refs[layer].hasOwnProperty("checked")
      ) {
        this.refs[layer].checked = false;
      }
      this.validateField("layers");
    }

    return this.state.addedLayers.map((layer, i) => (
      <li className="layer" key={"addedLayer_" + i}>
        <span
          onClick={() => {
            this.renderLayerInfoDialog(this.state.addedLayersInfo[layer]);
          }}
        >
          {layer}
        </span>
        &nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)} />
      </li>
    ));
  }

  createGuid() {
    return Math.floor((1 + Math.random()) * 0x1000000)
      .toString(16)
      .substring(1);
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      var layers = [];

      const append = (layer, parentGuid) => {
        const guid = this.createGuid();

        let trueTitle = layer.hasOwnProperty("Title") ? layer.Title : "";
        let abstract = layer.hasOwnProperty("Abstract") ? layer.Abstract : "";

        let opts = {
          title: trueTitle,
          abstract: abstract,
          children: layer.Layer,
        };

        let queryableIcon =
          layer.queryable === "1" ? "fa fa-check" : "fa fa-remove";
        let isGroupIcon = layer.Layer ? "fa fa-check" : "fa fa-remove";

        return (
          <tr key={"fromCapability_" + guid}>
            <td className="wms-layer-name">
              <input
                ref={layer.Name}
                id={"layer" + guid}
                type="checkbox"
                data-type="wms-layer"
                checked={this.state.addedLayers.find((l) => l === layer.Name)}
                onChange={(e) => {
                  this.appendLayer(e, layer.Name, opts);
                }}
                // disabled={parentGuid !== null} // When we get auto-selection of sublayers to work, we should disable manual checking on sublayer items
              />
              &nbsp;
              <label htmlFor={"layer" + guid}>{trueTitle}</label>
            </td>
            <td>{layer.Name}</td>
            <td>
              <i className={isGroupIcon} />
            </td>
            <td>
              <i className={queryableIcon} />
            </td>
          </tr>
        );
      };

      /**
       * Previous to this recursive approach the code did check 3
       * levels down. Additionally it "flatted" the group layers down:
       * if there were sublayers, only sublayers were added, while the
       * parent group layer was ignored.
       *
       * This function handles all levels of subgrouping and additionally
       * also adds parent group layer, which is how it should be handled
       * according to WMS specification.
       */
      const recursivePushLayer = (layer, parentGuid = null) => {
        // Handle group type called "Containing category" in WMS specification.
        // Such group has no name attribute and can't be rendered on its own. If we
        // find one of these, don't add it to the list.
        if (layer.Name) layers.push(append(layer, parentGuid));
        // Next, check if there are sublayers and repeat the procedure
        if (layer.Layer) {
          // Create a guid to indicate which element is the parent of current
          const guid = this.createGuid();
          layer.Layer.forEach((layer) => {
            recursivePushLayer(layer, guid);
          });
        }
      };

      this.state.capabilities?.Capability?.Layer?.Layer &&
        this.state.capabilities.Capability.Layer.Layer.forEach((layer) => {
          recursivePushLayer(layer);
        });

      return layers;
    } else {
      return null;
    }
  }

  loadLayers(layer, callback) {
    this.loadWMSCapabilities(undefined, () => {
      // We can not assume that layer.version exists, because the
      // previous implementation of WMS in Hajk2 assumed it was "1.1.1"
      // and did not add "version" property.
      layer.version = layer.version || "1.1.1";

      var addedLayersInfo = {};
      var capabilities = this.state.capabilitiesList.find(
        (capabilities) => capabilities.version === layer.version
      );
      if (layer.layersInfo) {
        addedLayersInfo = layer.layersInfo.reduce((c, l) => {
          c[l.id] = l;
          return c;
        }, {});
      } else {
        addedLayersInfo = {};
        layer.layers.forEach((layer) => {
          addedLayersInfo[layer] = {
            id: layer,
            caption: "",
            legend: "",
            legendIcon: "",
            infobox: "",
            style: "",
            queryable: "",
            infoclickIcon: "",
          };
        });
      }

      this.setState(
        {
          addedLayers: layer.layers,
          addedLayersInfo: addedLayersInfo,
          capabilities,
          projection: layer.projection,
          version: capabilities.version,
          infoFormat: layer.infoFormat,
          infoClickSortProperty: layer.infoClickSortProperty ?? "",
          infoClickSortType: layer.infoClickSortType ?? "string",
          hideExpandArrow: layer.hideExpandArrow ?? false,
          minMaxZoomAlertOnToggleOnly:
            layer.minMaxZoomAlertOnToggleOnly ?? false,
          useCustomDpiList: layer.useCustomDpiList ?? false,
          customDpiList: layer.customDpiList?.length > 0 ? layer.customDpiList : [
            { "pxRatio": 0, "dpi": 90 },
            { "pxRatio": 2, "dpi": 180 },
            { "pxRatio": 3, "dpi": 270 }
          ],
        },
        () => {
          this.setServerType();
          this.validate();

          if (callback) callback();
        }
      );
    });
  }

  loadWMSCapabilities(e, callback) {
    if (e) {
      e.preventDefault();
    }

    this.setState({
      load: true,
      addedLayers: [],
      addedLayersInfo: {},
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined,
    });

    if (this.state.capabilities) {
      this.state.capabilities?.Capability?.Layer?.Layer &&
        this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
          if (this.refs.hasOwnProperty(layer.Name))
            this.refs[layer.Name].checked = false;
        });
    }

    var capabilitiesPromise = this.props.model.getAllWMSCapabilities(
      this.state.url
    );

    capabilitiesPromise
      .then((capabilitiesList) => {
        this.setState(
          {
            capabilitiesList,
            load: false,
          },
          () => {
            if (callback) {
              callback();
            } else {
              var capabilities = this.state.capabilitiesList[0];
              this.setState(
                {
                  capabilities,
                  version: capabilities.version,
                },
                () => {
                  this.setServerType();
                }
              );
            }
          }
        );
      })
      .catch((err) => {
        if (this.props.parentView) {
          this.props.parentView.setState({
            alert: true,
            alertMessage: "Servern svarar inte. Försök med en annan URL.",
          });
        }
      });
  }

  selectVersion(e) {
    var version = e.target.value;
    var capabilities = this.state.capabilitiesList.find(
      (capabilities) => capabilities.version === version
    );

    var singleTile = this.state.singleTile;

    this.setState({
      capabilities,
      version,
      singleTile,
    });

    this.setServerType();
  }

  setImageFormats() {
    let imgs;
    if (
      this.state.capabilities &&
      this.state.capabilities.Capability &&
      this.state.capabilities.Capability.Request &&
      this.state.capabilities.Capability.Request.GetMap
    ) {
      imgs = this.state.capabilities.Capability.Request.GetMap.Format;
    }

    let imgFormats = imgs
      ? supportedImageFormats.map((imgFormat, i) => {
          if (imgs.indexOf(imgFormat) > -1) {
            return <option key={i}>{imgFormat}</option>;
          } else {
            return "";
          }
        })
      : "";

    return imgFormats;
  }

  setServerType() {
    let formats;
    if (
      this.state.capabilities &&
      this.state.capabilities.Capability &&
      this.state.capabilities.Capability.Request &&
      this.state.capabilities.Capability.Request.GetFeatureInfo
    ) {
      formats =
        this.state.capabilities.Capability.Request.GetFeatureInfo.Format;
    }
    if (formats && formats.indexOf("application/geojson") > -1) {
      this.setState({ serverType: "arcgis" });
    }
  }

  setProjections() {
    let projections;
    if (
      this.state.capabilities &&
      this.state.capabilities.Capability &&
      this.state.capabilities.Capability.Layer
    ) {
      var RS = this.state.version === "1.3.0" ? "CRS" : "SRS";
      projections = this.state.capabilities.Capability.Layer[RS];
    }

    let projEles = projections
      ? supportedProjections.map((proj, i) => {
          if (projections.indexOf(proj) > -1) {
            return <option key={i}>{proj}</option>;
          } else {
            return "";
          }
        })
      : "";

    return projEles;
  }

  setInfoFormats() {
    let formats;
    if (
      this.state.capabilities &&
      this.state.capabilities.Capability &&
      this.state.capabilities.Capability.Request &&
      this.state.capabilities.Capability.Request.GetFeatureInfo
    ) {
      formats =
        this.state.capabilities.Capability.Request.GetFeatureInfo.Format;
    }

    let formatEles = formats
      ? supportedInfoFormats.map((format, i) => {
          if (formats.indexOf(format) > -1) {
            return <option key={i}>{format}</option>;
          } else {
            return "";
          }
        })
      : "";

    return formatEles;
  }

  /**
   * Populerar de fält som finns i modal för lagerinställningar layer.layer
   * @param {*} layer
   */
  setLayerSettings(layer) {
    // Hämta från capabilities det layer.layer som matchar namnet
    // var currentLayer = this.state.capabilities.Capability.Layer.Layer.find(
    //   l => {
    //     return l.Name === layer.name;
    //   }
    // );

    // Sätt det state som behövs för att modalen skall populeras och knapparna skall fungera
    this.setState({
      layerSettings: {
        settings: true,
        visible: true,
        //styles: currentLayer.Style || [],
        style: layer.style,
        name: layer.name,

        // confirmAction anropas från LayerAlert- komponenten och result är alertens state
        confirmAction: (result) => {
          this.saveLayerSettings(result, layer.name);
          this.setState({
            layerSettings: {
              settings: false,
              visible: false,
            },
          });
        },
        denyAction: () => {
          this.setState({
            layerSettings: {
              settings: false,
              visible: false,
            },
          });
        },
      },
    });
  }

  getLayer() {
    const o = {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      internalLayerName: this.getValue("internalLayerName"),
      url: this.getValue("url"),
      customGetMapUrl: this.getValue("customGetMapUrl"),
      owner: this.getValue("owner"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      legendIcon: this.getValue("legendIcon"),
      projection: this.getValue("projection"),
      layers: this.getValue("layers"),
      layersInfo: this.getValue("layersInfo"),
      searchFields: this.getValue("searchFields"),
      displayFields: this.getValue("displayFields"),
      visibleAtStart: this.getValue("visibleAtStart"),
      tiled: this.getValue("tiled"),
      showAttributeTableButton: this.getValue("showAttributeTableButton"),
      opacity: this.getValue("opacity"),
      maxZoom: this.getValue("maxZoom"),
      minZoom: this.getValue("minZoom"),
      minMaxZoomAlertOnToggleOnly: this.getValue("minMaxZoomAlertOnToggleOnly"),
      singleTile: this.getValue("singleTile"),
      hidpi: this.getValue("hidpi"),
      useCustomDpiList: this.state.useCustomDpiList,
      customDpiList: this.state.useCustomDpiList ? this.state.customDpiList : [],
      customRatio: this.getValue("customRatio"),
      imageFormat: this.getValue("imageFormat"),
      serverType: this.getValue("serverType"),
      attribution: this.getValue("attribution"),
      // drawOrder: this.getValue("drawOrder"),
      searchUrl: this.getValue("searchUrl"),
      searchPropertyName: this.getValue("searchPropertyName"),
      searchDisplayName: this.getValue("searchDisplayName"),
      secondaryLabelFields: this.getValue("secondaryLabelFields"),
      searchShortDisplayName: this.getValue("searchShortDisplayName"),
      searchOutputFormat: this.getValue("searchOutputFormat"),
      searchGeometryField: this.getValue("searchGeometryField"),
      infoVisible: this.getValue("infoVisible"),
      infoTitle: this.getValue("infoTitle"),
      infoText: this.getValue("infoText"),
      infoUrl: this.getValue("infoUrl"),
      infoUrlText: this.getValue("infoUrlText"),
      infoOwner: this.getValue("infoOwner"),
      timeSliderVisible: this.getValue("timeSliderVisible"),
      timeSliderStart: this.getValue("timeSliderStart"),
      timeSliderEnd: this.getValue("timeSliderEnd"),
      // solpopup: this.getValue("solpopup"),
      version: this.state.version,
      infoFormat: this.getValue("infoFormat"),
      infoClickSortProperty: this.getValue("infoClickSortProperty"),
      infoClickSortDesc: this.getValue("infoClickSortDesc"),
      infoClickSortType: this.getValue("infoClickSortType"),
      // infoclickIcon: this.getValue("infoclickIcon"),
      hideExpandArrow: this.getValue("hideExpandArrow"),
      // style: this.getValue("style"),

      zIndex: this.getValue("zIndex"),
    };
    return o;
  }

  getValue(fieldName) {
    function create_date() {
      return new Date().getTime().toString();
    }

    function format_layers(layers) {
      return layers.map((layer) => layer);
    }

    function format_layers_info(layersInfo) {
      return Object.keys(layersInfo).map((layerInfo) => ({
        ...layersInfo[layerInfo],
      }));
    }

    const input = this.refs["input_" + fieldName];
    let value = input ? input.value : "";

    // We must cast the following to Number, as String won't be accepted for those:
    if (["maxZoom", "minZoom"].indexOf(fieldName) > -1) {
      value = Number(value || -1);
      return value === 0 ? -1 : value;
    }
    if (fieldName === "minMaxZoomAlertOnToggleOnly") value = input.checked;
    if (fieldName === "date") value = create_date();
    if (fieldName === "singleTile") value = input.checked;
    if (fieldName === "hidpi") value = input.checked;
    if (fieldName === "useCustomDpiList") value = input.checked;
    if (fieldName === "customRatio")
      value = parseFloat(Number(value).toFixed(2));
    if (fieldName === "tiled") value = input.checked;
    if (fieldName === "showAttributeTableButton") value = input.checked;
    if (fieldName === "layers") value = format_layers(this.state.addedLayers);
    if (fieldName === "layersInfo")
      value = format_layers_info(this.state.addedLayersInfo);
    if (fieldName === "infoVisible") value = input.checked;
    if (fieldName === "timeSliderVisible") value = input.checked;
    // if (fieldName === "drawOrder") value = 1000;
    if (fieldName === "visibleAtStart") value = Boolean(value);
    if (fieldName === "searchFields") value = value || null;
    if (fieldName === "displayFields") value = value || null;
    if (fieldName === "zIndex") value = value || null;
    if (fieldName === "opacity") value = parseFloat(Number(value).toFixed(2));
    if (fieldName === "infoClickSortDesc") value = input.checked;
    if (fieldName === "hideExpandArrow") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = ["url", "caption", "layers"];
    var errors = [];

    validationFields.forEach((field) => {
      var valid = this.validateField(field, false, false);
      if (!valid) {
        errors.push(field);
      }
    });

    this.setState({
      validationErrors: errors,
    });

    return errors.length === 0;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find((v) => v === inputName)
      ? "validation-error"
      : "";
  }

  validateField(fieldName, forcedValue, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    function number(v) {
      return !empty(v) && !isNaN(Number(v));
    }

    function empty(v) {
      return typeof v === "string"
        ? v.trim() === ""
        : Array.isArray(v)
        ? v[0] === ""
        : false;
    }

    switch (fieldName) {
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "customRatio":
        if (isNaN(Number(value)) || value < 1 || value > 5) {
          valid = false;
        }
        break;
      case "opacity":
        if (isNaN(Number(value)) || value < 0 || value > 1) {
          valid = false;
        }
        break;
      case "minZoom":
      case "maxZoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
        if (value === "") {
          valid = false;
        }
        break;
      default:
        break;
    }

    if (updateState !== false) {
      if (!valid) {
        this.setState({
          validationErrors: [...this.state.validationErrors, fieldName],
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            (v) => v !== fieldName
          ),
        });
      }
    }

    return valid;
  }

  getWorkspaces = async (url) => {
    //
    url = url.substring(0, url.lastIndexOf("/")) + "/rest/workspaces";
    //
    const res = await hfetch(url);
    //
    const json = await res.json();
    //
    //this.setState({ workspaceList: json.workspaces.workspace });
    //
    var sortedWorksapes = json.workspaces.workspace.sort(GetSortOrder("name")); //Pass the attribute to be sorted on

    function GetSortOrder(prop) {
      return function (a, b) {
        if (a[prop] > b[prop]) {
          return 1;
        } else if (a[prop] < b[prop]) {
          return -1;
        }
        return 0;
      };
    }
    this.setState({ workspaceList: sortedWorksapes });
  };

  updateDpiList(e, kv, key){
    const index = this.state.customDpiList.findIndex(o => o === kv);

    if(e.target.value.includes(".") || e.target.value.includes(",")){
      kv[key] = parseFloat(parseFloat(e.target.value.replace(",", ".")).toFixed(1));
    }else{
      kv[key] = parseInt(e.target.value);
    }
    
    let newValue = [...this.state.customDpiList];
    newValue[index] = kv;
    this.setState({customDpiList: newValue});
  }

  removeDpiListRow(e, index){
    if(this.state.customDpiList.length <= 1){
      return;
    }
    let newValue = [...this.state.customDpiList];
    newValue.splice(index, 1);
    this.setState({customDpiList: newValue});
  }

  addDpiListRow(){
    let newValue = [...this.state.customDpiList];
    newValue.push({ pxRatio: 0, dpi: 90 });
    this.setState({customDpiList: newValue});
  }

  render() {
    const loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";
    const timeSliderClass = this.state.timeSliderVisible
      ? "tooltip-timeSlider"
      : "hidden";

    const version = this.state.version || "1.1.1";
    const infoFormat = this.state.infoFormat || "";

    return (
      <fieldset>
        <legend>WMS-lager</legend>
        <div className="separator">Anslutning</div>
        <div>
          <label>Servertyp</label>
          <select
            className="control-fixed-width"
            ref="input_serverType"
            value={this.state.serverType}
            onChange={(e) => {
              this.setState({ serverType: e.target.value });
              if (
                e.target.value === "geoserver"
                  ? (document.getElementById(
                      "availableWorkspaces"
                    ).style.display = "unset")
                  : (document.getElementById(
                      "availableWorkspaces"
                    ).style.display = "none")
              );
            }}
          >
            <option>geoserver</option>
            <option>mapserver</option>
            <option>qgis</option>
            <option>arcgis</option>
          </select>
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            onChange={(e) => {
              this.setState({ url: e.target.value });
              this.validateField("url");
            }}
            className={this.getValidationClass("url")}
          />
          {this.state.serverType === "geoserver" ? (
            <span
              onClick={(e) => {
                this.getWorkspaces(this.state.url);
              }}
              className="btn btn-default"
            >
              Hämta workspace
            </span>
          ) : (
            <span
              onClick={(e) => {
                this.loadWMSCapabilities(e);
              }}
              className="btn btn-default"
            >
              Ladda {loader}
            </span>
          )}
        </div>

        <div id="availableWorkspaces">
          <label>Välj workspace</label>
          <select
            className="control-fixed-width"
            ref="input_workspaceName"
            value={this.state.workspaceName}
            onChange={(e) =>
              this.setState({
                url:
                  this.state.url.substring(
                    0,
                    this.state.url.lastIndexOf("geoserver/") + 10
                  ) + e.target.value,
              })
            }
          >
            <option key="wms" value="wms">
              Alla
            </option>
            {this.state.workspaceList.map((workspace) => {
              return (
                <option
                  key={workspace.name + "/wms"}
                  value={workspace.name + "/wms"}
                >
                  {workspace.name}
                </option>
              );
            })}
          </select>
          &nbsp;
          <span
            onClick={(e) => {
              this.loadWMSCapabilities(e);
            }}
            className="btn btn-default"
          >
            Hämta lager {loader}
          </span>
        </div>

        <div className="separator">Inställningar för request</div>
        <div>
          <label>
            GetMap-url{" "}
            <i
              className="fa fa-question-circle"
              data-toggle="tooltip"
              title="OBS: Ange endast om GetMap-url:en skall vara en annan än den url som är angiven ovan. Majoriteten av administratörer lämnar detta fält tomt."
            />
          </label>
          <input
            type="text"
            ref="input_customGetMapUrl"
            value={this.state.customGetMapUrl}
            onChange={(e) => {
              this.setState({ customGetMapUrl: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Version</label>
          <select
            className="control-fixed-width"
            ref="input_version"
            onChange={this.selectVersion.bind(this)}
            value={version}
          >
            {this.state.capabilitiesList.map((capa) => {
              return (
                <option key={capa.version} value={capa.version}>
                  {capa.version}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label>Bildformat</label>
          <select
            className="control-fixed-width"
            ref="input_imageFormat"
            value={this.state.imageFormat}
            onChange={(e) => this.setState({ imageFormat: e.target.value })}
          >
            {this.setImageFormats()}
          </select>
        </div>
        <div>
          <label>Koordinatsystem</label>
          <select
            className="control-fixed-width"
            ref="input_projection"
            value={this.state.projection !== null ? this.state.projection : ""}
            onChange={(e) => this.setState({ projection: e.target.value })}
          >
            {this.setProjections()}
          </select>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_hidpi"
            id="input_hidpi"
            onChange={(e) => this.setState({ hidpi: e.target.checked })}
            checked={this.state.hidpi}
          />
          &nbsp;
          <label htmlFor="input_hidpi">
            Efterfråga hög DPI{" "}
            <i
              className="fa fa-question-circle"
              data-toggle="tooltip"
              title="Hämta 'kartbilder' med hög upplösning vid skärmar som stödjer detta (Inställning hidpi i OL-klasserna ImageWMS/TileWMS)"
            />
          </label>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_useCustomDpiList"
            id="input_useCustomDpiList"
            onChange={(e) => this.setState({ useCustomDpiList: e.target.checked })}
            checked={this.state.useCustomDpiList}
          />
          &nbsp;
          <label htmlFor="input_useCustomDpiList">
            Custom DPI {" "}
            <i
              className="fa fa-question-circle"
              data-toggle="tooltip"
              title="Hämta 'kartbilder' med specifik dpi vid pixelRatio-brytpunkt."
            />
          </label>
          {this.state.useCustomDpiList
            ? 
            <div>
              <div style={{display: "flex", color: "#c0c0c0"}}>
                <div style={{width: "155px"}}>pixel ratio</div>
                <div style={{width: "155px"}}>dpi</div>
              </div>              
            {
            this.state.customDpiList.map((kv, index) =>
              <div key={`${kv.pxRatio}__${kv.dpi}__${index}`} style={{display: "flex"}}>
                <div>
                  <input type="text" defaultValue={kv.pxRatio} style={{width: "150px"}}
                    onBlur={(e) => { this.updateDpiList(e, kv, "pxRatio"); }}/>
                </div>
                <div>
                  <input type="text" defaultValue={kv.dpi} style={{width: "150px"}}
                    onBlur={(e) => { this.updateDpiList(e, kv, "dpi"); }}/>
                    <button type="button" className="btn btn-default" style={{fontWeight: "bold"}} disabled={this.state.customDpiList.length === 1}
                      onClick={(e)=>{ this.removeDpiListRow(e, index); }}>-</button>
                    {index === this.state.customDpiList.length-1 ?
                    <button type="button" className="btn btn-default" style={{fontWeight: "bold", marginLeft: "5px"}}
                      onClick={(e)=>{ this.addDpiListRow(); }}>+</button>
                    : ""  
                  }
                </div>
              </div>
            )
            }
            </div>
            : null }
        </div>        
        <div>
          <input
            type="checkbox"
            ref="input_singleTile"
            id="input_singleTile"
            onChange={(e) => this.setState({ singleTile: e.target.checked })}
            checked={this.state.singleTile}
          />
          &nbsp;
          <label htmlFor="input_singleTile">Single tile</label>
          <div
            style={{
              paddingLeft: "20px",
              marginLeft: "4px",
              borderLeft: "2px double #1f1c1c",
            }}
          >
            <label htmlFor="input_customRatio">
              Custom ratio (Lämna som 0 för OL-default){" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Bestämmer storlek på bilden vid varje request där 1 är viewportens storlek och 2 är dubbelt så stor osv (Inställning för ratio i OL-klassen ImageWMS)"
              />
            </label>
            <input
              type="text"
              ref="input_customRatio"
              value={this.state.customRatio}
              disabled={!this.state.singleTile}
              onChange={(e) => {
                this.setState({ customRatio: e.target.value });
                this.validateField("customRatio");
              }}
              className={this.getValidationClass("customRatio")}
            />
          </div>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_tiled"
            id="input_tiled"
            onChange={(e) => {
              this.setState({ tiled: e.target.checked });
            }}
            checked={this.state.tiled}
          />
          &nbsp;
          <label htmlFor="input_tiled">GeoWebCache</label>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_showAttributeTableButton"
            id="input_showAttributeTableButton"
            onChange={(e) => {
              this.setState({ showAttributeTableButton: e.target.checked });
            }}
            checked={this.state.showAttributeTableButton}
          />
          &nbsp;
          <label
            htmlFor="input_showAttributeTableButton"
            style={{ width: "auto" }}
          >
            Visa knapp för attributtabell{" "}
            <i
              className="fa fa-question-circle"
              data-toggle="tooltip"
              title="Visar knappen för att visa lagrets attributtabell. Se även GitHub, issue #595."
            />
          </label>
        </div>
        <div className="separator">Tillgängliga lager</div>
        <div>
          <table
            style={{
              display: "block",
              overflowY: "scroll",
              maxHeight: "600px",
            }}
          >
            <thead>
              <tr>
                <td>Titel</td>
                <td>Namn</td>
                <td>Grupp</td>
                <td>Infoclick</td>
              </tr>
            </thead>
            {this.renderLayerList()}
          </table>
        </div>
        <div className="separator">Hantera valda lager</div>
        <div>
          <label>Valda lager*</label>
          <div
            ref="input_layers"
            className={
              this.getValidationClass("layers") + " layer-list-choosen"
            }
          >
            <ul>{this.renderSelectedLayers()}</ul>
          </div>
        </div>
        <div>
          <label>Stäng av möjlighet att expandera</label>
          <input
            type="checkbox"
            ref="input_hideExpandArrow"
            id="input_hideExpandArrow"
            onChange={(e) =>
              this.setState({ hideExpandArrow: e.target.checked })
            }
            checked={this.state.hideExpandArrow}
          />
        </div>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            onChange={(e) => {
              this.setState({ caption: e.target.value });
              this.validateField("caption");
            }}
            className={this.getValidationClass("caption")}
          />
        </div>
        <div>
          <label>Visningsnamn Admin</label>
          <input
            type="text"
            ref="input_internalLayerName"
            value={this.state.internalLayerName || ""}
            onChange={(e) => {
              this.setState({ internalLayerName: e.target.value });
              this.validateField("internalLayerName");
            }}
          />
        </div>

        <div>
          <label>Teckenförklaring</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            onChange={(e) => this.setState({ legend: e.target.value })}
          />
          <span
            onClick={(e) => {
              this.loadLegend(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>
            Teckenförklar
            <br />
            ingsikon
          </label>
          <input
            type="text"
            ref="input_legendIcon"
            value={this.state.legendIcon}
            onChange={(e) => this.setState({ legendIcon: e.target.value })}
          />
          <span
            onClick={(e) => {
              this.loadLegendIcon(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>Infoklick-format</label>
          <select
            className="control-fixed-width"
            style={{ dispaly: "in-line" }}
            ref="input_infoFormat"
            value={infoFormat}
            onChange={(e) => this.setState({ infoFormat: e.target.value })}
          >
            {this.setInfoFormats()}
          </select>
        </div>
        <div>
          <label>Infoklick sortera på attribut</label>
          <input
            type="text"
            ref="input_infoClickSortProperty"
            value={this.state.infoClickSortProperty}
            onChange={(e) =>
              this.setState({ infoClickSortProperty: e.target.value })
            }
          />
        </div>
        <div>
          <label>Infoklick sortera fallande</label>
          <input
            type="checkbox"
            ref="input_infoClickSortDesc"
            onChange={(e) =>
              this.setState({ infoClickSortDesc: e.target.checked })
            }
            checked={this.state.infoClickSortDesc}
          />
        </div>
        <div>
          <label>Infoklick sorterings-typ</label>
          <select
            name=""
            id=""
            ref="input_infoClickSortType"
            className="control-fixed-width"
            value={this.state.infoClickSortType}
            onChange={(e) =>
              this.setState({ infoClickSortType: e.target.value })
            }
          >
            <option value="string">string</option>
            <option value="number">number</option>
          </select>
        </div>
        <div>
          <label>Opacitet*</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            ref="input_opacity"
            value={this.state.opacity}
            className={
              (this.getValidationClass("opacity"), "control-fixed-width")
            }
            onChange={(e) => {
              this.setState({ opacity: e.target.value });
              this.validateField("opacity");
            }}
          />
        </div>
        <div>
          <label>
            Min zoom{" "}
            <abbr title="Lägsta zoomnivå där lagret visas. OBS! Om man vill att lagret ska visas för skala 1:10 000, 1:5 000, 1:2 000 osv måste man ange den zoomnivå som skalsteget ovanför skala 1:10 000 har (t ex 1:20 000). Om 5 motsvarar 1:10 000 ska man då ange 4. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den lägsta zoomnivån. Se även inställning för Max zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_minZoom"
            value={this.state.minZoom}
            className={
              (this.getValidationClass("minZoom"), "control-fixed-width")
            }
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ minZoom: v });
            }}
          />
        </div>
        <div>
          <label>
            Max zoom{" "}
            <abbr title="Högsta zoomnivå vid vilket lagret visas. Om man t ex anger 5 för skala 1:10 000 kommer lagret att visas för skala 1:10 000 men inte för skala 1:5000. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den sista zoomnivån. Se även inställning för Min zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_maxZoom"
            value={this.state.maxZoom}
            className={
              (this.getValidationClass("minZoom"), "control-fixed-width")
            }
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ maxZoom: v }, () =>
                this.validateField("maxZoom")
              );
            }}
          />
        </div>
        <div>
          <label>
            Visa endast Min/Max varningsruta vid klick.
            <abbr title="Som standard visas även varningsruta vid start samt när lagret blir dolt pga zoombegränsningen (Min zoom och Max zoom).">
              (?)
            </abbr>
          </label>
          <input
            type="checkbox"
            ref="input_minMaxZoomAlertOnToggleOnly"
            onChange={(e) =>
              this.setState({ minMaxZoomAlertOnToggleOnly: e.target.checked })
            }
            checked={this.state.minMaxZoomAlertOnToggleOnly}
          />
        </div>
        <div className="separator">Metadata</div>
        <div>
          <label>Innehåll</label>
          <input
            className="control-fixed-width"
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={(e) => this.setState({ content: e.target.value })}
          />
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref="input_date">
            <i>{this.props.model.parseDate(this.state.date)}</i>
          </span>
        </div>
        <div>
          <label>Upphovsrätt</label>
          <input
            type="text"
            ref="input_attribution"
            onChange={(e) => {
              this.setState({ attribution: e.target.value });
              this.validateField("attribution", e);
            }}
            value={this.state.attribution}
            className={this.getValidationClass("attribution")}
          />
        </div>
        <div className="info-container">
          <div>
            <input
              type="checkbox"
              ref="input_infoVisible"
              id="info-document"
              onChange={(e) => {
                this.setState({ infoVisible: e.target.checked });
              }}
              checked={this.state.infoVisible}
            />
            &nbsp;
            <label htmlFor="info-document">Infodokument</label>
          </div>
          <div className={infoClass}>
            <label>Rubrik</label>
            <input
              type="text"
              ref="input_infoTitle"
              onChange={(e) => {
                this.setState({ infoTitle: e.target.value });
                this.validateField("infoTitle", e);
              }}
              value={this.state.infoTitle}
              className={this.getValidationClass("infoTitle")}
            />
          </div>
          <div className={infoClass}>
            <label>Text</label>
            <textarea
              type="text"
              ref="input_infoText"
              onChange={(e) => {
                this.setState({ infoText: e.target.value });
                this.validateField("infoText", e);
              }}
              value={this.state.infoText}
              className={this.getValidationClass("infoText")}
            />
          </div>
          <div className={infoClass}>
            <label>Länk (ex. till PDF)</label>
            <input
              type="text"
              ref="input_infoUrl"
              onChange={(e) => {
                this.setState({ infoUrl: e.target.value });
                this.validateField("infoUrl", e);
              }}
              value={this.state.infoUrl}
              className={this.getValidationClass("infoUrl")}
            />
          </div>
          <div className={infoClass}>
            <label>Länktext</label>
            <input
              type="text"
              ref="input_infoUrlText"
              onChange={(e) => {
                this.setState({ infoUrlText: e.target.value });
                this.validateField("infoUrlText", e);
              }}
              value={this.state.infoUrlText}
              className={this.getValidationClass("infoUrlText")}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input
              type="text"
              ref="input_infoOwner"
              onChange={(e) => {
                this.setState({ infoOwner: e.target.value });
                this.validateField("infoOwner", e);
              }}
              value={
                this.state.infoOwner ? this.state.infoOwner : this.state.owner
              }
              className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
        <div className="timeSlider-container">
          <div>
            <input
              type="checkbox"
              ref="input_timeSliderVisible"
              id="timeSlider"
              onChange={(e) => {
                this.setState({ timeSliderVisible: e.target.checked });
              }}
              checked={this.state.timeSliderVisible}
            />
            &nbsp;
            <label htmlFor="timeSlider">Tidslinjedatum</label>
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje start</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderStart"
              onChange={(e) => {
                this.setState({ timeSliderStart: e.target.value });
              }}
              value={this.state.timeSliderStart}
            />
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje slut</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderEnd"
              onChange={(e) => {
                this.setState({ timeSliderEnd: e.target.value });
              }}
              value={this.state.timeSliderEnd}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default WMSLayerForm;
