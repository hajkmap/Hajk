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

/**
 * @class
 */
class AlertView extends React.Component {

  constructor() {
    super();
  }

  /**
   * Render the View
   */
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
                <p>
                  {options.message.split('\n').map(function(text, i) {
                    return (
                      <span key={i}>
                        <span>{text}</span>
                        <br/>
                      </span>
                    )
                  })}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={options.denyAction} className="btn btn-default">Avbryt</button>&nbsp;
                <button type="button" onClick={options.confirmAction} className="btn btn-primary">OK</button>
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
                  {options.message.split('\n').map(function(text, i) {
                    return (
                      <span key={i}>
                        <span>{text}</span>
                        <br/>
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

/**
 * AlertView module.<br>
 * Use <code>require('views/alert')</code> for instantiation.
 * @module AlertView-module
 * @returns {AlertView}
 */
module.exports = AlertView;