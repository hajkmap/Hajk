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

var Panel = require('views/panel');
var Alert = require('alert');

var isMobile = () => document.body.clientWidth <= 600;

var ColorPicker = React.createClass({
  /*
   * @property {Array{string}} colors
   */
  colors: [
    "rgb(77, 77, 77)",
    "rgb(153, 153, 153)",
    "rgb(255, 255, 255)",
    "rgb(244, 78, 59)",
    "rgb(254, 146, 0)",
    "rgb(252, 220, 0)",
    "rgb(219, 223, 0)",
    "rgb(164, 221, 0)",
    "rgb(104, 204, 202)",
    "rgb(15, 175, 255)",
    "rgb(174, 161, 255)",
    "rgb(253, 161, 255)",
    "rgb(51, 51, 51)",
    "rgb(128, 128, 128)",
    "rgb(204, 204, 204)",
    "rgb(211, 49, 21)",
    "rgb(226, 115, 0)",
    "rgb(252, 196, 0)",
    "rgb(176, 188, 0)",
    "rgb(104, 188, 0)",
    "rgb(22, 165, 165)",
    "rgb(0, 156, 224)",
    "rgb(123, 100, 255)",
    "rgb(250, 40, 255)",
    "rgb(0, 0, 0)",
    "rgb(102, 102, 102)",
    "rgb(179, 179, 179)",
    "rgb(159, 5, 0)",
    "rgb(196, 81, 0)",
    "rgb(251, 158, 0)",
    "rgb(128, 137, 0)",
    "rgb(25, 77, 51)",
    "rgb(12, 121, 125)",
    "rgb(0, 98, 177)",
    "rgb(101, 50, 148)",
    "rgb(171, 20, 158)"
  ],
  /*
   * Abort any operation and deselect any tool
   * when the components unmounts.
   * @return {objct} state
   */
  getInitialState: function() {
    return {
      color: this.props.model.get(this.props.property)
    };
  },
  /*
   * @override
   */
  componentWillReceiveProps: function () {
    // TODO:
    // The stack trace seems messed up here.
    // The value in the model is not correct at the time of render,
    // the model switches the values and keeps the last set value.
    // This is solved by setTimeout 0, to put the call
    // at the bottom of the stack. But anyway, its considered a bug.
    setTimeout(() => {
      this.setState({
        color: this.props.model.get(this.props.property)
      });
    }, 0);
  },
  /*
   * Set the current color of the component.
   * @param {ol.event} event
   */
  setColor: function (event) {
    var reg   = /rgb[a]?\(.*\)/
    ,   value = reg.exec(event.target.style.background)

    if (value && value[0]) {
      this.setState({
        color: value[0]
      });
      this.props.onChange(value[0]);
    }
  },
  /*
   * Get current color.
   * @return {string} color
   */
  getColor: function () {
    return this.state.color;
  },
  /*
   * Render the color map component.
   * @return {React.Component} component
   */
  renderColorMap: function () {
    return this.colors.map((color, i) => {
      var black = "rgb(0, 0, 0)"
      ,   gray  = "rgb(150, 150, 150)"
      ,   white = "rgb(255, 255, 255)"
      ,   style = {
        width:        "22px",
        height:       "22px",
        display:      "inline-block",
        margin:       "2px",
        background:   color,
        border:       color === this.state.color ?
                      color === black ? "2px solid " + gray : "2px solid " + black :
                      color === white ? "2px solid " + gray : "2px solid " + color
      };
      return <div onClick={this.setColor} key={i} style={style}></div>
    });
  },
  /*
   * Render the colorpicker tool.
   * @return {React.Component} component
   */
  render: function () {
    var colorMap = this.renderColorMap();
    return (
      <div className="swatch">
        {colorMap}
      </div>
    )
  }
});

/**
 * @class
 */
var DrawPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      pointRadius: this.props.model.get('pointRadius'),
      pointSymbol: this.props.model.get('pointSymbol'),
      lineWidth: this.props.model.get('lineWidth'),
      lineStyle: this.props.model.get('lineStyle'),
      polygonLineWidth: this.props.model.get('polygonLineWidth'),
      polygonLineStyle: this.props.model.get('polygonLineStyle'),
      polygonFillOpacity: this.props.model.get('polygonFillOpacity'),
      exportUrl: false,
      kmlImport: false
    };
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.abort();
    this.props.model.off('change:dialog');
    this.props.model.off('change:kmlExportUrl');
    this.props.model.off('change:kmlImport');
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
    this.setState({
      showLabels: this.props.model.get('showLabels')
    });
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.on('change:dialog', () => {
      this.setState({
        dialog: this.props.model.get('dialog')
      });
      this.refs.textInput.focus();
    });
    this.props.model.on("change:kmlExportUrl", () => {
      this.setState({
        exportUrl: this.props.model.get('kmlExportUrl')
      });
    });
    this.props.model.on("change:kmlImport", () => {
      this.setState({
        kmlImport: this.props.model.get('kmlImport')
      });
    });
  },

  /**
   * Render alert component
   * @instance
   * @return {AlertView}
   */
  renderAlert: function () {
    var options = {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        })
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        })
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ""
        })
      }
    };

    if (this.state.alert) {
      return <Alert options={options}/>
    } else {
      return null;
    }
  },

  /**
   * Remove all drawings from map.
   * @instance
   */
  clear: function () {
    this.props.model.clear();
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /**
   * Confirm before clear.
   * @instance
   */
  alertClear: function(){
    this.setState({
      alert: true,
      alertMessage: ` Vill du verkligen rensa allt?`,
      confirm: true,
      confirmAction: () => {
        this.clear();
      },
      denyAction: () => {
        this.setState({ alert: false });
      }
    });
  },

  /**
   * Abort any operation and deselect any tool.
   * @instance
   */
  abort: function () {
    this.props.model.abort();
    $('#Point, #Circle, #Text, #Polygon, #LineString, #delete').removeClass('selected');
    $('#abort').hide();
    this.setState({
      symbology: ""
    })
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /**
   * Import kml.
   * @instance
   */
  import: function () {
    this.abort();
    this.props.model.set("kmlExportUrl", false);
    this.props.model.import();
  },

  /**
   * Export kml.
   * @instance
   */
  export: function () {
    this.abort();
    this.props.model.set("kmlImport", false);
    this.props.model.export();
  },

  /**
   * Handle change event of the show labels checkbox.
   * @instance
   */
  toggleLabels: function () {
    this.setState({
      showLabels: this.props.model.toggleLabels()
    });
  },

  /**
   * Activate the removal tool and update visuals.
   * @instance
   */
  activateRemovalTool: function () {
    this.props.model.activateRemovalTool();
    $('#Point, #Text, #Polygon, #LineString, #delete').removeClass('selected');
    $('#delete').addClass('selected');
    $('#abort').show();
    this.setState({
      symbology: ""
    })
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /*
   * Activate given draw tool and update visuals.
   * @instance
   * @param {string} type
   */
  activateDrawTool: function (type) {
    this.props.model.activateDrawTool(type);
    $('#Circle, #Point, #Text, #Polygon, #LineString, #delete').removeClass('selected');
    $('#' + type).addClass('selected');
    $('#abort').show();
    this.setState({
      symbology: type
    });
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
    if (isMobile()) {
      this.props.navigationPanel.minimize();
    }
  },

  /**
   * Render the symbology component.
   * @instance
   * @param {string} type
   * @return {external:ReactElement} component
   */
  renderSymbology: function (type) {

    function update(func, state_prop, e) {
      var value = e.target.value
      ,   state = {};

      if (e.target.type === "checkbox") {
        value = e.target.checked;
      }

      if (typeof value === "string") {
        value = !isNaN(parseFloat(value)) ?
                 parseFloat(value) :
                !isNaN(parseInt(value)) ?
                 parseInt(value) : value;
      }
      state[state_prop] = value;
      this.setState(state);
      this.props.model[func].call(this.props.model, value);
    }

    switch (type) {
      case "Point":
        return (
          <div>
            <h2>Ritmanér punkt</h2>
            <input type="checkbox" onChange={update.bind(this, 'setPointSymbol', 'pointSymbol')}
                                   checked={this.state.pointSymbol}
                                   id="point-symbol"/>
            <label htmlFor="point-symbol">Använd symbol</label>
            <div>Färg</div>
            <ColorPicker
              model={this.props.model}
              property="pointColor"
              onChange={this.props.model.setPointColor.bind(this.props.model)}
            />
            <div>Storlek</div>
            <select value={this.state.pointRadius} onChange={update.bind(this, 'setPointRadius', 'pointRadius')}>
              <option value="4">Liten</option>
              <option value="7">Normal</option>
              <option value="14">Stor</option>
              <option value="20">Större</option>
            </select>
          </div>
        );
      case "LineString":
        return (
          <div>
            <h2>Ritmanér linje</h2>
            <div>Färg</div>
            <ColorPicker
              model={this.props.model}
              property="lineColor"
              onChange={this.props.model.setLineColor.bind(this.props.model)}
            />
            <div>Tjocklek</div>
            <select value={this.state.lineWidth} onChange={update.bind(this, 'setLineWidth', 'lineWidth')}>
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Stil</div>
            <select value={this.state.lineStyle} onChange={update.bind(this, 'setLineStyle', 'lineStyle')}>
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      case "Circle":
        return (
          <div>
            <h2>Ritmanér cirkel</h2>
            <label>Ange radie: </label>&nbsp;
            <input type="text" name="circle-radius" value={this.state.circleRadius} onChange={update.bind(this, 'setCircleRadius', 'circleRadius')}/>
            <div>Linjefärg</div>
            <ColorPicker
              model={this.props.model}
              property="lineColor"
              onChange={this.props.model.setLineColor.bind(this.props.model)}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              model={this.props.model}
              property="polygonFillColor"
              onChange={this.props.model.setPolygonFillColor.bind(this.props.model)}
            />
            <div>Opacitet</div>
            <select value={this.state.polygonFillOpacity} onChange={update.bind(this, 'setPolygonFillOpacity', 'polygonFillOpacity')}>
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select value={this.state.polygonLineWidth} onChange={update.bind(this, 'setPolygonLineWidth', 'polygonLineWidth')}>
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select value={this.state.polygonLineStyle} onChange={update.bind(this, 'setPolygonLineStyle', 'polygonLineStyle')}>
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      case "Polygon":
        return (
          <div>
            <h2>Ritmanér yta</h2>
            <div>Linjefärg</div>
            <ColorPicker
              model={this.props.model}
              property="polygonLineColor"
              onChange={this.props.model.setPolygonLineColor.bind(this.props.model)}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              model={this.props.model}
              property="polygonFillColor"
              onChange={this.props.model.setPolygonFillColor.bind(this.props.model)}
            />
            <div>Opacitet</div>
            <select value={this.state.polygonFillOpacity} onChange={update.bind(this, 'setPolygonFillOpacity', 'polygonFillOpacity')}>
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select value={this.state.polygonLineWidth} onChange={update.bind(this, 'setPolygonLineWidth', 'polygonLineWidth')}>
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select value={this.state.polygonLineStyle} onChange={update.bind(this, 'setPolygonLineStyle', 'polygonLineStyle')}>
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      default:
        return <div></div>;
    }
  },

  /**
   * Render the import result component.
   * @instance
   * @param {string} url
   * @return {external:ReactElement} component
   */
  renderImport: function (visible) {

    function upload() {
      this.refs.uploadIframe.addEventListener("load", () => {
        this.props.model.importDrawLayer(this.refs.uploadIframe.contentDocument);
      });
    }

    if (!visible) return null;
    var url = this.props.model.get('importUrl');
    var style = {display: "none"};
    return (
      <div>
        <h4>Importera</h4>
        <p>Välj fil att importera</p>
        <form id="upload-form" method="post" action={url} target="upload-iframe" encType="multipart/form-data">
          <input onChange={upload.bind(this)} type="file" name="files[]" multiple="false" className="btn btn-default"/><br/>
          <input type="submit" value="Ladda upp" name="upload-file-form" className="btn btn-default"/><br/>
          <iframe id="upload-iframe" name="upload-iframe" ref="uploadIframe" style={style}></iframe>
        </form>
      </div>
    )
  },

  /**
   * Render the export result component.
   * @instance
   * @param {string} url
   * @return {external:ReactElement} component
   */
  renderExportResult: function (url) {
    if (!url) return null;
    if (url === "NO_FEATURES") {
      return (
        <div>
          <h4>Export</h4>
          <p>Denna funktionen exporterar inritade objekt.</p>
          <p>Kartan innehåller inte något att exportera.</p>
        </div>
      )
    } else {
      return (
        <div>
          <h4>Export</h4>
          <p>Din export är klar, hämta den genom att klicka på länken nedan.</p>
          <p>
            Exportfilen är av typen .kml och kan vid ett senare tillfälle importeras i kartan.
            Detta kan vara användbart om du vill dela med dig av det du ritat eller vill öppna det vid ett senare tillfälle.
            Filen kan även öppnas i Google Earth.
          </p>
          <a href={url}>Hämta export</a>
        </div>
      )
    }
  },

  /**
   * Render the dialog component.
   * @instance
   * @param {boolean} visible
   * @return {external:ReactElement} component
   */
  renderDialog: function(visible) {
    if (!visible) return null;

    function enter(e) {
      if (e.keyCode == 13) {
        update.call(this);
      }
    }

    function abort() {
      this.props.model.set('dialog', false);
      this.refs.textInput.blur();
      this.props.model.removeEditFeature();
    }

    function update() {
      this.refs.textInput.blur();
      this.props.model.set('dialog', false);
      this.props.model.setPointText(this.refs.textInput.value);
    }

    return (
      <div className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Ange text</h4>
            </div>
            <div className="modal-body">
              <input ref="textInput" onKeyDown={enter.bind(this)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={update.bind(this)}>Spara</button>&nbsp;
              <button type="button" className="btn btn-default" data-dismiss="modal" onClick={abort.bind(this)}>Avbryt</button>
            </div>
          </div>
        </div>
      </div>
    );
  },

  /**
   * Render the view.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var showLabels = this.state.showLabels ? "checked" : ""
    ,   symbology  = this.renderSymbology(this.state.symbology)
    ,   dialog     = this.renderDialog(this.state.dialog)
    ,   exportRes  = this.renderExportResult(this.state.exportUrl)
    ,   importRes  = this.renderImport(this.state.kmlImport);

    return (
      <div>
        <Panel title="Rita och måttsätt" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
          <div className="draw-tools">
            <div id="labels">
              <input id="labels-checkbox" onChange={this.toggleLabels} type="checkbox" checked={showLabels} />
              <label htmlFor="labels-checkbox">Visa areal/längd på ritade objekt</label>
            </div>
            <ul>
              <li id="Text" onClick={this.activateDrawTool.bind(this, "Text")}>
                <i className="fa fa-font fa-0"></i> <span>Skriv text</span>
              </li>
              <li id="Point" onClick={this.activateDrawTool.bind(this, "Point")}>
                <i className="iconmoon-punkt"></i> <span>Rita punkt</span>
              </li>
              <li id="Circle" onClick={this.activateDrawTool.bind(this, "Circle")}>
                <i className="iconmoon-punkt"></i> <span>Rita cirkel</span>
              </li>
              <li id="LineString" onClick={this.activateDrawTool.bind(this, "LineString")}>
                <i className="iconmoon-linje"></i> <span>Rita linje</span>
              </li>
              <li id="Polygon" onClick={this.activateDrawTool.bind(this, "Polygon")}>
                <i className="iconmoon-yta"></i> <span>Rita yta</span>
              </li>
              <li id="delete" onClick={this.activateRemovalTool}>
                <i className="fa fa-eraser fa-0"></i> <span>Radera objekt</span>
              </li>
              <li id="clear" onClick={this.alertClear}>
                <i className="fa fa-trash fa-0"></i> <span>Rensa allt</span>
              </li>
              <li id="clear" onClick={this.import}>
                <i className="fa fa-file-o fa-0"></i> <span>Importera</span>
              </li>
              <li id="clear" onClick={this.export}>
                <i className="fa fa-save fa-0"></i> <span>Exportera</span>
              </li>
              <li id="abort" className="green" onClick={this.abort}>
                <i className="fa fa-check fa-0"></i> <span>Klar</span>
              </li>
            </ul>
          </div>
          <div className="panel-body">
            {symbology}
            {exportRes}
            {importRes}
          </div>
        </Panel>
        {dialog}
        {this.renderAlert()}
      </div>
    );
  }
};

/**
 * DrawPanelView module.<br>
 * Use <code>require('views/drawpanel')</code> for instantiation.
 * @module DrawPanelView-module
 * @returns {DrawPanelView}
 */
module.exports = React.createClass(DrawPanelView);
