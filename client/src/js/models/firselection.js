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

        this.set('highlightLayer', new HighlightLayer({
            id: 'selection-highligt',
            anchor: this.get('anchor'),
            imgSize: this.get('imgSize'),
            markerImg: this.get('markerImg'),
            style: this.getScetchStyle()
        }));

        this.get('olMap').addLayer(this.get('drawLayer'));
        this.get('olMap').addLayer(this.get('highlightLayer').layer);

        this.set('polygonSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Polygon'
        }));

        this.set('squareSelection', new ol.interaction.Draw({
            source: this.get('source'),
            style: this.getScetchStyle(),
            type: 'Circle',
            geometryName: "Box",
            geometryFunction: ol.interaction.Draw.createBox()
        }));

        this.get('polygonSelection').on('drawend', () => {
            //this.get('source').clear();
            //this.get('highlightLayer').clearHighlight();
            //this.clear();
        });
    },

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
                    color: 'rgba(0, 0, 0, 0)'
                }),
                stroke: new ol.style.Stroke({
                    color: color,
                    width: 4
                }),
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0)'
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

        if (tool === 'multiSelect') {
            this.get('olMap').on('singleclick', this.onMapSingleClick, this);
            this.get('olMap').set('clickLock', true);
        }

        if (!tool) {
            this.get('olMap').set('clickLock', false);
            this.get('olMap').un('singleclick', this.onMapSingleClick, this);
        }
    },

    getFeatures: function () {
        return this.get('highlightLayer').getFeatures().concat(
            this.get('source').getFeatures()
        );
    },

    abort: function () {
        this.setActiveTool('');
        this.get('source').clear();
        this.get('olMap').set('clickLock', false);
        this.get('highlightLayer').clearHighlight();
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
