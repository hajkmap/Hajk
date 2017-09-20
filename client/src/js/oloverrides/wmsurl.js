/**
 * Dessa funktioner är överlagrade från openlayers eftersom det finns en bugg i openlayers implementation
 * som ej tar hänsyn till den förändrade ordningen av koordinater för BBOX i wms-lager av version 1.3.0, vilket skapade ett fel i
 * SWEREF-koordinatsystem.
 **/

function getRequestUrl(tileCoord, tileSize, tileExtent, pixelRatio, projection, params) {
	var urls = this.urls;
	if (!urls) {
		return undefined;
	}
	const isV13 = params.VERSION == '1.3.0';
	params['WIDTH'] = tileSize[0];
	params['HEIGHT'] = tileSize[1];

	params[isV13 ? 'CRS' : 'SRS'] = projection.getCode();

	if (!params.hasOwnProperty('STYLES')) {
		params['STYLES'] = '';
	}

	if (pixelRatio != 1) {
		switch (this.get('serverType').toLowerCase()) {
			case 'geoserver':
				var dpi = (90 * pixelRatio + 0.5) | 0;
				if (params.hasOwnProperty('FORMAT_OPTIONS')) {
					params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
				} else {
					params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
				}
				break;
			case 'arcgis':
				params['MAP_RESOLUTION'] = 90 * pixelRatio;
				break;
				// case ol.source.WMSServerType.CARMENTA_SERVER:
				// case ol.source.WMSServerType.QGIS:
				// 	params['DPI'] = 90 * pixelRatio;
				// 	break;
			default:
				// ol.asserts.assert(false, 52); // Unknown `serverType` configured
				break;
		}
	}

	//	var axisOrientation = projection.getAxisOrientation();
	var bbox = tileExtent;
	if (this.v13_ && axisOrientation.substr(0, 2) == 'ne' || isSweref(projection)) {
		var tmp;
		tmp = tileExtent[0];
		bbox[0] = tileExtent[1];
		bbox[1] = tmp;
		tmp = tileExtent[2];
		bbox[2] = tileExtent[3];
		bbox[3] = tmp;
	}
	params['BBOX'] = bbox.join(',');
	var url = urls[0];
	return url + '?' + $.param(params);
}

module.exports = {
	/**
	 * 
	 source: this.layer.getSource(),
      layers: this.queryableLayerNames,
      coordinate: params.coordinate,
      resolution:  params.resolution,
      projection: params.projection,
      params: {
        'INFO_FORMAT': this.get('serverType') === "arcgis" ? 'application/geojson' : 'application/json',
        'feature_count': 100
      } 
	 * 
	 */
	customGetFeatureInformationUrl: function (options) {
		let source = options.source;
		let version = source.getParams().VERSION;
		let projection = ol.proj.get(options.projection);
		let layerNames = options.layers;
		let resolution = options.resolution;
		let coordinate = options.coordinate;
		let params = options.params;		
		if (options.isSingleTile || version != "1.3.0") {
			return source.getGetFeatureInfoUrl(coordinate,
				resolution,
				projection,
				params);
		}

		let tileGrid = source.getTileGrid();
		if (!tileGrid) return undefined;

		// if (!tileGrid) {
		// 	tileGrid = source.getTileGridForProjection(projection);
		// }
		var tileCoord = tileGrid.getTileCoordForCoordAndResolution(
			coordinate, resolution);

		if (tileGrid.getResolutions().length <= tileCoord[0]) {
			return undefined;
		}
		var tileResolution = tileGrid.getResolution(tileCoord[0]);
		var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);
		var tileSize = ol.size.toSize(
			tileGrid.getTileSize(tileCoord[0]), this.tmpSize);
		let x = Math.floor((coordinate[0] - tileExtent[0]) / tileResolution);
		let y = Math.floor((tileExtent[3] - coordinate[1]) / tileResolution)

		let baseParams = {
			'SERVICE': 'WMS',
			'VERSION': version,
			'REQUEST': 'GetFeatureInfo',
			'FORMAT': 'image/png',
			'TRANSPARENT': true,
			'LAYERS': layerNames,
			'QUERY_LAYERS': layerNames
		};
		Object.assign(baseParams, params);

		baseParams[version == "1.3.0" ? 'I' : 'X'] = x;
		baseParams[version == "1.3.0" ? 'J' : 'Y'] = y;

		// //No gutter support
		return getRequestUrl.call(source, tileCoord, tileSize, tileExtent,
			1, projection, baseParams);


	},

	customGetTileUrl: function (tileCoord, pixelRatio, projection) {
		let tileGrid = this.getTileGrid();
		if (!tileGrid) {
			tileGrid = this.getTileGridForProjection(projection);
		}

		if (tileGrid.getResolutions().length <= tileCoord[0]) {
			return undefined;
		}

		if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
			pixelRatio = 1;
		}

		let tileResolution = tileGrid.getResolution(tileCoord[0]);
		let tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);
		let tileSize = ol.size.toSize(
			tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

		let gutter = this.gutter_ || 0; //Vi stödjer ej gutter just nu
		if (gutter !== 0) {
			tileSize = ol.size.buffer(tileSize, gutter, this.tmpSize);
			tileExtent = ol.extent.buffer(tileExtent,
				tileResolution * gutter, tileExtent);
		}

		if (pixelRatio != 1) {
			tileSize = ol.size.scale(tileSize, pixelRatio, this.tmpSize);
		}

		let baseParams = Object.assign({
			'SERVICE': 'WMS',
			'VERSION': '1.1.0',
			'REQUEST': 'GetMap',
			'FORMAT': 'image/png',
			'TRANSPARENT': true
		}, this.getParams());

		//{ SRS: undefined, CRS: undefined}
		if (baseParams.hasOwnProperty("SRS"))
			delete baseParams.SRS;

		if (baseParams.hasOwnProperty("CRS"))
			delete baseParams.CRS;

		return getRequestUrl.call(this, tileCoord, tileSize, tileExtent,
			pixelRatio, projection, baseParams);
	}
};

const isSweref = (projection) => {
	let code = projection.getCode().split(':');
	code = parseInt(code[code.length - 1]);
	let isSweref = isNaN(code) ? false : code >= 3006 && code <= 3018;
	return isSweref;
};