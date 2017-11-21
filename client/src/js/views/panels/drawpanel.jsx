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
var Alert = require('alert');
var ColorPicker = require('components/colorpicker');

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
      pointSettings: this.props.model.get('pointSettings'),
      pointRadius: this.props.model.get('pointRadius'),
      pointSymbol: this.props.model.get('pointSymbol'),
      fontSize: this.props.model.get('fontSize'),
      lineWidth: this.props.model.get('lineWidth'),
      lineStyle: this.props.model.get('lineStyle'),
      circleLineColor: this.props.model.get('circleLineColor'),
      circleFillColor: this.props.model.get('circleFillColor'),
      circleLineStyle: this.props.model.get('circleLineStyle'),
      circleLineWidth: this.props.model.get('circleLineWidth'),
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
    this.props.model.off('change:downloadDrawKml');
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
    this.props.model.on("change:downloadDrawKml")
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
    this.props.model.set("circleRadius", "");
    this.setState({
      circleRadius: ""
    });
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
    $('#Point, #Circle, #Text, #Polygon, #LineString, #move, #edit, #delete').removeClass('selected');
    $('#abort').hide();
    this.setState({
      symbology: ""
    })
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
    this.props.model.measureTooltip.setPosition(null);
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
    $('#Point, #Text, #Polygon, #LineString, #Circle, #move, #edit, #delete').removeClass('selected');
    $('#delete').addClass('selected');
    $('#abort').show();
    this.setState({
      symbology: ""
    })
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /**
   * Activate move tool and update visuals.
   * @instance
   */
  activateMoveTool: function () {
    this.props.model.activateMoveTool();
    $('#Point, #Text, #Polygon, #LineString, #Circle, #move, #edit, #delete').removeClass('selected');
    $('#move').addClass('selected');
    $('#abort').show();
    this.setState({
      symbology: ""
    })
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /**
   * Activate move tool and update visuals.
   * @instance
   */
  activateEditTool: function () {
    this.props.model.activateEditTool();
    $('#Point, #Text, #Polygon, #LineString, #Circle, #move, #edit, #delete').removeClass('selected');
    $('#edit').addClass('selected');
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
    $('#Circle, #Point, #Text, #Polygon, #LineString, #move, #edit, #delete').removeClass('selected');
    $('#' + type).addClass('selected');
    $('#abort').show();
    this.setState({
      symbology: type
    });
    this.props.model.set("kmlExportUrl", false);
    this.props.model.set("kmlImport", false);
  },

  /**
   * Set marker image.
   * @instance
   * @param {object} e
   */
  setMarkerImg: function(e) {
    this.props.model.set('markerImg', e.target.src);
    this.forceUpdate();
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

    function hasClass(icon) {
      return this.props.model.get('markerImg') === window.location.href + `assets/icons/${icon}.png`
        ? "selected"
        : "" ;
    }

    function renderIcons() {

      var icons = this.props.model.get('icons').split(',');

      return (
        icons.map((icon, i) => {
          icon = icon.trim();
          if (icon === "br") {
            return (<br key={i} />);
          } else {
            var iconSrc = `assets/icons/${icon}.png`;
            return (
              <div key={i} className={hasClass.call(this, icon)}>
                <img onClick={this.setMarkerImg} src={iconSrc}></img>
              </div>
            )
          }
        })
      );
    }

    function renderPointSettings() {
      switch (this.state.pointSettings) {
        case "point":
          return (
            <div>
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
        case "symbol":
          return (
            <div className="point-marker-img">
                {renderIcons.call(this)}
            </div>
          );
      }
    }

    switch (type) {
      case "Text":
        return (
          <div>
            <h2>Ritmanér text</h2>
            <div>Textstorlek</div>
            <select value={this.state.fontSize} onChange={update.bind(this, 'setFontSize', 'fontSize')}>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="60">60</option>
              <option value="80">100</option>
            </select>
            <div>Textfärg</div>
            <ColorPicker
              model={this.props.model}
              property="fontColor"
              onChange={this.props.model.setFontColor.bind(this.props.model)}
            />
            <div>Bakgrundsfärg text</div>
            <ColorPicker
              model={this.props.model}
              noColor="true"
              property="fontBackColor"
              onChange={this.props.model.setFontBackColor.bind(this.props.model)}
            />
          </div>
        );
      case "Point":
        return (
          <div>
            <h2>Ritmanér punkt</h2>
            <label>Välj typ</label>
            <div>
              <select value={this.state.pointSettings} onChange={e => {
                  var value = e.target.value === "symbol" ? true : false;
                  update.call(this, 'setPointSettings', 'pointSettings', e);
                  update.call(this, 'setPointSymbol', 'pointSymbol', {
                    target: {
                      type: "checkbox",
                      checked: value
                    }
                  });
                }}>
                <option key="point" value="point">Punkt</option>
                <option key="symbol" value="symbol">Symbol</option>
              </select>
            </div>
             {renderPointSettings.call(this)}
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
              property="circleLineColor"
              onChange={this.props.model.setCircleLineColor.bind(this.props.model)}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              model={this.props.model}
              property="circleFillColor"
              onChange={this.props.model.setCircleFillColor.bind(this.props.model)}
            />
            <div>Opacitet</div>
            <select value={this.state.circleFillOpacity} onChange={update.bind(this, 'setCircleFillOpacity', 'circleFillOpacity')}>
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select value={this.state.circleLineWidth} onChange={update.bind(this, 'setCircleLineWidth', 'circleLineWidth')}>
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select value={this.state.circleLineStyle} onChange={update.bind(this, 'setCircleLineStyle', 'circleLineStyle')}>
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
        <p>Välj KML-fil att importera</p>
        <form id="upload-form" method="post" action={url} target="upload-iframe" encType="multipart/form-data">
          <input onChange={upload.bind(this)} type="file" name="files[]" accept=".kml" multiple="false" className="btn btn-default"/><br/>
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
        <Panel title="Rita och mäta" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
          <div className="draw-tools">
            <div id="labels">
              <input id="labels-checkbox" onChange={this.toggleLabels} type="checkbox" checked={showLabels} />
              <label htmlFor="labels-checkbox">Visa areal/längd/koordinater på ritade objekt</label>
            </div>
            <ul>
              <li id="Text" onClick={this.activateDrawTool.bind(this, "Text")}>
                <i className="fa fa-font fa-0"></i> <span>Skriv text</span>
              </li>
              <li id="Point" onClick={this.activateDrawTool.bind(this, "Point")}>
                <i className="fa fa-circle fa-0"></i> <span>Rita punkt</span>
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
              <li id="move" onClick={this.activateMoveTool}>
                <i className="fa fa-arrows fa-0"></i> <span>Flytta objekt</span>
              </li>
              <li id="edit" onClick={this.activateEditTool}>
                <i className="fa fa-edit fa-0"></i> <span>Ändra objekt</span>
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
          <div>{dialog}
            {this.renderAlert()}
          </div>
        </Panel>

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
