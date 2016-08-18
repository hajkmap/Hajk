var ToolModel = require('tools/tool');

module.exports = ToolModel.extend({

	defaults: {
		type: 'coordinates',
		panel: 'CoordinatesPanel',
		title: 'Visa koordinater',
		visible: false,
		toolbar: 'bottom',
		map: undefined,
		icon: 'fa fa-crosshairs icon',
		features: undefined,
		interactionLayer: undefined,
		interactions: [],
		position: {
			x: undefined,
			y: undefined
		}
	},

	initialize: function (options) {
		ToolModel.prototype.initialize.call(this);
	},
   /**
	* Anropas när verktyget har kopplats till applikationen.
	* @param  {object} shell applikationens modell.
	*/
	configure: function (shell) {
		this.set('map', shell.getMap().getMap());
		this.set('interactionLayer', new ol.layer.Vector({
			source: new ol.source.Vector({}),
			name: 'coordinatesToolInteractionLayer'
		}));
		this.get('map').addLayer(this.get('interactionLayer'));
		proj4.defs("EPSG:3021","+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +units=m +no_defs");
	},

	clicked: function(arg) {
		this.set('visible', true);
		// if (this.get('interactions').length === 0) {
		// 	this.createInteractions();
		// }
	},
	/**
	 * Skapar markören på kartan och gör den
	 * flyttbar. Skapar även stil för markören.
	 * Om användaren försöker markera något annat
	 * som inte returnerar en feature blir markören
	 * markerad igen. Dvs, det går inte att klicka bort
	 * markören av misstag.
	 *
	 */
	createInteractions: function () {
		var center = this.get('map').getView().getCenter();
		var	source = this.get('interactionLayer').getSource();
		var	feature = new ol.Feature({geometry: new ol.geom.Point(center)});
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
		var	selectInteraction =
			new ol.interaction.Select({
				layers: [this.get('interactionLayer')],
			});
		var	selectedFeatures = selectInteraction.getFeatures();
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
	/*
	 * Tar bort markören från kartan.
	 *
	 */
	removeInteractions: function () {
		var interactions = this.get('interactions');
		var i;

		for (i = 0;i < interactions.length; i++){
			this.get('map').removeInteraction(interactions[i]);
		}

		this.set('interactions', []);
	},

	setCoordinates: function (xy) {
		this.set('position', {
			x: xy[0],
			y: xy[1]
		});
	},

	updateCoordinates: function (e) {
		var coordinates = e.target.getGeometry().getCoordinates();
		this.setCoordinates(coordinates);
	},
	/**
	 * Konverterar från grundprojektionen till vald projektion.
	 * Notera att vald projektion {to} måste vara definierad i
	 * proj4.defs. Se configure() ovan.
	 *
	 * @params: coordinates{Array[x,y]}, to{String('EPSG:4326')}
	 * @returns: {ol.Coordinate}
	 *
	 */
	transform: function (coordinates, to) {
		var from = this.get('map').getView().getProjection();
		return ol.proj.transform(coordinates, from, to);
	},
	/*
	 * Genererar ett objekt med koordinater formatterade
	 * enligt olika projektioner.
	 *
	 * @returns: <object>
	 *
	 */
	presentCoordinates: function () {
		var presentedCoordinates = {
			raw: this.get('position'),
		};
		var transformedCoordinates = {};
		var transformations = [{
			code: 'EPSG:4326',
			title: 'WGS 84'
		},  {
			code: 'EPSG:3007',
			title: 'Sweref 99 12 00'
		},	{
			code: 'EPSG:3006',
			title: 'Sweref 99 TM'
		}, {
			code: 'EPSG:3021',
			title: 'RT 90 2.5 gon V'
		}];
		var coordinates = this.extractXYArray(presentedCoordinates['raw']);

		_.each(transformations, (transformation) => {
			transformedCoordinates[transformation.title] = this.transform(coordinates, transformation.code);
			transformedCoordinates[transformation.title] = this.extractXYObject(transformedCoordinates[transformation.title]);
		});

		presentedCoordinates['transformed'] = transformedCoordinates;

		return presentedCoordinates;
	},

	extractXYArray: function (xyObject) {
		var coordinates = _.map(xyObject,
			(value, key) => {
				if (key === 'x' || key === 'y') {
					return value;
				}
			}
		);
		return coordinates;
	},

	extractXYObject: function (xy) {
		var coordinates = {};
		_.each(xy, (element, index) => {
			if (index === 0) {
				coordinates['x'] = element;
			}
			else if (index === 1) {
				coordinates['y'] = element;
			}
			else {
				throw 'Array index out of bounds while parsing coordinates.'
			}
		});
		return coordinates;
	}
});
