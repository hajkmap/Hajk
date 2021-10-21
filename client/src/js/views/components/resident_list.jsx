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
    this.config = this.props.model.get("residentList");
    return {
      visible: false,
      minAge: this.config.minAge,
      includeAge: false,
      includeBirthDate: false,
      adjustToReal: false,
      includeSSN: false,
      includeGender: false,
      fetchingExcel: false,
      excelUrl: "",
      errorMessage: null,
    };
  },

  getResidentData: function (callback) {
    var hits = this.props.model.get("items"),
      mapProjection = this.props.model
        .get("map")
        .getView()
        .getProjection()
        .getCode(),
      wfslayer = null;

    if (
      this.config.residentListWfsLayer &&
      this.config.residentListWfsLayer.length > 0
    ) {
      wfslayer = this.config.residentListWfsLayer[0];
    } else {
      console.error("KIR WFS layer not configured");
      return;
    }

    if (!hits || hits.length === 0) {
      alert("Inga fastigheter eller adresser valda");
      return;
    }

    var filters = [];
    hits.forEach(
      function (l) {
        l.hits.forEach(
          function (h) {
            filters.push(
              new ol.format.filter.Intersects(
                wfslayer.geometryField,
                h.getGeometry(),
                mapProjection
              )
            );
          }.bind(this)
        );
      }.bind(this)
    );

    var featureRequest = new ol.format.WFS().writeGetFeature({
      srsName: mapProjection,
      featureTypes: wfslayer.layers,
      outputFormat: wfslayer.outputFormat,
      filter:
        filters.length > 1
          ? ol.format.filter.or.apply(null, filters)
          : filters[0],
    });

    this.props.model.set("kirExcelReportIsReady", false);
    this.setState({ fetchingExcel: true, excelUrl: "", errorMessage: null });
    $.ajax({
      url: wfslayer.url,
      method: "POST",
      contentType: "application/xml",
      xhrFields: { withCredentials: true },
      data: new XMLSerializer().serializeToString(featureRequest),
      success: function (response) {
        var features =
          wfslayer.outputFormat === "GML3"
            ? new ol.format.GML().readFeatures(response)
            : new ol.format.GeoJSON().readFeatures(response);

        callback(features);
      }.bind(this),
      error: function (message) {
        this.setState({
          fetchingExcel: false,
          errorMessage: "Kunde inte hämta invånarinformation",
        });

        console.error(message);
      }.bind(this),
    });
  },

  generateExcel: function (features) {
    var _config = this.props.model.get("residentListDataLayer");
    var rows = [];
    var columns = [];

    if (this.state.adjustToReal) {
      columns.push(" ");
    }

    if (this.state.includeSSN) {
      columns.push("Personnummer");
    }

    columns.push(_config.namnDisplayName);

    if (this.state.adjustToReal) {
      columns.push("I egenskap av");
      columns.push("  ");
    }

    columns.push(_config.adressDisplayName);
    columns.push(_config.postnrDisplayName);
    columns.push(_config.postortDisplayName);

    if (this.state.includeAge) {
      columns.push(_config.alderDisplayName);
    }

    if (this.state.includeBirthDate) {
      columns.push(_config.fodelsedatumDisplayName);
    }

    if (this.state.includeGender) {
      columns.push(_config.koenDisplayName);
    }

    features.forEach(
      function (f) {
        var row = [];

        if (this.state.adjustToReal) {
          row.push(" ");
        }

        if (this.state.includeSSN) {
          row.push(this.addDashToSSN(f.get(_config.fodelsedatumFieldName)));
        }

        row.push(f.get(_config.namnFieldName));

        if (this.state.adjustToReal) {
          row.push("Boende");
          row.push("  ");
        }

        row.push(f.get(_config.adressFieldName));
        row.push(f.get(_config.postnrFieldName));
        row.push(f.get(_config.postortFieldName));

        if (
          f.get(_config.alderFieldName) &&
          parseInt(f.get(_config.alderFieldName)) <
            parseInt(document.getElementById("min-age").value)
        ) {
          return;
        }

        if (this.state.includeAge) {
          row.push(f.get(_config.alderFieldName));
        }

        if (this.state.includeBirthDate) {
          row.push(
            this.dateFromPersonalNumber(f.get(_config.fodelsedatumFieldName))
          );
        }

        if (this.state.includeGender) {
          row.push(f.get(_config.koenFieldName));
        }

        rows.push(row);
      }.bind(this)
    );

    $.ajax({
      url: this.config.excelExportUrl,
      method: "POST",
      data: { json: JSON.stringify({ columns: columns, rows: rows }) },
      success: function (response) {
        if (response) {
          this.props.model.set("kirExcelReportIsReady", true);
          this.setState({
            fetchingExcel: false,
            excelUrl: response,
            errorMessage: null,
          });
        }
      }.bind(this),
      error: function () {
        this.setState({
          fetchingExcel: false,
          errorMessage: "Kunde inte skapa Excel-fil",
        });
      }.bind(this),
    });
  },

  addDashToSSN: function (ssn) {
    ssn = "" + ssn;
    var _ssn = ssn.substring(0, ssn.length - 4);
    _ssn += "-" + ssn.substr(ssn.length - 4, 4);
    return _ssn;
  },

  dateFromPersonalNumber: function (personalNumber) {
    return personalNumber.substring(0, personalNumber.length - 4);
  },

  exportToExcel: function () {
    if (this.props.residentData) {
      this.generateExcel(this.props.residentData);
    } else {
      this.getResidentData(
        function (features) {
          this.generateExcel(features);
        }.bind(this)
      );
    }
  },

  render: function () {
    var expandButtonClass =
      "fa clickable arrow pull-right expand-button fa-angle-" +
      (this.state.visible ? "up" : "down");

    return (
      <div className="panel panel-default kir">
        <div className="panel-heading">
          Boendeförteckning
          {this.props.model.get("instructionResidentList") != null ? (
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
            onClick={(e) => {
              this.setState({ visible: !this.state.visible });
            }}
          ></button>
          {this.state.instructionVisible ? (
            <div
              className="panel-body-instruction"
              dangerouslySetInnerHTML={{
                __html: decodeURIComponent(
                  atob(this.props.model.get("instructionResidentList"))
                ),
              }}
            />
          ) : (
            ""
          )}
        </div>

        <div
          className={this.state.visible ? "panel-body" : "panel-body hidden"}
        >
          <fieldset>
            <legend>Inkludera i förteckning:</legend>

            <label htmlFor="min-age">Ange lägsta ålder</label>
            <input
              type="text"
              id="min-age"
              defaultValue={this.state.minAge}
              onChange={(e) => this.setState({ minAge: e.target.value })}
            />
            <br />

            <input
              id="cbx-adjust"
              type="checkbox"
              defaultChecked={this.state.adjustToReal}
              onChange={(e) =>
                this.setState({ adjustToReal: e.target.checked })
              }
            />
            <label htmlFor="cbx-adjust">
              Anpassa till Fastighetsförteckning
            </label>
            <br />
            <input
              id="cbx-ssn"
              type="checkbox"
              defaultChecked={this.state.includeSSN}
              onChange={(e) => this.setState({ includeSSN: e.target.checked })}
            />
            <label htmlFor="cbx-ssn">Personnummer</label>
            <br />

            <input
              type="checkbox"
              id="cbx-age"
              defaultChecked={this.state.includeAge}
              onChange={(e) => this.setState({ includeAge: e.target.checked })}
            />
            <label htmlFor="cbx-age">Ålder</label>
            <br />

            <input
              id="cbx-bd"
              type="checkbox"
              defaultChecked={this.state.includeBirthDate}
              onChange={(e) =>
                this.setState({ includeBirthDate: e.target.checked })
              }
            />
            <label htmlFor="cbx-bd">Födelsedatum</label>
            <br />

            <input
              id="cbx-gender"
              type="checkbox"
              defaultChecked={this.state.includeGender}
              onChange={(e) =>
                this.setState({ includeGender: e.target.checked })
              }
            />
            <label htmlFor="cbx-gender">Kön</label>
          </fieldset>
        </div>

        {this.props.model.get("excelExportUrl") != null ? (
          <button
            className="btn btn-default fir-icon-button"
            onClick={this.exportToExcel}
          >
            <i className="excel" />
            Skapa boendeförteckning
          </button>
        ) : (
          ""
        )}

        {this.state.fetchingExcel ? "Hämtar..." : ""}

        {this.props.model.get("kirExcelReportIsReady") ? (
          <a href={this.state.excelUrl} target="_blank">
            Ladda ner
          </a>
        ) : (
          ""
        )}

        {this.state.errorMessage != null ? (
          <div className="error-message">{this.state.errorMessage}</div>
        ) : (
          ""
        )}
      </div>
    );
  },
};

module.exports = React.createClass(ResidentList);
