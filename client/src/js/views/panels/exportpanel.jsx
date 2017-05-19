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

var ExportTiffSettings = React.createClass({

  getInitialState: function() {
    return {
    };
  },

  removePreview: function () {
    this.props.model.removeTiffPreview();
  },

  addPreview: function (map) {
    var center = this.props.model.getPreviewFeature() ?
                 ol.extent.getCenter(this.props.model.getPreviewFeature().getGeometry().getExtent()) :
                 map.getView().getCenter();
    this.props.model.addTiffPreview(center);
  },

  exportTIFF: function () {
    this.props.model.exportTIFF(() => {
    });
  },



  componentWillUnmount: function () {
    this.removePreview();
  },

  render: function () {

    var map = this.props.olMap
    ,   loader = null;

    if (this.state.loading) {
      loader = <i className="fa fa-refresh fa-spin"></i>;
    }
    
    if (this.props.model.previewLayer.getSource().getFeatures().length === 0) {
      this.addPreview(map);    
    }    
    
    //downloadlänk
    if (this.props.model.get("downloadingTIFF")) {
      downloadLink = <p>Hämtar...</p>
    } else if (this.props.model.get("urlTIFF")) {
      downloadLink = <a href={this.props.model.get("urlTIFF")} target="_blank"><p>Ladda ner TIFF</p></a>
    } else {
      downloadLink = null;
    }
    
    return (
      <div className="export-settings">
        <div>
          <div>
            <button onClick={this.exportTIFF} className="btn btn-default">Skapa TIFF {loader}</button>
          </div>
          <div>{downloadLink}</div>
          <br />
          <div id="tiff"></div>
        </div>
      </div>
    );

  }
});

var ExportPdfSettings = React.createClass({

  resolutions: [72, 96, 150, 200, 300],
  paperFormats: ["A2", "A3", "A4"],

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
        case 'A2':
          return {
              width:  this.getOrientation() === 'L' ? 594 : 420,
              height: this.getOrientation() === 'L' ? 420 : 594
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
          scale: this.getScale(),
          resolution: this.getResolution()
        }
    ;
    node.html('');
    this.props.model.exportPDF(options, () => {
      this.setState({
        loading: false
      });
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
    ,   paperFormatOptions
    ,   loader = null
    ,   downloadLink = null
    ;

    if (this.state.loading) {
      loader = <i className="fa fa-refresh fa-spin"></i>;
    }

    if (!this.props.visible) return null;

    options = scales.map((s, i) => <option key={i} value={s}>1:{s}</option>);
    resolutionOptions = this.resolutions.map((s, i) => {
      if (this.state.selectFormat === 'A2') {
        console.log(s);
        return s !== '300' 
          ? <option key={i} value={s}>{s}</option>
          : <option key={i} value={s} disabled>{s}</option>;
        } else {
          return <option key={i} value={s}>{s}</option>;
        }
      });
    paperFormatOptions = this.paperFormats.map((s, i) => {
      if (this.state.selectResolution === '300') {
        console.log(s);
        return s !== 'A2'
          ? <option key={i} value={s}>{s}</option>
          : <option key={i} value={s} disabled>{s}</option>;
        } else {
          return <option key={i} value={s}>{s}</option>;
        }
    });
        
    this.addPreview(map);

    //downloadlänk
    if (this.props.model.get("downloadingPdf")) {
      downloadLink = <p>Hämtar...</p>
    } else if (this.props.model.get("urlPdf")) {
      downloadLink = <a href={this.props.model.get("urlPdf")} target="_blank"><p>Ladda ner PDF</p></a>
    } else {
      downloadLink = null;
    }

    return (
      <div className="export-settings">
        <div className="panel panel-default">
          <div className="panel-heading">Välj pappersstorlek</div>
          <div className="panel-body">
            <select onChange={this.setFormat} defaultValue={this.state.selectFormat}>
              {paperFormatOptions}
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
          <button onClick={this.exportPDF} className="btn btn-default">Skapa PDF {loader}</button>
          <br />
          {downloadLink}
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

  componentDidMount: function () {
    this.props.model.on('change:activeTool', () => {
      this.setState({
        activeTool: this.props.model.get('activeTool')
      });
    });
    this.props.model.on('change:urlPdf', () => {
      this.setState({
        downloadUrl: this.props.model.get('urlPdf')
      });
    });
    this.props.model.on('change:downloadingPdf', () => {
      this.setState({
        downloading: this.props.model.get('downloadingPdf')
      });
    });
    this.props.model.on('change:urlTIFF', () => {
      this.setState({
        downloadUrl: this.props.model.get('urlTIFF')
      });
    });
    this.props.model.on('change:downloadingTIFF', () => {
      this.setState({
        downloadingTIFF: this.props.model.get('downloadingTIFF')
      });
    });

  },

  componentWillUnmount: function () {
    this.props.model.off('change:activeTool');
    this.props.model.off('change:urlPdf');
    this.props.model.off('change:downloadingPdf');
    this.props.model.off('change:urlTIFF');
    this.props.model.off('change:downloadingTIFF');
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      showExportSettings: true,
      activeTool: this.props.model.get('activeTool')
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

  activateTool: function (name) {
    if (this.props.model.get('activeTool') === name) {
      this.props.model.setActiveTool(undefined);
    } else {
      this.props.model.setActiveTool(name);
    }
  },

  getClassNames: function (type) {
    return this.state.activeTool === type
      ? "btn btn-primary"
      : "btn btn-default";
  },

  renderToolbar: function () {
    const activeFormats = [];
    if (this.props.model.get('pdfActive')) {
        activeFormats.push('pdf');
    }
    if (this.props.model.get('tiffActive')) {
        activeFormats.push('tiff');
    }
    return (
      <div>
        <div>Välj format</div>
        <div className="btn-group">
          {activeFormats.map((format, i) =>
            <button key={i} onClick={() => this.activateTool(format)} type="button" className={this.getClassNames(format)} >
              {format.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    );
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var activeTool = this.props.model.get('activeTool');
    var tool = <div>Välj utdataformat.</div>
    if (activeTool === 'pdf' && this.props.model.get('olMap')) {
      tool = <ExportPdfSettings
        visible={this.state.showExportSettings}
        model={this.props.model}
        olMap={this.props.model.get('olMap')}/>;
    }
    if (activeTool === 'tiff' && this.props.model.get('olMap')) {
      tool = <ExportTiffSettings
        model={this.props.model}
        olMap={this.props.model.get('olMap')}/>;
    }
    return (
      <Panel title="Skriv ut karta" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
        <div className="export-panel">
          <div>
            {this.renderToolbar()}
          </div>
          <br/>
          {tool}
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
