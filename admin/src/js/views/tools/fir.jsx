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

import React from 'react';
import { Component } from 'react';
import Tree from '../tree.jsx';
import { SketchPicker } from 'react-color';

var defaultState = {
    validationErrors: [],
    toolbar: 'bottom',
    active: false,
    index: 0,
    base64Encode: false,
    instruction: '',
    filterVisible: false, //ta bort?
    displayPopup: true,
    firSelectionTools: true, // has only been tested with set to true
    maxZoom: 14,
    excelExportUrl: '/mapservice/export/excel',
    kmlImportUrl: '/mapservice/import/kml',
    markerImg: 'http://localhost/hajk/assets/icons/marker.png',
    infoKnappLogo: '/assets/icons/hjalpknapp_FIR.png',
    instructionSokning: '',
    instructionHittaGrannar: '',
    instructionSkapaFastighetsforteckning: '',
    anchorX: 16,
    anchorY: 32,
    imgSizeX: 32,
    imgSizeY: 32,
    popupOffsetY: 0,
    visibleForGroups: [],
    searchableLayers: {},
    tree: '',
    layers: [],
    realEstateLayer: {},
    realEstateWMSLayer: {},
    colorResult: 'rgba(255,255,0,0.3)',
    colorResultStroke: '',
    colorHighlight: '',
    colorHighlightStroke: '',
    colorHittaGrannarBuffer: '',
    colorHittaGrannarBufferStroke: ''
};

class ToolOptions extends Component {
    /**
     *
     */
    constructor () {
        super();
        this.state = defaultState;
        this.type = 'fir';

        this.handleAddSearchable = this.handleAddSearchable.bind(this);
        this.loadLayers = this.loadLayers.bind(this);
    }

    componentDidMount () {
        if (this.props.parent.props.parent.state.authActive) {
            this.loadSearchableLayers();
        }
        var tool = this.getTool();
        if (tool) {
            this.setState({
                active: true,
                index: tool.index,
                base64Encode: tool.options.base64Encode,
                instruction: tool.options.instruction,
                instructionSokning: tool.options.instructionSokning,
                instructionHittaGrannar: tool.options.instructionHittaGrannar,
                instructionSkapaFastighetsforteckning: tool.options.instructionSkapaFastighetsforteckning,
                filterVisible: tool.options.filterVisible,
                firSelectionTools: tool.options.firSelectionTools,
                displayPopup: tool.options.displayPopup,
                maxZoom: tool.options.maxZoom,
                excelExportUrl: tool.options.excelExportUrl,
                kmlImportUrl:tool.options.kmlImportUrl,
                markerImg: tool.options.markerImg,
                infoKnappLogo: tool.options.infoKnappLogo,
                anchorX: tool.options.anchor[0] || this.state.anchorX,
                anchorY: tool.options.anchor[1] || this.state.anchorY,
                imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
                imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
                popupOffsetY: tool.options.popupOffsetY,
                visibleForGroups: tool.options.visibleForGroups ? tool.options.visibleForGroups : [],
                layers: tool.options.layers ? tool.options.layers : [],
                realEstateLayer: tool.options.realEstateLayer,
                realEstateWMSLayer: tool.options.realEstateWMSLayer,
                colorResult: tool.options.colorResult,
                colorResultStroke: tool.options.colorResultStroke,
                colorHighlight: tool.options.colorHighlight,
                colorHighlightStroke: tool.options.colorHighlightStroke,
                colorHittaGrannarBuffer: tool.options.colorHittaGrannarBuffer,
                colorHittaGrannarBufferStroke: tool.options.colorHittaGrannarBufferStroke
            }, () => { this.loadLayers(); });
        } else {
            this.setState({
                active: false
            });
        }
    }

    componentWillUnmount () {
    }
    /**
     *
     */
    componentWillMount () {

    }

