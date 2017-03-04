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

var CoordinatesList = React.createClass({

  isPlanar: function(epsgString) {
    return (
      ['WGS 84'].indexOf(epsgString) === -1
    );
  },

  convertDDToDMS: function(D, lng){
    return {
      dir : D < 0 ? lng? 'W' : 'S' :lng ? 'E' : 'N',
      deg : Math.floor((D < 0 ? D =- D : D)),
      min : Math.floor((D * 60) % 60),
      sec : ((D * 3600) % 60).toFixed(5)
    };
  },

  formatDMS: function(dms) {
    return (
      [dms.deg, '°', dms.min, '′', dms.sec, '″', dms.dir].join('')
    )
  },

  getLon: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.xtitle }: </strong> { this.formatDMS(this.convertDDToDMS(xyObject.x, true)) }
      </span>
    )
  },

  getLat: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.ytitle }: </strong> { this.formatDMS(this.convertDDToDMS(xyObject.y, true)) }
      </span>
    )
  },

  getX: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.xtitle }: </strong> { xyObject.x.toFixed(2) } m
      </span>
    )
  },

  getY: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.ytitle }: </strong> { xyObject.y.toFixed(2) } m
      </span>
    )
  },

  processSphericalXY: function(xyObject) {
    return (
      <div>
        <dd>
          {xyObject.inverseAxis ? this.getLat(xyObject) : this.getLon(xyObject)}
        </dd>
        <dd>
          {xyObject.inverseAxis ? this.getLon(xyObject) : this.getLat(xyObject)}
        </dd>
      </div>
    )
  },

  processPlanarXY: function(xyObject) {
    return (
      <div>
        <dd>
          {xyObject.inverseAxis ? this.getX(xyObject) : this.getY(xyObject)}
        </dd>
        <dd>
          {xyObject.inverseAxis ? this.getY(xyObject) : this.getX(xyObject)}
        </dd>
      </div>
    )
  },

  processTitle: function(title, object) {
    if (object.hasOwnProperty('default') && object['default'] === true){
      return (
        <dt>
          <strong style={{fontWeight: 'bold'}}>{title}</strong> {object.hint}
        </dt>
      )
    } else {
      return (
        <dt>{title}</dt>
      )
    }
  },

  processRow: function(object, title) {
    if (this.isPlanar(title)) {
      return (
        [this.processTitle(title, object), this.processPlanarXY(object)]
      )
    } else {
      return (
        [this.processTitle(title, object), this.processSphericalXY(object)]
      )
    }
  },

  render: function() {
    var coordinates = this.props.coordinates;
    return (
      <dl>
        { Object.keys(coordinates).map((key) => this.processRow(coordinates[key], key)) }
      </dl>
    )
  }
});

/**
 * @class
 */
var CoordinatesPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      interactionVisible: true
    };
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:position', this.writeCoordinates);
    this.props.model.removeInteractions();
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.on('change:position', this.writeCoordinates);
    this.setState({
      coordinates: this.props.model.presentCoordinates()
    });
  },

  /**
   * Write coordinates, will trigger set state.
   * @instance
   */
  writeCoordinates: function () {
    this.setState({
      coordinates: this.props.model.presentCoordinates()
    });
  },

  /**
   * Reset the application, will trigger set state.
   * @instance
   */
  reset: function () {
    this.setState({
      interactionVisible: !this.state.interactionVisible
    });
    this.state.interactionVisible ? this.props.model.removeInteractions() :
                                    this.props.model.createInteractions();
  },

  /**
   * Render the view.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var coordinates;
    if (this.props.model.get('interactions').length === 0) {
      this.props.model.createInteractions();
    }
    coordinates = this.state.coordinates ? this.state.coordinates.transformed : {};
    return (
      <Panel title="Koordinater" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
        <div className="coordinate-display">
          <CoordinatesList coordinates={coordinates} />
        </div>
      </Panel>
    );
  }
};

/**
 * CoordinatesPanelView module.<br>
 * Use <code>require('views/coordinatespanel')</code> for instantiation.
 * @module CoordinatesPanelView-module
 * @returns {CoordinatesPanelView}
 */
module.exports = React.createClass(CoordinatesPanelView);
