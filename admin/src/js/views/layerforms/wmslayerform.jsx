import React from "react";
import { Component } from 'react';
import $ from 'jquery';

const defaultState = {
  load: false,
  imageLoad: false,
  capabilities: false,
  validationErrors: [],
  layers: [],
  addedLayers: [],
  id: "",
  caption: "",
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
  owner: "",
  url: "",
  searchFields: "",
  displayFields: "",
  url: "",
  visibleAtStart: false,
  queryable: true,
  tiled: false,
  singleTile: false,
  imageFormat: "",
  serverType: 'geoserver',
  drawOrder: 1,
  layerType: "WMS"
};

/**
 *
 */
class WMSLayerForm extends Component {

  componentDidMount() {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on('change:legend', () => {
      this.setState({
        legend: this.props.model.get('legend')
      });
      this.validateField('legend');
    });
  }

  componentWillUnmount() {
    this.props.model.off('change:legend');
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
    $('#select-image').trigger('click');
  }

  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>
          {layers}
        </ul>
      </div>
    )
  }

  appendLayer(e, checkedLayer) {
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }
    this.validateField('layers');
    this.forceUpdate();
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer({
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
      this.validateField('layers');
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={"addedLayer_" + i}>
        <span>{layer}</span>&nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)}></i>
      </li>
    )
  }

  createGuid() {
    return Math.floor((1 + Math.random()) * 0x1000000)
        .toString(16)
        .substring(1);
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      var layers = [];

      var append = (layer) => {

        var classNames = this.state.layerPropertiesName === layer.Name ?
                         "fa fa-info-circle active" : "fa fa-info-circle";

        var i = this.createGuid();
        var title = /^\d+$/.test(layer.Name) ? <label>&nbsp;{layer.Title}</label> : null;

        return (
          <li key={"fromCapability_" + i}>
            <input
              ref={layer.Name}
              id={"layer" + i}
              type="checkbox"
              data-type="wms-layer"
              checked={this.state.addedLayers.find(l => l === layer.Name)}
              onChange={(e) => {
                this.appendLayer(e, layer.Name)
              }} />&nbsp;
            <label htmlFor={"layer" + i}>{layer.Name}</label>{title}
            <i style={{display:"none"}} className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)}></i>
          </li>
        )
      };

      this.state.capabilities.Capability.Layer.Layer.map((layer) => {
        if (layer.Layer) {
          layer.Layer.forEach((layer) => {
            if (layer.Layer) {
              layer.Layer.forEach((layer) => {
                layers.push(append(layer));
              });
            } else {
              layers.push(append(layer));
            }
          });
        } else {
          layers.push(append(layer));
        }
      });
      return layers;
    } else {
      return null;
    }
  }

  loadLayers(layer, callback) {
    this.loadWMSCapabilities(undefined, () => {
      this.setState({
        addedLayers: layer.layers
      });
      Object.keys(this.refs).forEach(element => {
        var elem = this.refs[element];
        if (this.refs[element].dataset.type == "wms-layer") {
          this.refs[element].checked = false;
        }
      });
      layer.layers.forEach(layer => {
        this.refs[layer].checked = true;
      });
      if (callback) callback();
    });
  }

  loadWMSCapabilities(e, callback) {

    if (e)
      e.preventDefault();

    this.setState({
      load: true,
      addedLayers: [],
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined
    });

    if (this.state.capabilities) {
      this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
        this.refs[layer.Name].checked = false;
      });
    }

    this.props.model.getWMSCapabilities(this.state.url, (capabilities) => {
      this.setState({
        capabilities: capabilities,
        load: false
      });
      if (capabilities === false) {
        this.props.application.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL."
        })
      }
      if (callback) {
        callback();
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
      infobox: this.getValue("infobox"),
      searchFields: this.getValue("searchFields"),
      displayFields: this.getValue("displayFields"),
      visibleAtStart: this.getValue("visibleAtStart"),
      singleTile: this.getValue("singleTile"),
      imageFormat: this.getValue("imageFormat"),
      serverType: this.getValue("serverType"),
      queryable: this.getValue("queryable"),
      tiled: this.getValue("tiled"),
      drawOrder: this.getValue("drawOrder")
    };
  }

  getValue(fieldName) {

    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'singleTile') value = input.checked;
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);

    return value;
  }

  validate() {

    var valid = true;

    if (!this.validateField("url"))
      valid = false;

    if (!this.validateField("caption"))
      valid = false;

    if (!this.validateField("layers"))
      valid = false;

    return valid;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }

  validateField (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;

    switch (fieldName) {
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
        if (value === "") {
          valid = false;
        }
        break;
    }

    if (!valid) {
      this.state.validationErrors.push(fieldName);
    } else {
      this.state.validationErrors = this.state.validationErrors.filter(v => v !== fieldName);
    }

    if (e) {
      let state = {};
      state[fieldName] = e.target.value;
      this.setState(state);
    } else {
      this.forceUpdate();
    }

    return valid;
  }

  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var imageLoader = this.state.imageLoad ? <i className="fa fa-refresh fa-spin"></i> : null

    return (
      <fieldset>
        <legend>WMS-lager</legend>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            onChange={(e) => {
              this.setState({'caption': e.target.value})
              this.validateField('caption');
            }}
            className={this.getValidationClass("caption")}
          />
        </div>
        <div>
          <label>Url*</label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            onChange={(e) => {
              this.setState({'url': e.target.value})
              this.validateField('url');
            }}
            className={this.getValidationClass("url")}
          />
          <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default">Ladda {loader}</span>
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref="input_date"><i>{this.props.model.parseDate(this.state.date)}</i></span>
        </div>
        <div>
          <label>Innehåll</label>
          <input
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={(e) => this.setState({'content': e.target.value})}
          />
        </div>
        <div>
          <label>Teckenförklaring</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            onChange={(e) => this.setState({'legend': e.target.value})}
          />
          <span onClick={(e) => {this.loadLegendImage(e)}} className="btn btn-default">Välj fil {imageLoader}</span>
        </div>
        <div>
          <label>Synligt vid start</label>
          <input
            type="checkbox"
            ref="input_visibleAtStart"
            onChange={
              (e) => {
                this.setState({visibleAtStart: e.target.checked})
              }
            }
            checked={this.state.visibleAtStart}
          />
        </div>
        <div>
          <label>Valda lager*</label>
          <div ref="input_layers" className={this.getValidationClass("layers") + " layer-list-choosen"} >
            <ul>
              {this.renderSelectedLayers()}
            </ul>
          </div>
        </div>
        <div>
          <label>Lagerlista</label>
          {this.renderLayerList()}
        </div>
        <div>
          <label>Inforuta</label>
          <textarea
            ref="input_infobox"
            value={this.state.infobox}
            onChange={(e) => this.setState({'infobox': e.target.value})}
          />
        </div>
        <div>
          <label>Bildformat</label>
          <select ref="input_imageFormat" value={this.state.imageFormat} onChange={(e) => this.setState({'imageFormat': e.target.value})}>
            <option value="image/png">image/png</option>
            <option value="image/jpeg">image/jpeg</option>
          </select>
        </div>
        <div>
          <label>Servertyp</label>
          <select ref="input_serverType" value={this.state.serverType} onChange={(e) => this.setState({'serverType': e.target.value})}>
            <option>geoserver</option>
            <option>arcgis</option>
          </select>
        </div>
        <div>
          <label>Single tile</label>
          <input
            type="checkbox"
            ref="input_singleTile"
            onChange={(e) => { this.setState({singleTile: e.target.checked})}}
            checked={this.state.singleTile}
          />
        </div>
        <div>
          <label>Infoklickbar</label>
          <input
            type="checkbox"
            ref="input_queryable"
            onChange={(e) => {this.setState({queryable: e.target.checked})}}
            checked={this.state.queryable}
          />
        </div>
        <div style={{display: "none"}}>
          <label>Geowebcache</label>
          <input
            type="checkbox"
            ref="input_tiled"
            onChange={
              (e) => {
                this.setState({tiled: e.target.checked})
              }
            }
            checked={this.state.tiled}
          />
        </div>
      </fieldset>
    );
  }

}

export default WMSLayerForm;
