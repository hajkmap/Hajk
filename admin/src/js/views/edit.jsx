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
  capabilities: [],
  validationErrors: [],
  mode: 'add',
  layers: [],
  addedLayers: [],
  id: '',
  caption: '',
  url: '',
  projection: '',
  point: false,
  linestring: false,
  polygon: false,
  layerProperties: [],
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
    this.abort();
    this.setState({
      mode: 'edit',
      id: layer.id,
      caption: layer.caption,
      url: layer.url,
      projection: layer.projection || 'EPSG:3006',
      addedLayers: [],
      point: layer.editPoint,
      linestring: layer.editLine,
      polygon: layer.editPolygon
    });

    setTimeout(() => {
      this.validate('caption');
      this.validate('url');
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

        this.describeLayer(undefined, layer.layers[0], layer);
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
    this.state.addedLayers = [];
    this.state.addedLayers.push(checkedLayer);
    this.forceUpdate();
    this.validate('layers');
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
      case 'layers':
        if (value.length === 0) {
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
      var value;
      if (fieldName === 'point' ||
          fieldName === 'linestring' ||
          fieldName === 'polygon') {
        value = e.target.checked;
      } else {
        value = e.target.value;
      }

      let state = {};
      state[fieldName] = value;
      this.setState(state);
    } else {
      this.forceUpdate();
    }

    return valid;
  }
  /**
   *
   */
  getEditableFields () {
    var filter, mapper;
    mapper = item => {
      return {
        index: item.index,
        name: item.name,
        dataType: item.localType,
        textType: item.textType || null,
        values: item.listValues || null,
        hidden: item.hidden,
        defaultValue: item.defaultValue
      };
    };

    filter = item => item.checked === true;

    return this
      .state
      .layerProperties
      .filter(filter)
      .map(mapper);
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
    if (fieldName === 'editableFields') value = this.getEditableFields();
    if (fieldName === 'point') value = input.checked;
    if (fieldName === 'polygon') value = input.checked;
    if (fieldName === 'linestring') value = input.checked;

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
  describeLayer (e, layerName, layer) {
    this.props.model.getLayerDescription(this.refs.input_url.value, layerName, (properties) => {
      if (layer && layer.editableFields) {
        layer.editableFields.forEach((editableField) => {
          properties[editableField.index].listValues = editableField.values;
          properties[editableField.index].textType = editableField.textType;
          properties[editableField.index].checked = true;
          properties[editableField.index].hidden = editableField.hidden;
          properties[editableField.index].defaultValue = editableField.defaultValue;
        });
      }

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
  addListValue (index, e) {
    if (this.state.layerProperties[index] && e.target.value !== '') {
      let props = this.state.layerProperties[index];
      if (!Array.isArray(props.listValues)) {
        props.listValues = [];
      }
      props.listValues.push(e.target.value);
    }
  }
  /**
   *
   */
  submit (e) {
    var validations = [
      this.validate('caption'),
      this.validate('url'),
      this.validate('layers')
    ];

    if (validations.every(v => v === true)) {
      let layer = {
        id: this.state.id,
        caption: this.getValue('caption'),
        url: this.getValue('url'),
        layers: this.getValue('layers'),
        projection: this.getValue('projection'),
        editableFields: this.getValue('editableFields'),
        editPoint: this.getValue('point'),
        editPolygon: this.getValue('polygon'),
        editLine: this.getValue('linestring')
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
  renderSelectedLayers () {
    if (!this.state.addedLayers) return null;

    function uncheck (layer) {
      this.state.addedLayers = [];
      this.refs[layer].checked = false;
      this.forceUpdate();
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className='layer noselect' key={i}>
        <span>{layer}</span>&nbsp;
        <i className='fa fa-times' onClick={uncheck.bind(this, layer)} />
      </li>
    );
  }
  /**
   *
   */
  renderListValues (index) {
    if (this.state.layerProperties[index] &&
        this.state.layerProperties[index].listValues) {
      return this.state.layerProperties[index].listValues.map((value, i) => {
        return (
          <span className='list-value noselect' key={i}>
            {value} <i className='fa fa-times' onClick={() => {
              this.state.layerProperties[index].listValues.splice(i, 1);
              this.forceUpdate();
            }} />
          </span>
        );
      });
    } else {
      return null;
    }
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
          <div>Information saknas</div>
        </div>
      );
    }

    var rows = this.state.layerProperties.map((property, i) => {
      var stringDataTypes = type => {
        if (type === 'string') {
          if (!property.textType) {
            property.textType = 'fritext';
          }
          return (
            <select defaultValue={property.textType} onChange={(e) => {
              property.textType = e.target.value;
            }}>
              <option value='fritext'>Fritext</option>
              <option value='datum'>Datum</option>
              <option value='lista'>Lista</option>
              <option value='flerval'>Flerval</option>
              <option value='url'>Url</option>
            </select>
          );
        }
        return null;
      };

      var listEditor = type => {
        if (type === 'string') {
          return (
            <div>
              <input onKeyDown={(e) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  this.addListValue(i, e);
                  this.forceUpdate();
                  e.target.value = '';
                }
              }} type='text' />
              <div className='editable-list'>
                { this.renderListValues(i) }
              </div>
            </div>
          );
        }
        return null;
      };

      var defaultValueEditor = (type, value) => {
        return (
          <div>
            <input defaultValue={value} type='text' onChange={(e) => {
              property.defaultValue = e.target.value;
            }} />
          </div>
        );
      };

      if (!property.hasOwnProperty('hidden')) {
        property.hidden = false;
      }

      property.index = i;

      if (property.localType === 'Geometry') {
        return null;
      }

      return (
        <tr key={parseInt(Math.random() * 1E8)}>
          <td>
            <input type='checkbox' defaultChecked={property.checked} onChange={(e) => {
              property.checked = e.target.checked;
            }} />
          </td>
          <td>
            <input type='checkbox' defaultChecked={property.hidden} onChange={(e) => {
              property.hidden = e.target.checked;
            }} />
          </td>
          <td>{property.name}</td>
          <td>{stringDataTypes(property.localType)}</td>
          <td>{property.localType}</td>
          <td>{listEditor(property.localType)}</td>
          <td>{defaultValueEditor(property.localType, property.defaultValue)}</td>
        </tr>
      );
    });

    return (
      <table className='edit-fields-table'>
        <thead>
          <tr>
            <th>Redigerbar</th>
            <th>Dold</th>
            <th>Namn</th>
            <th>Typ</th>
            <th>Datatyp</th>
            <th>Listvärden</th>
            <th>Standardvärde</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
  /**
   *
   */
  renderLayersFromCapabilites () {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {
        return (
          <li key={i}>
            <input ref={layer.name} id={'layer' + i} type='radio' name='featureType' data-type='wfs-layer' onChange={(e) => {
              this.appendLayer(e, layer.name);
              this.describeLayer(e, layer.name);
            }} />&nbsp;
            <label htmlFor={'layer' + i}>{layer.name}</label>
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
  renderProjections () {
    var render = (projection, i) => <option key={i} value={projection}>{projection}</option>;
    var options = this.props.config.projections.map(render);

    return (
      <select ref='input_projection' value={this.state.projection} onChange={(e) => {
        this.setState({
          projection: e.target.value
        });
      }}>{options}</select>
    );
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
              <legend>Lägg till WFST-tjänst</legend>
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
                <label>Projektion</label>
                {this.renderProjections()}
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
                <label>Redigerbara fält</label>
                {this.renderLayerProperties()}
              </div>
              <div>
                <label>Geometrityper</label>
                <div className='geometry-types'>
                  <input
                    checked={this.state.point}
                    onChange={(e) => this.validate('point', e)}
                    ref='input_point'
                    name='point' id='point'
                    type='checkbox' />
                  <label htmlFor='point'>&nbsp;Punkter</label><br />
                  <input
                    checked={this.state.linestring}
                    onChange={(e) => this.validate('linestring', e)}
                    ref='input_linestring'
                    name='linestring'
                    id='linestring'
                    type='checkbox' />
                  <label htmlFor='linestring'>&nbsp;Linjer</label><br />
                  <input
                    checked={this.state.polygon}
                    onChange={(e) => this.validate('polygon', e)}
                    ref='input_polygon'
                    name='polygon'
                    id='polygon'
                    type='checkbox' />
                  <label htmlFor='polygon'>&nbsp;Ytor</label>
                </div>
              </div>
            </fieldset>
            <button className='btn btn-primary'>{this.state.mode == 'edit' ? 'Spara' : 'Lägg till'}</button>&nbsp;
            {abort}
          </form>
        </article>
      </section>
    );
  }
}

export default Search;
