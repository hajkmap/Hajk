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
            <button onClick={this.exportTIFF} className="btn btn-primary">Skapa TIFF {loader}</button>
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
      selectScale: '500',
      manualScale: '2500',
      selectResolution: '72',
      center: this.props.model.getPreviewFeature() ?
        this.props.model.getPreviewCenter() :
        this.props.olMap.getView().getCenter(),
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

    var width  = pageSize(this.getFormat()).width
    ,   height = pageSize(this.getFormat()).height;

    return {
      width: ((width / 25.4)),
      height:  ((height / 25.4))
    };
  },

  getPreviewPaperMeasures: function() { 
    var size = this.getPaperMeasures()
    ,   inchInMillimeter = 25.4
    ,   defaultPixelSizeInMillimeter = 0.28
    ,   dpi = (inchInMillimeter / defaultPixelSizeInMillimeter); // ~90
    return {
      width: size.width * dpi,
      height:  size.height * dpi
    };
  },

  getScale: function () {
    return (this.state.selectScale === 'other') ? this.state.manualScale : this.state.selectScale;
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

  setCenter: function(val) {
    this.setState({
      center: val
    });
  },

  setManualScale: function(e) {
    if (e.target.value.startsWith('1:')) {
      e.target.value = e.target.value.split(':')[1];
    }

    var val = this.getScale();
    //if (e.target.value < 250) {
    //  val = 250;
    //} else if (e.target.value > 250000) {
    //  val = 250000;
    //} else {
      val = e.target.value;
    //}
    this.setState({
      manualScale: val
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
    ,   paper  = this.getPreviewPaperMeasures()
    //,   center = this.state.center;
    ,   center = this.props.model.getPreviewFeature() ?
                 ol.extent.getCenter(this.props.model.getPreviewFeature().getGeometry().getExtent()) :
                 map.getView().getCenter();

    this.props.model.addPreview(scale, paper, center);


    var preScale = undefined;

    switch(scale){
      case "250":
        preScale = 6;
        break;
      case "500":
        preScale = 6;
        break;
      case "1000":
        preScale = 5;
        break;
      case "2500":
        preScale = 4;
        break;
      case "5000":
        preScale = 3;
        break;
      case "10000":
        preScale = 2;
        break;
      case "25000":
        preScale = 1;
        break;
      case "50000":
        preScale = 1;
        break;
      case "100000":
        preScale = 0;
        break;
      case "250000":
        preScale = 0;
        break;
      default:
        preScale = map.getView().getZoom();
        break;
    }
    if(this.props.model.get('autoScale') && isMobile && mobilAnpassningEnabled && preScale < map.getView().getZoom()){
      map.getView().setZoom(preScale);
    }
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
        return s !== 300 
          ? <option key={i} value={s}>{s}</option>
          : <option key={i} value={s} disabled>{s}</option>;
        } else {
          return <option key={i} value={s}>{s}</option>;
        }
      });
    paperFormatOptions = this.paperFormats.map((s, i) => {
      if (this.state.selectResolution === '300') {
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
            <select onChange={this.setFormat} value={this.state.selectFormat}>
              {paperFormatOptions}
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj orientering</div>
          <div className="panel-body">
            <select onChange={this.setOrientation} value={this.state.selectOrientation}>
              <option value="P">stående</option>
              <option value="L">liggande</option>
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj skala</div>
          <div className="panel-body">
            <select onChange={this.setScale} value={this.state.selectScale}>
              {options}
              <option value="other">Annan skala</option>
            </select>
            {this.state.selectScale==='other' && <input type="text" onChange={this.setManualScale} value={this.state.manualScale}></input>}
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj upplösning</div>
          <div className="panel-body">
            <select onChange={this.setResolution} value={this.state.selectResolution}>
              {resolutionOptions}
            </select>
          </div>
        </div>
        <div>
          <button onClick={this.exportPDF} className="btn btn-main">Skapa PDF {loader}</button>
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
      <Panel title="Skriv ut karta" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
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
