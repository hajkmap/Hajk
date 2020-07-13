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

var Panel = require('views/panel');

var CoordinatesList = React.createClass({

  isPlanar: function (epsgString) {
    return (
      ['WGS 84'].indexOf(epsgString) === -1
    );
  },

  convertDDToDMS: function (D, lng) {
    return {
      dir: D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
      deg: Math.floor((D < 0 ? D = -D : D)),
      min: Math.floor((D * 60) % 60),
      sec: ((D * 3600) % 60).toFixed(this.props.model.get('formattedNumbers') ? 1 : 5)
    };
  },

  formatDMS: function (dms) {
    return (
      [dms.deg, '°', dms.min, '′', dms.sec, '″', dms.dir].join('')
    );
  },

  getLon: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.xtitle }: </strong> { this.formatDMS(this.convertDDToDMS(xyObject.x, true)) }
      </span>
    );
  },

  getLat: function (xyObject) {
    return (
      <span>
        <strong>{ xyObject.ytitle }: </strong> { this.formatDMS(this.convertDDToDMS(xyObject.y, false)) }
      </span>
    );
  },

  getX: function (xyObject) {
    var numberOfgetX = Math.floor(xyObject.x);
    valOfgetX = numberOfgetX.toString().match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g);

    if(this.props.model.get('formattedNumbers')){
      return (
          <span>
        <strong>{ xyObject.xtitle }: </strong>  {valOfgetX[0] + " " + valOfgetX[1]}
      </span>
      );
    }else{
      return (
          <span>
        <strong>{ xyObject.xtitle }: </strong> { xyObject.x.toFixed(2) } m
      </span>
      );
    }
  },

  getY: function (xyObject) {
    var numberOfgetY = Math.floor(xyObject.y);
    valOfgetY = numberOfgetY.toString().match(/(\d+?)(?=(\d{3})+(?!\d)|$)/g);

    if(this.props.model.get('formattedNumbers')){
      return (
          <span>
        <strong>{ xyObject.ytitle }: </strong> {valOfgetY[0] + " " + valOfgetY[1] + " " +valOfgetY[2]}
      </span>
      );
    }else{
      return (
          <span>
        <strong>{ xyObject.ytitle }: </strong> { xyObject.y.toFixed(2) } m
      </span>
      );
    }
  },

  processSphericalXY: function (xyObject) {
    return (
      <div>
        <dd>
          {xyObject.inverseAxis ? this.getLat(xyObject) : this.getLon(xyObject)}
        </dd>
        <dd>
          {xyObject.inverseAxis ? this.getLon(xyObject) : this.getLat(xyObject)}
        </dd>
      </div>
    );
  },

  processPlanarXY: function (xyObject) {
    return (
      <div>
        <dd>
          {xyObject.inverseAxis ? this.getX(xyObject) : this.getY(xyObject)}
        </dd>
        <dd>
          {xyObject.inverseAxis ? this.getY(xyObject) : this.getX(xyObject)}
        </dd>
      </div>
    );
  },

  processTitle: function (title, object) {
    if (object.hasOwnProperty('default') && object['default'] === true) {
      return (
        <dt>
          <strong style={{fontWeight: 'bold'}}>{title}</strong> {object.hint}
        </dt>
      );
    } else {
      return (
        <dt>{title}</dt>
      );
    }
  },

  processRow: function (object, title) {
    if (this.isPlanar(title)) {
      return (
        [this.processTitle(title, object), this.processPlanarXY(object)]
      );
    } else {
      return (
        [this.processTitle(title, object), this.processSphericalXY(object)]
      );
    }
  },

  render: function () {
    var coordinates = this.props.coordinates;
    return (
      <dl>
        { Object.keys(coordinates).map((key) => this.processRow(coordinates[key], key)) }
      </dl>
    );
  }
});

//Sök på Coordinate
var SearchOnCoordinates = React.createClass({

  addInput: function(item){
    return (
        <option key={item.code} value={item.code}>{item.title}</option>
    );
  },

  getInitialState:function() {
    return {
      selectValue: this.props.model.get("transformations")[0].code
    };
  },

  updateSelect: function(event){
    this.state.selectValue = event.target.value;
    this.props.model.moveFeature(event)
    this.forceUpdate();
  },


  render: function () {

    return(
      <div>
        <p>Välj en plats i kartan genom att ange koordinater. </p>
        <dl>
          <dt>
            Söka på koordinater
          </dt>
          <dd>
            <h4>Välj koordinatsystem:&nbsp;&nbsp;
            <select id="coordSystem-coord-tool" value={this.state.selectValue} onChange={(event) => this.updateSelect(event)}>
              {this.props.model.get("transformations").map((item) => this.addInput(item))}
            </select></h4>
            <div>
              Ange platsens koordinater <br/>
              N/Long: <input type='text' id='latSOC'  /> &nbsp;&nbsp;&nbsp;
              E/Lat: <input type='text' id='lonSOC'  /><br/>
            </div><br/>
            <div className='pull-right'>
              <button onClick={(event) => this.props.model.zoomaCoords(event)} className='btn btn-primary' id='zoomaCoords'>Zooma</button>&nbsp;
              <button onClick={(event) => this.props.model.panoreraCoords(event)} className='btn btn-primary' id='panoreraCoords'>Panorera</button>&nbsp;
              <button onClick={(event) => this.props.model.laddaCoords(event)} className='btn btn-primary' id='laddaCoords'>Koordinater</button>&nbsp;
              <button onClick={(event) => this.props.model.resetCoords(event)} className='btn btn-primary' id='restCoords'>Rensa</button>
            </div><br/><br/>
          </dd>
        </dl>
      </div>
    );

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
  getInitialState: function () {
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
    var positionN = this.props.model.get("position").y;
    var positionE = this.props.model.get("position").x;
    document.getElementById('latSOC').value == positionN;
    document.getElementById('lonSOC').value == positionE;
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
    this.state.interactionVisible ? this.props.model.removeInteractions()
      : this.props.model.createInteractions();
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

    var searchOnCoordinates = this.props.model.get('searchOnCoordinates')
        ? <SearchOnCoordinates model={this.props.model}/>
        : "";

    return (
      <Panel title='Koordinater' onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
        <div className='coordinate-display'>
          <p>
            Välj en plats i kartan genom att flytta på siktet. <br />
          </p>
          <CoordinatesList coordinates={coordinates} model={this.props.model} />
          {searchOnCoordinates}
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
