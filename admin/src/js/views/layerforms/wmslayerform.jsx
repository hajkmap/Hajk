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

import React from 'react';
import { Component } from 'react';
import $ from 'jquery';
var solpop;

const defaultState = {
  load: false,
  imageLoad: false,
  capabilities: false,
  validationErrors: [],
  layers: [],
  addedLayers: [],
  id: '',
  caption: '',
  content: '',
  date: 'Fylls i per automatik',
  infobox: '',
  legend: '',
  owner: '',
  url: '',
  queryable: true,
  opacity: 1.0,
  tiled: false,
  singleTile: false,
  imageFormat: '',
  serverType: 'geoserver',
  drawOrder: 1,
  layerType: 'WMS',
  attribution: '',
  searchUrl: '',
  searchPropertyName: '',
  searchDisplayName: '',
  searchOutputFormat: '',
  searchGeometryField: '',
  infoVisible: false,
  infoTitle: '',
  infoText: '',
  infoUrl: '',
  infoUrlText: '',
  infoOwner: '',
  solpopup: solpop
};

/**
 *
 */
class WMSLayerForm extends Component {
  componentDidMount () {
    defaultState.url = this.props.url;
    this.setState(defaultState);
    this.props.model.on('change:legend', () => {
      this.setState({
        legend: this.props.model.get('legend')
      });
      this.validateField('legend');
    });
  }

  componentWillUnmount () {
    this.props.model.off('change:legend');
  }

  constructor () {
    super();
    this.state = defaultState;
    this.layer = {};
  }

  reset () {
    this.setState(defaultState);
  }

  loadLegendImage (e) {
    $('#select-image').trigger('click');
  }

