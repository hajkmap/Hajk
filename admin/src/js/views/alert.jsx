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

import React from 'react';
import { Component } from 'react';

class Alert extends Component {

  constructor() {
    super();
  }

  render() {
    var options = this.props.options;
    if (options.confirm) {
      return !options.visible ? false : (
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
                <button type="button" onClick={options.denyAction} className="btn btn-default">Avbryt</button>&nbsp;
                <button type="button" onClick={options.confirmAction} className="btn btn-primary">OK</button>
              </div>
            </div>
          </div>
        </div>
      )
    } else if (options.settings) {
      return !options.visible ? false : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Infoklickinställningar - {options.name}</h4>
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
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Format</label>
                      <select 
                        defaultValue="Välj ett format"
                        className="form-control"
                        onChange={(e) => {
                          this.props.setFormat(e.target.value);
                        }}>
                        {options.formats}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Stil</label>
                      <select 
                        defaultValue="Välj en stil"
                        className="form-control"
                        onChange={(e) => {
                          this.props.setStyle(e.target.value);
                        }}>
                        {options.styles}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Inforuta</label>
                      <textarea
                        ref="input_infobox"
                        defaultValue={this.props.infobox}
                        onChange={(e) => {
                          this.props.setInfobox(e.target.value);
                        }}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={options.denyAction} className="btn btn-default">Avbryt</button>&nbsp;
                <button type="button" onClick={options.confirmAction} className="btn btn-primary">Spara</button>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return !options.visible ? false : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Meddelande</h4>
              </div>
              <div className="modal-body">
                <p>
                  {options.message.split('\n').map(function (text, i) {
                    return (
                      <span key={i}>
                        <span>{text}</span>
                        <br />
                      </span>
                    )
                  })}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={options.onClick} className="btn btn-default">OK</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}

export default Alert;
