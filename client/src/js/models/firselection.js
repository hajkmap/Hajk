var HighlightLayer = require('layers/highlightlayer');

/**
 * @typedef {Object} firSelectionModel~firSelectionModelProperties
 * @property {string} type -Default: anchor
 * @property {string} panel -Default: anchorpanel
 * @property {string} toolbar -Default: bottom
 * @property {string} icon -Default: fa fa-link icon fa-flip-horizontal
 * @property {string} title -Default: Länk
 * @property {boolean} visible - Default: false
 * @property {ShellModel} shell
 * @property {string} anchor - Default: ''
 */
var FirSelectionModelProperties = {
    activeTool: '',
    markerImg: 'assets/icons/marker.png',
    anchor: [
        8,
        8
    ],
    imgSize: [
        16,
        16
    ],
    kmlImportUrl: "/mapservice/import/kml"
};

/**
 * @description
 *
 *  Prototype for creating an anchor model.
 *
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {firSelectionModel~firSelectionModelProperties} options - Default options
 */
var FirSelectionModel = {
    /**
     * @instance
     * @property {firSelectionModel~firSelectionModelProperties} defaults - Default settings
     */
    defaults: FirSelectionModelProperties,

    features: {},

    isDrawActive: false,

    initialize: function (options) {
        this.set('olMap', options.map);
        this.set('layerCollection', options.layerCollection);
        this.set('source', new ol.source.Vector({ wrapX: false }));

        this.set('drawLayer', new ol.layer.Vector({
            source: this.get('source'),
            queryable: false,
            name: 'search-selection-layer',
            caption: 'search-selection-layer',
            style: (feature) => this.getScetchStyle(feature)
        }));

        this.set('highlightLayer', new HighlightLayer({
            id: 'selection-highligt',
            anchor: this.get('anchor'),
            imgSize: this.get('imgSize'),
            markerImg: this.get('markerImg'),
            style: this.getScetchStyle()
        }));

        // firBufferLayer: layer for sökningsbuffer
        this.set("firBufferLayer", new ol.layer.Vector({
            caption: 'bufferSearching',
            name: 'fir-searching-buffer-layer',
            source: new ol.source.Vector(),
            queryable: false,
            visible: true,
            style: this.getFirBufferStyle()
        }));

        this.get("firBufferLayer").getSource().on('addfeature', evt => {
            evt.feature.setStyle(this.get("firBufferLayer").getStyle());
        });

        this.get('map').addLayer(this.get("firBufferLayer"));
        this.get('olMap').addLayer(this.get('drawLayer'));
        this.get('olMap').addLayer(this.get('highlightLayer').layer);

        this.set('polygonSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Polygon',
            geometryName: "Polygon",
            condition : function(e){ // this will ensure that it is possible to click out drawings even with ctrl pressed
                return true;
            }
        }));

        this.get('polygonSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('squareSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Circle',
            geometryName: "Box",
            geometryFunction: ol.interaction.Draw.createBox(),
            condition : function(e){ // this will ensure that it is possible to click out drawings even with ctrl pressed
                return true;
            }
        }));

        this.get('squareSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('lineSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'LineString',
            geometryName: "LineString",
            condition : function(e){ // this will ensure that it is possible to click out drawings even with ctrl pressed
                return true;
            }
        }));

        this.get('lineSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('pointSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Point',
            geometryName: "Point",
            condition : function(e){ // this will ensure that it is possible to click out drawings even with ctrl pressed
                return true;
            }
        }));

        this.get('pointSelection').on("drawend", this.deactiveTool.bind(this));
    },

    deactiveTool: function(event){
        if(!ctrlIsDown) {
            setTimeout(a => {
                this.setActiveTool(undefined);
                if(!$('#slackaBufferSokomrade').is(":checked")) {
                    $('#slackaBufferSokomrade').click();
                }
            }, 50);
        }
    },

    //firBufferStyle in searchingbox
    getFirBufferStyle: function () {
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(77, 210, 255, 0.7)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(153, 153, 153, 0.8)',
                width: 4
            })
        });
    } ,

    isQueryable: function (layer) {
        return (
            (
                layer.get('type') === 'wms' ||
                layer.get('type') === 'arcgis'
            ) &&
            layer.get('queryable') &&
            layer.getVisible()
        );
    },

    clearSelection: function () {
        this.get('source').clear();
        this.get('highlightLayer').clearHighlight();
        this.features = {};
    },

    clear: function () {
        this.features = {};
    },

    putHighlightLayerOnTop: function () {
        let layers = this.get('olMap').getLayers();
        const topIndex = layers.getLength() - 1;
        var h = layers.getArray().find(layer => layer.get('id') === 'selection-highligt');
        if (h) {
            layers.remove(h);
            layers.push(h);
        }
    },

    addFeature: function (f) {
        const id = f.getId();

        let clone = f.clone();
        clone.setId(f.getId());

        this.get('source').clear();
        this.putHighlightLayerOnTop();

        if (this.features.hasOwnProperty(id)) {
            delete this.features[id];
            this.get('highlightLayer').removeHighlight(clone);
        } else {
            this.features[id] = f;
            f.operation = 'Within';
            this.get('highlightLayer').addHighlight(clone, false);
        }
    },

    onMapSingleClick: function (event) {
        if (this.get('activeTool') !== 'multiSelect') {
            return;
        }

        var wmsLayers = this.get('layerCollection').filter(layer => this.isQueryable(layer)),
            projection = this.get('olMap').getView().getProjection().getCode(),
            resolution = this.get('olMap').getView().getResolution(),
            promises = []
        ;

        this.get('olMap').forEachFeatureAtPixel(event.pixel, (feature, layer) => {
            if (layer && layer.get('name')) {
                if (
                    layer.get('name') !== 'preview-layer' &&
                    layer.get('name') !== 'highlight-wms'
                ) {
                    promises.push(new Promise((resolve, reject) => {
                        this.addFeature(feature);
                        resolve();
                    }));
                }
            }
        });

        wmsLayers.forEach((wmsLayer, index) => {
            wmsLayer.index = index;
            promises.push(new Promise((resolve, reject) => {
                wmsLayer.getFeatureInformation({
                    coordinate: event.coordinate,
                    resolution: resolution,
                    projection: projection,
                    error: message => {
                        resolve();
                    },
                    success: features => {
                        if (Array.isArray(features) && features.length > 0) {
                            features.forEach(feature => {
                                this.addFeature(feature);
                            });
                        }
                        resolve();
                    }
                });
            }));
        });

        Promise.all(promises).then(() => {
            // Selection complete
        });
    },

    getScetchStyle: function () {
        const color = 'rgba(0, 0, 0, 0.6)';
        return [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: color,
                    width: 4
                }),
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0,5)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: 2
                    })
                })
            })
        ];
    },

    hasFeatures: function () {
        return (
            this.get('source').getFeatures().length > 0 ||
            Object.keys(this.features).length > 0
        );
    },

    setActiveTool: function (tool) {
        if(this.get("activeTool") !== null || typeof this.get("activeTool") !== "undefined") {
            this.get('olMap').removeInteraction(this.get(this.get('activeTool'))); // tool name in activeTool should match the interaction created in this file
        }
        this.set('activeTool', tool);

        if (tool === 'polygonSelection') {
            this.get('olMap').addInteraction(this.get('polygonSelection'));
            this.get('olMap').set('clickLock', true);
        }

        if (tool === 'squareSelection'){
            this.get('olMap').addInteraction(this.get('squareSelection'));
            this.get('olMap').set('clickLock', true);
        }

        if (tool === 'lineSelection') {
            this.get('olMap').addInteraction(this.get('lineSelection'));
            this.get('olMap').set('clickLock', true);
        }

        if (tool === 'pointSelection') {
            this.get('olMap').addInteraction(this.get('pointSelection'));
            this.get('olMap').set('clickLock', true);
        }

        if (!tool) {
            this.get('olMap').set('clickLock', false);
            this.get('olMap').un('singleclick', this.onMapSingleClick, this);
        }

        this.clickEnterSokomrade();
    },

    clickEnterSokomrade: function(){
        if(this.get("callBackEnter") === "") {
            this.set("callbackEnter", "listening");
            window.addEventListener("keydown", function handler(e) {
                if (e.keyCode === 13) {
                    var searchInomOmrade = $("#sokEnter");
                    searchInomOmrade.click();
                }
                window.removeEventListener("keydown", handler);
            });
        }
    },

    bufferSearchingInput: function(){
        var bufferLength = document.getElementById("bufferSearchingInput").value;
        this.set("bufferLength", bufferLength);
        this.bufferSearching(bufferLength);
    },

    bufferSearching: function(bufferSearchingLength) {
        var parser = new jsts.io.OL3Parser();
        var bufferLength = bufferSearchingLength;
        this.get("firBufferLayer").getSource().clear();

        if(bufferSearchingLength > 0) {

            this.get("map").getLayers().forEach(layer => {
                if (layer.get("caption") === "search-selection-layer") {
                    layer.getSource().getFeatures().forEach(feature => {
                        var jstsGeom = parser.read(feature.getGeometry());
                        // create a buffer of the required meters around each line
                        var buffered = jstsGeom.buffer(bufferLength);

                        // create a new feature and add in a new layer that has highlightstyle
                        var buffer = new ol.Feature();

                        // convert back from JSTS and replace the geometry on the feature
                        buffer.setGeometry(parser.write(buffered));
                        buffer.set("originalFeature", feature);
                        this.get("firBufferLayer").getSource().addFeature(buffer);
                    });
                }
            });
        }
    },

    getFeatures: function () {
        var allFeatures = [];

        this.bufferSearchingInput();
        allFeatures = allFeatures.concat(this.get('highlightLayer').getFeatures(), this.get('source').getFeatures(), this.get("firBufferLayer").getSource().getFeatures());

        return allFeatures;
        //return allFeatures.concat(this.get('highlightLayer').getFeatures(), this.get('source').getFeatures(), this.get("firBufferLayer").getSource().getFeatures());
    },

    abort: function () {
        this.setActiveTool('');
        this.get('source').clear();
        this.get('olMap').set('clickLock', false);
        this.get('highlightLayer').clearHighlight();
        this.get("firBufferLayer").getSource().clear();
        this.clear();
    },

    importDrawLayer: function (xmlDoc) {
        try {
            var clonedNode = xmlDoc.childNodes[0].cloneNode(true),
                serializer = new XMLSerializer(),
                kml_string = serializer.serializeToString(clonedNode),
                parser = new ol.format.KML(),
                features = parser.readFeatures(kml_string),
                extent = false;

        features.forEach((feature) => {
                var coordinates = feature.getGeometry().getCoordinates();
            try {
                var type = feature.getGeometry().getType();

                var newCoordinates = [];
                feature.setProperties({
                    user: true
                });
                if (type == 'LineString') {
                    coordinates.forEach((c, i) => {
                        pairs = [];
                        c.forEach((digit) => {
                            if (digit != 0) {
                                pairs.push(digit);
                            }
                        });
                        newCoordinates.push(pairs);
                    });
                    feature.getGeometry().setCoordinates(newCoordinates);
                } else if (type == 'Polygon') {
                    newCoordinates[0] = [];
                    coordinates.forEach((polygon, i) => {
                        polygon.forEach((vertex, j) => {
                            pairs = [];
                            vertex.forEach((digit) => {
                                if (digit != 0) {
                                    pairs.push(digit);
                                }
                            });
                            newCoordinates[0].push(pairs);
                        });
                    });
                    feature.getGeometry().setCoordinates(newCoordinates);
                }

                feature.getGeometry().transform(
                    'EPSG:4326',
                    this.get('olMap').getView().getProjection()
                );
                this.setStyleFromProperties(feature);
            }catch (e) {
                alert("fel formated fil");
                return;

            }
        });

        if(features.length < 1){
            alert("Kunde inte hitta några objekt i KML-filen");
            return;
        }

        this.get('source').addFeatures(features);
        extent = this.calculateExtent(features);

        if (extent) {
            let size = this.get('olMap').getSize();
            this.get('olMap').getView().fit(extent, size);
        }

        } catch (e){
            alert("Filen är inte korrekt formaterad");
        }
    },

    /**
     * Set the features style from based upon its properties.
     * @param {external:"ol.feature"}
     * @instance
     */
    setStyleFromProperties: function (feature) {
        if (feature.getProperties().style) {
            try {
                let style = JSON.parse(feature.getProperties().style);
                if (style.text) {
                    this.setFeaturePropertiesFromText(feature);
                    if (style.pointRadius > 0) {
                        this.setFeaturePropertiesFromGeometry(feature);
                    }
                } else {
                    this.setFeaturePropertiesFromGeometry(feature);
                }
                feature.setStyle(this.getStyle(feature, style));
            } catch (ex) {
                console.error('Style attribute could not be parsed.', ex);
            }
        } else {
            // https://github.com/openlayers/openlayers/issues/3262
            let func = feature.getStyleFunction();
            if (func) {
                let style = func.call(feature, this.get('olMap').getView().getResolution());
                if (style[0] && style[0].getFill && style[0].getFill() === null) {
                    style[0].setFill(new ol.style.Fill({
                        color: [0, 0, 0, 0]
                    }));
                }
                feature.setStyle(style);
            }
        }
    },

    /**
     * Calculate extent of given features
     * @instance
     * @param {array} features
     * @return {external:ol.Extent} extent
     */
    calculateExtent (features) {
        var x = [];
        features.forEach((feature, i) => {
            var e = feature.getGeometry().getExtent(); // l b r t
            if (i === 0) {
                x = e;
            } else {
                let t = 0;
                for (;t < 4; t++) {
                    if (t < 2) {
                        if (x[t] > e[t]) {
                            x[t] = e[t];
                        }
                    } else {
                        if (x[t] < e[t]) {
                            x[t] = e[t];
                        }
                    }
                }
            }
        });
        return x.every(c => c) ? x : false;
    },

    /**
     * Update any feature with properties from its own geometry.
     * @instance
     * @params {external:"ol.feature"} feature
     */
    setFeaturePropertiesFromGeometry: function (feature) {
        if (!feature) return;
        var geom,
            type = '',
            lenght = 0,
            radius = 0,
            area = 0,
            position = {
                n: 0,
                e: 0
            }
        ;
        geom = feature.getGeometry();
        type = geom.getType();
        switch (type) {
            case 'Point':
                position = {
                    n: Math.round(geom.getCoordinates()[1]),
                    e: Math.round(geom.getCoordinates()[0])
                };
                break;
            case 'LineString' :
                length = Math.round(geom.getLength());
                break;
            case 'Polygon':
                area = Math.round(geom.getArea());
                break;
            case 'Circle':
                radius = Math.round(geom.getRadius());
                if (radius === 0)
                    radius = parseFloat(this.get('circleRadius'));
                break;
            default:
                break;
        }
        feature.setProperties({
            type: type,
            user: true,
            length: length,
            area: area,
            radius: radius,
            position: position
        });
    },
    /**
     * Get styles array.
     * @instance
     * @param {external:"ol.feature"} feature
     * @param {boolean} forcedProperties - Force certain properties to be taken directly from the feature.
     * @return {Array<{external:"ol.style"}>} style
     *
     */
    getStyle: function (feature, forcedProperties) {
        var geometryName = feature.getGeometryName();
        function getLineDash () {
            var scale = (a, f) => a.map(b => f * b),
                width = lookupWidth.call(this),
                style = lookupStyle.call(this),
                dash = [12, 7],
                dot = [2, 7]
            ;
            switch (style) {
                case 'dash':
                    return width > 3 ? scale(dash, 2) : dash;
                case 'dot':
                    return width > 3 ? scale(dot, 2) : dot;
                default :
                    return undefined;
            }
        }

        function getFill () {
            function rgba () {
                switch (geometryName) {
                    case 'Circle':
                        return this.get('circleFillColor')
                            .replace('rgb', 'rgba')
                            .replace(')', `, ${this.get('circleFillOpacity')})`);

                    case 'Polygon':
                        return this.get('polygonFillColor')
                            .replace('rgb', 'rgba')
                            .replace(')', `, ${this.get('polygonFillOpacity')})`);

                    case 'Box':
                        return this.get('boxFillColor')
                            .replace('rgb', 'rgba')
                            .replace(')', `, ${this.get('boxFillOpacity')})`);
                }
            }

            var color = forcedProperties ? forcedProperties.fillColor : rgba.call(this);
            var fill = new ol.style.Fill({
                color: color
            });

            return fill;
        }

        function lookupStyle () {
            switch (geometryName) {
                case 'Polygon':
                    return this.get('polygonLineStyle');
                case 'Circle':
                    return this.get('circleLineStyle');
                case 'Box':
                    return this.get('boxLineStyle');
                default:
                    return this.get('lineStyle');
            }
        }

        function lookupWidth () {
            switch (geometryName) {
                case 'Polygon':
                    return this.get('polygonLineWidth');
                case 'Circle':
                    return this.get('circleLineWidth');
                case 'Box':
                    return this.get('boxLineWidth');
                default:
                    return this.get('lineWidth');
            }
        }

        function lookupColor () {
            if (forcedProperties) {
                return forcedProperties.strokeColor;
            }
            switch (geometryName) {
                case 'Polygon':
                    return this.get('polygonLineColor');
                case 'Circle':
                    return this.get('circleLineColor');
                case 'Box':
                    return this.get('boxLineColor');
                default:
                    return this.get('lineColor');
            }
        }

        function getStroke () {
            var color = forcedProperties
                ? forcedProperties.strokeColor
                : lookupColor.call(this);

            var width = forcedProperties
                ? forcedProperties.strokeWidth
                : lookupWidth.call(this);

            var lineDash = forcedProperties
                ? forcedProperties.strokeDash
                : getLineDash.call(this);

            var stroke = new ol.style.Stroke({
                color: color,
                width: width,
                lineDash: lineDash
            });

            return stroke;
        }

        function getImage () {
            var radius = type === 'Text' ? 0 : forcedProperties ? forcedProperties.pointRadius : this.get('pointRadius');
            var iconSrc = forcedProperties ? (forcedProperties.image || this.get('markerImg')) : this.get('markerImg');

            var icon = new ol.style.Icon({
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                src: iconSrc
            });

            var dot = new ol.style.Circle({
                radius: radius,
                fill: new ol.style.Fill({
                    color: forcedProperties ? forcedProperties.pointColor : this.get('pointColor')
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgb(255, 255, 255)',
                    width: 2
                })
            });

            if (forcedProperties) {
                if (forcedProperties.image) {
                    return icon;
                } else {
                    return dot;
                }
            }

            if (this.get('pointSymbol') && type !== 'Text') {
                return icon;
            } else {
                return dot;
            }
        }

        function getText () {
            var offsetY = () => {
                var offset = -15;

                if (this.get('pointSymbol')) { offset = -40; }

                if (type === 'Text') { offset = 0; }

                return offset;
            };

            return new ol.style.Text({
                textAlign: 'center',
                textBaseline: 'middle',
                font: `${this.get('fontSize')}px sans-serif`,
                text: forcedProperties ? forcedProperties.text : this.getLabelText(feature),
                fill: new ol.style.Fill({color: this.get('fontColor')}),
                stroke: new ol.style.Stroke({color: this.get('fontBackColor'), width: 3}),
                offsetX: type === 'Text' ? 0 : 10,
                offsetY: offsetY(),
                rotation: 0,
                scale: 1.4
            });
        }

        var type = feature.getProperties().type;

        return [
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 255, 255, 0.5)',
                    width: type === 'Polygon'
                        ? this.get('polygonLineWidth') + 2
                        : this.get('lineWidth') + 2
                })
            }),
            new ol.style.Style({
                fill: getFill.call(this),
                stroke: getStroke.call(this),
                image: getImage.call(this),
                text: getText.call(this)
            })
        ];
    },

    /**
     * Update any feature with property to identify feature as text feature.
     * @instance
     * @params {external:"ol.feature"} feature
     * @params {string} text
     */
    setFeaturePropertiesFromText: function (feature, text) {
        if (!feature) return;
        feature.setProperties({
            type: 'Text',
            user: true,
            description: text
        });
    },
};

/**
 * Selection model module.<br>
 * Use <code>require('models/firSelectionModel')</code> for instantiation.
 * @module firSelectionModel-module
 * @returns {firSelectionModel}
 */
module.exports = Backbone.Model.extend(FirSelectionModel);
