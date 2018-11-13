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

var Panel = require('views/panel');

/**
 * @class
 */
var SelectionPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      activeTool: this.props.model.get('activeTool')
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentWillMount: function () {
    this.props.model.on('change:activeTool', () => {
      this.setState({
        activeTool: this.props.model.get('activeTool')
      });
    });
  },

  componentWillUnmount () {
    this.props.model.setActiveTool('');
    this.props.model.off('change:activeTool');
  },

  activateTool: function (name) {
    if (this.props.model.get('activeTool') === name) {
      this.props.model.setActiveTool(undefined);
    } else {
      this.props.model.setActiveTool(name);
    }
  },

  getClassNames: function (type) {
    return this.state.activeTool === type
      ? 'btn btn-primary'
      : 'btn btn-default';
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var anchor = this.props.model.get('anchor');

    return (
      <div className='selection-toolbar'>
        <div className='selection-title'>
          <b>Sök inom område</b>
        </div>
        <div className='btn-group btn-group'>
          <div className="btn-selection" onClick={() => this.activateTool('drawSelection')}>
            <button type='button' className={this.getClassNames('drawSelection')} title='Markera efter polygon'>
              <i className='fa iconmoon-yta icon' />
            </button>
            <span className="clickable">Rita polygon</span>
          </div>
          <div className="btn-select" onClick={() => this.activateTool('multiSelect')}>
            <button type='button' className={this.getClassNames('multiSelect')} title='Markera flera objekt'>
              <i className='fa fa-hand-pointer-o icon' />
            </button>
            <span className="clickable">Markera objekt</span>
          </div>
          <div className="btn-clear" title="Rensa" onClick={(e) => {
            e.preventDefault();
            this.props.model.clearSelection();
          }}>
            <i className="fa fa-times-circle clickable" />&nbsp;
            <span className="clickable">Rensa</span>
          </div>

        </div>
      </div>
    );
  }
};

/**
 * SelectionPanelView module.<br>
 * Use <code>require('views/anchorpanel')</code> for instantiation.
 * @module SelectionPanelView-module
 * @returns {SelectionPanelView}
 */
module.exports = React.createClass(SelectionPanelView);
