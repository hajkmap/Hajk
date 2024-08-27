import React from "react";
import { Component } from "react";
import $ from "jquery";
import Alert from "../views/alert.jsx";
import WMSLayerForm from "./layerforms/wmslayerform.jsx";
import WMTSLayerForm from "./layerforms/wmtslayerform.jsx";
import ArcGISLayerForm from "./layerforms/arcgislayerform.jsx";
import VectorLayerForm from "./layerforms/vectorlayerform.jsx";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const defaultState = {
  layerType: "WMS",
  validationErrors: [],
  mode: "add",
  alert: false,
  confirm: false,
  alertMessage: "",
  content: "",
  confirmAction: () => {},
  denyAction: () => {},
};

class Manager extends Component {
  constructor(props) {
    super(props);
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.props.model.getConfig(this.props.config.url_layers);
    this.setState(defaultState);
    this.props.model.on("change:layers", () => {
      this.setState({
        layers: this.props.model.get("layers"),
      });
    });

    // Fetch all map configs to model
    this.props.model.fetchAllMapConfigsToModel();
  }

  componentWillUnmount() {
    this.props.model.off("change:layers");
  }

  findLayerInConfig(id) {
    let mapsWithLayers = this.props.model.get("mapsWithLayers");
    let matchedConfigs = [];

    function findInBaselayers(baselayers, layerId) {
      return baselayers.find((l) => l.id === layerId);
    }

    function findInGroups(groups, layerId) {
      let config;
      groups.forEach((group) => {
        let found = group.layers.find((l) => l.id === layerId);
        if (found) {
          config = found;
        }
        if (group.hasOwnProperty("groups")) {
          findInGroups(group.groups, layerId);
        }
      });
      return config;
    }

    for (let i = 0; i < mapsWithLayers.length; i++) {
      if (
        findInBaselayers(mapsWithLayers[i].layers.baseLayers, id) ||
        findInGroups(mapsWithLayers[i].layers.groups, id)
      ) {
        matchedConfigs.push(mapsWithLayers[i].mapFilename);
      }
    }

    // There might be duplicates, but we want to return unique values only.
    // Also, sort values for a nicer output.
    return [...new Set(matchedConfigs)].sort();
  }

  infoAboutLayer(e, layer) {
    let matchedConfigs = this.findLayerInConfig(layer.id);
    let alertMessage;
    if (matchedConfigs.length < 1) {
      alertMessage = `Lagret "${layer.caption}" används inte i någon karta.`;
    } else {
      alertMessage = `Lagret "${
        layer.caption
      }" används i följande kartor: ${matchedConfigs.join(", ")}`;
    }

    this.setState({
      alert: true,
      alertMessage: alertMessage,
    });
    e.stopPropagation();
  }

