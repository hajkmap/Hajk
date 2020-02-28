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

import React from "react";
import { Component } from "react";
import $ from "jquery";
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
  content: "",
  date: "Fylls i per automatik",
  legend: "",
  owner: "",
  url: "",
  opacity: 1.0,
  tiled: false,
  singleTile: false,
  imageFormat: "",
  serverType: "geoserver",
  drawOrder: 1,
  layerType: "WMS",
  attribution: "",
  searchUrl: "",
  searchPropertyName: "",
  searchDisplayName: "",
  searchOutputFormat: "",
  searchGeometryField: "",
  infoVisible: false,
  infoTitle: "",
  infoText: "",
  infoUrl: "",
  infoUrlText: "",
  infoOwner: "",
  solpopup: solpop,
  capabilitiesList: [],
  version: "1.1.0",
  projection: "",
  infoFormat: "",
  style: []
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
  "CRS:84"
];

const supportedInfoFormats = [
  "application/json",
  "text/xml",
  "application/geojson"
];

const supportedImageFormats = [
  "image/png",
  "image/jpeg",
  "image/png; mode=8bit",
  "image/vnd.jpeg-png"
];

/**
 *
 */
class WMSLayerForm extends Component {
  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on("change:legend", () => {
      this.setState({
        legend: this.props.model.get("legend")
      });
      this.validateField("legend");
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:legend");
  }

  constructor() {
    super();
    this.state = defaultState;
    this.layer = {};
  }

  reset() {
    this.setState(defaultState);
  }

  loadLegendImage(e) {
    $("#select-image").trigger("click");
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
        infoText: opts.abstract
      });
    } else if (this.state.addedLayers.length === 0) {
      this.setState({
        caption: "",
        infoText: ""
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
      ].Capability.Layer.Layer.find(l => {
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
          foundCrs.CRS.forEach(crs => {
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
        ${opts.children.map(ch => ch.Title).join(", ")}\n
        I dagsläget saknar Hajk funktionaliteten att automatiskt lägga till underlagren, men du kan enkelt göra det själv genom att kryssa för underlagren vars namn du ser ovan. \n
        Se även till att avmarkera själva lagergruppen (${checkedLayer}), för den behöver du inte ha om du lägger till dess underlager.`;

        this.props.parent.setState({
          alert: true,
          alertMessage: message,
          caption: "Valt lager är en lagergrupp"
        });
        // End of temporary solution
      }

      addedLayersInfo[checkedLayer] = {
        id: checkedLayer,
        caption: "",
        legend: "",
        infobox: "",
        style: "",
        queryable: ""
      };
      this.setState(
        {
          addedLayers: [...this.state.addedLayers, checkedLayer],
          addedLayersInfo: addedLayersInfo
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
            layer => layer !== checkedLayer
          )
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
    match = arrayToSearchIn.find(l => {
      if (l.hasOwnProperty("Layer")) {
        return this.findInCapabilities(layerName, l.Layer);
      }
      return l.Name === layerName;
    });
    return match;
  }

  renderLayerInfoInput(layerInfo) {
    var currentLayer = this.findInCapabilities(layerInfo.id);

    this.setState({
      style: currentLayer.Style || []
    });

    let addedLayersInfo = this.state.addedLayersInfo;
    addedLayersInfo[layerInfo.id].styles = currentLayer.Style;
    this.setState({
      addedLayersInfo: addedLayersInfo
    });

    let styles = layerInfo.styles
      ? layerInfo.styles.map(style => (
          <option key={"style_" + style.Name} value={style.Name}>
            {style.Name}
          </option>
        ))
      : null;

    return (
      <div>
        <div>
          <div>
            <label>Visningsnamn</label>
          </div>
          <input
            value={layerInfo.caption}
            onChange={e => {
              let addedLayersInfo = this.state.addedLayersInfo;
              addedLayersInfo[layerInfo.id].caption = e.target.value;
              this.setState(
                {
                  addedLayersInfo: addedLayersInfo
                },
                () => {
                  this.renderLayerInfoDialog(layerInfo);
                }
              );
            }}
            type="text"
          />
        </div>
        <div>
          <div>
            <label>Inforuta</label>
          </div>
          <textarea
            style={{ width: "100%" }}
            value={layerInfo.infobox}
            onChange={e => {
              let addedLayersInfo = this.state.addedLayersInfo;
              addedLayersInfo[layerInfo.id].infobox = e.target.value;
              this.setState(
                {
                  addedLayersInfo: addedLayersInfo
                },
                () => {
                  this.renderLayerInfoDialog(layerInfo);
                }
              );
            }}
            type="text"
          />
        </div>
        <div>
          <div>
            <label>Stil</label>
          </div>
          <select
            value={layerInfo.style}
            className="control-fixed-width"
            onChange={e => {
              let addedLayersInfo = this.state.addedLayersInfo;
              addedLayersInfo[layerInfo.id].style = e.target.value;
              this.setState(
                {
                  addedLayersInfo: addedLayersInfo
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
        <div>
          <div>
            <label>Infoklick</label>
          </div>
          <input
            id="infoclickable"
            type="checkbox"
            checked={layerInfo.queryable}
            onChange={e => {
              let addedLayersInfo = this.state.addedLayersInfo;
              addedLayersInfo[layerInfo.id].queryable = e.target.checked;
              this.setState(
                {
                  addedLayersInfo: addedLayersInfo
                },
                () => {
                  this.renderLayerInfoDialog(layerInfo);
                }
              );
            }}
          />
        </div>
      </div>
    );
  }

  renderLayerInfoDialog(layerInfo) {
    this.props.parent.setState({
      alert: true,
      alertMessage: this.renderLayerInfoInput(layerInfo),
      contentType: "react",
      caption: "Inställningar för lager"
    });
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(
        {
          target: {
            checked: false
          }
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
          children: layer.Layer
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
                checked={this.state.addedLayers.find(l => l === layer.Name)}
                onChange={e => {
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
          layer.Layer.forEach(layer => {
            recursivePushLayer(layer, guid);
          });
        }
      };

      this.state.capabilities.Capability.Layer.Layer.forEach(layer => {
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
        capabilities => capabilities.version === layer.version
      );
      if (layer.layersInfo) {
        addedLayersInfo = layer.layersInfo.reduce((c, l) => {
          c[l.id] = l;
          return c;
        }, {});
      } else {
        addedLayersInfo = {};
        layer.layers.forEach(layer => {
          addedLayersInfo[layer] = {
            id: layer,
            caption: "",
            legend: "",
            infobox: "",
            style: "",
            queryable: ""
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
          infoFormat: layer.infoFormat
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
      layerPropertiesName: undefined
    });

    if (this.state.capabilities) {
      this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
        if (this.refs.hasOwnProperty(layer.Name))
          this.refs[layer.Name].checked = false;
      });
    }

    var capabilitiesPromise = this.props.model.getAllWMSCapabilities(
      this.state.url
    );

    capabilitiesPromise
      .then(capabilitiesList => {
        this.setState(
          {
            capabilitiesList,
            load: false
          },
          () => {
            if (callback) {
              callback();
            } else {
              var capabilities = this.state.capabilitiesList[0];
              this.setState(
                {
                  capabilities,
                  version: capabilities.version
                },
                () => {
                  this.setServerType();
                }
              );
            }
          }
        );
      })
      .catch(err => {
        console.error(err);
        if (this.props.parentView) {
          this.props.parentView.setState({
            alert: true,
            alertMessage: "Servern svarar inte. Försök med en annan URL."
          });
        }
      });
  }

  selectVersion(e) {
    var version = e.target.value;
    var capabilities = this.state.capabilitiesList.find(
      capabilities => capabilities.version === version
    );

    var singleTile = this.state.singleTile;

    this.setState({
      capabilities,
      version,
      singleTile
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
      formats = this.state.capabilities.Capability.Request.GetFeatureInfo
        .Format;
    }
    if (formats && formats.indexOf("application/geojson") > -1) {
      this.setState({ serverType: "arcgis" });
    } else {
      this.setState({ serverType: "geoserver" });
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
      formats = this.state.capabilities.Capability.Request.GetFeatureInfo
        .Format;
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
        confirmAction: result => {
          this.saveLayerSettings(result, layer.name);
          this.setState({
            layerSettings: {
              settings: false,
              visible: false
            }
          });
        },
        denyAction: () => {
          this.setState({
            layerSettings: {
              settings: false,
              visible: false
            }
          });
        }
      }
    });
  }

  getLayer() {
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue("caption"),
      url: this.getValue("url"),
      owner: this.getValue("owner"),
      date: this.getValue("date"),
      content: this.getValue("content"),
      legend: this.getValue("legend"),
      layers: this.getValue("layers"),
      layersInfo: this.getValue("layersInfo"),
      singleTile: this.getValue("singleTile"),
      imageFormat: this.getValue("imageFormat"),
      serverType: this.getValue("serverType"),
      opacity: this.getValue("opacity"),
      tiled: this.getValue("tiled"),
      drawOrder: this.getValue("drawOrder"),
      attribution: this.getValue("attribution"),
      searchUrl: this.getValue("searchUrl"),
      searchPropertyName: this.getValue("searchPropertyName"),
      searchDisplayName: this.getValue("searchDisplayName"),
      searchOutputFormat: this.getValue("searchOutputFormat"),
      searchGeometryField: this.getValue("searchGeometryField"),
      infoVisible: this.getValue("infoVisible"),
      infoTitle: this.getValue("infoTitle"),
      infoText: this.getValue("infoText"),
      infoUrl: this.getValue("infoUrl"),
      infoUrlText: this.getValue("infoUrlText"),
      infoOwner: this.getValue("infoOwner"),
      solpopup: this.getValue("solpopup"),
      version: this.state.version,
      projection: this.getValue("projection"),
      infoFormat: this.getValue("infoFormat"),
      style: this.getValue("style")
    };
  }

  getValue(fieldName) {
    function create_date() {
      return new Date().getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    function format_layers_info(layersInfo) {
      return Object.keys(layersInfo).map(layerInfo => ({
        ...layersInfo[layerInfo]
      }));
    }

    var input = this.refs["input_" + fieldName],
      value = input ? input.value : "";

    if (fieldName === "date") value = create_date();
    if (fieldName === "singleTile") value = input.checked;
    if (fieldName === "tiled") value = input.checked;
    if (fieldName === "layers") value = format_layers(this.state.addedLayers);
    if (fieldName === "layersInfo")
      value = format_layers_info(this.state.addedLayersInfo);
    if (fieldName === "infoVisible") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = ["url", "caption", "layers"];
    var errors = [];

    validationFields.forEach(field => {
      var valid = this.validateField(field, false, false);
      if (!valid) {
        errors.push(field);
      }
    });

    this.setState({
      validationErrors: errors
    });

    return errors.length === 0;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName)
      ? "validation-error"
      : "";
  }

  validateField(fieldName, forcedValue, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    switch (fieldName) {
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "opacity":
        if (isNaN(Number(value)) || value < 0 || value > 1) {
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
          validationErrors: [...this.state.validationErrors, fieldName]
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            v => v !== fieldName
          )
        });
      }
    }

    return valid;
  }

  render() {
    var loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    var infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";

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
            style={{ width: "50%" }}
            ref="input_serverType"
            value={this.state.serverType}
            onChange={e => this.setState({ serverType: e.target.value })}
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
            onChange={e => {
              this.setState({ url: e.target.value });
              this.validateField("url");
            }}
            className={this.getValidationClass("url")}
          />
          <span
            onClick={e => {
              this.loadWMSCapabilities(e);
            }}
            className="btn btn-default"
          >
            Ladda {loader}
          </span>
        </div>
        <div className="separator">Inställningar för request</div>
        <div>
          <label>Version</label>
          <select
            className="control-fixed-width"
            style={{ width: "50%" }}
            ref="input_version"
            onChange={this.selectVersion.bind(this)}
            value={version}
          >
            {this.state.capabilitiesList.map(capa => {
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
            style={{ width: "50%" }}
            ref="input_imageFormat"
            value={this.state.imageFormat}
            onChange={e => this.setState({ imageFormat: e.target.value })}
          >
            {this.setImageFormats()}
          </select>
        </div>
        <div>
          <label>Koordinatsystem</label>
          <select
            className="control-fixed-width"
            style={{ width: "50%" }}
            ref="input_projection"
            value={this.state.projection !== null ? this.state.projection : ""}
            onChange={e => this.setState({ projection: e.target.value })}
          >
            {this.setProjections()}
          </select>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_singleTile"
            id="input_singleTile"
            onChange={e => this.setState({ singleTile: e.target.checked })}
            checked={this.state.singleTile}
          />
          &nbsp;
          <label htmlFor="input_singleTile">Single tile</label>
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_tiled"
            id="input_tiled"
            onChange={e => {
              this.setState({ tiled: e.target.checked });
            }}
            checked={this.state.tiled}
          />
          &nbsp;
          <label htmlFor="input_tiled">GeoWebCache</label>
        </div>
        <div className="separator">Tillgängliga lager</div>
        <div>
          <table
            style={{
              display: "block",
              overflowY: "scroll",
              maxHeight: "600px"
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
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            onChange={e => {
              this.setState({ caption: e.target.value });
              this.validateField("caption");
            }}
            className={this.getValidationClass("caption")}
          />
        </div>

        <div>
          <label>Teckenförklaring</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            onChange={e => this.setState({ legend: e.target.value })}
          />
          <span
            onClick={e => {
              this.loadLegendImage(e);
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
            style={{ width: "50%", dispaly: "in-line" }}
            ref="input_infoFormat"
            value={infoFormat}
            onChange={e => this.setState({ infoFormat: e.target.value })}
          >
            {this.setInfoFormats()}
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
            onChange={e => {
              this.setState({ opacity: e.target.value });
              this.validateField("opacity");
            }}
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
            onChange={e => this.setState({ content: e.target.value })}
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
            onChange={e => {
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
              onChange={e => {
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
              onChange={e => {
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
              onChange={e => {
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
              onChange={e => {
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
              onChange={e => {
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
              onChange={e => {
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
        <div className="separator">Sökning</div>
        {/* <h2>Sökning</h2> */}
        <div>
          <label>Url</label>
          <input
            type="text"
            ref="input_searchUrl"
            onChange={e => {
              this.setState({ searchUrl: e.target.value });
              this.validateField("searchUrl", e);
            }}
            value={this.state.searchUrl}
            className={this.getValidationClass("searchUrl")}
          />
        </div>
        <div>
          <label>Sökfält</label>
          <input
            type="text"
            ref="input_searchPropertyName"
            onChange={e => {
              this.setState({ searchPropertyName: e.target.value });
              this.validateField("searchPropertyName", e);
            }}
            value={this.state.searchPropertyName}
            className={this.getValidationClass("searchPropertyName")}
          />
        </div>
        <div>
          <label>Visningsfält</label>
          <input
            type="text"
            ref="input_searchDisplayName"
            onChange={e => {
              this.setState({ searchDisplayName: e.target.value });
              this.validateField("searchDisplayName", e);
            }}
            value={this.state.searchDisplayName}
            className={this.getValidationClass("searchDisplayName")}
          />
        </div>
        <div>
          <label>Utdataformat</label>
          <input
            type="text"
            ref="input_searchOutputFormat"
            onChange={e => {
              this.setState({ searchOutputFormat: e.target.value });
              this.validateField("searchOutputFormat", e);
            }}
            value={this.state.searchOutputFormat}
            className={this.getValidationClass("searchOutputFormat")}
          />
        </div>
        <div>
          <label>Geometrifält</label>
          <input
            type="text"
            ref="input_searchGeometryField"
            onChange={e => {
              this.setState({ searchGeometryField: e.target.value });
              this.validateField("searchGeometryField", e);
            }}
            value={this.state.searchGeometryField}
            className={this.getValidationClass("searchGeometryField")}
          />
        </div>
      </fieldset>
    );
  }
}

export default WMSLayerForm;
