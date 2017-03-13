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
var BufferPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
    };
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function () {
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <Panel title="Buffertverktyg" onUnmountClicked={this.props.onUnmountClicked} onCloseClicked={this.props.onCloseClicked}>
        <div className="panel-content">
          Buffertool
        </div>
      </Panel>
    );
  }
};

/**
 * bufferPanelView module.<br>
 * Use <code>require('views/bufferpanel')</code> for instantiation.
 * @module BufferPanelView-module
 * @returns {BufferPanelView}
 */
module.exports = React.createClass(BufferPanelView);
