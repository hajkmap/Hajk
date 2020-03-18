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

import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import CancelIcon from "@material-ui/icons/Cancel";
import DoneIcon from "@material-ui/icons/Done";
import { withStyles } from "@material-ui/core/styles";
import { green, blue } from "@material-ui/core/colors";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

class LayerAlert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryable: props.options.queryable || false,
      style:
        props.options.style ||
        (props.options.styles.length > 0 ? props.options.styles[0].Name : "")
    };
  }

  render() {
    let options = this.props.options;
    let styles = options.styles.map((style, index) => {
      return <option key={"style" + index}>{style.Name}</option>;
    });
    return (
      <div className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                Infoklickinställningar - {options.name}
              </h4>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="infoclickable">Infoklick</label>
                    <input
                      id="infoclickable"
                      type="checkbox"
                      ref="input_queryable"
                      checked={this.state.queryable}
                      onChange={e => this._onQueryableChange(e)}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Stil</label>
                    <select
                      className="form-control"
                      defaultValue={this.state.style}
                      onChange={e => this._onStyleChange(e)}
                    >
                      {styles}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={e => this._onCancelClick(e)}
                startIcon={<CancelIcon />}
              >
                Avbryt
              </ColorButtonBlue>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={e => this._onSaveClick(e)}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            </div>
          </div>
        </div>
      </div>
    );
  }

  _onStyleChange(e) {
    this.setState({
      style: e.target.value
    });
  }

  _onQueryableChange(e) {
    this.setState({
      queryable: e.target.checked
    });
  }

  _onSaveClick(e) {
    // har vinåg
    this.props.options.confirmAction(this.state);
  }

  _onCancelClick(e) {
    this.props.options.denyAction();
  }
}

class Alert extends Component {
  render() {
    var options = this.props.options;
    var imageLoader = this.props.imageLoader;
    if (options.confirm) {
      return !options.visible ? (
        false
      ) : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Bekräfta</h4>
              </div>
              <div className="modal-body">
                <p>{options.message}</p>
              </div>
              <div className="modal-footer">
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={options.confirmAction}
                  startIcon={<DoneIcon />}
                >
                  OK
                </ColorButtonGreen>
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={options.denyAction}
                  startIcon={<CancelIcon />}
                >
                  Avbryt
                </ColorButtonBlue>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (options.settings) {
      return !options.visible ? (
        false
      ) : (
        <LayerAlert options={options} imageLoader={imageLoader} />
      );
    } else {
      return !options.visible ? (
        false
      ) : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {options.caption || "Meddelande"}
                </h4>
              </div>
              <div className="modal-body">
                {options.contentType === "react" ? (
                  options.message
                ) : (
                  <p>
                    {options.message.split("\n").map(function(text, i) {
                      return (
                        <span key={i}>
                          <span>{text}</span>
                          <br />
                        </span>
                      );
                    })}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={options.onClick}
                >
                  OK
                </ColorButtonGreen>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Alert;
