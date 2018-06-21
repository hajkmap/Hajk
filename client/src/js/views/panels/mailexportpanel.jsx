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

var MailExportPdfSettings = React.createClass({
  resolutions: [72, 96, 150, 200, 300],
  paperFormats: ["A2", "A3", "A4"],

  getInitialState: function() {
    return {
      selectFormat: 'A4',
      selectOrientation: 'S',
      selectScale: '500',
      manualScale: '2500',
      selectResolution: this.resolutions[0],
      center: this.props.model.getPreviewFeature() ?
        this.props.model.getPreviewCenter() :
        this.props.olMap.getView().getCenter(),
      loading: false,
      exportOption: "email",
      activePaper: 'A4 P',
      activeScale: '400',
      showExportOptions: false,
      showManualScale: false
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

  getDocumentUrl: function () {
    return this.props.model.get("urlPdf");
  },

  getEmailAddress: function () {
    return this.state.emailAddress;
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
      selectScale: e.target.value,
      activeScale: e.target.value,
      showManualScale: false
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
      manualScale: val,
      selectScale: e.target.value,
      activeScale: 'other'
    });
  },

  showManualScale: function() {
    this.setState({
      showManualScale: !this.state.showManualScale,
      activeScale: null
    });
    this.refs.scaleInputField.focus();
  },

  setFormatAndOrientation: function (e, orientation, format) {
      this.setState({
        selectOrientation: orientation,
        selectFormat: format,
        activePaper: e.target.value
      });

      if (format === "A4") {
        if (orientation === "P") {
          $('.a4-l, .a3-p, .a3-l').removeClass('selected');
          $('.a4-p').addClass('selected');
        } else {
          $('.a4-p, .a3-p, .a3-l').removeClass('selected');
          $('.a4-l').addClass('selected');
        }
      } else if (format === "A3") {
        if (orientation === "P") {
          $('.a4-l, .a4-p, .a3-l').removeClass('selected');
          $('.a3-p').addClass('selected');
        } else {
          $('.a4-p, .a4-l, .a3-p').removeClass('selected');
          $('.a3-l').addClass('selected');
        }
      }
  },

  setActiveMethod: function (currentMethod) {
      this.setState({
        exportOption: currentMethod,
        selectOrientation: "P",
        selectFormat: "A4",
        activePaper: "A4 P"
      });

      $('.a4-l, .a3-p, .a3-l').removeClass('selected');
      $('.a4-p').addClass('selected');

      if (this.state.exportOption != currentMethod) {
        var pdfDocument = document.getElementById("pdfDocument");

        if (pdfDocument != null) {
          pdfDocument.src="about:blank";
          pdfDocument.style.display = 'none';
          this.setState({
            showExportOptions: false
          });
        }
      }
  },

  setActiveScale: function () {

  },

  printDialog: function () {
    document.getElementById("pdfDocument").contentWindow.window.print();
  },

  //Send PDF by email
  sendPDF: function () {
    if (this.state.isValid) {
      document.getElementById("email-input").value = "";
      var node = $(ReactDOM.findDOMNode(this)).find('#send-pdf')
      ,   options = {
            size: this.getPaperMeasures(),
            format: this.getFormat(),
            orientation: this.getOrientation(),
            scale: this.getScale(),
            resolution: this.getResolution(),
            documentUrl: this.getDocumentUrl(),
            emailAddress: this.getEmailAddress()
          }
      ;
      node.html('');
      this.props.model.sendPDF(options, () => {
        this.setState({
          loading: false
        });
      });

    } else {
      this.props.model.set('messageSent', "Ogiltig e-postadress!");
    }
  },

  setOrientation: function(e) {
    this.setState({
      selectOrientation: e.target.value
    });
  },

  removePreview: function () {
    this.props.model.removePreview();
  },

  focusInput(component) {
        if (component) {
            React.findDOMNode(component).focus();
        }
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
        loading: false,
        showExportOptions: true
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
    ,   otherScaleBtn
    ,   otherScale
    ,   previewOption
    ,   loader = null
    ,   downloadLink = null
    ,   mailSent = null
    ,   emailAddress
    ,   exportOption = this.state.exportOption
    ;

    if (this.state.loading) {
      loader = <i className="fa fa-refresh fa-spin"></i>;
    }

    if (!this.props.visible) return null;

    options = scales.map((s, i) => {
      return (
        <button type="button" className={(this.state.activeScale == s) ? "btn btn-default scale-options selected-scale" : "btn btn-default scale-options"} value={this.state.selectScale} onClick={this.setScale}>
          <option key={i} value={s}>1:{s}</option>
        </button>
      );
    });

    otherScaleBtn = <button type="button" className={this.state.showManualScale ? "btn btn-default scale-options selected-scale" : "btn btn-default scale-options"} onClick={this.showManualScale}>Egen</button>;
    otherScale = <input type="text" className={this.state.showManualScale ? "scale-options" : "hide"} ref="scaleInputField" onChange={this.setManualScale} onClick={this.setManualScale} value={this.state.manualScale}></input>;

    this.addPreview(map);

    var validate_input = (event) => {
      var validateEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      this.emailAddress = event.target.value;
      this.props.model.set('emailAddress', this.emailAddress);

      if (this.emailAddress.length > 0 && validateEmail.test(this.emailAddress)) {
        this.setState({
          isValid: true,
          emailAddress: event.target.value
        });
      } else {
        this.setState({
          isValid: false
        });
      }
    };

    //downloadlänk
    if (this.props.model.get("downloadingPdf")) {
      downloadLink = <p>Hämtar...</p>
    } else if (this.props.model.get("urlPdf")) {
      downloadLink =
        <iframe
          src={this.props.model.get("urlPdf")+"#toolbar=0&navpanes=0&scrollbar=0"}
          id="pdfDocument"
          width="300px"
          height="415px" />

      if (this.state.exportOption === "email") {
        previewOption = [
          <div>
            <input
                id="email-input"
                type="email"
                ref="validateEmail"
                placeholder="Ange e-postadress..."
                value={emailAddress}
                onChange={validate_input} />
            <br />
            <button onClick={this.sendPDF} className="btn btn-success btn-lg">
              <i className="fa fa-paper-plane"></i><br />
              Skicka
            </button>
            <br />
            {mailSent}
          </div>
        ]
      } else if (this.state.exportOption === "print") {
        previewOption = [
          <div>
            <button onClick={this.printDialog} className="btn btn-success btn-lg">
              <i className="fa fa-print"></i>
              <br />
              Skriv ut nu
            </button>
          </div>
        ];
      }

      this.props.model.set('documentUrl', this.props.model.get("urlPdf"));
    } else {
      downloadLink = null;
    }

    //Meddelande skickat
    if (this.props.model.get("sendingMessage")) {
      mailSent = <p>Skickar...</p>
    } else if (this.props.model.get("messageSent")) {
      mailSent = <p className="email-success" id="email-success">{this.props.model.get("messageSent")}</p>
    } else {
      mailSent = null;
    }

    return (
      <div className="export-settings">

        <div className="panel panel-default">
          <p>Metod</p>
          <div>
            <button type="button" title="Mejla karta" onClick={(e) => { this.setActiveMethod("email")}} className={this.state.exportOption === "email" ? 'btn btn-primary method-options' : 'btn btn-default method-options'}>
              <i className="fa fa-envelope-o"></i><br />
              E-post
            </button>
            <button type="button" title="Skriv ut karta" onClick={(e) => { this.setActiveMethod("print")}} className={this.state.exportOption === "print" ? 'btn btn-primary method-options' : 'btn btn-default method-options'}>
              <i className="fa fa-print"></i><br />
              Utskrift
            </button>
          </div>
        </div>

        <div className="panel panel-default">
          <p>Papper</p>
          <div>
            <div>
              <button className="paper-icon-button a4-vertical" value="A4 P" title="Stående A4" onClick={(e) => { this.setFormatAndOrientation(e, "P","A4")}}>
                <div className="img-container">
                  <span className={this.state.activePaper === 'A4 P' ? 'fa fa-file paper-icon a4-p selected' : 'fa fa-file paper-icon a4-p'}></span>
                  <h2 className="paper-text-container">
                    <span className="paper-text">A4</span>
                  </h2>
                </div>
              </button>

              <button className="paper-icon-button a4-horizontal" value="A4 L" title="Liggande A4" onClick={(e) => { this.setFormatAndOrientation(e, "L","A4")}}>
                <div className="img-container">
                  <span className="fa fa-file fa-custom-rotate paper-icon a4-l"></span>
                  <h2 className="paper-text-container">
                    <span className="paper-text">A4</span>
                  </h2>
                </div>
              </button>

              <button className="paper-icon-button a3-vertical" value="A3 P" title="Stående A3" onClick={(e) => { this.setFormatAndOrientation(e, "P","A3")}} disabled={this.state.exportOption === "print" ? true : false}>
                <div className="img-container">
                  <span className="fa fa-file paper-icon a3-p"></span>
                  <h2 className="paper-text-container">
                    <span className="paper-text">A3</span>
                  </h2>
                </div>
              </button>

              <button className="paper-icon-button a3-horizontal" value="A3 L" title="Liggande A3" onClick={(e) => { this.setFormatAndOrientation(e, "L","A3")}} disabled={this.state.exportOption === "print" ? true : false}>
                <div className="img-container">
                  <span className="fa fa-file fa-custom-rotate paper-icon a3-l"></span>
                  <h2 className="paper-text-container">
                    <span className="paper-text">A3</span>
                  </h2>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="panel panel-default">
          <p>Skala</p>
          <div>
            {options}
            {otherScaleBtn}
            {otherScale}
          </div>
        </div>

        <div className="panel panel-default">
          <div className="section section-success-btn">
            <button onClick={this.exportPDF} className="btn btn-success btn-lg">Skapa karta</button>
          </div>
        </div>

        <div className="panel panel-default">
          <div>
            {downloadLink}
          </div>
        </div>

        <div className="panel panel-default">
          <div className={this.state.showExportOptions ? "section section-success-btn" : "section section-success-btn hide"}>
            {previewOption}
          </div>
        </div>
        <br />
      </div>
    )
  }
});