    /**
     * Anropas från tree.jsx i componentDidMount som passar med refs.
     * Sätter checkboxar och inputfält för söklager.
     * @param {*} childRefs
     */
    loadLayers (childRefs) {
        // checka checkboxar, visa textfält
        // och sätt text från kartkonfig.json
        let ids = [];

        for (let id of this.state.layers) {
            ids.push(id);
        }

        if (typeof childRefs !== 'undefined') {
            for (let i of ids) {
                childRefs['cb_' + i.id].checked = true;
                childRefs[i.id + "_fnrField"].hidden = false;
                childRefs[i.id + "_omradeField"].hidden = false;
                childRefs[i.id].hidden = false;

                childRefs[i.id + "_fnrField"].value = i.fnrField;
                childRefs[i.id + "_omradeField"].value = i.omradeField;
                childRefs[i.id].value = i.visibleForGroups.join();
            }
        }
    }

    handleInputChange (event) {
        var target = event.target;
        var name = target.name;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        if (typeof value === 'string' && value.trim() !== '') {
            value = !isNaN(Number(value)) ? Number(value) : value;
        }

        if (name == 'instruction' || name == 'instructionSokning' || name == 'instructionHittaGrannar' || name == 'instructionSkapaFastighetsforteckning' || name == 'realEstateLayer_instructionVidSokresult') {
            value = btoa(value);
        }

        if(name.indexOf("_") !== -1){
            if(name.indexOf("realEstateLayer") !== -1){
                //var realEstateLayer = this.state.realEstateLayer;
                var field = name.split("_")[1];
                this.state.realEstateLayer[field] = value.toString();
            } else if(name.indexOf("realEstateWMSLayer") !== -1){
                var field = name.split("_")[1];
                this.state.realEstateWMSLayer[field] = value.toString();
            }
        }


        this.setState({
            [name]: value
        });
    }

    loadSearchableLayers () {
        let layers = this.props.model.getConfig(this.props.model.get('config').url_layers, (layers) => {
            this.setState({
                searchableLayers: layers.wfslayers
            });

            console.log("searchable", this.state.searchableLayers);
            this.setState({
                tree: <Tree type="fir" model={this} layers={this.state.searchableLayers} handleAddSearchable={this.handleAddSearchable} loadLayers={this.loadLayers} />
            });
        });
    }

    getTool () {
        return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
    }

    add (tool) {
        this.props.model.get('toolConfig').push(tool);
    }

    remove (tool) {
        this.props.model.set({
            'toolConfig': this.props.model.get('toolConfig').filter(tool => tool.type !== this.type)
        });
    }

    replace (tool) {
        this.props.model.get('toolConfig').forEach(t => {
            if (t.type === this.type) {
                t.options = tool.options;
                t.index = tool.index;
            }
        });
    }

    save () {
        var toolbar = 'bottom';
        var tool = {
            'type': this.type,
            'index': this.state.index,
            'options': {
                toolbar: toolbar,
                maxZoom: this.state.maxZoom,
                markerImg: this.state.markerImg,
                infoKnappLogo: this.state.infoKnappLogo,
                kmlImportUrl: this.state.kmlImportUrl,
                excelExportUrl: this.state.excelExportUrl,
                displayPopup: this.state.displayPopup,
                base64Encode: this.state.base64Encode,
                instruction: this.state.instruction,
                instructionSokning: this.state.instructionSokning,
                instructionHittaGrannar: this.state.instructionHittaGrannar,
                instructionSkapaFastighetsforteckning: this.state.instructionSkapaFastighetsforteckning,
                filterVisible: this.state.filterVisible,
                firSelectionTools: this.state.firSelectionTools,
                anchor: [this.state.anchorX, this.state.anchorY],
                imgSize: [this.state.imgSizeX, this.state.imgSizeY],
                popupOffsetY: this.state.popupOffsetY,
                visibleForGroups: this.state.visibleForGroups.map(Function.prototype.call, String.prototype.trim),
                layers: this.state.layers ? this.state.layers : [],
                realEstateLayer: this.state.realEstateLayer,
                realEstateWMSLayer: this.state.realEstateWMSLayer,
                colorResult: this.state.colorResult ? this.state.colorResult : 'rgba(255,255,0,0.3)',
                colorResultStroke: this.state.colorResultStroke ? this.state.colorResultStroke : 'rgba(0,0,0,0.6)',
                colorHighlight: this.state.colorHighlight ? this.state.colorHighlight : 'rgba(0,0,255,0.2)',
                colorHighlightStroke: this.state.colorHighlightStroke ? this.state.colorHighlightStroke : 'rgba(0,0,0,0.6)',
                colorHittaGrannarBuffer: this.state.colorHittaGrannarBuffer ? this.state.colorHittaGrannarBuffer : 'rgba(50,200,200,0.4)',
                colorHittaGrannarBufferStroke: this.state.colorHittaGrannarBufferStroke ? this.state.colorHittaGrannarBufferStroke : 'rgba(0,0,0,0.2)'
            }
        };

        var existing = this.getTool();

        function update () {
            this.props.model.updateToolConfig(this.props.model.get('toolConfig'), () => {
                this.props.parent.props.parent.setState({
                    alert: true,
                    alertMessage: 'Uppdateringen lyckades'
                });
            });
        }

        if (!this.state.active) {
            if (existing) {
                this.props.parent.props.parent.setState({
                    alert: true,
                    confirm: true,
                    alertMessage: 'Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?',
                    confirmAction: () => {
                        this.remove();
                        update.call(this);
                        this.setState(defaultState);
                    }
                });
            } else {
                this.remove();
                update.call(this);
            }
        } else {
            if (existing) {
                this.replace(tool);
            } else {
                this.add(tool);
            }
            update.call(this);
        }
    }