  removeLayer(e, layer) {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage: `Lagret "${layer.caption}" kommer att tas bort. Är detta ok?`,
      confirmAction: () => {
        this.props.model.removeLayer(layer, (success) => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.setState({
              alert: true,
              alertMessage: `Lagret ${layer.caption} togs bort!`,
            });
            if (this.state.id === layer.id) {
              this.abort();
            }
          } else {
            this.setState({
              alert: true,
              alertMessage: `Lagret "${layer.caption}" kunde inte tas bort. Försök igen senare.`,
            });
          }
        });
      },
    });
    e.stopPropagation();
  }

  loadLayer(e, layer) {
    if (layer.type === "ArcGIS") {
      this.setState({
        mode: "edit",
        layerType: "ArcGIS",
      });

      setTimeout(() => {
        this.refs["ArcGISLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          internalLayerName: layer.internalLayerName,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          legendIcon: layer.legendIcon,
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
          infoOpenDataLink: layer.infoOpenDataLink,
          infoOwner: layer.infoOwner,
        });

        this.refs["ArcGISLayerForm"].loadLayers(layer, () => {
          this.refs["ArcGISLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "Vector") {
      this.setState({
        mode: "edit",
        layerType: "Vector",
      });

      setTimeout(() => {
        this.refs["VectorLayerForm"].setState({
          id: layer.id,
          dataFormat: layer.dataFormat || "WFS",
          caption: layer.caption,
          internalLayerName: layer.internalLayerName,
          content: layer.content,
          date: layer.date,
          icon: layer.icon || "",
          infobox: layer.infobox,
          infoclickIcon: layer.infoclickIcon,
          displayFields: layer.displayFields,
          secondaryLabelFields: layer.secondaryLabelFields,
          shortDisplayFields: layer.shortDisplayFields,
          legend: layer.legend,
          legendIcon: layer.legendIcon,
          owner: layer.owner,
          url: layer.url,
          queryable: layer.queryable,
          filterable: layer.filterable || false,
          projection: layer.projection,
          lineWidth: layer.lineWidth || "",
          lineStyle: layer.lineStyle || "",
          lineColor: layer.lineColor || "",
          fillColor: layer.fillColor || "",
          opacity: layer.opacity,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom,
          infoClickSortProperty: layer.infoClickSortProperty || "",
          infoClickSortType: layer.infoClickSortType || "string",
          rotateMap: layer.rotateMap || "n",
          infoClickSortDesc: layer.infoClickSortDesc ?? true,
          sldUrl: layer.sldUrl,
          sldText: layer.sldText,
          sldStyle: layer.sldStyle,
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
          infoOpenDataLink: layer.infoOpenDataLink,
          infoOwner: layer.infoOwner,
          timeSliderVisible: layer.timeSliderVisible,
          timeSliderStart: layer.timeSliderStart,
          timeSliderEnd: layer.timeSliderEnd,
          pointSize: layer.pointSize,
          filterAttribute: layer.filterAttribute,
          filterValue: layer.filterValue,
          filterComparer: layer.filterComparer,
        });

        this.refs["VectorLayerForm"].loadLayers(layer, () => {
          this.refs["VectorLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "WMS") {
      this.setState({
        mode: "edit",
        layerType: "WMS",
      });
      setTimeout(() => {
        this.refs["WMSLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          internalLayerName: layer.internalLayerName,
          content: layer.content,
          date: layer.date,
          legend: layer.legend,
          legendIcon: layer.legendIcon,
          owner: layer.owner,
          url: layer.url,
          customGetMapUrl: layer.customGetMapUrl || "",
          opacity: layer.opacity,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom,
          infoClickSortProperty: layer.infoClickSortProperty || "",
          infoClickSortType: layer.infoClickSortType || "string",
          rotateMap: layer.rotateMap || "n",
          infoClickSortDesc: layer.infoClickSortDesc ?? true,
          tiled: layer.tiled,
          showAttributeTableButton: layer.showAttributeTableButton || false,
          singleTile: layer.singleTile,
          hidpi: layer.hidpi,
          customRatio: layer.customRatio,
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
          searchShortDisplayName: layer.searchShortDisplayName || "",
          searchOutputFormat: layer.searchOutputFormat || "",
          searchGeometryField: layer.searchGeometryField || "",
          infoVisible: layer.infoVisible,
          infoTitle: layer.infoTitle,
          infoText: layer.infoText,
          infoUrl: layer.infoUrl,
          infoUrlText: layer.infoUrlText,
          infoOpenDataLink: layer.infoOpenDataLink,
          infoOwner: layer.infoOwner,
          timeSliderVisible: layer.timeSliderVisible,
          timeSliderStart: layer.timeSliderStart,
          timeSliderEnd: layer.timeSliderEnd,
        });

        this.refs["WMSLayerForm"].loadLayers(layer, () => {
          this.refs["WMSLayerForm"].validate();
        });
      }, 0);
    }

    if (layer.type === "WMTS") {
      this.setState({
        mode: "edit",
        layerType: "WMTS",
      });

      setTimeout(() => {
        this.refs["WMTSLayerForm"].setState({
          id: layer.id,
          caption: layer.caption,
          internalLayerName: layer.internalLayerName,
          content: layer.content,
          date: layer.date,
          infobox: layer.infobox,
          legend: layer.legend,
          legendIcon: layer.legendIcon,
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
          infoOpenDataLink: layer.infoOpenDataLink,
          infoOwner: layer.infoOwner,
          timeSliderVisible: layer.timeSliderVisible,
          timeSliderStart: layer.timeSliderStart,
          timeSliderEnd: layer.timeSliderEnd,
          minZoom: layer.minZoom,
          maxZoom: layer.maxZoom,
        });
        setTimeout(() => {
          this.refs["WMTSLayerForm"].validate();
        }, 0);
      }, 0);
    }
  }

  describeLayer(e, layerName) {
    this.props.model.getLayerDescription(
      this.refs.input_url.value,
      layerName,
      (properties) => {
        this.setState({
          layerProperties: properties,
          layerPropertiesName: layerName,
        });
      }
    );
  }

  closeDetails() {
    this.setState({
      layerProperties: undefined,
      layerPropertiesLayer: undefined,
    });
  }

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

  filterLayers(e) {
    this.setState({
      filter: e.target.value,
    });
  }

  getLayersWithFilter() {
    return this.props.model.get("layers").filter((layer) => {
      const caption = layer.caption.toLowerCase();
      const internalLayerName = layer.internalLayerName?.toLowerCase() || "";
      const filter = this.state.filter.toLowerCase();
      return (
        caption.includes(filter) ||
        internalLayerName.includes(filter) ||
        layer.id.includes(filter)
      );
    });
  }

  renderLayersFromConfig(layers) {
    layers = this.state.filter
      ? this.getLayersWithFilter()
      : this.props.model.get("layers");

    var startsWith = [];
    var alphabetically = [];

    if (this.state.filter) {
      layers.forEach((layer) => {
        layer.caption.toLowerCase().indexOf(this.state.filter.toLowerCase()) ===
          0 ||
        layer.internalLayerName
          ?.toLowerCase()
          .indexOf(this.state.filter.toLowerCase()) === 0
          ? startsWith.push(layer)
          : alphabetically.push(layer);
      });

      startsWith.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      alphabetically.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      layers = startsWith.concat(alphabetically);
    }

    return layers.map((layer, i) => {
      var displayType = "";
      switch (layer.type) {
        case "WMS":
          displayType = "";
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
        default:
          break;
      }

      return (
        <li onClick={(e) => this.loadLayer(e, layer)} key={"layer_" + i}>
          <div className="main-box">
            <span>
              {layer.internalLayerName?.length > 0
                ? layer.internalLayerName
                : layer.caption}{" "}
              {displayType}
            </span>
            <span style={{ fontSize: "x-small" }}>{layer.id}</span>
          </div>
          <div className="options-box">
            <i
              title="Info om lager"
              onClick={(e) => this.infoAboutLayer(e, layer)}
              className="fa fa-info"
            />
            <i
              title="Radera lager"
              onClick={(e) => this.removeLayer(e, layer)}
              className="fa fa-trash"
            />
          </div>
        </li>
      );
    });
  }

  abort(e) {
    if (this.state.layerType === "WMS") {
      this.refs["WMSLayerForm"].reset();
    }
    this.setState(defaultState);
  }

  whenLayerAdded(success, layer) {
    if (success) {
      this.props.model.getConfig(this.props.config.url_layers);
      this.abort();
      this.setState({
        alert: true,
        alertMessage: "Lagret har lagts till i listan av tillgängliga lager.",
      });
    } else {
      this.setState({
        alert: true,
        alertMessage: "Lagret kunde inte läggas till. Försök igen senare.",
      });
    }
  }

  whenLayerUpdated(success, date) {
    if (success) {
      this.props.model.getConfig(this.props.config.url_layers);

      this.setState({
        alert: true,
        alertMessage: "Uppdateringen lyckades!",
        date: date,
      });
    } else {
      this.setState({
        alert: true,
        alertMessage: "Uppdateringen misslyckades.",
      });
    }
  }

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
      this.props.model.addLayer(layer, (success) => {
        this.whenLayerAdded(success, layer.date);
      });
    }

    if (this.state.mode === "edit") {
      if (layer.type === "ArcGIS" && layer.legend === "") {
        this.props.model.getLegend(layer, (legend) => {
          layer.legend = legend;
          this.props.model.updateLayer(layer, (success) => {
            this.whenLayerUpdated(success);
          });
        });
      } else {
        this.props.model.updateLayer(layer, (success) => {
          this.whenLayerUpdated(success);
        });
      }
    }
  }

  uploadLegend(callback, type) {
    $(`#${type}-form`).submit();
    this.refs[`${type}Iframe`].addEventListener("load", () => {
      console.log(this.refs[`${type}Iframe`], "this.refs.uploadIframe");
      if (this.refs[`${type}Iframe`].contentDocument) {
        if (!window.location.origin) {
          window.location.origin =
            window.location.protocol +
            "//" +
            window.location.hostname +
            (window.location.port ? ":" + window.location.port : "");
        }

        let node = $(this.refs[`${type}Iframe`].contentDocument).find(
          "body"
        )[0];
        let url = `${window.location.origin}/${node.innerHTML}`;
        this.props.model.set(type, url);
      }
    });
  }

  renderForm() {
    switch (this.state.layerType) {
      case "WMS":
        return (
          <WMSLayerForm
            ref="WMSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            parent={this}
            url={this.props.config.url_default_server}
            serverType={this.props.config.default_server_type}
          />
        );
      case "WMTS":
        return (
          <WMTSLayerForm
            ref="WMTSLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            parent={this}
            url={this.props.config.url_default_server}
            serverType={this.props.config.default_server_type}
          />
        );
      case "ArcGIS":
        return (
          <ArcGISLayerForm
            ref="ArcGISLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            parent={this}
            url={this.props.config.url_default_server}
            serverType={this.props.config.default_server_type}
          />
        );
      case "Vector":
        return (
          <VectorLayerForm
            ref="VectorLayerForm"
            model={this.props.model}
            layer={this.state.layer}
            parent={this}
            url={this.props.config.url_default_server}
            serverType={this.props.config.default_server_type}
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
      contentType: this.state.contentType,
      caption: this.state.caption,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }

  render() {
    var abort =
        this.state.mode === "edit" ? (
          <ColorButtonRed
            variant="contained"
            className="btn btn-danger"
            onClick={(e) => this.abort(e)}
            startIcon={<CancelIcon />}
          >
            Avbryt
          </ColorButtonRed>
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
            onChange={(e) => this.filterLayers(e)}
          />
          <ul className="config-layer-list">{this.renderLayersFromConfig()}</ul>
        </aside>
        <article>
          {[
            "select-layers-info-legend-icon",
            "select-image",
            "select-legend-icon",
          ].map((type) => {
            return (
              <form
                id={`${type}-form`}
                key={type}
                method="post"
                action={url}
                encType="multipart/form-data"
                target={`${type}-iframe`}
              >
                <input
                  style={{
                    opacity: 0,
                    position: "absolute",
                    width: "auto",
                    height: "100%",
                    padding: 0,
                    top: "-500px",
                  }}
                  id={type}
                  type="file"
                  multiple={false}
                  name="files[]"
                  onChange={(e) => {
                    const caller = e.currentTarget.getAttribute("caller");
                    if (caller) {
                      this.uploadLegend(e, caller);
                    }
                  }}
                />
                <iframe
                  id={`${type}-iframe`}
                  name={`${type}-iframe`}
                  ref={`${type}Iframe`}
                  style={{ display: "none" }}
                  title={`${type}-iframe`}
                />
              </form>
            );
          })}

          <form
            method="post"
            action=""
            onSubmit={(e) => {
              this.submit(e);
            }}
          >
            <p>
              <label>Välj lagertyp</label>
              <select
                disabled={typeSelectorDisabled}
                value={this.state.layerType}
                className="control-fixed-width"
                onChange={(e) => {
                  this.setState({ layerType: e.target.value });
                }}
              >
                <option>WMS</option>
                <option>WMTS</option>
                <option>ArcGIS</option>
                <option value="Vector">Vektor</option>
              </select>
            </p>
            {this.state.mode === "edit" ? (
              <ColorButtonBlue
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            ) : (
              <ColorButtonGreen
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
            )}
            &nbsp;
            {abort}
            {this.renderForm()}
            {this.state.mode === "edit" ? (
              <ColorButtonBlue
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            ) : (
              <ColorButtonGreen
                variant="contained"
                className="btn"
                type="submit"
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
            )}
            &nbsp;
            {abort}
          </form>
        </article>
        <div className="details">{this.renderLayerProperties()}</div>
      </section>
    );
  }
}

export default Manager;
