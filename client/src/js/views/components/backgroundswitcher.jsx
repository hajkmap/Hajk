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

var InfoButton = require('components/infobutton');

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
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.backgroundSwitcherModeChanged();
    this.props.model.on('change:backgroundSwitcherMode', () => {
      this.backgroundSwitcherModeChanged();
    });
    this.props.model.on('change:showInfo', this.onShowInfoChanged, this);
    this.setState({
      selected: this.props.model.get('background'),
      showInfo: this.props.model.get('showInfo')
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:backgroundSwitcherMode');
    this.props.model.off('change:showInfo', this.onShowInfoChanged, this);
  },

  /**
   * Event handler for background switcher mode changes
   * @instance
   */
  backgroundSwitcherModeChanged: function () {
    var mode = this.props.model.get('backgroundSwitcherMode'),
      cls = (this.props.model.get('backgroundSwitcherMode') === 'hidden') ? 'fa fa-angle-right arrow' : 'fa fa-angle-up arrow'
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
      'selected': 'black'
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
      'selected': 'white'
    });
    this.props.model.set('background', 'white');
  },

  /**
   * Hide current background layer
   * @instance
   */
  clear: function () {
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
      'selected': layer.id
    });
    this.props.model.set('background', layer.id);
  },

  /**
   * Set visibility of background layer
   * @instance
   */
  setVisibility: function () {
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
    } else {
      return this.props.layers.filter(l =>
        l.getVisible() && l.id === layer.id
      ).length === 1;
    }
  },

  /**
   * On show info change event handler.
   * @instance
   */
  onShowInfoChanged: function () {
    this.setState({ showInfo: this.props.model.get('showInfo') });
  },

  /**
   * Toggle info visibility
   * @instance
   */
  toggleInfo: function (e, index) {
    e.stopPropagation();
    this.state.showInfo != index ? this.props.model.set('showInfo', index) : this.props.model.set('showInfo', undefined);
  },

  /**
   * Render the layers component.
   * @instance
   * @return {external:ReactElement}
   */
  renderLayers: function () {
    return (
      this.props.layers.map((layer, i) => {
        var index = 'background-layer-' + i,
          checked = this.getSelected(layer),
          infoIndex = i,
          infoExpanded = this.state.showInfo,
          infoVisible = layer.get('infoVisible');
        if(this.props.model.get("infoHtml")){
          return (
              <li key={index}>
                <input id={index} name='background' type='radio' checked={checked} onChange={(e) => this.setBackgroundLayer(layer)} />
                <label htmlFor={index}>{layer.get('caption')}</label>

                <span className={infoVisible ? 'visible' : 'hidden'} onClick={(e) => this.toggleInfo(e, i)}>
              <InfoButton key={index} index={index} />
            </span>

                <div className={infoExpanded === infoIndex ? 'dropdown' : 'hidden'}>
                  <p className="info-title" dangerouslySetInnerHTML={{__html: layer.get('infoTitle')}}></p>
                  <p className="info-text" dangerouslySetInnerHTML={{__html: layer.get('infoText')}}></p>
                  <p className="info-text" dangerouslySetInnerHTML={{__html: layer.get('infoUrl')}}></p>
                  <p className="info-text" dangerouslySetInnerHTML={{__html: layer.get('infoOwner')}}></p>
                </div>
              </li>
          );
        }else {
          return (
              <li key={index}>
                <input id={index} name='background' type='radio' checked={checked}
                       onChange={(e) => this.setBackgroundLayer(layer)}/>
                <label htmlFor={index}>{layer.get('caption')}</label>

                <span className={infoVisible ? 'visible' : 'hidden'} onClick={(e) => this.toggleInfo(e, i)}>
              <InfoButton key={index} index={index}/>
            </span>

                <div className={infoExpanded === infoIndex ? 'dropdown' : 'hidden'}>
                  <p className='info-title'>{layer.get('infoTitle')}</p>
                  <p className='info-text'>{layer.get('infoText')}</p>
                  <a className='info-text' href={layer.get('infoUrl')} target='_blank'>{layer.get('infoUrl')}</a><br/>
                  <i className='info-text'>{layer.get('infoOwner') ? 'Ägare: ' + layer.get('infoOwner') : ''}</i>
                </div>
              </li>
          );
        }
      })
    );
  },

  /**
   * Render an extra/special layer to the background switcher
   * Possible values are "black" and "white".
   * @instance
   * @return {external:ReactElement}
   */
  renderExtraLayer: function (mode) {
    var shouldRender = true,
      changeMethod = () => {},
      caption = '',
      checked = false
    ;

    if (mode === 'black') {
      shouldRender = this.props.model.get('backgroundSwitcherBlack');
      changeMethod = this.setBlackBackground;
      caption = 'Svart bakgrund';
      checked = this.state.selected === 'black';
    }

    if (mode === 'white') {
      shouldRender = this.props.model.get('backgroundSwitcherWhite');
      changeMethod = this.setWhiteBackground;
      caption = 'Vit bakgrund';
      checked = this.state.selected === 'white';
    }

    if (shouldRender) {
      let id = Math.round(Math.random() * 1E8);
      return (
        <li key={id}>
          <input id={id} name='background' type='radio' checked={checked} onChange={() => changeMethod.call(this)} />
          <label htmlFor={id}>{caption}</label>
        </li>
      );
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
      <div className='background-switcher'>
        <h3 onClick={this.setVisibility} ><span className={this.state.displayModeClass} />&nbsp;Bakgrundskartor</h3>
        <ul className={this.state.displayMode}>
          {this.renderLayers()}
          {this.renderExtraLayer('black')}
          {this.renderExtraLayer('white')}
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
