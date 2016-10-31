// Copyright (C) 2016 Göteborgs Stad
//
// Detta program är fri mjukvara: den är tillåtet att redistribuera och modifeara
// under villkoren för licensen CC-BY-NC-ND 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-ND 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-nd/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Cypyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-komersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

var Panel = require('views/panel');

var ExportSettings = React.createClass({

  resolutions: [72, 96, 150],

  getInitialState: function() {
    return {
      selectFormat: 'A4',
      selectOrientation: 'S',
      selectScale: '2500',
      selectResolution: '72',
      loading: false
    };
  },

  getPaperMeasures: function () {

    var pageSize = format => {
      switch (format) {
        case 'A4':
          return {
            width:  this.getOrientation() === 'L' ? 297 : 210,
            height: this.getOrientation() === 'L' ? 210 : 297
          }
        case 'A3':
          return {
            width:  this.getOrientation() === 'L' ? 420 : 297,
            height: this.getOrientation() === 'L' ? 297 : 420
          }
        default: {
          return {
            width: 0,
            height: 0
          }
        }
      }
    }

    var dpi    = (25.4 / .28)
    ,   width  = pageSize(this.getFormat()).width
    ,   height = pageSize(this.getFormat()).height;

    return {
      width: ((width / 25.4) * dpi),
      height:  ((height / 25.4) * dpi)
    };
  },

  getScale: function () {
    return this.state.selectScale;
  },

  getResolution: function () {
    return this.state.selectResolution;
  },

  getOrientation: function () {
    return this.state.selectOrientation;
  },

  getFormat: function () {
    return this.state.selectFormat;
  },

  setFormat: function (e) {
    if (e.target.value === "A3") {
      this.resolutions = [72];
    } else {
      this.resolutions = [72, 96, 150];
    }
    this.setState({
      selectFormat: e.target.value
    });
  },

  setResolution: function(e) {
    this.setState({
      selectResolution: e.target.value
    });
  },

  setScale: function(e) {
    this.setState({
      selectScale: e.target.value
    });
  },

  setOrientation: function(e) {
    this.setState({
      selectOrientation: e.target.value
    });
  },

  removePreview: function () {
    this.props.model.removePreview();
  },

  addPreview: function (map) {
    var scale  = this.getScale()
    ,   paper  = this.getPaperMeasures()
    ,   center = this.props.model.getPreviewFeature() ?
                 ol.extent.getCenter(this.props.model.getPreviewFeature().getGeometry().getExtent()) :
                 map.getView().getCenter();

    this.props.model.addPreview(scale, paper, center);
  },

  exportPDF: function () {
    this.setState({
      loading: true
    });
    var node = $(ReactDOM.findDOMNode(this)).find('#pdf')
    ,   options = {
          size: this.getPaperMeasures(),
          format: this.getFormat(),
          orientation: this.getOrientation(),
          format: this.getFormat(),
          scale: this.getScale(),
          resolution: this.getResolution()
        }
    ;
    node.html('');
    this.props.model.exportPDF(options, (anchor) => {
      this.setState({
        loading: false
      });
      node.html(`<div class="alert alert-success">Din utskrift är klar. Tryck på <a href="${anchor}" target="_blank">Hämta</a> för att ladda ner en PDF-fil med resultatet.</div>`);
    });
  },

  componentWillUnmount: function () {
    this.removePreview();
  },

  render: function () {
    var map = this.props.olMap
    ,   scales = this.props.model.get('scales')
    ,   options
    ,   resolutionOptions
    ,   loader = null;

    if (this.state.loading) {
      loader = <i className="fa fa-refresh fa-spin"></i>;
    }

    if (!this.props.visible) return null;

    options = scales.map((s, i) => <option key={i} value={s}>1:{s}</option>);
    resolutionOptions = this.resolutions.map((s, i) => <option key={i} value={s}>{s}</option>);

    this.addPreview(map);

    return (
      <div className="export-settings">
        <div className="panel panel-default">
          <div className="panel-heading">Välj pappersstorlek</div>
          <div className="panel-body">
            <select onChange={this.setFormat} defaultValue={this.state.selectFormat}>
              <option value="A3">A3</option>
              <option value="A4">A4</option>
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj orientering</div>
          <div className="panel-body">
            <select onChange={this.setOrientation} defaultValue={this.state.selectOrientation}>
              <option value="P">stående</option>
              <option value="L">liggande</option>
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj skala</div>
          <div className="panel-body">
            <select onChange={this.setScale} defaultValue={this.state.selectScale}>
              {options}
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj upplösning</div>
          <div className="panel-body">
            <select onChange={this.setResolution} defaultValue={this.state.selectResolution}>
              {resolutionOptions}
            </select>
          </div>
        </div>
        <div>
          <button onClick={this.exportPDF} className="btn btn-default">Skriv ut {loader}</button>
        </div>
        <br />
        <div id="pdf"></div>
      </div>
    )
  }
});

/**
 * @class
 */
var ExportPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      showExportSettings: true
    };
  },

  /**
   * Set the export setting property, this vill trigger set state.
   * @instance
   * @param {boolean} value
   */
  setExportSettings: function (value) {
    this.setState({
      showExportSettings: value
    });
  },

  /**
   * Export the image.
   * @instance
   */
  exportImage: function () {
    var node = $(ReactDOM.findDOMNode(this)).find('#image');
    node.html('');
    this.props.model.exportImage((anchor) => {
      node.html(anchor);
    });
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <Panel title="Skriv ut karta" onCloseClicked={this.props.onCloseClicked} minimized={this.props.minimized}>
        <div className="export-panel">
          <ExportSettings
            visible={this.state.showExportSettings}
            model={this.props.model}
            olMap={this.props.model.get('olMap')}
          />
        </div>
      </Panel>
    );
  }
};

/**
 * ExportPanelView module.<br>
 * Use <code>require('views/exportpanel')</code> for instantiation.
 * @module ExportPanelView-module
 * @returns {ExportPanelView}
 */
module.exports = React.createClass(ExportPanelView);