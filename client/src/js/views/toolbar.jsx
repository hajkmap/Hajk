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
// https://github.com/Johkar/Hajk2

/**
 * @class
 */
var ToolbarView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {};
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function() {
    this.props.navigationModel.on('change:activePanelType', () => {
      this.setState({
        activeTool: this.props.navigationModel.get('activePanelType')
      });
    });
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var tools = this.props.model
      .filter(t => t.get('toolbar'))
      .filter(tool => tool.get('toolbar') === 'bottom')
      .map((tool, index) => {
        var a = tool.get('panel').toLowerCase()
        ,   b = this.state.activeTool
        ,   c = a === b ? 'btn btn-primary' : 'btn btn-default';

        if (tool.get('active') === false) {
          return null;
        }

        return (
          <button
            type="button"
            className={c}
            onClick={() => {
              tool.clicked();
              this.props.navigationModel.set('r', Math.random());
            }}
            key={index}
            title={tool.get("title")}>
            <i className={ tool.get("icon") }></i>
          </button>
        );
      });

    var widgets = this.props.model
      .filter(t => t.get('toolbar'))
      .filter(tool => tool.get('toolbar') === 'top-right')
      .map((tool, index) => {
        var className = tool.get('active') ? 'btn btn-primary' : 'btn btn-default';
        tool.on('change:active', () => {
          this.forceUpdate();
        });
        return (
          <button
            type="button"
            className={className}
            onClick={() => {
              tool.clicked();
            }}
            key={index}
            title={tool.get("title")}>
            <i className={ tool.get("icon") }></i>
          </button>
        );
      });

    return (
      <div className="map-toolbar-wrapper">
        <div
          className="btn-group btn-group-lg map-toolbar bottom-toobar"
          role="group"
          aria-label="toolbar">
          {tools}
        </div>
        <div className="upper-toolbar">{widgets}</div>
        <div className="information" id="information"></div>
      </div>
    );
  }
};

/**
 * ToolbarView module.<br>
 * Use <code>require('views/toolbar')</code> for instantiation.
 * @module ToolbarView-module
 * @returns {ToolbarView}
 */
module.exports = React.createClass(ToolbarView);
