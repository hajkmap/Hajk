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
var BackgroundSwitcherView = {

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      displayMode: 'hidden',
      displayModeClass: 'fa fa-angle-right arrow'
    }
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.backgroundSwitcherModeChanged();
    this.props.model.on('change:backgroundSwitcherMode', () => {
      this.backgroundSwitcherModeChanged()
    });
    this.setState({
      selected: this.props.model.get('background')
    })
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:backgroundSwitcherMode');
  },

  /**
   * Event handler for background switcher mode changes
   * @instance
   */
  backgroundSwitcherModeChanged: function () {
    var mode = this.props.model.get('backgroundSwitcherMode')
    ,   cls  = (this.props.model.get('backgroundSwitcherMode') === 'hidden') ? 'fa fa-angle-right arrow' : 'fa fa-angle-down arrow'
    ;
    this.setState({
      displayMode: mode,
      displayModeClass: cls
    });
  },

  /**
   * Set black background
   * @instance
   */
  setBlackBackground: function () {
    this.clear();
    $('#map').css({background: 'black'});
    this.setState({
      "selected" : 'black'
    });
    this.props.model.set('background', 'black');
  },

  /**
   * Set white background
   * @instance
   */
  setWhiteBackground: function () {
    this.clear();
    $('#map').css({background: 'white'});
    this.setState({
      "selected" : 'white'
    });
    this.props.model.set('background', 'white');
  },

  /**
   * Hide current background layer
   * @instance
   */
  clear: function() {
    this.props.layers.forEach(baselayer => {
      baselayer.setVisible(false);
      baselayer.getLayer().setVisible(false);
    });
  },

  /**
   * Set background layer
   * @instance
   * @param {Layer} layer
   */
  setBackgroundLayer: function (layer) {
    $('#map').css({background: 'white'});
    this.props.layers.forEach(baselayer => {
      var visible = baselayer.id === layer.id;
      baselayer.setVisible(visible);
      baselayer.getLayer().setVisible(visible);
    });
    this.setState({
      "selected" : layer.id
    })
    this.props.model.set('background', layer.id);
  },

  /**
   * Set visibility of background layer
   * @instance
   */
  setVisibility: function() {
    this.props.model.set('backgroundSwitcherMode',
      this.props.model.get('backgroundSwitcherMode') === 'hidden' ? '' : 'hidden'
    );
  },

  /**
   * Check if given layer is the selected layer
   * @instance
   * @param {Layer} layer
   */
  getSelected: function (layer) {
    if (this.state && this.state.selected) {
      if (this.state.selected === layer.get('id')) {
        return true;
      }
    }
    return this.props.layers.filter(l =>
      l.getVisible() && l.id === layer.id
    ).length === 1;
  },

  /**
   * Render the layers component.
   * @instance
   * @return {external:ReactElement}
   */
  renderLayers: function () {
    return (
      this.props.layers.map((layer, i) => {
        var index = "background-layer-" + i
        ,   checked = this.getSelected(layer);
        return (
          <li key={index}>
            <input id={index} name="background" type="radio" checked={checked} onChange={(e) => this.setBackgroundLayer(layer) }></input>
            <label htmlFor={index}>{layer.get('caption')}</label>
          </li>
        );
      })
    )
  },

  /**
   * Render an extra/special layer to the background switcher
   * Possible values are "black" and "white".
   * @instance
   * @return {external:ReactElement}
   */
  renderExtraLayer: function(mode) {
    var shouldRender = true
    ,   changeMethod = () => {}
    ,   caption = ""
    ,   checked = false
    ;

    if (mode === 'black') {
      shouldRender = this.props.model.get("backgroundSwitcherBlack");
      changeMethod = this.setBlackBackground;
      caption = "Svart bakgrund";
      checked = this.state.selected === "black";
    }

    if (mode === 'white') {
      shouldRender = this.props.model.get("backgroundSwitcherWhite");
      changeMethod = this.setWhiteBackground;
      caption = "Vit bakgrund";
      checked = this.state.selected === "white";
    }

    if (shouldRender) {
      let id = Math.round(Math.random() * 1E8);
      return (
        <li key={id}>
          <input id={id} name="background" type="radio" checked={checked} onChange={() => changeMethod.call(this) }></input>
          <label htmlFor={id}>{caption}</label>
        </li>
      )
    }
    return null;
  },

  /**
   * Render the background switcher component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <div className="background-switcher">
        <h3 onClick={this.setVisibility} ><span className={this.state.displayModeClass}></span>&nbsp;Bakgrundskartor</h3>
        <ul className={this.state.displayMode}>
          {this.renderLayers()}
          {this.renderExtraLayer("black")}
          {this.renderExtraLayer("white")}
        </ul>
      </div>
    );
  }
};

/**
 * BackgroundSwitcherView module.<br>
 * Use <code>require('views/backgroundswitcher')</code> for instantiation.
 * @module BackgroundSwitcherView-module
 * @returns {BackgroundSwitcherView}
 */
module.exports = React.createClass(BackgroundSwitcherView);