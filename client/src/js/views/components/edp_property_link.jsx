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

var EdpPropertyLink = {

  getInitialState: function () {
    this.config = this.props.model.get("edpPropertyLink");

    return {
      visible: false,
      instructionVisible: false,
      sendingToEDP: false,
      errorMessage: null
    };
  },

  sendProperties: function() {
    var hits = this.props.model.get("items");
    if (!hits || hits.length === 0) {
       alert("Inga fastigheter eller adresser valda");
       return;
    }

    var properties = [],
        fnr = this.props.model.get("edp").fnrFieldName,
        fastbet = this.props.model.get("edp").fastbetFieldName;

    hits.forEach(function(l) {
      l.hits.forEach(function(h) {
        properties.push({ "Fnr": h.get(fnr), "Fastbet": h.get(fastbet) });
      }.bind(this));
    }.bind(this));

    this.setState({ sendingRequest: true, requestReady: false, errorMessage: null, propertiesCount: properties.length });
    $.ajax({
      url: this.props.model.get("edp").url,
      method: 'POST',
      data: { json: JSON.stringify(properties) },
      success: function(response) {
        this.setState({
          sendingRequest: false,
          requestReady: true
        });
      }.bind(this),
      error: function(message) {
        this.setState({
          sendingRequest: false,
          errorMessage: "Kunde inte skicka fastigheter till EDP"
        });

        console.error(message);
      }.bind(this)
    });
  },

  render: function() {
    return (
        <div className='panel panel-default kir'>
            <div className='panel-heading'>EDP Vision
              {
                  this.props.model.get("instructionEDPVision") &&
                  <button className='btn-info-fir' onClick={() => this.setState({ instructionVisible: !this.state.instructionVisible })}>
                    <img src={this.props.model.get("infoKnappLogo")} />
                  </button>
              }

              {
                this.state.instructionVisible &&
                <div className='panel-body-instruction'
                  dangerouslySetInnerHTML={{__html: decodeURIComponent(atob(this.props.model.get("instructionEDPVision")))}} />
              }

            </div>

            {
              this.props.model.get('excelExportUrl') != null &&
              <button className='btn btn-default fir-icon-button' onClick={this.sendProperties}>
                <i className='edp' />Skicka till EDP
              </button>
            }

            {
              this.state.sendingRequest && "Skickar..."
            }

            {
              this.state.requestReady && <span>{this.state.propertiesCount} objekt har skickats</span>
            }

            {
              this.state.errorMessage != null && <div className="error-message">{this.state.errorMessage}</div>
            }
        </div>
    );
  }
};

module.exports = React.createClass(EdpPropertyLink);
