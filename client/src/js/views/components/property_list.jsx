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

var PropertyList = {
  options: [],

  getInitialState: function () {
    return {
      visible: false,
      samfallighet: false,
      ga: false,
      rattighet: false,
      persnr: false,
      taxerad_agare: false,
      fastighet_utskick: false,
    };
  },

  optionChanged: function (e) {
    var columns = this.props.model.get("chosenColumns"),
      option = e.target.id,
      state = [];

    state[option] = !this.state[option];
    this.setState(
      state,
      function () {
        if (this.state[option]) {
          columns.push(option);
        } else {
          columns.pop(option);
        }

        this.props.model.set("chosenColumns", columns);
      }.bind(this)
    );
  },

  exportToEcxel: function () {
    var hits = this.props.model.get("items");

    if (!hits || hits.length === 0) {
      alert("Inga fastigheter eller adresser valda");
      return;
    }

    this.props.model.set("url", "");
    this.props.model.export("excel");
  },

  render: function () {
    var expandButtonClass =
      "fa clickable arrow pull-right expand-button fa-angle-" +
      (this.state.visible ? "up" : "down");

    return (
      <div className="panel panel-default kir">
        <div className="panel-heading">
          Fastighetsförteckning
          {this.props.model.get("instructionSkapaFastighetsforteckning") !=
          null ? (
            <button
              className="btn-info-fir"
              onClick={() =>
                this.setState({
                  instructionVisible: !this.state.instructionVisible,
                })
              }
            >
              <img src={this.props.model.get("infoKnappLogo")} />
            </button>
          ) : (
            ""
          )}
          <button
            className={expandButtonClass}
            onClick={() => this.setState({ visible: !this.state.visible })}
          />
          {this.state.instructionVisible ? (
            <div
              className="panel-body-instruction instructionsText"
              dangerouslySetInnerHTML={{
                __html: decodeURIComponent(
                  atob(
                    this.props.model.get(
                      "instructionSkapaFastighetsforteckning"
                    )
                  )
                ),
              }}
            ></div>
          ) : (
            ""
          )}
        </div>

        <div
          className={this.state.visible ? "panel-body" : "panel-body hidden"}
        >
          <fieldset>
            <legend>Inkludera i förteckning:</legend>

            <input
              type="checkbox"
              id="samfallighet"
              defaultChecked={this.state.samfallighet}
              onChange={this.optionChanged}
            />
            <label htmlFor="samfallighet">Samfälligheter</label>
            <br />

            <input
              id="ga"
              type="checkbox"
              defaultChecked={this.state.ga}
              onChange={this.optionChanged}
            />
            <label htmlFor="ga">Gemensamhetsanläggningar</label>
            <br />

            <input
              id="rattighet"
              type="checkbox"
              defaultChecked={this.state.rattighet}
              onChange={this.optionChanged}
            />
            <label htmlFor="rattighet">Rättigheter</label>
            <br />

            <input
              id="persnr"
              type="checkbox"
              defaultChecked={this.state.persnr}
              onChange={this.optionChanged}
            />
            <label htmlFor="persnr">Personnummer</label>
            <br />

            <input
              id="taxerad_agare"
              type="checkbox"
              defaultChecked={this.state.taxerad_agare}
              onChange={this.optionChanged}
            />
            <label htmlFor="taxerad_agare">Taxerad Ägare</label>
            <br />

            <input
              id="fastighet_utskick"
              type="checkbox"
              defaultChecked={this.state.fastighet_utskick}
              onChange={this.optionChanged}
            />
            <label htmlFor="fastighet_utskick">Utskickslista</label>
          </fieldset>
        </div>

        {this.props.model.get("excelExportUrl") != null ? (
          <button
            className="btn btn-default fir-icon-button"
            onClick={this.exportToEcxel}
          >
            <i className="excel" />
            Skapa fastighetsförteckning
          </button>
        ) : (
          ""
        )}

        {this.props.model.get("downloading") ? "Hämtar..." : ""}

        {this.props.model.get("url") ? (
          <a href={this.props.model.get("url")} target="_blank">
            Ladda ner
          </a>
        ) : (
          ""
        )}
      </div>
    );
  },
};

module.exports = React.createClass(PropertyList);
