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
import Anchor from './tools/anchor.jsx';
import Buffer from './tools/buffer.jsx';
import Bookmark from './tools/bookmark.jsx';
import Coordinates from './tools/coordinates.jsx';
import Draw from './tools/draw.jsx';
import Edit from './tools/edit.jsx';
import Export from './tools/export.jsx';
import Infoclick from './tools/infoclick.jsx';
import Information from './tools/information.jsx';
import Location from './tools/location.jsx';
import Search from './tools/search.jsx';
import StreetView from './tools/streetview.jsx';
import Preset from './tools/preset.jsx';
import Measure from './tools/measure.jsx';
import Routing from './tools/routing.jsx';
import MailExport from './tools/mailexport.jsx';

var defaultState = {
  activeTool: ''
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor () {
    super();
    this.state = defaultState;
  }

  componentDidMount () {
    this.props.model.on('change:urlMapConfig', this.onUrlMapConfigChanged.bind(this));
  }

  componentWillUnmount () {
    this.props.model.off('change:urlMapConfig', this.onUrlMapConfigChanged.bind(this));
  }

  onUrlMapConfigChanged () {
    const t = this.state.activeTool;
    this.setState({
      activeTool: ''
    });
    setTimeout(() => {
      this.setState({
        activeTool: t
      });
    }, 20);
  }

  getActiveTool (tool) {
    switch (tool) {
      case 'anchor':
        return <Anchor parent={this} model={this.props.model} />;
      case 'buffer':
        return <Buffer parent={this} model={this.props.model} />;
      case 'bookmark':
        return <Bookmark parent={this} model={this.props.model} />;
      case 'coordinates':
        return <Coordinates parent={this} model={this.props.model} />;
      case 'draw':
        return <Draw parent={this} model={this.props.model} />;
      case 'edit':
        return <Edit parent={this} model={this.props.model} />;
      case 'export':
        return <Export parent={this} model={this.props.model} />;
      case 'infoclick':
        return <Infoclick parent={this} model={this.props.model} />;
      case 'information':
        return <Information parent={this} model={this.props.model} />;
      case 'location':
        return <Location parent={this} model={this.props.model} />;
      case 'search':
        return <Search parent={this} model={this.props.model} />;
      case 'streetview':
        return <StreetView parent={this} model={this.props.model} />;
      case 'preset':
        return <Preset parent={this} model={this.props.model} />;
      case 'measure':
        return <Measure parent={this} model={this.props.model} />;
      case 'routing':
        return <Routing parent={this} model={this.props.model} />;
      case 'mailexport':
        return <MailExport parent={this} model={this.props.model} />;
      default:
        return null;
    }
  }

  toggleTool (tool) {
    this.setState({
      activeTool: tool
    });
  }

  getIndexForTool (tool) {
    var found = false;
    if (Array.isArray(this.props.model.get('toolConfig'))) {
      found = this.props.model
        .get('toolConfig')
        .filter(t => t.type === tool);
    }

    if (found[0]) {
      return found[0].index;
    } else {
      return -1;
    }
  }

  getClassNamesForActive (tool) {
    var found = false;
    if (Array.isArray(this.props.model.get('toolConfig'))) {
      found = this.props.model
        .get('toolConfig')
        .filter(t => t.type === tool).length > 0;
    }
    return found ? 'fa fa-check-square-o' : 'fa fa-square-o';
  }

  getClassNamesForSelected (tool) {
    return this.state.activeTool === tool ? 'layer-item selected' : 'layer-item';
  }

  render () {
    var toolTypes = {
      anchor: 'Länk till kartan',
      buffer: 'Skapa buffertzon',
      bookmark: 'Bokmärken',
      coordinates: 'Fånga koordinat',
      draw: 'Rita och mäta',
      edit: 'Editering',
      export: 'Utskrift',
      infoclick: 'Infoklick',
      information: 'Om kartan',
      search: 'Sök',
      streetview: 'Google Street View',
      preset: 'Snabbval',
      measure: 'Mät',
      location: 'Visa min position',
      routing: 'Navigation',
      mailexport: 'Mail & utskrift'
    };

    return (
      <div>
        <aside>
          <ul className='config-layer-list'>
            {
              Object
                .keys(toolTypes)
                .sort(
                  (a, b) => this.getIndexForTool(a) === this.getIndexForTool(b) ? 0 : this.getIndexForTool(a) > this.getIndexForTool(b) ? 1 : -1)
                .map((key, i) => {
                  var index = this.getIndexForTool(key);
                  return <li
                    key={i}
                    className={this.getClassNamesForSelected(key)}
                    onClick={() => this.toggleTool(key)}>
                    <span className={this.getClassNamesForActive(key)} />
                      &nbsp;
                    <span>{toolTypes[key]} ({index})</span>
                  </li>;
                })
            }
          </ul>
        </aside>
        <article>
          <fieldset className='tree-view'>
            <legend>Verktygsinställningar</legend>
            <div>
              {this.getActiveTool(this.state.activeTool)}
            </div>
          </fieldset>
        </article>
      </div>
    );
  }
}

export default ToolOptions;
