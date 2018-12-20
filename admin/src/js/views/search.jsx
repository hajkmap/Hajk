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
import Alert from '../views/alert.jsx';

const defaultState = {
  load: false,
  capabilities: false,
  validationErrors: [],
  mode: 'add',
  layers: [],
  addedLayers: [],
  id: '',
  caption: '',
  date: 'Fylls i per automatik',
  searchFields: '',
  infobox: '',
  aliasDict: '',
  displayFields: '',
  geometryField: '',
  url: '',
  outputFormat: undefined,
  alert: false,
  corfirm: false,
  alertMessage: '',
  content: '',
  confirmAction: () => {},
  denyAction: () => {}
};
/**
 *
 */
class Search extends Component {
  /**
   *
   */
  constructor () {
    super();
    this.state = defaultState;
  }
  /**
   *
   */
  componentDidMount () {
    this.props.model.set('config', this.props.config);
    this.props.model.getConfig(this.props.config.url_layers);
    this.props.model.on('change:layers', () => {
      this.setState({
        layers: this.props.model.get('layers')
      });
    });

    defaultState.url = this.props.config.url_default_server;

    this.setState(defaultState);
  }
  /**
   *
   */
  componentWillUnmount () {
    this.props.model.off('change:layers');
  }
  /**
   *
   */
  removeLayer (e, layer) {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage: 'Lagret kommer att tas bort. Är detta ok?',
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
              alertMessage: 'Lagret kunde inte tas bort. Försök igen senare.'
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
  loadLayer (e, layer) {
    this.setState({
      mode: 'edit',
      id: layer.id,
      caption: layer.caption,
      searchFields: layer.searchFields,
      infobox: layer.infobox,
      aliasDict: layer.aliasDict,
      displayFields: layer.displayFields,
      geometryField: layer.geometryField,
      outputFormat: layer.outputFormat || 'GML3',
      url: layer.url,
      addedLayers: []
    });

    setTimeout(() => {
      this.validate('url');
      this.validate('searchFields');
      this.validate('displayFields');
      this.validate('geometryField');
      this.validate('outputFormat');
      this.loadWMSCapabilities(undefined, () => {
        this.setState({
          addedLayers: layer.layers
        });

        this.validate('layers');

        Object.keys(this.refs).forEach(element => {
          var elem = this.refs[element];
          if (this.refs[element].dataset.type == 'wms-layer') {
            this.refs[element].checked = false;
          }
        });

        layer.layers.forEach(layer => {
          this.refs[layer].checked = true;
        });
      });
    }, 0);
  }
  /**
   *
   */
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
      this.state.capabilities.forEach((layer, i) => {
        this.refs[layer.name].checked = false;
      });
    }

