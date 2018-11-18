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
    ]
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

        //this.drawLayer.setZIndex(100);

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
            geometryName: "Polygon"
        }));

        this.get('polygonSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('squareSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Circle',
            geometryName: "Box",
            geometryFunction: ol.interaction.Draw.createBox()
        }));

        this.get('squareSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('lineSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'LineString',
            geometryName: "LineString"
        }));

        this.get('lineSelection').on("drawend", this.deactiveTool.bind(this));

        this.set('pointSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Point',
            geometryName: "Point"
        }));

        this.get('pointSelection').on("drawend", this.deactiveTool.bind(this));
    },

    deactiveTool: function(event){
        console.log("deactiateTool");
        //this.setActiveTool(undefined);
        if(!ctrlIsDown) {
            setTimeout(a => {
                console.log("here");
                this.setActiveTool(undefined);
                console.log("here2");
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
        console.log("activeTool", this.get("activeTool"));
        console.log("Status 1 ?", this.get("activeToolStatus"));
        if(this.get("activeTool") !== null || typeof this.get("activeTool") !== "undefined") {
            console.log("removing");
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


    },

    bufferSearchingInput: function(){
        var bufferLength = document.getElementById("bufferSearchingInput").value;
        this.set("bufferLength", bufferLength);
        this.bufferSearching(bufferLength);
    },

    bufferSearching: function(bufferSearchingLength) {
        var parser = new jsts.io.OL3Parser();
        parser.inject(ol.geom.Point, ol.geom.LineString, ol.geom.LinearRing, ol.geom.Polygon, ol.geom.MultiPoint, ol.geom.MultiLineString, ol.geom.MultiPolygon);

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

        //return allFeatures;
        return allFeatures.concat(this.get('highlightLayer').getFeatures(), this.get('source').getFeatures(), this.get("firBufferLayer").getSource().getFeatures());
    },

    abort: function () {
        this.setActiveTool('');
        this.get('source').clear();
        this.get('olMap').set('clickLock', false);
        this.get('highlightLayer').clearHighlight();
        this.get("firBufferLayer").getSource().clear();
        this.clear();
    }
};

/**
 * Selection model module.<br>
 * Use <code>require('models/firSelectionModel')</code> for instantiation.
 * @module firSelectionModel-module
 * @returns {firSelectionModel}
 */
module.exports = Backbone.Model.extend(FirSelectionModel);
