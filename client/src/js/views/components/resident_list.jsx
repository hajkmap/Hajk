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
      minAge: 18,
      includeAge: false,
      includeBirthDate: false,
      includeGender: false,
      fetchingExcel: false,
      excelIsReady: false,
      excelUrl: ""
    };
  },

  getResidentData: function(callback) {
    var hits = this.props.model.get("items");
    if (!hits || hits.length === 0) {
       alert("Inga fastigheter eller adresser valda");
       return;
    }

    var filters = [];
    //Do we need to check if it's Fastighet/Address layer?
    hits.forEach(function(l) {
      l.hits.forEach(function(h) {
        filters.push(new ol.format.filter.Intersects("geom", h.getGeometry(), "EPSG:3007"))
      });
    });

    var featureRequest = new ol.format.WFS().writeGetFeature({
      srsName: 'EPSG:3007',
      featureTypes: ['ext_skv_v1:kir_folk'],
      outputFormat: 'application/json',
      filter: ol.format.filter.or.apply(null, filters)
    });

    this.setState({ fetchingExcel: true, excelIsReady: false, excelUrl: "" });
    $.ajax({
      url: "https://kommungis-utv.varberg.se/util/geoserver/wfs",
      method: 'POST',
      contentType: 'application/xml',
      xhrFields: { withCredentials: true },
      data: new XMLSerializer().serializeToString(featureRequest),
      success: function(response) {
        if (response && response.features) {
          callback(response.features);
        } else {
          return null;
        }
      }.bind(this),
      error: function(message) {
        this.setState({ fetchingExcel: false });

        console.error(message);
      }
    });
  },

  generateExcel: function(features, callback) {
    var columns = ["fonetnamn", "adress", "postnr", "ort", "personnr"];
    if (this.state.includeGender) {
      columns.push("koen");
    }

    var rows = [];
    features.forEach(function(f) {
      var row = [];
      columns.forEach(function(c) {
        row.push(f.properties[c]);
      });

      rows.push(row);
    });

    $.ajax({
      url: HAJK2.servicePath + "/fir/residentlist",
      method: "POST",
      format: "json",
      data: { json: JSON.stringify({ "columns": columns, "rows": rows }) },
      success: function(response) {
        if (response) {
          this.setState({
            fetchingExcel: false,
            excelIsReady: true,
            excelUrl: response
          });
        }
      }.bind(this),
      error: function() {
        this.setState({ fetchingExcel: false });
      }.bind(this)
    });
  },

  exportToEcxel: function() {
    this.getResidentData(function(features) {
      this.generateExcel(features);
    }.bind(this));
  },

  render: function() {
    var expandButtonClass = "fa clickable arrow pull-right expand-button fa-angle-" + (this.state.visible ? "up" : "down");

    return (
        <div className='panel panel-default kir'>
            <div className='panel-heading'>Boendeförteckning från sökresultat
              <button className={ expandButtonClass } onClick={(e) => { this.setState({ visible: !this.state.visible })}}></button>
            </div>

            <div className={ this.state.visible ? "panel-body" : "panel-body hidden" }>
              <fieldset>
                <legend>Inkludera i förteckning:</legend>

                <label htmlFor="min-age">Minimiålder</label>
                <input type="text" id="min-age" defaultValue={this.state.minAge}
                  onChange={(e) => this.setState({ minAge: e.target.value })} />
                <br />

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
                <i className='excel' />Skapa boendeförteckning
              </button> : ""
            }

            {
              this.state.fetchingExcel ? "Hämtar..." : ""
            }

            {
              this.state.excelIsReady ? <a href={this.state.excelUrl} target="_blank">Ladda ner</a> : ""
            }
        </div>
    );
  }
};

module.exports = React.createClass(ResidentList);
