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
var InformationView = {

  componentDidMount: function() {
    this.props.model.on('change:visible', () => {
      this.setState({
        visible: this.props.model.get('visible')
      })
    });
    this.setState({
      visible: this.props.model.get('visible')
    });
  },

  componentWillUnMount: function() {
    this.props.model.off('change:visible');
  },

  /**
   * Close the infomraiton box
   * @instance
   * @return {external:ReactElement}
   */
  close: function () {
    this.props.model.set('visible', false);
  },

  /**
   * Render the legend item component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    if (this.state && this.state.visible) {
      return (
        <div id="blanket">
          <div id="container">
            <div key="a" id="header">{this.props.model.get('headerText')}
              <i className="fa fa-times pull-right clickable panel-close" id="close" onClick={this.close}></i>
            </div>
            <div id="body-wrapper">
              <div key="b" id="body" dangerouslySetInnerHTML={{__html: this.props.model.get('text')}}></div>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
};

/**
 * LegendView module.<br>
 * Use <code>require('views/legend')</code> for instantiation.
 * @module LegendView-module
 * @returns {InformationView}
 */
module.exports = React.createClass(InformationView);
