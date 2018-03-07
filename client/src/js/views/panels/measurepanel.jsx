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
//var ColorPicker = require('components/colorpicker');

/**
 * @class
 */
var MeasurePanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      lineWidth: this.props.model.get('lineWidth'),
      lineStyle: this.props.model.get('lineStyle'),
      polygonLineWidth: this.props.model.get('polygonLineWidth'),
      polygonLineStyle: this.props.model.get('polygonLineStyle'),
      polygonFillOpacity: this.props.model.get('polygonFillOpacity'),
      buttonDisabled: true
    };
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.abort();
    this.props.model.off('change:dialog');
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
    $('.measure-tool-item').removeClass('selected');
    this.setState({
      symbology: "",
      buttonDisabled: true
    })
    this.props.model.measureTooltip.setPosition(null);
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
    $('.measure-tool-item').removeClass('selected');
    $('#delete').addClass('selected');
    this.setState({ buttonDisabled: false });
  },

  /**
   * Activate move tool and update visuals.
   * @instance
   */
  activateMoveTool: function () {
    this.props.model.activateMoveTool();
    $('.measure-tool-item').removeClass('selected');
    $('#move').addClass('selected');
    this.setState({ buttonDisabled: false });
  },

  /**
   * Activate move tool and update visuals.
   * @instance
   */
  activateEditTool: function () {
    this.props.model.activateEditTool();
    $('.measure-tool-item').removeClass('selected');
    $('#edit').addClass('selected');
    this.setState({ buttonDisabled: false });
  },

  /*
   * Activate given draw tool and update visuals.
   * @instance
   * @param {string} type
   */
  activateDrawTool: function (type) {
    this.props.model.activateDrawTool(type);
    $('.measure-tool-item').removeClass('selected');
    $('#' + type).addClass('selected');
    this.setState({ buttonDisabled: false });
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
    var dialog = this.renderDialog(this.state.dialog);

    return (
        <Panel title="Mät" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
          <div className="draw-tools measure-tools">
            <ul>
              <li className="measure-tool-item" id="LineString" onClick={this.activateDrawTool.bind(this, "LineString")}>
                <i className="iconmoon-linje"></i> <span>Mät avstånd</span>
              </li>
              <li className="measure-tool-item" id="Polygon" onClick={this.activateDrawTool.bind(this, "Polygon")}>
                <i className="iconmoon-yta"></i> <span>Mät yta</span>
              </li>
              <li className="measure-tool-item" id="clear" onClick={this.alertClear}>
                <i className="fa fa-trash fa-0"></i> <span>Rensa allt</span>
              </li>
            </ul>
          </div>
          <div>
            {dialog}
            {this.renderAlert()}
          </div>
        </Panel>

    );
  }
};

/**
 * MeasurePanelView module.<br>
 * Use <code>require('views/MeasurePanel')</code> for instantiation.
 * @module MeasurePanelView-module
 * @returns {MeasurePanelView}
 */
module.exports = React.createClass(MeasurePanelView);