    handleAuthGrpsChange (event) {
        const target = event.target;
        const value = target.value;
        let groups = [];

        try {
            groups = value.split(',');
        } catch (error) {
            console.log(`Någonting gick fel: ${error}`);
        }

        this.setState({
            visibleForGroups: value !== '' ? groups : []
        });
    }

    renderVisibleForGroups () {
        if (this.props.parent.props.parent.state.authActive) {
            return (
                <div>
                    <label htmlFor='visibleForGroups'>Tillträde</label>
                    <input id='visibleForGroups' value={this.state.visibleForGroups} type='text' name='visibleForGroups' onChange={(e) => { this.handleAuthGrpsChange(e); }} />
                </div>
            );
        } else {
            return null;
        }
    }
    /**
     * anropas från tree.jsx som eventhandler. Hantering för checkboxar och
     * inmatning av AD-grupper för wfs:er
     * @param {*} e
     * @param {*} layer
     */
    handleAddSearchable (e, layer) {
        if (e.target.type.toLowerCase() === 'checkbox') {
            if (e.target.checked) {
                let toAdd = {
                    id: layer.id.toString(),
                    fnrField: "",
                    omradeField: "",
                    visibleForGroups: []
                };
                this.setState({
                    layers: [...this.state.layers, toAdd]
                });
            } else {
                let newArray = this.state.layers.filter((o) => o.id != layer.id.toString());

                this.setState({
                    layers: newArray
                });
            }
        }
        if (e.target.type.toLowerCase() === 'text') {
            let obj = this.state.layers.find((o) => o.id === layer.id.toString());
            let newArray = this.state.layers.filter((o) => o.id !== layer.id.toString());

            // Skapar array och trimmar whitespace från start och slut av varje cell
            console.log("changed target", e.target);
            if (typeof obj !== 'undefined') {
                if(e.target.placeholder === "Tillträde"){
                    obj.visibleForGroups = e.target.value.split(',');
                    obj.visibleForGroups = obj.visibleForGroups.map(el => el.trim());
                } else if (e.target.placeholder === "fnrField"){
                    obj.fnrField = e.target.value.trim();
                } else if (e.target.placeholder === "omradeField"){
                    obj.omradeField = e.target.value.trim();
                } else {
                    console.error("Got a target in handleAddSearchable which no case exists for. Got", e.target.placeholder);
                }
            }

            newArray.push(obj);

            // Sätter visibleForGroups till [] istället för [""] om inputfältet är tomt.
            if (newArray.length === 1) {
                if (newArray[0].visibleForGroups.length === 1 && newArray[0].visibleForGroups[0] === '') {
                    newArray[0].visibleForGroups = [];
                }
            }

            this.setState({
                layers: newArray
            });
        }
    }

