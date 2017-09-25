var ToolModel = require('tools/tool');

/**
 * @typedef {Object} CoordinatesModel~CoordinatesModelPropertiesPosition
 * @property {number} x
 * @property {number} y
 */
var position = {
  x: 0,
  y: 0
};

/**
 * @typedef {Object} CoordinatesModel~CoordinatesModelProperties
 * @property {string} type -Default: coordinates
 * @property {string} panel -Default: CoordinatesPanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-crosshairs icon
 * @property {string} title -Default: Visa koordinater
 * @property {boolean} visible - Default: false
 * @property {object} map
 * @property {object} features
 * @property {object} interactionLayer
 * @property {array} interactions
 * @property {CoordinatesModel~CoordinatesModelPropertiesPosition} position
 */
var CoordinatesModelProperties = {
  type: 'coordinates',
  panel: 'CoordinatesPanel',
  toolbar: 'bottom',
  icon: 'fa fa-crosshairs icon',
  title: 'Visa koordinater',
  visible: false,
  map: undefined,
  features: undefined,
  interactionLayer: undefined,
  interactions: [],
  position: {
    x: undefined,
    y: undefined
  }
};

/**
 * Prototype for creating an coordinates model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {CoordinatesModel~CoordinatesModelProperties} options - Default options
 */
var CoordinatesModel = {

  /**
   * @instance
   * @property {CoordinatesModel~CoordinatesModelProperties} defaults - Default settings
   */
  defaults: CoordinatesModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {
    this.set('map', shell.getMap().getMap());
    this.set('interactionLayer', new ol.layer.Vector({
      source: new ol.source.Vector({}),
      name: 'coordinatesToolInteractionLayer'
    }));
    this.get('map').addLayer(this.get('interactionLayer'));
    proj4.defs("EPSG:3021","+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +units=m +no_defs");
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function(arg) {
    this.set('visible', !this.get('visible'));
    this.set('toggled', !this.get('toggled'));
    console.log('visible: ' + this.get('visible') + ' \ttoggled: ' + this.get('toggled'));
  },

  /**
   * Create and add marker interaction to map.
   * @instance
   */
  createInteractions: function () {
    var center = this.get('map').getView().getCenter();
    var source = this.get('interactionLayer').getSource();
    var feature = new ol.Feature({geometry: new ol.geom.Point(center)});
    var iconStyle =
      new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 32],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          opacity: 0.75,
          src: 'assets/icons/crosshairs-64x64.png'
        })
      });
    var selectInteraction =
      new ol.interaction.Select({
        layers: [this.get('interactionLayer')],
      });
    var selectedFeatures = selectInteraction.getFeatures();
    var modifyInteraction =
      new ol.interaction.Modify({
        features: selectedFeatures,
        style: iconStyle,
        pixelTolerance: 32,
      });

    this.get('map').addInteraction(selectInteraction);
    this.get('map').addInteraction(modifyInteraction);
    this.set('interactions', [selectInteraction, modifyInteraction]);
    this.setCoordinates(feature.getGeometry().getCoordinates());

    feature.setStyle(iconStyle);
    var timer = null;
    feature.on('change', event => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {this.updateCoordinates(event)}, 50)
    });

    selectedFeatures.push(feature);
    selectInteraction.on('select', event => {
      if (event.deselected.length > 0) {
        selectedFeatures.push(feature);
      }
    });
  },

  /**
   * Remove the marker interaction from the map.
   * @instance
   */
  removeInteractions: function () {
    var interactions = this.get('interactions');
    var i;

    for (i = 0;i < interactions.length; i++){
      this.get('map').removeInteraction(interactions[i]);
    }

    this.set('interactions', []);
  },

  /**
   * Set position property value
   * @instance
   * @param {array} xy
   */
  setCoordinates: function (xy) {
    this.set('position', {
      x: xy[0],
      y: xy[1]
    });
  },

  /**
   * Update coordinates
   * @instance
   * @param {object} event
   */
  updateCoordinates: function (e) {
    var coordinates = e.target.getGeometry().getCoordinates();
    this.setCoordinates(coordinates);
  },

  /**
   * @desription
   *
   *  Transform coordinates with proj4.
   *  The coordinate system used must be present in proj4.defs.
   *
   * @instance
   * @param {array<{number}>} coordinates
   * @param {string} to
   * @return {array<{number}>} coordinates
   *
   */
  transform: function (coordinates, to) {
    var from = this.get('map').getView().getProjection();
    return ol.proj.transform(coordinates, from, to);
  },

  /**
   * Create a coordinate presentation object with configured out srs.
   * @instance
   * @return {object} coordinatePresentation
   */
  presentCoordinates: function () {
    var presentedCoordinates = {
      raw: this.get('position'),
    };
    var transformedCoordinates = {};
    var transformations = this.get('transformations');
    var coordinates = this.extractXYArray(presentedCoordinates['raw']);

    _.each(transformations, (transformation) => {
      transformedCoordinates[transformation.title] = this.transform(coordinates, transformation.code);
      transformedCoordinates[transformation.title] = this.extractXYObject(transformedCoordinates[transformation.title]);

      transformedCoordinates[transformation.title].xtitle = transformation.xtitle || 'X';
      transformedCoordinates[transformation.title].ytitle = transformation.ytitle || 'Y';
      transformedCoordinates[transformation.title].inverseAxis = transformation.inverseAxis === undefined ? false : transformation.inverseAxis;

      if (transformation.hasOwnProperty('default')) {
        transformedCoordinates[transformation.title].default = transformation.default;
        transformedCoordinates[transformation.title].hint = transformation.hint || "";
      }
    });

    presentedCoordinates['transformed'] = transformedCoordinates;

    return presentedCoordinates;
  },

  /**
   * Convert XY-array to XY-object
   * @instance
   * @param {object} xyObject
   * @return {array} coordinates
   */
  extractXYArray: function (xyObject) {
    return Object.keys(xyObject).map((key, value) => {
      if (key === 'x' || key === 'y') {
        return xyObject[key];
      }
    });
  },

  /**
   * Convert XY-object to XY-array
   * @instance
   * @param {array} coordinates
   * @return {object} xyObject
   */
  extractXYObject: function (xy) {
    var coordinates = {};
    xy.forEach((element, index) => {
      if (index === 0) {
        coordinates['x'] = element;
      } else if (index === 1) {
        coordinates['y'] = element;
      } else {
        throw 'Array index out of bounds while parsing coordinates.'
      }
    });
    return coordinates;
  }

};

/**
 * Coordinates model module.<br>
 * Use <code>require('models/coordinates')</code> for instantiation.
 * @module CoordinatesModel-module
 * @returns {CoordinatesModel}
 */
module.exports = ToolModel.extend(CoordinatesModel);
