/**
 * Created by hiwe001 on 2017-07-04.
 */
/**
 * Created by hiwe001 on 2017-05-24.
 */
var ToolModel = require('tools/tool');

/**
 * @typedef {Object} LocationModel~LocationModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 */
var RoutingModelProperties = {
  type: 'routing',
  panel: 'routingpanel',
  toolbar: 'bottom',
  icon: 'fa fa-level-up icon',
  title: 'Navigation',
  visible: false,
  Id: 'LocationB',
  state: 'choose_start', // will change to choose_end and choose_mode
  apiKey: "AIzaSyCb-bvLmybNb4QSERR43eGlvvQyUrBAQG4",
  onStartKey: undefined,
  onEndKey: undefined,
  onRoutingKey: undefined,
  routingFinished: undefined,
  travelMode: 'walking',
  position: {
    latitude: undefined,
    longitude: undefined,
    latitudeEnd: undefined,
    longitudeEnd: undefined
  }
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {LocationModel~LocationModelProperties} options - Default options
 */
startPoint = undefined;

var RoutingModel = {

  defaults: RoutingModelProperties,
  /**
   * @instance
   * @property {RoutingModel~RoutingModelProperties} defaults - Default settings
   */


  /* Starting Point */
  /* Get a current position from GPS(button right top)*/
  turnOnGPSClicked: function() {
      this.getLocation();
  },

  getLocation: function(){
    if(navigator.geolocation){
      console.log('getCurrentPosition');
      navigator.geolocation.getCurrentPosition(this.setPositionEvent.bind(this));
    }else{
      alert("kan inte få position. Skriv startposition i rutan eller tryck position på kartan.");
    }

  },


  positionError: function(error){
    /* reset this location setting */
    this.set({
      position: {
        latitude: undefined,
        longitude: undefined
      }
    });
  },

  /* Choose a starting location on the map manually. and drop a pin */
  startPointSelection: function(event){
    var startPoint = new ol.Feature(); /* startPoint and point(below) must be the same l.134*/
    startPoint.setGeometry(new ol.geom.Point(event.coordinate));
  /* Convert Geometry to Coordinate */

    //var test = ol.proj.transform(startPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    //console.log(test);
    //var lonlat = startPoint.getGeometry().getCoordinates();
    var lonlat = ol.proj.transform(startPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.get('layer_start').getSource().clear();
    this.get('layer_start').getSource().addFeature(startPoint);
    startPoint.setStyle(style_start);

    var pos = this.get('position');
    pos.latitude = lat;
    pos.longitude = lon;
    this.set('position', pos);

   // this.state.activePanel(true);
   },

  setTravelMode: function(travelmode){
    this.set('travelMode', travelmode);
  },

  endPointSelection: function(event){
    var endPoint = new ol.Feature();
    endPoint.setGeometry(new ol.geom.Point(event.coordinate));

    var lonlat = ol.proj.transform(endPoint.getGeometry().getCoordinates(), 'EPSG:3007', 'EPSG:4326');
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.get('layer_end').getSource().clear();
    this.get('layer_end').getSource().addFeature(endPoint);
    endPoint.setStyle(style_end);

    var pos = this.get('position');
    pos.latitudeEnd = lat;
    pos.longitudeEnd = lon;
    this.set('position', pos);
  },


  activateStartMode: function(){
    this.set('state', 'choose_start');
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onStartKey') === undefined) {
      this.set('onStartKey', this.get('map').on('singleclick', this.startPointSelection.bind(this)));
    }

    if (isMobile()) {
      this.props.navigationPanel.minimize();
    }
  },

  activateEndMode: function(){
    this.set('state', 'choose_end');
    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onEndKey') === undefined) {
      this.set('onEndKey', this.get('map').on('singleclick', this.endPointSelection.bind(this)));
    }
    if(this.get('onEndKey') !== undefined && this.get('routingFinished')) {
      this.set('onEndKey', this.get('map').on('singleclick', this.endPointSelection.bind(this)));
      // TODO modify if and clear route
      this.set('routeFinished', false);
    }

    if (isMobile()) {
      this.props.navigationPanel.minimize();
    }
  },

  activateRoutingMode: function(){
    this.set('state', 'show_route');
    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }

    if(this.get('onRoutingKey') === undefined) {
      //this.set('onRoutingKey', this.get('map').on('singleclick', this.showRoutingInfoPopup.bind(this)));
    }
    this.searchTrip();
  },


  // Executed once when the panel is loaded
  initStartPoint: function() {
    style_start = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: 1.0,
        src: 'assets/icons/startRouting_40.png',
        scale: (1)
      })
    });

    style_end = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: 1.0,
        src: 'assets/icons/malRouting_40.png',
        scale: (1)
      })
    });

    style_route = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: 1.0,
        src: 'assets/icons/markering_A_liten.png',
        scale: (1)
      })
    });

    this.set('style_route_normal', style_route);

    style_route_highlight = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        opacity: 1.0,
        src: 'assets/icons/Markering_A_stor.png',
        scale: (1.5)
      })
    });

    this.set('style_route_highlight', style_route_highlight);

    layer_drawing_style =  new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 255, 0.5)',
        width: 4
      }),
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 0, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 0.5)',
          width: 2
        })
      })});

    var source_start = new ol.source.Vector({});
    var source_end = new ol.source.Vector({});
    var source_route = new ol.source.Vector({});
    var source_drawing = new ol.source.Vector({});

    if (this.get('layer_start') === undefined) {
      this.set("layer_start", new ol.layer.Vector({
        source: source_start,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: style_start
      }));

      this.set("layer_end", new ol.layer.Vector({
        source: source_end,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: style_end
      }));

      this.set("layer_route", new ol.layer.Vector({
        source: source_route,
        name: "routing",
        content: "Punkt",
        queryable: true,
        style: style_route
      }));

      this.set("layer_drawing", new ol.layer.Vector({
        source: source_drawing,
        name: "routing",
        content: "linje",
        queryable: false,
        style: layer_drawing_style
      }));

      this.get('map').addLayer(this.get('layer_start'));
      this.get('map').addLayer(this.get('layer_end'));
      this.get('map').addLayer(this.get('layer_route'));
      this.get('map').addLayer(this.get('layer_drawing'));
    }
  },

  setPositionEvent: function(event){
    console.log('got position');
    var pos = this.get('position');
    pos.latitude = event.coords.latitude;
    pos.longitude = event.coords.longitude;
    this.set('position', pos);
    this.setPosition();
  },

  setPosition: function(){
    console.log('setPosition');
    this.get('layer_start').getSource().clear();
    if (this.get('position').longitude && this.get('position').latitude) {
      var point = new ol.geom.Point([
        this.get('position').longitude,
        this.get('position').latitude
      ]);
      var transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", this.get('map').getView().getProjection());
      point.setCoordinates(transformed);
      var ft = new ol.Feature({geometry: point});
      ft.setStyle(style_start);
      this.get('layer_start').getSource().addFeature(ft);
      this.get('map').getView().setCenter(point.getCoordinates());
    }
  },

  configure: function (shell) {
    this.set('map', shell.getMap().getMap());
  },

  searchTrip: function(){
    this.set({'state': undefined});
    var pos = this.get('position');
    if(pos.latitude === undefined || pos.longitude === undefined ||
  pos.latitudeEnd === undefined || pos.longitudeEnd === undefined){
      alert('Välj start och slut');
    } else {
      ol.Observable.unByKey(this.get('onEndKey'));
      var mode = this.get('travelMode');
      var url = 'https://karta2.varberg.se/maps/api/directions/json?mode=' + mode + '&origin=' + pos.latitude + ',' + pos.longitude + '&destination=' + pos.latitudeEnd + ',' + pos.longitudeEnd +'&key=' + this.get('apiKey');
    var request =$.ajax({
        url: url,
        type: "post",
        contentType: 'text/plain',
        xhrFields: {
          withCredentials: false
        },
        cache: false,
        success: (res) => { this.plotRoute(res, this.get('map'), this.get('layer_route'), this.get('layer_drawing'))},
        error: (err) => {
          alert("Det gick inte att navigera dig. Försök igen senare");
        },
    });
  }
  },

  plotRoute: function(res, map, layer, layer_drawing) {

    var routeResult = "";
    layer.getSource().clear();
    var steps = res.routes[0].legs[0].steps;
    var routeDiv = document.createElement('div');
    var p = document.createElement('p');
    p.innerHTML = '<b>Färdsätt:</b>' + res.routes[0].legs[0].steps[0].travel_mode + '<br>' + '<b>Avstånd:</b> ' + res.routes[0].legs[0].distance.text +'('+res.routes[0].legs[0].distance.value+'m)' + '<br>' + '<b>Tid:</b> ' + res.routes[0].legs[0].duration.text + '<br>' + '<b>Startadress:</b> ' + res.routes[0].legs[0].start_address + '<br>' + '<b>Slutadress:</b> ' + res.routes[0].legs[0].end_address;
    routeDiv.appendChild(p);
    for(var i = 0; i < steps.length; i++){
      var lat = steps[i].start_location.lat;
      var lng = steps[i].start_location.lng;

      var point = new ol.geom.Point([
        lng,
        lat
      ]);
      var transformed = ol.proj.transform(point.getCoordinates(), "EPSG:4326", "EPSG:3007");
      point.setCoordinates(transformed);


      var n = i + 1;
      var tmpFeature = new ol.Feature({geometry: point, information: steps[i].html_instructions});
      tmpFeature.number = "" + n;
      tmpFeature.setStyle(style_route);
      layer.getSource().addFeature(tmpFeature);
      // route features
      var tmpLi = document.createElement('li');
      tmpLi.onclick = this.highlightFeature.bind(this);
      tmpLi.id = 'step_number' + n;
      tmpLi.innerHTML = n + "," + steps[i].html_instructions;
      var tmpI = document.createElement('n');
      tmpI.class = 'fa fa-arrow-down';
      var tmpBr = document.createElement('br');
      routeDiv.appendChild(tmpLi);
      routeDiv.appendChild(tmpI);
      routeDiv.appendChild(tmpBr);
    }


    var resList = document.getElementById('resultList');
    while (resList.firstChild) {
      resList.removeChild(resList.firstChild);
    }

    // put result into the table
    document.getElementById('resultList').appendChild(routeDiv);

    var routePath = new ol.format.Polyline({
    }).readGeometry(res.routes[0].overview_polyline.points);

    routePath = (new ol.format.Polyline({
    }).readGeometry(res.routes[0].overview_polyline.points, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3007'
    }));

    layer_drawing.getSource().clear();
    var ft = new ol.Feature({
      type: 'routing',
      geometry: routePath
    });
    ft.setStyle(layer_drawing_style);

    layer_drawing.getSource().addFeature(ft);
    var centerLat = (this.get('position').latitude + this.get('position').latitudeEnd) / 2;
    var centerLon = (this.get('position').longitude + this.get('position').longitudeEnd) / 2;
    map.getView().setCenter(ol.proj.transform([centerLon, centerLat], 'EPSG:4326', 'EPSG:3007'));
    map.getView().fit(layer_drawing.getSource().getExtent(), map.getSize());

  },

  highlightFeature: function(event){
    var feature_number = -1;
    if (event.target.nodeName === 'B'){
      feature_number = event.target.parentNode.id.substring('step_number'.length);
    } else {
      feature_number = event.target.id.substring('step_number'.length);
    }

    //feature_number = feature_number - 1;
    console.log(feature_number);
    var layer = this.get('layer_route');

    var features = layer.getSource().getFeatures();
    var featuresLength = features.length + 1;

    for (var i= 0; i < features.length ; i++){
      if(features[i].number === feature_number){
        console.log(features[i].number);
        console.log(feature_number);
        features[i].setStyle(this.get('style_route_highlight'));
      } else {
        features[i].setStyle(this.get('style_route_normal'));
      }
    }
  },

  drawRoute: function(steps){

    var routePath = new ol.format.Polyline({
    }).readGeometry(steps);

    var ft = new ol.Feature({type: 'routing', geometry: routePath});
    ft.setStyle(style_route);
    this.get('layer_drawing').getSource().addFeature(ft);


  },

  getOptions: function () {
  },

  deleteLayers: function() {
    this.get('layer_start').getSource().clear();
    this.get('layer_end').getSource().clear();
    this.get('layer_route').getSource().clear();
    this.get('layer_drawing').getSource().clear();

    this.set({
      position:{
        latitude: undefined,
        longitude: undefined,
        latitudeEnd: undefined,
        longitudeEnd: undefined
      }
    });

    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }
  },

  ConvertAddressToCoord: function(){
    /* need to create a box with suggestion */
    /* var searchStringStart = "<wfs:GetFeature\
     service = 'WFS'\
     version = '1.1.0'\
     xmlns:wfs = 'http://www.opengis.net/wfs'\
     xmlns:ogc = 'http://www.opengis.net/ogc'\
     xmlns:gml = 'http://www.opengis.net/gml'\
     xmlns:esri = 'http://www.esri.com'\
     xmlns:xsi = 'http://www.w3.org/2001/XMLSchema-instance'\
     xsi:schemaLocation='http://www.opengis.net/wfs ../wfs/1.1.0/WFS.xsd'\
     outputFormat="GML2"\
     maxFeatures="1000">\
     <wfs:Query typeName='feature:fastighetsytor' srsName='EPSG:3007'>\
     <ogc:Filter>\
     \
     <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">\
     <ogc:PropertyName>text</ogc:PropertyName>\
     <ogc:Literal>";
     var searchStringEnd = "</ogc:Literal>\
     </ogc:PropertyIsLike>\
     </ogc:Filter>\
     </wfs:Query>\
     </wfs:GetFeature>";

     var value = ''; // TODO get value from box
     var forAjax = searchStringStart + value + '*' + searchStringEnd;
     */


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

  onCloseTab: function() {
    this.get('layer_start').getSource().clear();
    this.get('layer_end').getSource().clear();
    this.get('layer_route').getSource().clear();
    this.get('layer_drawing').getSource().clear();

    this.set({
      position:{
        latitude: undefined,
        longitude: undefined,
        latitudeEnd: undefined,
        longitudeEnd: undefined
      }
    });

    if(this.get('onStartKey') !== undefined) {
      ol.Observable.unByKey(this.get('onStartKey'));
      this.set('onStartKey', undefined);
    }
    if(this.get('onRoutingKey') !== undefined) {
      ol.Observable.unByKey(this.get('onRoutingKey'));
      this.set('onRoutingKey', undefined);
    }
    if(this.get('onEndKey') !== undefined) {
      ol.Observable.unByKey(this.get('onEndKey'));
      this.set('onEndKey', undefined);
    }

  },

  clicked: function (arg) {
    this.set('visible', true);
    this.set('toggled', !this.get('toggled'));
  },
};

/**
 * Location model module.<br>
 * Use <code>require('models/information')</code> for instantiation.
 * @module LocationModel-module
 * @returns {LocationModel}
 */
module.exports = ToolModel.extend(RoutingModel);
