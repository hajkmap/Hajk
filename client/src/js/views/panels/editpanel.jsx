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

var AttributeEditor = React.createClass({

  getInitialState: function() {
    return {
      disabled: true,
      formValues: {}
    };
  },

  componentWillUnmount: function () {
  },

  componentWillMount: function () {
  },

  componentDidMount: function () {
    this.props.model.on('change:editFeature', (attr) => {
      var valueMap = {}
      ,   feature = this.props.model.get('editFeature')
      ,   source = this.props.model.get('editSource')
      ,   props
      ,   defaultValue = '';

      if (!feature || !source) return;

      props = feature.getProperties();
      source.editableFields.map(field => {
        field.initialRender = true;
        if (field.textType === "flerval") {
          valueMap[field.name] = field.values.map(value => {
            return {
              name: value,
              checked: typeof props[field.name] === "string" ?
                       props[field.name].split(';').find(v => v === value) !== undefined :
                       false
            }
          });
        } else {
          valueMap[field.name] = props[field.name] || defaultValue;
        }

      });

      this.state.formValues = valueMap;
    });
  },

  updateFeature: function () {
    var props = this.props.model.get('editFeature').getProperties();
    Object.keys(this.state.formValues).forEach(key => {
      var value = this.state.formValues[key];
      if (value === '') value = null;
      if (Array.isArray(value)) {
        value = value.filter(v => v.checked).map(v => v.name).join(';');
      }
      props[key] = value;
    });
    this.props.model.get('editFeature').setProperties(props);
  },

  checkInteger: function (name, value) {
    if (/^\d+$/.test(value) || value === "") {
      this.state.formValues[name] = value;
      this.updateFeature();
      this.setState({
        formValues: this.state.formValues
      });
    }
  },

  checkNumber: function (name, value) {
    if (/^\d+([\.\,](\d+)?)?$/.test(value) || value === "") {
      value = value.replace(',', '.');
      this.state.formValues[name] = value;
      this.updateFeature();
      this.setState({
        formValues: this.state.formValues
      });
    }
  },

  checkUrl: function (name, value) {

    var regex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
    var valid = regex.test(value);

    if (valid || value === '') {
      this.state.formValues[name] = value;
    } else {
      this.state.formValues[name] = '';
      this.props.panel.setState({
        alert: true,
        loading: false,
        alertMessage: `Fältet ${name} är av typen URL, vilken måste följa formatet http://www.google.se.`,
        confirm: false
      });
    }

    this.updateFeature();
    this.setState({
      formValues: this.state.formValues
    });
  },

  checkText: function (name, value) {
    this.state.formValues[name] = value;
    this.updateFeature();
    this.setState({
      formValues: this.state.formValues
    });
  },

  checkSelect: function (name, value) {
    this.state.formValues[name] = value;
    this.updateFeature();
    this.setState({
      formValues: this.state.formValues
    });
  },

  checkMultiple: function (name, checked, value, index) {
    this.state.formValues[name][index].checked = checked;
    this.updateFeature();
    this.setState({
      formValues: this.state.formValues
    });
  },

  checkDate: function (name, date) {
    var value = "";
    if (date.format) {
      value = date.format('Y-MM-DD HH:mm:ss');
    } else {
      value = date;
    }
    this.state.formValues[name] = value;
    this.updateFeature();
    this.setState({
      formValues: this.state.formValues
    });
  },

  setChanged: function() {
    if (this.props.model.get('editFeature').modification !== 'added' &&
        this.props.model.get('editFeature').modification !== 'removed') {
      this.props.model.get('editFeature').modification = 'updated';
    }
  },

  getValueMarkup: function (field) {

    if (field.dataType === "int") {
      field.textType = "heltal";
    }

    if (field.dataType === "number") {
      field.textType = "nummer";
    }

    if (field.dataType === "date") {
      field.textType = "datum";
    }

    var value = this.state.formValues[field.name];

    if (value === "" && field.initialRender) {
      value = field.defaultValue;
      this.state.formValues[field.name] = value;
    }

    switch (field.textType) {
      case "heltal":
        return (
          <input className="form-control" type="text" value={value} onChange={(e) => {
              this.setChanged();
              this.checkInteger(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "nummer":
        return (
          <input className="form-control" type="text" value={value} onChange={(e) => {
              this.setChanged();
              this.checkNumber(field.name, e.target.value);
              field.initialRender = false;
            }}
          />
        );
      case "datum":
        if (typeof value === "string") {
          value = value.replace('T', ' ').replace('Z','')
        }
        return (
          <Datetime closeOnSelect={true} disableOnClickOutside={true} dateFormat="Y-MM-DD" timeFormat="HH:mm:ss" value={value} onChange={(date) => {
              this.setChanged();
              this.checkDate(field.name, date);
              field.initialRender = false;
            }}
          />
        );
      case "url":
      case "fritext":
        return (
          <input
            className="form-control"
            type="text"
            value={value}
            onChange={(e) => {
              this.setChanged();
              this.checkText(field.name, e.target.value);
              field.initialRender = false;
            }}
            onBlur={(e) => {
              this.setChanged();
              if (field.textType === "url") {
                this.checkUrl(field.name, e.target.value);
              }
              field.initialRender = false;
            }}
          />
        );
      case "flerval":
        let defaultValues = [];
        if (typeof field.defaultValue === "string") {
          defaultValues = field.defaultValue.split(',');
        }
        if (field.initialRender) {
          defaultValues.forEach(defaultValue => {
            value.forEach(val => {
              if (defaultValue === val.name) {
                val.checked = true;
              }
            });
          });
        }

        let checkboxes = field.values.map(
          (val, i) => {

            var id = field.name + i
            ,   item = value.find(item => item.name === val) || {checked: false};

            return (
              <div key={i}>
                <input type="checkbox" id={id} checked={item.checked} onChange={(e) => {
                  this.setChanged();
                  this.checkMultiple(field.name, e.target.checked, val, i);
                  field.initialRender = false;
                }}/>
                <label htmlFor={id}>{val}</label>
              </div>
            )
          }
        );
        return <div>{checkboxes}</div>;
      case "lista":
        let options = null;
        if (Array.isArray(field.values))
          options = field.values.map((val, i) => <option key={i} value={val}>{val}</option>);

        return (
          <select className="form-control" value={value} onChange={(e) => {
              this.setChanged();
              this.checkSelect(field.name, e.target.value);
              field.initialRender = false;
            }}
          >
            <option value="">-Välj värde-</option>
            {options}
          </select>
        );
      case null:
        return (<span>{value}</span>);
      default:
        return (<span>{value}</span>);
    }
  },

  render: function () {

    if (!this.props.feature) return null;

    var markup = this.props.source.editableFields.map((field, i) => {

      var value = this.getValueMarkup(field)
      ,   className = ''
      ;

      if (field.hidden) {
        className = "hidden"
      }

      this.updateFeature();

      return (
        <div key={i} ref={field.name} className="field" className={className}>
          <div>{field.name}</div>
          <div>{value}</div>
        </div>
      )
    });

    return (
      <div>{markup}</div>
    );
  }
});

var Toolbar = React.createClass({

  getInitialState: function() {
    return {
      activeTool: undefined
    };
  },

  componentWillUnmount: function () {
    this.props.model.off('change:layer');
  },

  componentWillMount: function () {
    this.props.model.on('change:layer', () => {
      if (this.props.model.get('layer')) {
        this.props.model.get('layer').dragLocked = true;
        this.props.model.deactivateTools();
        this.setState({
          activeTool: undefined
        });
      }
    });
  },

  componentDidMount: function () {
  },

  changeTool: function(type) {

    if (this.state.activeTool === type.toLowerCase()) {
      this.props.model.deactivateDrawTool(true);
      if (type === 'move') {
        this.props.model.get('layer').dragLocked = true;
      }

      return this.setState({
        activeTool: undefined
      });
    }

    switch (type) {
      case "Point":
      case "LineString":
      case "Polygon":
        this.props.model.activateDrawTool(type);
        this.props.model.setRemovalToolMode('off');
        break;
      case "remove":
        this.props.model.deactivateDrawTool(type);
        break;
      case "move":
        this.props.model.deactivateDrawTool(type);
        this.props.model.setRemovalToolMode('off');
        break;
    }
  },

  onAddPointClicked: function() {
    this.props.model.get('layer').dragLocked = true;
    this.setState({activeTool: "point"});
    this.changeTool('Point');
  },

  onAddLineClicked: function() {
    this.props.model.get('layer').dragLocked = true;
    this.setState({activeTool: "linestring"});
    this.changeTool('LineString');
  },

  onAddPolygonClicked: function() {
    this.props.model.get('layer').dragLocked = true;
    this.setState({activeTool: "polygon"});
    this.changeTool('Polygon');
  },

  onRemoveClicked: function() {
    this.props.model.get('layer').dragLocked = true;
    this.props.model.setRemovalToolMode(this.state.activeTool === "remove" ? "off" : "on");
    this.setState({activeTool: "remove"});
    this.changeTool('remove');
  },

  onMoveClicked: function() {
    this.props.model.get('layer').dragLocked = false;
    this.setState({activeTool: "move"});
    this.changeTool('move');
  },

  onSaveClicked: function () {

    var getMessage = (data) => {
      if (!data)
        return `Uppdatateringen lyckades men det upptäcktes inte några ändringar.`;
      if (data.ExceptionReport) {
        return `Uppdateringen misslyckades: ${data.ExceptionReport.Exception.ExceptionText.toString()}`;
      }
      if (data.TransactionResponse && data.TransactionResponse.TransactionSummary) {
        return `Uppdateringen lyckades:
          antal skapade objekt: ${data.TransactionResponse.TransactionSummary.totalInserted}
          antal borttagna objekt: ${data.TransactionResponse.TransactionSummary.totalDeleted}
          antal uppdaterade objekt: ${data.TransactionResponse.TransactionSummary.totalUpdated}
        `
      } else {
        return 'Status för uppdateringen kunde inte avläsas ur svaret från servern.'
      }
    };

    if (!this.props.model.get('editSource'))
      return;

    this.props.panel.setState({
      loading: true
    });

    this.props.model.save((data) => {
      this.props.panel.setState({
        alert: true,
        loading: false,
        alertMessage: getMessage(data),
        confirm: false
      });
      this.props.model.setRemovalToolMode('off');
      this.props.model.filty = false;
      this.props.panel.setLayer(this.props.model.get('editSource'));
    });

  },

  onCancelClicked: function() {
    this.props.model.get('layer').dragLocked = true;
    this.props.model.deactivate();
    this.props.panel.setState({
      checked: false,
      enabled: false
    });
    this.setState({
      activeTool: undefined
    });
  },

  render: function () {

    var disabled = !this.props.enabled;
    var isActive = (type) => {
      return this.state.activeTool === type ? "btn btn-primary" : "btn btn-default";
    };

    var source = this.props.model.get('editSource');
    var editPoint = editPolygon = editLine = false;

    if (source) {
      editPoint = source.editPoint;
      editLine = source.editLine;
      editPolygon = source.editPolygon;
    }

    return (
      <div>
        <div className="edit-toolbar-wrapper">
          <div className="btn-group btn-group-lg map-toolbar">
            <button
              disabled={disabled === false ? !editPoint : disabled}
              onClick={() => {this.onAddPointClicked()}}
              className={isActive("point")}
              type="button"
              title="Lägg till punkt"
            >
              <i className="iconmoon-punkt"></i>
            </button>
            <button
              disabled={disabled === false ? !editLine : disabled}
              onClick={() => {this.onAddLineClicked()}}
              className={isActive("linestring")}
              type="button"
              title="Lägg till linje"
            >
              <i className="iconmoon-linje"></i>
            </button>
            <button
              disabled={disabled === false ? !editPolygon : disabled}
              onClick={() => {this.onAddPolygonClicked()}}
              className={isActive("polygon")}
              type="button"
              title="Lägg till yta"
            >
              <i className="iconmoon-yta"></i>
            </button>
            <button
              disabled={disabled}
              onClick={() => {this.onMoveClicked()}}
              className={isActive("move")}
              type="button"
              title="Flytta geometri"
            >
              <i className="fa fa-arrows icon"></i>
            </button>
            <button
              disabled={disabled}
              onClick={() => {this.onRemoveClicked()}}
              className={isActive("remove")}
              type="button"
              title="Ta bort geometri"
            >
              <i className="fa fa-eraser icon"></i>
            </button>
            <button
              disabled={disabled}
              onClick={(e) => {this.onSaveClicked()}}
              className="btn btn-default"
              type="button"
              title="Spara"
            >
              <i className="fa fa-floppy-o icon"></i>
            </button>
            <button
              disabled={disabled}
              onClick={(e) => {this.onCancelClicked()}}
              className="btn btn-default"
              type="button"
              title="Avbryt"
            >
              <i className="fa fa-ban icon"></i>
            </button>
          </div>
        </div>
      </div>
    )
  }
});

/**
 * @class
 */
var EditPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      enabled: false,
      checked: false
    };
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:editFeature');
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {

    this.props.model.on('change:editFeature', (attr) => {
      this.setState({
        editFeature: this.props.model.get('editFeature'),
        editSource: this.props.model.get('editSource')
      });
    });

    this.props.model.on('change:removeFeature', (attr) => {
      if (this.props.model.get('removeFeature')) {
        this.setState({
          alert: true,
          alertMessage: ` Vill du ta bort markerat obekt?

            Tryck därefter på sparaknappen för definitiv verkan.
          `,
          confirm: true,
          confirmAction: () => {
            var feature = this.props.model.get('removeFeature')
            this.props.model.get('select').getFeatures().remove(feature);
            feature.modification = 'removed';
            feature.setStyle(this.props.model.getHiddenStyle());
          },
          denyAction: () => {
            this.setState({ alert: false });
            this.props.model.set('removeFeature', undefined)
          }
        });
      }
    });
  },

  /**
   * Set active layer to edit
   * @instance
   * @param {external:"ol.source"} source
   *
   */
  setLayer: function (source) {

    var clear = () => {
      var time = new Date().getTime() - timer;
      if (time < 1000) {
        setTimeout(() => {
          this.setState({ loading: false });
        }, 1000 - time);
      } else {
        this.setState({ loading: false });
      }
    };

    var changeActiveLayer = () => {
      this.setState({
        checked: source.caption,
        loading: true,
        enabled: true
      });
      this.props.model.setLayer(source, clear);
    }

    var timer = new Date().getTime();

    if (this.props.model.filty) {
      this.setState({
        alert: true,
        alertMessage: `Du har en aktiv redigeringssession startad dina ändringar kommer att gå förlorade.

        Vill du forstätta ändå?`,
        confirm: true,
        confirmAction: () => {
          changeActiveLayer();
        },
        denyAction: () => {
          this.setState({ alert: false });
        }
      });
    } else {
      changeActiveLayer();
    }
  },

  /**
   * Render the component.
   * @instance
   * @return {Alert} component
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
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    var visible = true, options, loader;

    options = () => {
      return this.props.model.get('sources').map(
        (source, i) => {
          var id = "edit-layer-" + i;
          return (
            <div key={i} className="list-item">
              <input id={id} type="radio" name="source" checked={this.state.checked === source.caption} onChange={(e) => {
                this.setLayer(source)
              }} />
              <label htmlFor={id}>{source.caption}</label>
            </div>
          )
        }
      )
    };

    if (this.state.loading) {
      loader = <div className="layer-loader"></div>;
    }

    return (
      <div>
        <Panel title="Editera lager" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
          <div className="edit-tools">
            <div className="loading-bar">
              {loader}
            </div>
            <Toolbar ref="toolbar" enabled={this.state.enabled} loading={this.state.loading} model={this.props.model} panel={this} />
            <ul className="edit-layers">
              {options()}
            </ul>
            <AttributeEditor ref="attributeEditor" feature={this.state.editFeature} source={this.state.editSource} model={this.props.model} activeTool={this.state.activeTool} panel={this}/>
          </div>
        </Panel>
        {this.renderAlert()}
      </div>
    );
  }
};

/**
 * EditPanelView module.<br>
 * Use <code>require('views/editpanel')</code> for instantiation.
 * @module EditPanelView-module
 * @returns {EditPanelView}
 */
module.exports = React.createClass(EditPanelView);
