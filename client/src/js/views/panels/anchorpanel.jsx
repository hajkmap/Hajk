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
/**
 * @class
 */
var AnchorPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      anchor: ""
    };
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function () {
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.generate();
  },

  /**
   * Generete anchor text.
   * @instance
   */
  generate: function () {
    this.setState({
      anchor: this.props.model.generate()
    });
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var anchor = this.props.model.get('anchor');
    return (
      <Panel title="Länk till karta" onUnmountClicked={this.props.onUnmountClicked} onCloseClicked={this.props.onCloseClicked}>
        <div className="panel-content">
          <button onClick={this.generate} className="btn btn-default">Uppdatera länk</button>
          <p>
            En direktlänk har genererats som visar aktuell utbretning, zoomnivå och tända/släckta lager.<br/>
            Tryck på länken nedan för att öppna kartan i ny flik för exempelvis bokmärkning.<br/>
            Högerklika på länken och välj kopiera genväg för att spara länken i urklipp för inklistring i ett e-mail exempelvis.<br/>
          </p>
          <div className="alert alert-success">
            <a target="_blank" href={anchor}>Länk</a>
          </div>
        </div>
      </Panel>
    );
  }
};

/**
 * AnchorPanelView module.<br>
 * Use <code>require('views/anchorpanel')</code> for instantiation.
 * @module AnchorPanelView-module
 * @returns {AnchorPanelView}
 */
module.exports = React.createClass(AnchorPanelView);