    this.props.model.getWMSCapabilities(this.state.url, (capabilities) => {
      this.setState({
        capabilities: capabilities,
        load: false
      });
      if (capabilities === false) {
        this.setState({
          alert: true,
          alertMessage: 'Servern svarar inte. Försök med en annan URL.'
        });
      }
      if (callback) {
        callback();
      }
    });
  }
  /**
   *
   */
  appendLayer (e, checkedLayer) {
    this.state.addedLayers.splice(0, this.state.addedLayers.length);
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }
    this.forceUpdate();
    this.validate('layers');
  }
  /**
   *
   */
  renderSelectedLayers () {
    if (!this.state.addedLayers) return null;

    function uncheck (layer) {
      this.appendLayer({
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className='layer' key={i}>
        <span>{layer}</span>&nbsp;
        <i className='fa fa-times' onClick={uncheck.bind(this, layer)} />
      </li>
    );
  }
  /**
   *
   */
  filterLayers (e) {
    this.setState({
      filter: e.target.value
    });
  }
  /**
   *
   */
  getLayersWithFilter (filter) {
    return this.props.model.get('layers').filter(layer => {
      return (new RegExp(this.state.filter)).test(layer.caption.toLowerCase());
    });
  }
  /**
   *
   */
  renderLayersFromConfig (layers) {
    layers = this.state.filter ? this.getLayersWithFilter() : this.props.model.get('layers');

    var startsWith = [];
    var alphabetically = [];

    if (this.state.filter) {
      layers.forEach(layer => {
        layer.caption.toLowerCase().indexOf(this.state.filter) == 0 ? startsWith.push(layer) : alphabetically.push(layer);
      });

      startsWith.sort(function (a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) return -1;
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) return 1;
        return 0;
      });

      alphabetically.sort(function (a, b) {
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
    
    return layers.map((layer, i) =>
      <li onClick={(e) => this.loadLayer(e, layer)} key={Math.random()}>
        <span>{layer.caption}</span>
        <i title='Radera lager' onClick={(e) => this.removeLayer(e, layer)} className='fa fa-trash' />
      </li>
    );
  }
  /**
   *
   */
  abort (e) {
    this.setState(defaultState);
  }
  /**
   *
   */
  validate (fieldName, e) {
    var value = this.getValue(fieldName),
      valid = true;

    switch (fieldName) {
      case 'displayFields':
      case 'searchFields':
        valid = value.every(val => /^\w+$/.test(val));
        if (value.length === 1 && value[0] === '') {
          valid = true;
        }

        break;
      case 'layers':
        if (value.length === 0) {
          valid = false;
        }
        break;
      case 'url':
      case 'caption':
      case 'geometryField':
        if (value === '') {
          valid = false;
        }
        break;
      case 'outputFormat':
        if (value == '') { valid = false; }
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
  /**
   *
   */
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
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'searchFields') value = value.split(',');
    if (fieldName === 'displayFields') value = value.split(',');

    return value;
  }
  /**
   *
   */
  createGuid (layers) {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
  /**
   *
   */
  submit (e) {
    var validations = [
      this.validate('url'),,
      this.validate('layers'),
      this.validate('searchFields'),
      this.validate('displayFields'),
      this.validate('geometryField'),
      this.validate('outputFormat')
    ];

    if (validations.every(v => v === true)) {
      console.log('getvalue: ' + this.getValue('aliasDict'));

      let layer = {
        id: this.state.id,
        caption: this.getValue('caption'),
        url: this.getValue('url'),
        layers: this.getValue('layers'),
        searchFields: this.getValue('searchFields'),
        infobox: this.getValue('infobox'),
        aliasDict: this.getValue('aliasDict'),
        displayFields: this.getValue('displayFields'),
        geometryField: this.getValue('geometryField'),
        outputFormat: this.getValue('outputFormat')
      };

      if (this.state.mode === 'add') {
        layer.id = this.createGuid(this.props.model.get('layers'));

        this.props.model.addLayer(layer, success => {
          if (success) {
            this.props.config.url_layers;
            this.props.model.getConfig(this.props.config.url_layers);
            this.abort();
            this.setState({
              alert: true,
              alertMessage: 'Lagret har lagt till i listan av tillgängliga lager.'
            });
          } else {
            this.setState({
              alert: true,
              alertMessage: 'Lagret kunde inte läggas till. Försök igen senare.'
            });
          }
        });
      }
      if (this.state.mode === 'edit') {
        this.props.model.updateLayer(layer, success => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.setState({
              alert: true,
              alertMessage: 'Uppdateringen lyckades!'
            });
            this.setState({
              date: layer.date
            });
          } else {
            this.setState({
              alert: true,
              alertMessage: 'Uppdateringen misslyckades.'
            });
          }
        });
      }
    }
    e.preventDefault();
  }
  /**
   *
   */
  parseDate () {
    var parsed = parseInt(this.state.date);
    return isNaN(parsed)
      ? this.state.date
      : (new Date(parsed)).toLocaleString();
  }
  /**
   *
   */
  getValidationClass (inputName) {
    return this.state.validationErrors.find(v => v === inputName) ? 'validation-error' : '';
  }
  /**
   *
   */
  describeLayer (e, layerName) {
    this.props.model.getLayerDescription(this.refs.input_url.value, layerName, (properties) => {
      this.setState({
        layerProperties: properties,
        layerPropertiesName: layerName
      });
    });
  }
  /**
   *
   */
  closeDetails () {
    this.setState({
      layerProperties: undefined,
      layerPropertiesName: undefined
    });
  }
  /**
   *
   */
  renderLayerProperties () {
    if (this.state.layerProperties === undefined) {
      return null;
    }
    if (this.state.layerProperties === false) {
      return (
        <div>
          <i className='fa fa-times' onClick={() => this.closeDetails()} />
          <div>Information saknas</div>
        </div>
      );
    }
    var rows = this.state.layerProperties.map((property, i) =>
      <tr key={i}>
        <td>{property.name}</td>
        <td>{property.localType}</td>
      </tr>
    );
    return (
      <div>
        <i className='fa fa-times' onClick={() => this.closeDetails()} />
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Typ</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
  /**
   *
   */
  renderLayersFromCapabilites () {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {
        var classNames = this.state.layerPropertiesName === layer.name
          ? 'fa fa-info-circle active' : 'fa fa-info-circle';
        return (
          <li key={i}>
            <input ref={layer.name} id={'layer' + i} type='radio' name='featureType' data-type='wms-layer' onChange={(e) => { this.appendLayer(e, layer.name); }} />&nbsp;
            <label htmlFor={'layer' + i}>{layer.name}</label>
            <i className={classNames} onClick={(e) => this.describeLayer(e, layer.name)} />
          </li>
        );
      });
    } else {
      return null;
    }
  }
  /**
   *
   */
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
  getAlertOptions () {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ''
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ''
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ''
        });
      }
    };
  }
  /**
   *
   */
  render () {
    var loader = this.state.load ? <i className='fa fa-refresh fa-spin' /> : null;
    var abort = this.state.mode === 'edit' ? <span className='btn btn-danger' onClick={(e) => this.abort(e)}>Avbryt</span> : null;

    return (
      <section className='tab-pane active'>
        <Alert options={this.getAlertOptions()} />
        <aside>
          <input placeholder='filtrera' type='text' onChange={(e) => this.filterLayers(e)} />
          <ul className='config-layer-list'>
            {this.renderLayersFromConfig()}
          </ul>
        </aside>
        <article>
          <form method='post' action='' onSubmit={(e) => { this.submit(e); }}>
            <fieldset>
              <legend>Lägg till WFS-tjänst</legend>
              <div>
                <label>Visningsnamn*</label>
                <input
                  type='text'
                  ref='input_caption'
                  value={this.state.caption}
                  onChange={(e) => this.validate('caption', e)}
                  className={this.getValidationClass('caption')}
                />
              </div>
              <div>
                <label>Url*</label>
                <input
                  type='text'
                  ref='input_url'
                  value={this.state.url}
                  onChange={(e) => this.validate('url', e)}
                  className={this.getValidationClass('url')}
                />
                <span onClick={(e) => { this.loadWMSCapabilities(e); }} className='btn btn-default'>Ladda lager {loader}</span>
              </div>
              <div>
                <label>Valt lager*</label>
                <div ref='input_layers' className={'layer-list-choosen ' + this.getValidationClass('layers')}>
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
                <label>alias dictionary</label>
                <textarea
                  ref='input_aliasDict'
                  value={this.state.aliasDict}
                  onChange={(e) => {
                    this.setState({'aliasDict': e.target.value});
                  }}
                />
              </div>
              <div>
                <label>Sökfält</label>
                <input
                  type='text'
                  ref='input_searchFields'
                  onChange={(e) => this.validate('searchFields', e)}
                  value={this.state.searchFields}
                  className={this.getValidationClass('searchFields')}
                />
              </div>
              <div>
                <label>Visningsfält</label>
                <input
                  type='text'
                  ref='input_displayFields'
                  onChange={(e) => this.validate('displayFields', e)}
                  value={this.state.displayFields}
                  className={this.getValidationClass('displayFields')}
                />
              </div>
              <div>
                <label>Geometrifält</label>
                <input
                  type='text'
                  ref='input_geometryField'
                  onChange={(e) => this.validate('geometryField', e)}
                  value={this.state.geometryField}
                  className={this.getValidationClass('geometryField')}
                />
              </div>
              <div>
                <label>Responstyp</label>
                <select ref='input_outputFormat' value={this.state.outputFormat} onChange={(e) => { this.validate('outputFormat', e); }}>
                  <option value='GML3'>GML3</option>
                  <option value='GML2'>GML2</option>
                </select>
              </div>
            </fieldset>
            <button className='btn btn-primary'>{this.state.mode == 'edit' ? 'Spara' : 'Lägg till'}</button>&nbsp;
            {abort}
          </form>
        </article>
        <div className='details'>
          {this.renderLayerProperties()}
        </div>
      </section>
    );
  }
}

export default Search;
