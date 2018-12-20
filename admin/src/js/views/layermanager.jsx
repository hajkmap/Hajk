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
import Alert from "../views/alert.jsx";
import WMSLayerForm from "./layerforms/wmslayerform.jsx";
import ExtendedWMSLayerForm from "./layerforms/extendedwmslayerform.jsx";
import WMTSLayerForm from "./layerforms/wmtslayerform.jsx";
import ArcGISLayerForm from "./layerforms/arcgislayerform.jsx";
import VectorLayerForm from "./layerforms/vectorlayerform.jsx";

/**
 *
 */
const defaultState = {
  layerType: "WMS",
  validationErrors: [],
  mode: "add",
  alert: false,
  confirm: false,
  alertMessage: "",
  content: "",
  confirmAction: () => {},
  denyAction: () => {}
};
/**
 *
 */
class Manager extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }
  /**
   *
   */
  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.props.model.getConfig(this.props.config.url_layers);
    this.setState(defaultState);
    this.props.model.on("change:layers", () => {
      this.setState({
        layers: this.props.model.get("layers")
      });
    });
  }
  /**
   *
   */
  componentWillUnmount() {
    this.props.model.off("change:layers");
  }
  /**
   *
   */
  removeLayer(e, layer) {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage: "Lagret kommer att tas bort. Är detta ok?",
      confirmAction: () => {
        this.props.model.removeLayer(layer, success => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.setState({
              alert: true,
              alertMessage: `Lagret ${layer.caption} togs bort!`
            });
            if (this.state.id === layer.id) {
              this.abort();
            }
          } else {
            this.setState({
              alert: true,
              alertMessage: "Lagret kunde inte tas bort. Försök igen senare."
            });
          }
        });
      }
    });
    e.stopPropagation();
  }
  /**
   *
   */
  loadLayer(e, layer) {
    if (layer.type === "ArcGIS") {
      this.setState({
        mode: "edit",
        layerType: "ArcGIS"
      });

      setTimeout(() => {
        this.refs["ArcGISLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          owner: layer.owner,
          url: layer.url,
          queryable: layer.queryable,
          singleTile: layer.singleTile,
          projection: layer.projection,
          extent: layer.extent,
          opacity: layer.opacity,
          drawOrder: layer.drawOrder,
          addedLayers: [],
          layerType: layer.type,
          attribution: layer.attribution,
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOwner: layer.infoOwner
        });

        this.refs["ArcGISLayerForm"].loadLayers(layer, () => {
          this.refs["ArcGISLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "Vector") {
      this.setState({
        mode: "edit",
        layerType: "Vector"
      });

      setTimeout(() => {
        this.refs["VectorLayerForm"].setState({
          id: layer.id,
          dataFormat: layer.dataFormat || "WFS",
          caption: layer.caption,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          owner: layer.owner,
          url: layer.url,
          queryable: layer.queryable,
          projection: layer.projection,
          lineWidth: layer.lineWidth || "3",
          lineStyle: layer.lineStyle || "solid",
          lineColor: layer.lineColor || "rgba(0, 0, 0, 0.5)",
          fillColor: layer.fillColor || "rgba(255, 255, 255, 0.5)",
          opacity: layer.opacity,
          symbolXOffset: layer.symbolXOffset || 0,
          symbolYOffset: layer.symbolYOffset || 0,
          labelAlign: layer.labelAlign || "",
          labelBaseline: layer.labelBaseline || "",
          labelSize: layer.labelSize || 0,
          labelOffsetX: layer.labelOffsetX || 0,
          labelOffsetY: layer.labelOffsetY || 0,
          labelWeight: layer.labelWeight || "",
          labelFont: layer.labelFont || "",
          labelFillColor: layer.labelFillColor || "rgba(0, 0, 0, 1)",
          labelOutlineColor:
            layer.labelOutlineColor || "rgba(255, 255, 255, 1)",
          labelOutlineWidth: layer.labelOutlineWidth || 3,
          labelAttribute: layer.labelAttribute || "",
          showLabels: layer.showLabels || true,
          drawOrder: layer.drawOrder,
          layer: layer.layer,
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOwner: layer.infoOwner
        });

        this.refs["VectorLayerForm"].loadLayers(layer, () => {
          this.refs["VectorLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "WMS") {
      this.setState({
        mode: "edit",
        layerType: "WMS"
      });

      setTimeout(() => {
        this.refs["WMSLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          owner: layer.owner,
          url: layer.url,
          queryable: layer.queryable,
          opacity: layer.opacity,
          tiled: layer.tiled,
          singleTile: layer.singleTile,
          imageFormat: layer.imageFormat,
          version: layer.version,
          serverType: layer.serverType,
          drawOrder: layer.drawOrder,
          addedLayers: [],
          layerType: layer.type,
          attribution: layer.attribution,
          searchUrl: layer.searchUrl || "",
          searchPropertyName: layer.searchPropertyName || "",
          searchDisplayName: layer.searchDisplayName || "",
          searchOutputFormat: layer.searchOutputFormat || "",
          searchGeometryField: layer.searchGeometryField || "",
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOwner: layer.infoOwner
        });

        this.refs["WMSLayerForm"].loadLayers(layer, () => {
          this.refs["WMSLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "ExtendedWMS") {
      this.setState({
        mode: "edit",
        layerType: "ExtendedWMS"
      });
      setTimeout(() => {
        this.refs["ExtendedWMSLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          owner: layer.owner,
          url: layer.url,
          queryable: layer.queryable,
          tiled: layer.tiled,
          singleTile: layer.singleTile,
          imageFormat: layer.imageFormat,
          version: layer.version,
          serverType: layer.serverType,
          drawOrder: layer.drawOrder,
          addedLayers: [],
          layerType: layer.type,
          projection: layer.projection,
          infoFormat: layer.infoFormat,
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOwner: layer.infoOwner
        });

        this.refs["ExtendedWMSLayerForm"].loadLayers(layer, () => {
          this.refs["ExtendedWMSLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "WMTS") {
      this.setState({
        mode: "edit",
        layerType: "WMTS"
      });

      setTimeout(() => {
        this.refs["WMTSLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          owner: layer.owner,
          url: layer.url,
          layer: layer.layer,
          matrixSet: layer.matrixSet,
          style: layer.style,
          projection: layer.projection,
          origin: layer.origin,
          resolutions: layer.resolutions,
          matrixIds: layer.matrixIds,
          layerType: layer.type,
          attribution: layer.attribution,
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOwner: layer.infoOwner
        });
        setTimeout(() => {
          this.refs["WMTSLayerForm"].validate();
        }, 0);
      }, 0);
    }
  }
  /**
   *
   */
  describeLayer(e, layerName) {
    this.props.model.getLayerDescription(
      this.refs.input_url.value,
      layerName,
      properties => {
        this.setState({
          layerProperties: properties,
          layerPropertiesName: layerName
        });
      }
    );
  }
  /**
   *
   */
  closeDetails() {
    this.setState({
      layerProperties: undefined,
      layerPropertiesLayer: undefined
    });
  }
  /**
   *
   */
  renderLayerProperties() {
    if (this.state.layerProperties === undefined) {
      return null;
    }
    if (this.state.layerProperties === false) {
      return (
        <div>
          <i className="fa fa-times" onClick={() => this.closeDetails()} />
          <div>Information saknas</div>
        </div>
      );
    }
    var rows = this.state.layerProperties.map((property, i) => (
      <tr key={"layerProperty_" + i}>
        <td>{property.name}</td>
        <td>{property.type}</td>
      </tr>
    ));
    return (
      <div>
        <i className="fa fa-times" onClick={() => this.closeDetails()} />
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Typ</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
  /**
   *
   */
  renderOwnerOptions() {
    if (this.props.config && this.props.config.owner_options) {
      return this.props.config.owner_options.map((option, i) => (
        <option value={option.value} key={"owner_" + i}>
          {option.title}
        </option>
      ));
    } else {
      return null;
    }
  }
  /**
   *
   */
  filterLayers(e) {
    this.setState({
      filter: e.target.value
    });
  }
  /**
   *
   */
  getLayersWithFilter(filter) {
    return this.props.model.get("layers").filter(layer => {
      return new RegExp(this.state.filter).test(layer.caption.toLowerCase());
    });
  }
  /**
   *
   */
  renderLayersFromConfig(layers) {
    layers = this.state.filter
      ? this.getLayersWithFilter()
      : this.props.model.get("layers");

    var startsWith = [];
    var alphabetically = [];

    if (this.state.filter) {
      layers.forEach(layer => {
        layer.caption.toLowerCase().indexOf(this.state.filter) == 0
          ? startsWith.push(layer)
          : alphabetically.push(layer);
      });

      startsWith.sort(function(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) return -1;
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) return 1;
        return 0;
      });

      alphabetically.sort(function(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) return -1;
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) return 1;
        return 0;
      });

      layers = startsWith.concat(alphabetically);
    }

    // Sort layers alphabetically
    layers.sort((a, b) => {
      return a.caption.toLowerCase().localeCompare(b.caption.toLowerCase());
    });

    return layers.map((layer, i) => {
      var displayType = "";
      switch (layer.type) {
        case "WMS":
          displayType = "";
          break;
        case "ExtendedWMS":
          displayType = "(Extended WMS)";
          break;
        case "WMTS":
          displayType = "(WMTS)";
          break;
        case "ArcGIS":
          displayType = "(ArcGIS)";
          break;
        case "Vector":
          displayType = "(Vektor)";
          break;
      }

      return (
        <li onClick={e => this.loadLayer(e, layer)} key={"layer_" + i}>
          <span>
            {layer.caption} {displayType}
          </span>
          <i
            title="Radera lager"
            onClick={e => this.removeLayer(e, layer)}
            className="fa fa-trash"
          />
        </li>
      );
    });
  }
  /**
   *
   */
  abort(e) {
    if (this.state.layerType === "WMS") {
      this.refs["WMSLayerForm"].reset();
    }
    this.setState(defaultState);
  }
  /**
   *
   */
  whenLayerAdded(success, layer) {
    if (success) {
      this.props.model.getConfig(this.props.config.url_layers);
      this.abort();
      this.setState({
        alert: true,
        alertMessage: "Lagret har lagts till i listan av tillgängliga lager."
      });
    } else {
      this.setState({
        alert: true,
        alertMessage: "Lagret kunde inte läggas till. Försök igen senare."
      });
    }
  }
  /**
   *
   */
  whenLayerUpdated(success, date) {
    if (success) {
      this.props.model.getConfig(this.props.config.url_layers);

      this.setState({
        alert: true,
        alertMessage: "Uppdateringen lyckades!",
        date: date
      });
    } else {
      this.setState({
        alert: true,
        alertMessage: "Uppdateringen misslyckades."
      });
    }
  }
  /**
   *
   */
  submit(e) {
    e.preventDefault();

    var form = this.refs[this.state.layerType + "LayerForm"],
      valid = form.validate(),
      layer = {};

    if (!valid) {
      return;
    }

    layer = form.getLayer();
    if (this.state.mode === "add") {
      layer.type = this.state.layerType;
      layer.id = null;
      this.props.model.addLayer(layer, success => {
        this.whenLayerAdded(success, layer.date);
      });
    }

    if (this.state.mode === "edit") {
      if (layer.type === "ArcGIS" && layer.legend === "") {
        this.props.model.getLegend(layer, legend => {
          layer.legend = legend;
          this.props.model.updateLayer(layer, success => {
            this.whenLayerUpdated(success);
          });
        });
      } else {
        this.props.model.updateLayer(layer, success => {
          this.whenLayerUpdated(success);
        });
      }
    }
  }
  /**
   *
   */
  uploadLegend(callback) {
    $("#upload-form").submit();
    this.refs.uploadIframe.addEventListener("load", () => {
      if (this.refs.uploadIframe.contentDocument) {
        if (!window.location.origin) {
          window.location.origin =
            window.location.protocol +
            "//" +
            window.location.hostname +
            (window.location.port ? ":" + window.location.port : "");
        }
        var node = $(this.refs.uploadIframe.contentDocument).find("body")[0],
          url = node.innerHTML,
          a = $(`<a href="${url}"">temp</a>`),
          b = a[0].href;
        this.props.model.set("legend", b);
      }
    });
  }
  /**
   *
   */
  renderForm() {
    switch (this.state.layerType) {
      case "WMS":
        return (
          <WMSLayerForm
            ref="WMSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            url={this.props.config.url_default_server}
          />
        );
      case "ExtendedWMS":
        return (
          <ExtendedWMSLayerForm
            ref="ExtendedWMSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            parentView={this}
            url={this.props.config.url_default_server}
          />
        );
      case "WFS":
        return (
          <WFSLayerForm
            ref="WFSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            url={this.props.config.url_default_server}
          />
        );
      case "WMTS":
        return (
          <WMTSLayerForm
            ref="WMTSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            url={this.props.config.url_default_server}
          />
        );
      case "ArcGIS":
        return (
          <ArcGISLayerForm
            ref="ArcGISLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            url={this.props.config.url_default_server}
            parent={this}
          />
        );
      case "Vector":
        return (
          <VectorLayerForm
            ref="VectorLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            url={this.props.config.url_default_server}
            parent={this}
          />
        );
      default:
        return <WMSLayerForm model={this.props.model} parent={this} />;
    }
  }

  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ""
        });
      }
    };
  }
  /**
   *
   */
  render() {
    var abort =
        this.state.mode === "edit" ? (
          <span className="btn btn-danger" onClick={e => this.abort(e)}>
            Avbryt
          </span>
        ) : null,
      url = this.props.config.url_import, // "/mapservice/export/importimage"
      typeSelectorDisabled = this.state.mode === "edit";

    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <aside>
          <input
            placeholder="filtrera"
            type="text"
            onChange={e => this.filterLayers(e)}
          />
          <ul className="config-layer-list">{this.renderLayersFromConfig()}</ul>
        </aside>
        <article>
          <form
            id="upload-form"
            method="post"
            action={url}
            encType="multipart/form-data"
            target="upload-iframe"
          >
            <input
              style={{
                opacity: 0,
                position: "absolute",
                width: "auto",
                height: "100%",
                padding: 0,
                top: "-500px"
              }}
              id="select-image"
              type="file"
              multiple="false"
              name="files[]"
              onChange={e => this.uploadLegend(e)}
            />
            <iframe
              id="upload-iframe"
              name="upload-iframe"
              ref="uploadIframe"
              style={{ display: "none" }}
            />
          </form>
          <form
            method="post"
            action=""
            onSubmit={e => {
              this.submit(e);
            }}
          >
            <p>
              <label>Välj lagertyp</label>
              <select
                disabled={typeSelectorDisabled}
                value={this.state.layerType}
                onChange={e => {
                  this.setState({ layerType: e.target.value });
                }}
              >
                <option>WMS</option>
                <option value="ExtendedWMS">Extended WMS</option>
                <option>WMTS</option>
                <option>ArcGIS</option>
                <option value="Vector">Vektor</option>
              </select>
            </p>
            {this.renderForm()}
            <button className="btn btn-primary">
              {this.state.mode == "edit" ? "Spara" : "Lägg till"}
            </button>&nbsp;
            {abort}
          </form>
        </article>
        <div className="details">{this.renderLayerProperties()}</div>
      </section>
    );
  }
}

export default Manager;