/**
 * @class
 */
var MailExportPanelView = {

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
    this.props.model.on('change:sendingMessage', () => {
      this.setState({
        sending: this.props.model.get('sendingMessage')
      });
    });
    this.props.model.on('change:messageSent', () => {
      this.setState({
        downloadUrl: this.props.model.get('messageSent')
      });
    });

  },

  componentWillUnmount: function () {
    this.props.model.off('change:activeTool');
    this.props.model.off('change:urlPdf');
    this.props.model.off('change:downloadingPdf');
    this.props.model.off('change:urlTIFF');
    this.props.model.off('change:downloadingTIFF');
    this.props.model.off('change:sendingMessage');
    this.props.model.off('change:messageSent');
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      showMailExportSettings: true,
      activeTool: this.props.model.get('activeTool')
    };
  },

  /**
   * Set the export setting property, this vill trigger set state.
   * @instance
   * @param {boolean} value
   */
  setMailExportSettings: function (value) {
    this.setState({
      showMailExportSettings: value
    });
  },

  /**
   * Export the image.
   * @instance
   */
  mailExportImage: function () {
    var node = $(ReactDOM.findDOMNode(this)).find('#image');
    node.html('');
    this.props.model.mailExportImage((anchor) => {
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
      tool = <MailExportPdfSettings
        visible={this.state.showMailExportSettings}
        model={this.props.model}
        olMap={this.props.model.get('olMap')}/>;
    }
    return (
      <Panel title="Skapa karta" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
        <div className="export-panel">
          <div>
            {this.renderToolbar()}
          </div>
          {tool}
        </div>
      </Panel>
    );
  }
};

/**
 * ExportPanelView module.<br>
 * Use <code>require('views/exportpanel')</code> for instantiation.
 * @module MailExportPanelView-module
 * @returns {MailExportPanelView}
 */
module.exports = React.createClass(MailExportPanelView);
