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

const Panel = require('views/panel');

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
      activeTool: this.props.model.get('activeTool'),
      validBufferDist: this.props.model.isNumber(this.props.model.get('bufferDist'))
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

  componentWillUnmount: function () {
    this.props.model.setActiveTool(undefined);
  },

  activateTool: function (name) {
    if (this.props.model.getActiveTool() === name) {
      this.props.model.setActiveTool(undefined);
    } else {
      this.props.model.setActiveTool(name);
    }
    this.setState({
      activeTool: this.props.model.getActiveTool()
    });
  },

  getClassNames: function (type) {
    return this.state.activeTool === type
      ? "btn btn-primary"
      : "btn btn-default";
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
          <p>
            Detta verktyg skapar en zon med angivet avstånd runt valda objekt i kartan.
          </p>
          <div className="panel panel-default">
            <div className="panel-heading">Välj objekt</div>
            <div className="panel-body">
              <button onClick={() => this.props.model.activateBufferMarker()} type="button" className={this.getClassNames('multiSelect')} title="Markera flera objekt">
                <i className="fa fa-plus icon"></i>
              </button>
              &nbsp;
              <span
                onClick={() => {
                  this.props.model.clearSelection();
                }}
                className="btn btn-link">
                Rensa selektering
              </span>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">Ange buffertavstånd</div>
            <div className="panel-body">
              <input
                id="buff-dist"
                type="text"
                name="buff-dist"
                style={{
                  background: this.state.validBufferDist ? '#FFF' : '#F33'
                }}
                value={this.props.model.get('bufferDist')}
                onBlur={(e) => {
                  this.setState({
                    validBufferDist: this.props.model.isNumber(e.target.value)
                  });
                }}
                onChange={(e) => {
                  this.props.model.set('bufferDist', e.target.value);
                  this.setState({
                    bufferDist: e.target.value
                  });
                }}>
              </input> m
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">Skapa buffert</div>
            <div className="panel-body">
              <button
                onClick={() => {
                  var status = this.props.model.buffer();
                  if (!status) {
                    this.setState({
                      validBufferDist: false
                    });
                  }
                }}
                className="btn btn-primary">
                Buffra
              </button>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">WFS List</div>
            <div className="panel-body">
              <div id="visibleLayerList"></div>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">Rensa kartan från buffrade objekt</div>
            <div className="panel-body">
              <button
                onClick={() => this.props.model.clearBuffer()}
                className="btn btn-primary">
                Rensa
              </button>
            </div>
          </div>
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