  renderLayerList () {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className='layer-list'>
        <ul>
          {layers}
        </ul>
      </div>
    );
  }

  appendLayer (e, checkedLayer, opts = {}) {
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }

    // If only one layer is selected, use title and abstract to populate some fields here
    if (this.state.addedLayers.length === 1 && this.state.caption.length === 0) {
      this.setState({
        caption: opts.title,
        infoText: opts.abstract
      });
    } else if (this.state.addedLayers.length === 0) {
      this.setState({
        caption: '',
        infoText: ''
      });
    }

    this.validateField('layers');
    this.forceUpdate();
  }

  renderSelectedLayers () {
    if (!this.state.addedLayers) return null;

    function uncheck (layer) {
      this.appendLayer({
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
      this.validateField('layers');
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className='layer' key={'addedLayer_' + i}>
        <span>{layer}</span>&nbsp;
        <i className='fa fa-times' onClick={uncheck.bind(this, layer)} />
      </li>
    );
  }

  createGuid () {
    return Math.floor((1 + Math.random()) * 0x1000000)
      .toString(16)
      .substring(1);
  }

  renderLayersFromCapabilites () {
    if (this.state && this.state.capabilities) {
      var layers = [];

      var append = (layer) => {
        var classNames = this.state.layerPropertiesName === layer.Name
          ? 'fa fa-info-circle active' : 'fa fa-info-circle';

        var i = this.createGuid();
        var title = /^\d+$/.test(layer.Name) ? <label>&nbsp;{layer.Title}</label> : null;

        let trueTitle = layer.hasOwnProperty('Title') ? layer.Title : '';
        let abstract = layer.hasOwnProperty('Abstract') ? layer.Abstract : '';

        let opts = {
          title: trueTitle,
          abstract: abstract
        };

        return (
          <li key={'fromCapability_' + i}>
            <input
              ref={layer.Name}
              id={'layer' + i}
              type='checkbox'
              data-type='wms-layer'
              checked={this.state.addedLayers.find(l => l === layer.Name)}
              onChange={(e) => {
                this.appendLayer(e, layer.Name, opts);
              }} />&nbsp;
            <label htmlFor={'layer' + i}>{layer.Name}</label>{title}
            <i style={{display: 'none'}} className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)} />
          </li>
        );
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

  loadLayers (layer, callback) {
    this.loadWMSCapabilities(undefined, () => {
      this.setState({
        addedLayers: layer.layers
      });
      Object.keys(this.refs).forEach(element => {
        var elem = this.refs[element];
        if (this.refs[element].dataset.type == 'wms-layer') {
          this.refs[element].checked = false;
        }
      });
      layer.layers.forEach(layer => {
        this.refs[layer].checked = true;
      });
      if (callback) callback();
    });
  }

  loadWMSCapabilities (e, callback) {
    if (e) { e.preventDefault(); }

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
          alertMessage: 'Servern svarar inte. Försök med en annan URL.'
        });
      }
      if (callback) {
        callback();
      }
    });
  }

  getLayer () {
    return {
      type: this.state.layerType,
      id: this.state.id,
      caption: this.getValue('caption'),
      url: this.getValue('url'),
      owner: this.getValue('owner'),
      date: this.getValue('date'),
      content: this.getValue('content'),
      legend: this.getValue('legend'),
      layers: this.getValue('layers'),
      infobox: this.getValue('infobox'),
      singleTile: this.getValue('singleTile'),
      imageFormat: this.getValue('imageFormat'),
      serverType: this.getValue('serverType'),
      queryable: this.getValue('queryable'),
      opacity: this.getValue('opacity'),
      tiled: this.getValue('tiled'),
      drawOrder: this.getValue('drawOrder'),
      attribution: this.getValue('attribution'),
      searchUrl: this.getValue('searchUrl'),
      searchPropertyName: this.getValue('searchPropertyName'),
      searchDisplayName: this.getValue('searchDisplayName'),
      searchOutputFormat: this.getValue('searchOutputFormat'),
      searchGeometryField: this.getValue('searchGeometryField'),
      infoVisible: this.getValue('infoVisible'),
      infoTitle: this.getValue('infoTitle'),
      infoText: this.getValue('infoText'),
      infoUrl: this.getValue('infoUrl'),
      infoUrlText: this.getValue('infoUrlText'),
      infoOwner: this.getValue('infoOwner'),
      searchGeometryField: this.getValue('searchGeometryField'),
      attribution: this.getValue('attribution'),
      solpopup: this.getValue('solpopup')
    };
  }

  getValue (fieldName) {
    function create_date () {
      return (new Date()).getTime();
    }

    function format_layers (layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs['input_' + fieldName],
      value = input ? input.value : '';

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'singleTile') value = input.checked;
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'infoVisible') value = input.checked;

    return value;
  }

  validate () {
    var valid = true;

    if (!this.validateField('url')) { valid = false; }

    if (!this.validateField('caption')) { valid = false; }

    if (!this.validateField('layers')) { valid = false; }

    return valid;
  }

  getValidationClass (inputName) {
    return this.state.validationErrors.find(v => v === inputName) ? 'validation-error' : '';
  }

  validateField (fieldName, e) {
    var value = this.getValue(fieldName),
      valid = true;

    switch (fieldName) {
      case 'layers':
        if (value.length === 0) {
          valid = false;
        }
        break;
      case 'opacity':
        console.log(value);
        console.log(typeof value);
        if (!/^-?\d+.\d+$/.test(value)) {
          valid = false;
        }
        break;
      case 'url':
      case 'caption':
        if (value === '') {
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

  render () {
    var loader = this.state.load ? <i className='fa fa-refresh fa-spin' /> : null;
    var imageLoader = this.state.imageLoad ? <i className='fa fa-refresh fa-spin' /> : null;
    var infoClass = this.state.infoVisible ? 'tooltip-info' : 'hidden';

    return (
      <fieldset>
        <legend>WMS-lager</legend>
        <div>
          <label>Visningsnamn*</label>
          <input
            type='text'
            ref='input_caption'
            value={this.state.caption}
            onChange={(e) => {
              this.setState({'caption': e.target.value});
              this.validateField('caption');
            }}
            className={this.getValidationClass('caption')}
          />
        </div>
        <div>
          <label>Url*</label>
          <input
            type='text'
            ref='input_url'
            value={this.state.url}
            onChange={(e) => {
              this.setState({'url': e.target.value});
              this.validateField('url');
            }}
            className={this.getValidationClass('url')}
          />
          <span onClick={(e) => { this.loadWMSCapabilities(e); }} className='btn btn-default'>Ladda {loader}</span>
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref='input_date'><i>{this.props.model.parseDate(this.state.date)}</i></span>
        </div>
        <div>
          <label>Innehåll</label>
          <input
            type='text'
            ref='input_content'
            value={this.state.content}
            onChange={(e) => this.setState({'content': e.target.value})}
          />
        </div>
        <div>
          <label>Teckenförklaring</label>
          <input
            type='text'
            ref='input_legend'
            value={this.state.legend}
            onChange={(e) => this.setState({'legend': e.target.value})}
          />
          <span onClick={(e) => { this.loadLegendImage(e); }} className='btn btn-default'>Välj fil {imageLoader}</span>
        </div>
        <div>
          <label>Valda lager*</label>
          <div ref='input_layers' className={this.getValidationClass('layers') + ' layer-list-choosen'} >
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
            ref='input_infobox'
            value={this.state.infobox}
            onChange={(e) => this.setState({'infobox': e.target.value})}
          />
        </div>
        <div>
          <label>Bildformat</label>
          <select ref='input_imageFormat' value={this.state.imageFormat} onChange={(e) => this.setState({'imageFormat': e.target.value})}>
            <option value='image/png'>image/png</option>
            <option value='image/png8'>image/png8</option>
            <option value='image/jpeg'>image/jpeg</option>
          </select>
        </div>
        <div>
          <label>Servertyp</label>
          <select ref='input_serverType' value={this.state.serverType} onChange={(e) => this.setState({'serverType': e.target.value})}>
            <option>geoserver</option>
            <option>arcgis</option>
          </select>
        </div>
        <div>
          <label>Opacitet*</label>
          <input
            type='number'
            step='0.01'
            ref='input_opacity'
            value={this.state.opacity}
            className={this.getValidationClass('opacity')}
            onChange={(e) => {
              console.log(e.target.value);
              this.setState({opacity: e.target.value});
              this.validateField('opacity');
            }}
          />
        </div>
        <div>
          <label>Single tile</label>
          <input
            type='checkbox'
            ref='input_singleTile'
            onChange={(e) => { this.setState({singleTile: e.target.checked}); }}
            checked={this.state.singleTile}
          />
        </div>
        <div>
          <label>Infoklickbar</label>
          <input
            type='checkbox'
            ref='input_queryable'
            onChange={(e) => { this.setState({queryable: e.target.checked}); }}
            checked={this.state.queryable}
          />
        </div>
        <div>
          <label>GeoWebCache</label>
          <input
            type='checkbox'
            ref='input_tiled'
            onChange={
              (e) => {
                this.setState({tiled: e.target.checked});
              }
            }
            checked={this.state.tiled}
          />
        </div>
        <div>
          <label>Upphovsrätt</label>
          <input
            type='text'
            ref='input_attribution'
            onChange={(e) => {
              this.setState({attribution: e.target.value});
              this.validateField('attribution', e);
            }}
            value={this.state.attribution}
            className={this.getValidationClass('attribution')}
          />
        </div>
        <div className='info-container'>
          <div>
            <label>Infodokument</label>
            <input
              type='checkbox'
              ref='input_infoVisible'
              onChange={(e) => { this.setState({infoVisible: e.target.checked}); }}
              checked={this.state.infoVisible}
            />
          </div>
          <div className={infoClass}>
            <label>Rubrik</label>
            <input
              type='text'
              ref='input_infoTitle'
              onChange={(e) => {
                this.setState({infoTitle: e.target.value});
                this.validateField('infoTitle', e);
              }}
              value={this.state.infoTitle}
              className={this.getValidationClass('infoTitle')}
            />
          </div>
          <div className={infoClass}>
            <label>Text</label>
            <textarea
              type='text'
              ref='input_infoText'
              onChange={(e) => {
                this.setState({infoText: e.target.value});
                this.validateField('infoText', e);
              }}
              value={this.state.infoText}
              className={this.getValidationClass('infoText')}
            />
          </div>
          <div className={infoClass}>
            <label>Länk (ex. till PDF)</label>
            <input
              type='text'
              ref='input_infoUrl'
              onChange={(e) => {
                this.setState({infoUrl: e.target.value});
                this.validateField('infoUrl', e);
              }}
              value={this.state.infoUrl}
              className={this.getValidationClass('infoUrl')}
            />
          </div>
          <div className={infoClass}>
            <label>Länktext</label>
            <input
              type='text'
              ref='input_infoUrlText'
              onChange={(e) => {
                this.setState({infoUrlText: e.target.value});
                this.validateField('infoUrlText', e);
              }}
              value={this.state.infoUrlText}
              className={this.getValidationClass('infoUrlText')}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input
              type='text'
              ref='input_infoOwner'
              onChange={(e) => {
                this.setState({infoOwner: e.target.value});
                this.validateField('infoOwner', e);
              }}
              value={this.state.infoOwner ? this.state.infoOwner : this.state.owner}
              className={this.getValidationClass('infoOwner')}
            />
          </div>
        </div>
        <h2>Sökning</h2>
        <div>
          <label>Url</label>
          <input
            type='text'
            ref='input_searchUrl'
            onChange={(e) => {
              this.setState({searchUrl: e.target.value});
              this.validateField('searchUrl', e);
            }}
            value={this.state.searchUrl}
            className={this.getValidationClass('searchUrl')}
          />
        </div>
        <div>
          <label>Sökfält</label>
          <input
            type='text'
            ref='input_searchPropertyName'
            onChange={(e) => {
              this.setState({searchPropertyName: e.target.value});
              this.validateField('searchPropertyName', e);
            }}
            value={this.state.searchPropertyName}
            className={this.getValidationClass('searchPropertyName')}
          />
        </div>
        <div>
          <label>Visningsfält</label>
          <input
            type='text'
            ref='input_searchDisplayName'
            onChange={(e) => {
              this.setState({searchDisplayName: e.target.value});
              this.validateField('searchDisplayName', e);
            }}
            value={this.state.searchDisplayName}
            className={this.getValidationClass('searchDisplayName')}
          />
        </div>
        <div>
          <label>Utdataformat</label>
          <input
            type='text'
            ref='input_searchOutputFormat'
            onChange={(e) => {
              this.setState({searchOutputFormat: e.target.value});
              this.validateField('searchOutputFormat', e);
            }}
            value={this.state.searchOutputFormat}
            className={this.getValidationClass('searchOutputFormat')}
          />
        </div>
        <div>
          <label>Geometrifält</label>
          <input
            type='text'
            ref='input_searchGeometryField'
            onChange={(e) => {
              this.setState({searchGeometryField: e.target.value});
              this.validateField('searchGeometryField', e);
            }}
            value={this.state.searchGeometryField}
            className={this.getValidationClass('searchGeometryField')}
          />
        </div>
      </fieldset>
    );
  }
}

export default WMSLayerForm;
