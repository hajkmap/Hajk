// Copyright (C) 2019 Varbergs kommun
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

var ResidentList = {

  getInitialState: function () {
    return {
      visible: false,
      includeAge: false,
      includeBirthDate: false,
      includeGender: false
    };
  },

  exportToEcxel: function() {

  },

  render: function() {
    var expandButtonClass = "fa clickable arrow pull-right expand-button fa-angle-" + (this.state.visible ? "up" : "down");

    return (
        <div className='panel panel-default kir'>
            <div className='panel-heading'>Skapa boendeförteckning
              <button className={ expandButtonClass } onClick={(e) => { this.setState({ visible: !this.state.visible })}}></button>
            </div>

            <div className={ this.state.visible ? "panel-body" : "panel-body hidden" }>
              <fieldset>
                <legend>Inkludera i förteckning:</legend>

                <input type="checkbox" id="cbx-age" defaultChecked={this.state.includeAge}
                  onChange={(e) => this.setState({ includeAge: e.target.checked })} />
                <label htmlFor="cbx-age">Ålder</label><br />

                <input id="cbx-bd" type="checkbox" defaultChecked={this.state.includeBirthDate}
                  onChange={(e) => this.setState({ includeBirthDate: e.target.checked })} />
                <label htmlFor="cbx-bd">Födelsedatum</label><br />

                <input id="cbx-gender" type="checkbox" defaultChecked={this.state.includeGender}
                  onChange={(e) => this.setState({ includeGender: e.target.checked })} />
                <label htmlFor="cbx-gender">Kön</label>
              </fieldset>
            </div>

            {
              this.props.model.get('excelExportUrl') != null ?
              <button className='btn btn-default fir-icon-button' onClick={this.exportToEcxel}>
                <i className='excel' />Skapa boendeförteckning från sökresultat
              </button> : ""
            }

        </div>
    );
  }
};

module.exports = React.createClass(ResidentList);
