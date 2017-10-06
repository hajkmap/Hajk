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

/**
 * @class
 */
var LayerItemView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      caption: "",
      visible: false,
      expanded: false,
      name: "",
      legend: [],
      status: "ok",
      infoVisible: false,
      infoTitle: "",
      infoText: "",
      infoUrl: "",
      infoOwner: "",
      infoExpanded: false
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.layer.on("change:status", this.onStatusChanged, this);
    this.props.layer.on("change:visible", this.onVisibleChanged, this);
    this.props.layer.on("change:legend", this.onLegendChanged, this);
    this.props.layer.on('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.on('change:showInfo', this.onShowInfoChanged, this);
    this.setState({
      status: this.props.layer.get('status'),
      caption: this.props.layer.getCaption(),
      visible: this.props.layer.getVisible(),
      showLegend: this.props.layer.get('showLegend'),
      legend: this.props.layer.getLegend(),
      infoVisible: this.props.layer.getInfoVisible(),
      infoTitle: this.props.layer.getInfoTitle(),
      infoText: this.props.layer.getInfoText(),
      infoUrl: this.props.layer.getInfoUrl(),
      infoOwner: this.props.layer.getInfoOwner(),
      showInfo: this.props.layer.get('showInfo')
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.layer.off("change:visible", this.onVisibleChanged, this);
    this.props.layer.off("change:legend", this.onLegendChanged, this);
    this.props.layer.off('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.off("change:status", this.onStatusChanged, this);
    this.props.layer.off('change:showInfo', this.onShowInfoChanged, this);
  },

  /**
   * On status change event handler.
   * @instance
   */
  onStatusChanged: function () {
    this.setState({
      status: this.props.layer.get('status')
    });
  },

  /**
   * On visible change event handler.
   * @instance
   */
  onVisibleChanged: function () {
    if (this.props.layer) {
      this.props.layer.getLayer().setVisible(this.props.layer.getVisible());
    }
    this.setState({
      visible: this.props.layer.getVisible()
    });
  },

  /**
   * On legend change event handler.
   * @instance
   */
  onLegendChanged: function () {
    this.setState({ legend: this.props.layer.getLegend() });
  },

  /**
   * On show legend change event handler.
   * @instance
   */
  onShowLegendChanged: function () {
    this.setState({ showLegend: this.props.layer.get('showLegend') });
  },

  /**
   * On show info change event handler.
   * @instance
   */
  onShowInfoChanged: function () {
    this.setState({ showInfo: this.props.layer.get('showInfo') });
  },

  /**
   * Toggle visibility of this layer item.
   * @instance
   */
  toggleVisible: function (e) {
    e.stopPropagation();
    this.props.layer.setVisible(!this.state.visible);
  },

  /**
   * Toggle legend visibility
   * @instance
   */
  toggleLegend: function (e) {
    e.stopPropagation();
    this.props.layer.set('showLegend', !this.state.showLegend);
  },

  /**
   * Toggle info visibility
   * @instance
   */
  toggleInfo: function (e) {
    e.stopPropagation();
    this.props.layer.set('showInfo', !this.state.showInfo);
  },

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus: function () {
    return this.state.status === "loaderror" ?
    (
      <span href="#" className="tooltip" title="Lagret kunde inte laddas in. Kartservern svarar inte.">
        <span title="" className="fa fa-exclamation-triangle tile-load-warning"></span>
      </span>
    ) : null;
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var caption       = this.state.caption
    ,   expanded      = this.state.showLegend
    ,   visible       = this.state.visible
    ,   toggleLegend  = (e) => { this.toggleLegend(e) }
    ,   toggleVisible = (e) => { this.toggleVisible(e) }
    ,   toggleInfo  = (e) => { this.toggleInfo(e) }
    ,   infoVisible   = this.state.infoVisible
    ,   infoTitle     = this.state.infoTitle
    ,   infoText      = this.state.infoText
    ,   infoUrl       = this.state.infoUrl
    ,   infoOwner     = this.state.infoOwner
    ,   infoExpanded  = this.state.showInfo;

    if (!caption) {
      return null;
    }

    var components = this.props.layer.getExtendedComponents({
      legendExpanded: expanded
    });

    var innerBodyClass = expanded && components.legend.legendPanel ? "panel-body" : "hidden";

    var statusClass = this.state.status === "loaderror" ? "fa fa-exclamation-triangle tile-load-warning tooltip" : "";

    var componentsInfo = this.props.layer.getExtendedComponents({
      infoExpanded: infoExpanded
    });

    var innerInfoBodyClass = infoExpanded && componentsInfo.legend.legendPanel ? "dropdown" : "hidden";
    
    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading unselectable" onClick={toggleLegend}>
          <span onClick={toggleVisible} className="clickable" style={{ position: 'relative', top: '3px' }}>
            <i className={visible ? 'fa fa-check-square-o': 'fa fa-square-o'} style={{ width: '15px'}}></i>&nbsp;
            {this.renderStatus()}
            <label className={visible ? 'layer-item-header-text active-group' : 'layer-item-header-text'}>{caption}</label>&nbsp;
          </span>
          {components.legend.legendButton}

          <span onClick={this.state.infoVisible ? toggleInfo : ""}>
            {this.state.infoVisible ? components.legend.infoButton : ""}
          </span>

        </div>
        <div className={innerInfoBodyClass}>
          <p className="info-title">{this.state.infoTitle}</p>
          <p className="info-text">{this.state.infoText}</p>
          <a className="info-text" href={this.state.infoUrl} target="_blank">{this.state.infoUrl}</a><br/>
          <i className="info-text">{this.state.infoOwner ? "Ägare: " + this.state.infoOwner : ""}</i>
        </div>

        <div className={innerBodyClass}>
          {components.legend.legendPanel}
        </div>
      </div>
    );
  }
};

/**
 * LayerItemView module.<br>
 * Use <code>require('views/layeritem')</code> for instantiation.
 * @module LayerItemView-module
 * @returns {LayerItemView}
 */
module.exports = React.createClass(LayerItemView);