    handleColorResult (color) {
        this.state.colorResult = color.hex;
    }
    handleColorResultStroke (color) {
        this.state.colorResultStroke = color.hex;
    }
    handleColorHighlight (color) {
        this.state.colorHighlight = color.hex;
    }
    handleColorHighlightStroke (color) {
        this.state.colorHighlightStroke = color.hex;
    }
    handleColorHittaGrannarBuffer (color) {
        this.state.colorHittaGrannarBuffer = color.hex;
    }
    handleColorHittaGrannarBufferStroke (color) {
        this.state.colorHittaGrannarBufferStroke = color.hex;
    }

    /**
     *
     */
    render () {
        return (
            <div>
                <form>
                    <p>
                        <button className='btn btn-primary' onClick={(e) => { e.preventDefault(); this.save(); }}>Spara</button>
                    </p>
                    <div>
                        <input
                            id='active'
                            name='active'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.active} />&nbsp;
                        <label htmlFor='active'>Aktiverad</label>
                    </div>
                    <div>
                        <label htmlFor='index'>Sorteringsordning</label>
                        <input
                            id='index'
                            name='index'
                            type='text'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.index} />
                    </div>
                    <div>
                        <input
                            id='displayPopup'
                            name='displayPopup'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.displayPopup} />&nbsp;
                        <label htmlFor='displayPopup'>Visa popup</label>
                    </div>
                    <div>
                        <input
                            id='filterVisible'
                            name='filterVisible'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.filterVisible} />&nbsp;
                        <label htmlFor='filterVisible'>Sök i synliga lager *måste vara false för Varbergsversion</label>
                    </div>
                    <div>
                        <input
                            id='firSelectionTools'
                            name='firSelectionTools'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.firSelectionTools} />&nbsp;
                        <label htmlFor='firSelectionTools'>firSelectionTools *måste vara true</label>
                    </div>
                    <div>
                        <input
                            id='Base64-active'
                            name='base64Encode'
                            type='checkbox'
                            onChange={(e) => { this.handleInputChange(e); }}
                            checked={this.state.base64Encode} />&nbsp;
                        <label htmlFor='Base64-active'>Base64-encoding aktiverad</label>
                    </div>
                    <div>
                        <label htmlFor='instruction'>Instruktion för FIR-verktyg</label>
                        <textarea
                            id='instruction'
                            name='instruction'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.instruction ? atob(this.state.instruction) : ''} />
                    </div>
                    <div>
                        <label htmlFor='instructionSokning'>Instruktion för "sökning"</label>
                        <textarea
                            id='instructionSokning'
                            name='instructionSokning'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.instructionSokning ? atob(this.state.instructionSokning) : ''} />
                    </div>
                    <div>
                        <label htmlFor='instructionHittaGrannar'>Instruktion för "hitta grannar"</label>
                        <textarea
                            id='instructionHittaGrannar'
                            name='instructionHittaGrannar'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.instructionHittaGrannar ? atob(this.state.instructionHittaGrannar) : ''} />
                    </div>
                    <div>
                        <label htmlFor='instructionSkapaFastighetsforteckning'>Instruktion för "skapa Fastighetsförteckning"</label>
                        <textarea
                            id='instructionSkapaFastighetsforteckning'
                            name='instructionSkapaFastighetsforteckning'
                            onChange={(e) => { this.handleInputChange(e); }}
                            value={this.state.instructionSkapaFastighetsforteckning ? atob(this.state.instructionSkapaFastighetsforteckning) : ''} />
                    </div>
                    {this.renderVisibleForGroups()}
                    <div>
                        <label htmlFor='maxZoom'>Zoomnivå</label>
                        <input value={this.state.maxZoom} type='text' name='maxZoom' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='excelExportUrl'>URL Excel-tjänst</label>
                        <input value={this.state.excelExportUrl} type='text' name='excelExportUrl' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='kmlImportUrl'>URL KML-tjänst(Import)</label>
                        <input value={this.state.kmlImportUrl} type='text' name='kmlImportUrl' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='markerImg'>Ikon för sökträff</label>
                        <input value={this.state.markerImg} type='text' name='markerImg' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='infoKnappLogo'>Ikon för hjälpknapp</label>
                        <input value={this.state.infoKnappLogo} type='text' name='infoKnappLogo' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='anchorX'>Ikonförskjutning X</label>
                        <input value={this.state.anchorX} type='text' name='anchorX' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='anchorY'>Ikonförskjutning Y</label>
                        <input value={this.state.anchorY} type='text' name='anchorY' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='popupOffsetY'>Förskjutning popup-ruta</label>
                        <input value={this.state.popupOffsetY} type='text' name='popupOffsetY' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='imgSizeX'>Bildbredd</label>
                        <input value={this.state.imgSizeX} type='text' name='imgSizeX' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='imgSizeY'>Bildhöjd</label>
                        <input value={this.state.imgSizeY} type='text' name='imgSizeY' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>

                    <div className='col-md-12'>
                      <span className='pull-left'>
                        <div>Resultat - färg för yta</div>
                        <SketchPicker
                            color={this.state.colorResult}
                            onChangeComplete={(e) => this.handleColorResult(e)}
                        />
                      </span>
                      <span className='pull-left' style={{marginLeft: '10px'}}>
                        <div>Resultat - färg för kantlinje</div>
                        <SketchPicker
                            color={this.state.colorResultStroke}
                            onChangeComplete={(e) => this.handleColorResultStroke(e)}
                        />
                      </span>
                    </div>
                    <div className='col-md-12'>
                      <span className='pull-left'>
                        <div>Valt objekt (hightlight) - färg för yta</div>
                        <SketchPicker
                            color={this.state.colorHighlight}
                            onChangeComplete={(e) => this.handleColorHighlight(e)}
                        />
                      </span>
                        <span className='pull-left' style={{marginLeft: '10px'}}>
                        <div>Valt objekt (hightlight) - färg för kantlinje</div>
                        <SketchPicker
                            color={this.state.colorHighlightStroke}
                            onChangeComplete={(e) => this.handleColorHighlightStroke(e)}
                        />
                      </span>
                    </div>
                    <div className='col-md-12'>
                      <span className='pull-left'>
                        <div>Buffer - färg för yta</div>
                        <SketchPicker
                            color={this.state.colorHittaGrannarBuffer}
                            onChangeComplete={(e) => this.handleColorHittaGrannarBuffer(e)}
                        />
                      </span>
                        <span className='pull-left' style={{marginLeft: '10px'}}>
                        <div>Buffer - färg för kantlinje</div>
                        <SketchPicker
                            color={this.state.colorHittaGrannarBufferStroke}
                            onChangeComplete={(e) => this.handleColorHittaGrannarBufferStroke(e)}
                        />
                      </span>
                    </div>
                    <div></div>
                    <div>
                        <label htmlFor='realEstateLayer_id'>realEstateLayers id</label>
                        <input value={this.state.realEstateLayer.id} type='text' name='realEstateLayer_id' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateLayer_omradeField'>realEstateLayers omradeField</label>
                        <input value={this.state.realEstateLayer.omradeField} type='text' name='realEstateLayer_omradeField' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateLayer_fnrField'>realEstateLayers fnrField</label>
                        <input value={this.state.realEstateLayer.fnrField} type='text' name='realEstateLayer_fnrField' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateLayer_labelField'>realEstateLayers labelField</label>
                        <input value={this.state.realEstateLayer.labelField} type='text' name='realEstateLayer_labelField' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateLayer_maxFeatures'>realEstateLayers maxFeatures</label>
                        <input value={this.state.realEstateLayer.maxFeatures} type='text' name='realEstateLayer_maxFeatures' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateLayer_instructionVidSokresult'>realEstateLayers instructionVidSokresult</label>
                        <input value={this.state.realEstateLayer.instructionVidSokresult ? atob(this.state.realEstateLayer.instructionVidSokresult) : ''} type='text' name='realEstateLayer_instructionVidSokresult' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateWMSLayer_id'>realEstateWMSLayers id</label>
                        <input value={this.state.realEstateWMSLayer.id} type='text' name='realEstateWMSLayer_id' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                    <div>
                        <label htmlFor='realEstateWMSLayer_fnrField'>realEstateWMSLayers fnrField</label>
                        <input value={this.state.realEstateWMSLayer.fnrField} type='text' name='realEstateWMSLayer_fnrField' onChange={(e) => { this.handleInputChange(e); }} />
                    </div>
                </form>
                <br/>
                {this.state.tree}
            </div>
        );
    }
}

export default ToolOptions;
