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
import Tree from '../tree.jsx';

var defaultState = {
  validationErrors: [],
  toolbar: 'bottom',
  active: false,
  index: 0,
  target: 'toolbar',
  onMap: false,
  bothSynlig: false,
  enableViewTogglePopupInSnabbsok: true,
  selectionTools: true,
  base64Encode: false,
  instruction: '',
  filterVisible: true,
  displayPopup: true,
  maxZoom: 14,
  excelExportUrl: '/mapservice/export/excel',
  kmlExportUrl: '/mapservice/export/kml',
  markerImg: 'http://localhost/hajk/assets/icons/marker.png',
  anchorX: 16,
  anchorY: 32,
  imgSizeX: 32,
  imgSizeY: 32,
  popupOffsetY: 0,
  visibleForGroups: [],
  searchableLayers: {},
  tree: '',
  layers: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor () {
    super();
    this.state = defaultState;
    this.type = 'search';

    this.handleAddSearchable = this.handleAddSearchable.bind(this);
    this.loadLayers = this.loadLayers.bind(this);
  }

  componentDidMount () {
    if (this.props.parent.props.parent.state.authActive) {
      this.loadSearchableLayers();
    }
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || 'toolbar',
        onMap: tool.options.onMap,
        bothSynlig: tool.options.bothSynlig,
        enableViewTogglePopupInSnabbsok: tool.options.enableViewTogglePopupInSnabbsok,
        selectionTools: tool.options.selectionTools,
        base64Encode: tool.options.base64Encode,
        instruction: tool.options.instruction,
        filterVisible: tool.options.filterVisible,
        displayPopup: tool.options.displayPopup,
        maxZoom: tool.options.maxZoom,
        excelExportUrl: tool.options.excelExportUrl,
        kmlExportUrl: tool.options.kmlExportUrl,
        markerImg: tool.options.markerImg,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY,
        imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
        imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
        popupOffsetY: tool.options.popupOffsetY,
        visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : [],
        layers: tool.options.layers ? tool.options.layers : []
      }, () => { this.loadLayers(); });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount () {
  }
  /**
   *
   */
  componentWillMount () {

  }

  /**
   * Anropas från tree.jsx i componentDidMount som passar med refs.
   * Sätter checkboxar och inputfält för söklager.
   * @param {*} childRefs
   */
  loadLayers (childRefs) {
    // checka checkboxar, visa textfält
    // och sätt text från kartkonfig.json
    let ids = [];

    for (let id of this.state.layers) {
      ids.push(id);
    }

    if (typeof childRefs !== 'undefined') {
      for (let i of ids) {
        childRefs['cb_' + i.id].checked = true;
        childRefs[i.id].hidden = false;
        childRefs[i.id].value = i.visibleForGroups.join();
      }
    }
  }

  handleInputChange (event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    if (typeof value === 'string' && value.trim() !== '') {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name === 'instruction') {
      value = btoa(value);
    }
    this.setState({
      [name]: value
    });
  }

  loadSearchableLayers () {
    this.props.model.getConfig(this.props.model.get('config').url_layers, (layers) => {
      this.setState({
        searchableLayers: layers.wfslayers
      });

      this.setState({
        tree: <Tree model={this} layers={this.state.searchableLayers} handleAddSearchable={this.handleAddSearchable} loadLayers={this.loadLayers} />
      });
    });
  }

  getTool () {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add (tool) {
    this.props.model.get('toolConfig').push(tool);
  }

  remove (tool) {
    this.props.model.set({
      'toolConfig': this.props.model.get('toolConfig').filter(tool => tool.type !== this.type)
    });
  }

  replace (tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  save () {
    var toolbar = 'bottom';
    var onMap = this.state.onMap;
    if (this.state.bothSynlig) {
      toolbar = 'bottom';
      onMap = true;
    } else if (onMap) {
      toolbar = '';
    }

    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        onMap: onMap,
        bothSynlig: this.state.bothSynlig,
        enableViewTogglePopupInSnabbsok: this.state.enableViewTogglePopupInSnabbsok,
        toolbar: toolbar,
        maxZoom: this.state.maxZoom,
        markerImg: this.state.markerImg,
        kmlExportUrl: this.state.kmlExportUrl,
        excelExportUrl: this.state.excelExportUrl,
        displayPopup: this.state.displayPopup,
        selectionTools: this.state.selectionTools,
        base64Encode: this.state.base64Encode,
        instruction: this.state.instruction,
        filterVisible: this.state.filterVisible,
        anchor: [this.state.anchorX, this.state.anchorY],
        imgSize: [this.state.imgSizeX, this.state.imgSizeY],
        popupOffsetY: this.state.popupOffsetY,
        visibleForGroups: this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim),
        layers: this.state.layers ? this.state.layers : []
      }
    };

    var existing = this.getTool();

    function update () {
      this.props.model.updateToolConfig(this.props.model.get('toolConfig'), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: 'Uppdateringen lyckades'
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: 'Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?',
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState(defaultState);
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }

  handleAuthGrpsChange (event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(',');
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== '' ? groups : []
    });
  }

  renderVisibleForGroups () {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor='visibleForGroups'>Tillträde</label>
          <input id='visibleForGroups' value={this.state.visibleForGroups} type='text' name='visibleForGroups' onChange={(e) => { this.handleAuthGrpsChange(e); }} />
        </div>
      );
    } else {
      return null;
    }
  }
  /**
   * anropas från tree.jsx som eventhandler. Hantering för checkboxar och
   * inmatning av AD-grupper för wfs:er
   * @param {*} e
   * @param {*} layer
   */
  handleAddSearchable (e, layer) {
    if (e.target.type.toLowerCase() === 'checkbox') {
      if (e.target.checked) {
        let toAdd = {
          id: layer.id.toString(),
          visibleForGroups: []
        };
        this.setState({
          layers: [...this.state.layers, toAdd]
        });
      } else {
        let newArray = this.state.layers.filter((o) => o.id !== layer.id.toString());

        this.setState({
          layers: newArray
        });
      }
    }
    if (e.target.type.toLowerCase() === 'text') {
      let obj = this.state.layers.find((o) => o.id === layer.id.toString());
      let newArray = this.state.layers.filter((o) => o.id !== layer.id.toString());

      // Skapar array och trimmar whitespace från start och slut av varje cell
      if (typeof obj !== 'undefined') {
        obj.visibleForGroups = e.target.value.split(',');
        obj.visibleForGroups = obj.visibleForGroups.map(el => el.trim());
      }

      newArray.push(obj);

      // Sätter visibleForGroups till [] istället för [""] om inputfältet är tomt.
      if (newArray.length === 1) {
        if (newArray[0].visibleForGroups.length === 1 && newArray[0].visibleForGroups[0] === '') {
          newArray[0].visibleForGroups = [];
        }
      }

      this.setState({
        layers: newArray
      });
    }
  }

  /**
   *
   */
  render () {
    return (
      <div>
        <form>
          <p>
            <button className='btn btn-primary' onClick={(e) => { e.preventDefault(); this.save(); }}>Spara</button>
          </p>
          <div>
            <input
              id='active'
              name='active'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.active} />&nbsp;
            <label htmlFor='active'>Aktiverad</label>
          </div>
          <div>
            <label htmlFor='index'>Sorteringsordning</label>
            <input
              id='index'
              name='index'
              type='text'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.index} />
          </div>
          <div>
            <label htmlFor='target'>Verktygsplacering</label>
            <input
              id='target'
              name='target'
              type='text'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.target} />
          </div>          
          <div>
            <input
              id='onMap'
              name='onMap'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.onMap} />&nbsp;
            <label htmlFor='onMap'>Alltid synlig</label>
          </div>
          <div>
            <input
              id='enableViewTogglePopupInSnabbsok'
              name='enableViewTogglePopupInSnabbsok'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.enableViewTogglePopupInSnabbsok} />&nbsp;
            <label htmlFor='enableViewTogglePopupInSnabbsok'>"Visa information" i snabbsök</label>
          </div>
          <div>
            <input
              id='bothSynlig'
              name='bothSynlig'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.bothSynlig} />&nbsp;
            <label htmlFor='bothSynlig'>Visa snabbsök</label>
          </div>
          <div>
            <input
              id='displayPopup'
              name='displayPopup'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.displayPopup} />&nbsp;
            <label htmlFor='displayPopup'>Visa popup</label>
          </div>
          <div>
            <input
              id='filterVisible'
              name='filterVisible'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.filterVisible} />&nbsp;
            <label htmlFor='filterVisible'>Sök i synliga lager</label>
          </div>
          <div>
            <input
              id='selectionTools'
              name='selectionTools'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.selectionTools} />&nbsp;
            <label htmlFor='selectionTools'>Verktyg för ytsökning</label>
          </div>
          <div>
            <input
              id='Base64-active'
              name='base64Encode'
              type='checkbox'
              onChange={(e) => { this.handleInputChange(e); }}
              checked={this.state.base64Encode} />&nbsp;
            <label htmlFor='Base64-active'>Komprimera instruktionstext</label>
          </div>
          <div>
            <label htmlFor='instruction'>Instruktion</label>
            <textarea
              id='instruction'
              name='instruction'
              onChange={(e) => { this.handleInputChange(e); }}
              value={this.state.instruction ? atob(this.state.instruction) : ''} />
          </div>
          {this.renderVisibleForGroups()}
          <div>
            <label htmlFor='maxZoom'>Zoomnivå</label>
            <input value={this.state.maxZoom} type='text' name='maxZoom' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='excelExportUrl'>URL Excel-tjänst</label>
            <input value={this.state.excelExportUrl} type='text' name='excelExportUrl' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='kmlExportUrl'>URL KML-tjänst</label>
            <input value={this.state.kmlExportUrl} type='text' name='kmlExportUrl' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='markerImg'>Ikon för sökträff</label>
            <input value={this.state.markerImg} type='text' name='markerImg' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='anchorX'>Ikonförskjutning X</label>
            <input value={this.state.anchorX} type='text' name='anchorX' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='anchorY'>Ikonförskjutning Y</label>
            <input value={this.state.anchorY} type='text' name='anchorY' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='popupOffsetY'>Förskjutning popup-ruta</label>
            <input value={this.state.popupOffsetY} type='text' name='popupOffsetY' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='imgSizeX'>Bildbredd</label>
            <input value={this.state.imgSizeX} type='text' name='imgSizeX' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
          <div>
            <label htmlFor='imgSizeY'>Bildhöjd</label>
            <input value={this.state.imgSizeY} type='text' name='imgSizeY' onChange={(e) => { this.handleInputChange(e); }} />
          </div>
        </form>
        {this.state.tree}
      </div>
    );
  }
}

export default ToolOptions;
