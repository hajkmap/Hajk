var FirSelectionToolbar = require('components/firselectiontoolbar');
var FirSearchResultGroup = require('components/firsearchresultgroup');

shiftIsDown = false;
ctrlIsDown = false;

window.onkeydown = (e) => {
    shiftIsDown = e.shiftKey;
    ctrlIsDown = e.ctrlKey;
};

window.onkeyup = (e) => {
    shiftIsDown = e.shiftKey;
    ctrlIsDown = e.ctrlKey;
};

/**
 * @class
 */
var FirSearchView = {
    /**
     * @property {string} value
     * @instance
     */
    value: undefined,

    /**
     * @property {number} timer
     * @instance
     */
    timer: undefined,

    /**
     * @property {number} loading
     * @instance
     */
    loading: 0,

    /**
     * Get initial state.
     * @instance
     * @return {object}
     */
    getInitialState: function () {
        console.log("firSearch -getInitialstate");
        return {
            visible: false,
            displayPopup: this.props.model.get('displayPopup')
        };
    },

    /**
     * Triggered when the component is successfully mounted into the DOM.
     * @instance
     */
    componentDidMount: function () {
        this.props.model.get("map").on('singleclick', this.props.model.clickedOnMap.bind(this.props.model));
        this.value = this.props.model.get('value');
        if (this.props.model.get('items')) {
            this.setState({
                showResults: true,
                result: {
                    status: 'success',
                    items: this.props.model.get('items')
                }
            });
        }

        this.props.model.on('change:displayPopup', () => {
            this.setState({
                displayPopup: this.props.model.get('displayPopup')
            });
        });
        this.props.model.on('change:url', () => {
            this.setState({
                downloadUrl: this.props.model.get('url')
            });
        });
        this.props.model.on('change:downloading', () => {
            this.setState({
                downloading: this.props.model.get('downloading')
            });
        });
    },

    componentDidUpdate: function () {
    },

    /**
     * Triggered before the component mounts.
     * @instance
     */
    componentWillMount: function () {
        console.log("firSearch -willmount");
        this.props.model.get('layerCollection')
            ? this.bindLayerVisibilityChange()
            : this.props.model.on('change:layerCollection', this.bindLayerVisibilityChange);
    },

    /**
     * Triggered when component unmounts.
     * @instance
     */
    componentWillUnmount: function () {

        this.props.model.get("map").un('singleclick', this.props.model.clickedOnMap);

        this.props.model.get('layerCollection').each((layer) => {
            layer.off('change:visible', this.search);
        });
        this.props.model.off('change:layerCollection', this.bindLayerVisibilityChange);
        this.props.model.off('change:displayPopup');
        this.props.model.off('change:url');
        this.props.model.off('change:downloading');
    },

    /**
     * Clear the search result.
     * @instance
     */
    clear: function () {
        this.value = '';
        this.props.model.set('value', '');
        this.props.model.set('searchTriggered', false);
        this.props.model.set("backupItems", []);
        this.props.model.clear();

        if (document.getElementById('alertSearchbar') != null) {
            document.getElementById('alertSearchbar').remove();
        }

        var bufferLength = document.getElementById("bufferSearchingInput").value;
        this.props.model.set("bufferLength", bufferLength);
        this.clearBufferLength(bufferLength);

        this.setState({
            loading: true,
            showResults: true,
            result: []
        });
    },

    clearBufferLength: function (bufferLength) {
        this.props.model.set("bufferLength", 0);
        document.getElementById("bufferSearchingInput").value = this.props.model.get("bufferLength");
    },

    /**
     * Handle key down event, this will set state.
     * @instance
     * @param {object} event
     */
    handleKeyDown: function (event) {
        if (event.keyCode === 13 && event.target.value.length < 5) {
            event.preventDefault();
            this.props.model.set('value', event.target.value);
            this.setState({
                force: true
            });
            this.props.model.set('force', true);
            this.search();
        }
    },

    /**
     * Perform a search in the model to update results.
     * @instance
     */
    update: function () {
        this.props.model.search();
    },

    /**
     * Search requested information.
     * @instance
     * @param {object} event
     */
    search: function (event) {
        this.props.model.set('searchTriggered', true);
        this.setState({
            loading: true
        });
        this.loading = Math.random();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            var loader = this.loading;
            this.props.model.abort();
            this.props.model.search(result => {
                if (result.status === "success") {
                    this.props.model.highlightResultLayer.getSource().clear();
                    this.props.model.firFeatureLayer.getSource().clear();
                    result.items.map(item => {
                        var groupName = item.layer;
                        item.hits.map(hit => {
                            this.props.model.firFeatureLayer.getSource().addFeature(hit);

                        });
                    });
                    if(this.props.model.get("force") && result.items.length > 0) {
                        this.props.model.get("map").getView().fit(this.props.model.firFeatureLayer.getSource().getExtent(), {
                            size: this.props.model.get("map").getSize(),
                            maxZoom: this.props.model.get('maxZoom')
                        });
                    }
                }
                var state = {
                    loading: false,
                    showResults: true,
                    result: result
                };
                if (loader !== this.loading) {
                    state.loading = true;
                }
                this.setState(state);
            }, false);
        }, 200);
    },

    /**
     * Bind an event handler to layer visibility change.
     * If a layer changes visibility the result vill update.
     * @instance
     */
    bindLayerVisibilityChange: function () {
        this.props.model.get('layerCollection').each((layer) => {
            layer.on('change:visible', () => {
                //this.update();
            });
        });
    },

    /**
     * Set search filter and perform a search.
     * @instance
     * @param {string} type
     * @param {object} event
     */
    setFilter: function (event) {
        this.props.model.set('filter', event.target.value);
        this.search();
    },

    /**
     * Render the search options component.
     * @instance
     * @return {external:ReactElement}
     */
    renderOptions: function () {
        console.log("render options");
        console.log("this.props.model");
        console.log(this.props.model);
        console.log("filterVisible");
        console.log(this.props.model.get("filterVisible"));
        var settings = this.props.model.get('settings'),
            sources = this.props.model.get('sources'),
            filterVisible = this.props.model.get('filterVisible'),
            filterVisibleBtn = null
        ;

        if (filterVisible) {
            filterVisibleBtn = (
                <div>
                    <input
                        id='filter-visible'
                        type='checkbox'
                        checked={this.props.model.get('filterVisibleActive')}
                        onChange={(e) => {
                            this.props.model.set('filterVisibleActive', e.target.checked);
                            this.setState({
                                filterVisibleActive: e.target.checked
                            });
                        }}
                    />&nbsp;
                    <label htmlFor='filter-visible'>Sök i alla synliga lager</label>
                </div>
            );
        }
        return (
            <div>
                <p>
                    <span>Sök: </span>&nbsp;
                    <select value={this.props.model.get('filter')} onChange={(e) => { this.setFilter(e); }}>
                        {/*<option value='*'> -- Alla -- </option>*/}
                        {
                            (() => {
                                return sources.map((wfslayer, i) => {
                                    return (
                                        <option key={i} value={wfslayer.caption}>
                                            {wfslayer.caption}
                                        </option>
                                    );
                                });
                            })()
                        }
                    </select>
                </p>
                {filterVisibleBtn}
            </div>
        );
    },

    onChangeDisplayPopup: function (e) {
        this.props.model.set('displayPopup', e.target.checked);
    },

    exportSelected: function (type) {
        this.props.model.export(type);
    },

    /**
     * Render the result component.
     * @instance
     * @return {external:ReactElement}
     */
    renderResults: function () {
        var groups = this.props.model.get('items'),
            excelButton = null,
            kmlButton = null,
            downloadLink = null
        ;

        if (this.props.model.get('kmlExportUrl')) {
            kmlButton = (
                <button className='btn btn-default icon-button' onClick={(e) => this.exportSelected('kml')}>
                    <i className='kml' />
                </button>
            );
        }

        if (this.props.model.get('excelExportUrl')) {
            excelButton = (
                <button className='btn btn-default icon-button' onClick={(e) => this.exportSelected('excel')}>
                    <i className='excel' />
                </button>
            );
        }

        // skapar en länk med url till nedladdning av export. Visar Spara
        // först när url finns.
        if (this.props.model.get('downloading')) {
            downloadLink = <a href='#'>Hämtar...</a>;
        } else if (this.props.model.get('url')) {
            downloadLink = <a href={this.props.model.get('url')}>Hämta sökresultat</a>;
        } else {
            downloadLink = null;
        }

        return (
            <div className='firSearch-results' key='firSearch-results'>
                <h3>Sökresultat</h3>
                {
                    (() => {
                        if (groups && groups.length > 0) {
                            return groups.map((item, i) => {
                                var id = 'group-' + i;
                                return (
                                    <FirSearchResultGroup
                                        isBar='no'
                                        id={id}
                                        key={id}
                                        result={item}
                                        numGroups={groups.length}
                                        model={this.props.model}
                                        parentView={this}
                                        map={this.props.model.get('map')} />
                                );
                            });
                        } else {
                            return (<div>Sökningen gav inget resultat.</div>);
                        }
                    })()
                }
            </div>

        );
    },

    checkBoxFir: function(column){
        var modelChosen = this.props.model.get("chosenColumns");
        if($("#"+column)[0].checked){
            modelChosen.push(column);
        }else {
            modelChosen.pop(column);
        }
        this.props.model.set("chosenColumns", modelChosen);
    },

    renderFastighetsForteckning: function(){
        var excelButton = null,
            downloadLink = null;


        if (this.props.model.get('excelExportUrl')) {
            excelButton = (
                <button className='btn btn-default icon-button' onClick={(e) => this.exportSelected('excel')}>
                    <i className='excel' />
                </button>
            );
        }

        // skapar en länk med url till nedladdning av export. Visar Spara
        // först när url finns.
        if (this.props.model.get('downloading')) {
            downloadLink = <a href='#'>Hämtar...</a>;
        } else if (this.props.model.get('url')) {
            downloadLink = <a href={this.props.model.get('url')}>Hämta sökresultat</a>;
        } else {
            downloadLink = null;
        }

        //infoknapp
        var instructionBtn;
        var instructionTxt;
        if (typeof this.props.model.get("instructionSkapaFastighetsforteckning") !== 'undefined' && this.props.model.get("instructionSkapaFastighetsforteckning") !== null && this.props.model.get("instructionSkapaFastighetsforteckning").length > 0) {
            instructionBtn = (
                <button onClick={() => this.openInstruction("skapaFastighetsforteckning")} className='btn-info' id='instructionBox' ><img src={infologo} /></button>
            );
            instructionTxt = (
                <div className='panel-body-instruction instructionsText' id='instructionsTextFirskapaFastighetsforteckning' dangerouslySetInnerHTML={{__html: this.props.model.get("instructionSkapaFastighetsforteckning")}} />
            );
        }
        var navPanel = document.getElementById('navigation-panel');
        navPanel.style.width = '417px';


        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Skapa fastighetsförteckning{instructionBtn}<button id="FIRCreateMinimizeButton" onClick={() => {console.log("clicked"); this.minBox('skapaFastighetsForteckning', "FIRCreateMinimizeButton")}} className={this.props.model.get("searchMinimizedClassButton")}></button>
                    {instructionTxt}
                    </div>
                <div className='panel-body'>
                    <div id="skapaFastighetsForteckning" className="hidden">
                    <p>Inkludera i förteckning:</p>
                    <input type="checkbox" id="traktnamn" onClick={()=> this.checkBoxFir("traktnamn")} /> Fastigheter <br/>
                    <input type="checkbox" id="text" onClick={()=> this.checkBoxFir("text")} /> Marksamfälligheter <br/>
                    <input type="checkbox" id="typ" onClick={()=> this.checkBoxFir("typ")} /> Gemensamhetsanläggningar <br/>
                    <input type="checkbox" id="nyckel" onClick={()=> this.checkBoxFir("nyckel")} /> Rättigheter <br/><br/>
                    </div>
                <div>
                    <br/>
                    <span className='pull-left'>{excelButton}</span>&nbsp;&nbsp; <span className='right'>Skapa fastighetsförteckning från sökresultat</span>
                    <div>{downloadLink}</div>
                </div>
                </div>
            </div>
        );
    },

    hittaGrannarUpdateRadio: function(){
        var checkedAngransade = document.getElementById("hittaGrannar").checked;
        var checkedMedBuffer = document.getElementById("hittaGrannarMedBuffer").checked;

        var bufferLength;

        if(checkedAngransade){
            document.getElementById("hittaGrannarMedBuffer").checked = false;
            bufferLength = 1;
        }else if(checkedMedBuffer){
            document.getElementById("hittaGrannar").checked = false;
            bufferLength = document.getElementById("bufferInput").value;
        }

        console.log("checkedAngransade", document.getElementById("hittaGrannar").checked);
        console.log("checkedMedBuffer", document.getElementById("hittaGrannarMedBuffer").checked);
        console.log("bufferLength", bufferLength);
    },

    hittaGrannar: function() {
        var parser = new jsts.io.OL3Parser();
        parser.inject(ol.geom.Point, ol.geom.LineString, ol.geom.LinearRing, ol.geom.Polygon, ol.geom.MultiPoint, ol.geom.MultiLineString, ol.geom.MultiPolygon);

        var radioCheckedAngransade = document.getElementById("hittaGrannar").checked,
            radioCheckedMedBuffer = document.getElementById("hittaGrannarMedBuffer").checked,
            bufferLength;

        if(radioCheckedMedBuffer ){
            bufferLength = document.getElementById("bufferInput").value;
        }else{
            bufferLength = 0.01;
        }
        console.log("bufferLength in hittaGrannar", bufferLength);

        this.props.model.firBufferFeatureLayer.getSource().clear();
        this.props.model.firBufferHiddenFeatureLayer.getSource().clear();

        var buffer = new ol.Feature();
        var bufferGeom = false;

        this.props.model.get("map").getLayers().forEach(layer => {
           if(layer.get("caption") === "FIRSökresltat")
               layer.getSource().getFeatures().forEach(feature => {
                   console.log("feature", feature);
                   var jstsGeom = parser.read(feature.getGeometry());

                   // create a buffer of the required meters around each line
                   var buffered = jstsGeom.buffer(bufferLength);
                   var bufferedFeature = new ol.Feature();
                   bufferedFeature.setGeometry(parser.write(buffered));
                   this.props.model.firBufferHiddenFeatureLayer.getSource().addFeature(bufferedFeature);
                   if(bufferGeom === false){
                       bufferGeom = buffered;
                   } else {
                       bufferGeom = bufferGeom.union(buffered);
                   }
               });
        });
        buffer.setGeometry(parser.write(bufferGeom));
        this.props.model.firBufferFeatureLayer.getSource().addFeature(buffer);

        this.props.model.set("hittaGrannar", true);
        this.props.model.set("bufferLength", bufferLength);
        this.props.model.get("backupItems").push(this.props.model.get("items"));

        this.setState({
            force: true
        });
        this.props.model.set('force', true);
        this.search();

        this.props.model.set('downloading', null);
        this.props.model.set('url', null);
    },

    rensaHittaGrannar: function(){
      this.props.model.firBufferFeatureLayer.getSource().clear();
      this.props.model.firFeatureLayer.getSource().clear();
      this.props.model.set("items", this.props.model.get("backupItems").pop());
      this.props.model.get("items").forEach(group => {
         group.hits.forEach(hit => {
            this.props.model.firFeatureLayer.getSource().addFeature(hit);
         });
      });
      this.forceUpdate();
    },

    bufferInput: function() {
        //document.getElementById("bufferValue").value = document.getElementById("bufferInput").value;
        var input = document.getElementById("bufferInput");
        var output = document.getElementById("bufferValue");

        output.value = input.value;

    },

    bufferBarInput: function() {
        document.getElementById("bufferInput").value = document.getElementById("bufferValue").value;
        //update hittaGrannar's bufferLength if value has changed
        /*document.getElementById("bufferValue").addEventListener("change",function() {
            console.log("bufferLength has Changed to", document.getElementById("bufferValue").value);
        });*/
    },

    openInstruction: function(id){
        console.log("openInstruction, id", id);
        var idName = "#instructionsTextFir" + id;
        console.log("idName", idName);
        var element = $(idName);
        element.toggle();
    },

    renderAnalysFunctions: function() {
        console.log("renderAnalysFunctions");

        var instructionBtn;
        var instructionTxt;
        console.log("--- instructionHittaGrannar", this.props.model.get("instructionHittaGrannar"));
        if (typeof this.props.model.get("instructionHittaGrannar") !== 'undefined' && this.props.model.get("instructionHittaGrannar") !== null && this.props.model.get("instructionHittaGrannar").length > 0) {
            instructionBtn = (
                <button onClick={() => this.openInstruction("hittaGrannar")} className='btn-info' id='instructionBox' ><img src={infologo} /></button>
            );
            instructionTxt = (
                <div className='panel-body-instruction instructionsText' id='instructionsTextFirhittaGrannar' dangerouslySetInnerHTML={{__html: this.props.model.get("instructionHittaGrannar")}} />
            );
        }
        var navPanel = document.getElementById('navigation-panel');
        navPanel.style.width = '417px';

        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Hitta grannar{instructionBtn}<button id="FIRHittaGrannarMinimizeButton" onClick={() => this.minBox('HittaGrannarMinimizeBox', "FIRHittaGrannarMinimizeButton")} className={this.props.model.get("searchMinimizedClassButton")}></button>
                    {instructionTxt}
                    </div>
                <div className='panel-body hidden' id='HittaGrannarMinimizeBox'>
                    <div><input type="radio" name="bufferOrNot" id="hittaGrannar" onClick={this.hittaGrannarUpdateRadio} defaultChecked={true}/> Hitta angränsade grannar <br/>
                    <div className="row"><div className="col-md-12"> <input type="radio" id="hittaGrannarMedBuffer" name="bufferOrNot" onClick={this.hittaGrannarUpdateRadio} /> Hitta grannar inom &nbsp;
                        <input id="bufferInput" type='text' ref='bufferInput' defaultValue="50" onChange={this.bufferInput}/> meter </div></div><br/>
                    <input id="bufferValue" type="range" min="0" max="100" defaultValue="50" onChange={() => {this.bufferBarInput(); this.hittaGrannarUpdateRadio()}}/>
                    </div><br/>
                    <div className='pull-right'>
                        <button id="fir-search-hitta-grannar" onClick={() => this.hittaGrannar()} type='submit' className='btn btn-primary'>Sök</button>&nbsp;
                        <button onClick={() => this.rensaHittaGrannar()} type='submit' className='btn btn-primary' id='rensaHittaGrannar'>Rensa</button>
                    </div>
                </div>
            </div>
        );
    },

    minBox: function (kategori, buttonId) {
        var item = $('#'+kategori);
        console.log("item", item);
        if(typeof item === 'undefined'){
            console.log("typeOfKategori is undefined");
            return;
        }

        console.log("class", item[0].attributes["class"].value);
        item.toggleClass('hidden');

        var buttonClass = item[0].attributes["class"].value.indexOf("hidden") === -1
            ? 'fa fa-angle-up clickable arrow pull-right arrowBoxSize'
            : 'fa fa-angle-down clickable arrow pull-right arrowBoxSize';
        this.props.model.set("searchExpandedClassButton", buttonClass);
        document.getElementById(buttonId).className = buttonClass;

    },

    exaktMatching: function(event) {
        console.log("sök exakt matching");
        this.props.model.set("exaktMatching", false);
        var exaktSearching = document.getElementById("exaktMatching").checked;
        console.log("this.props.model.exaktSearching", this.props.model.get("exaktMatching"));

        if(exaktSearching){
            this.props.model.set("exaktMatching", exaktSearching);
            console.log("TRUE");
        }else{
            this.props.model.set("exaktMatching", exaktSearching);
            console.log("FALSE");
        }
        console.log("exaktMatching", this.props.model.get("exaktMatching"));
    },

    /**
     * Render the panel component.
     * @instance
     * @return {external:ReactElement}
     */
    render: function () {
        var results = null,
            value = this.props.model.get('value'),
            showResults = this.props.model.shouldRenderResult(false),
            options = this.renderOptions(),
            searchExpandedClassButton= "fa fa-angle-up clickable arrow pull-right";

        if (showResults) {
            if (this.state.loading) {
                results = (
                    <p>
                        <span className='sr-only'>Laddar...</span>
                        <i className='fa fa-refresh fa-spin fa-3x fa-fw' />
                    </p>
                );
            } else {
                if ((this.refs.searchInput &&
                    this.refs.searchInput.value.length > 3) ||
                    this.props.model.get('force')) {
                    results = this.renderResults();
                } else {
                    results = (
                        <p className='alert alert-info'>
                            Skriv minst fyra tecken för att påbörja automatisk sökning. Tryck på <b>retur</b> för att forcera en sökning.
                        </p>
                    );
                }
            }
        }

        var search_on_input = (event) => {
            this.value = event.target.value;
            this.props.model.set('value', this.value);
            this.setState({
                value: this.value,
                force: false
            });
            this.props.model.set('force', false);
            if (this.refs.searchInput.value.length > 3) {
                this.search();
            } else {
                this.setState({
                    loading: false
                });
            }
            this.props.model.set('downloading', null);
            this.props.model.set('url', null);
        };

        var search_on_click = (event) => {
            this.setState({
                force: true
            });
            this.props.model.set('force', true);
            this.search();

            this.props.model.set('downloading', null);
            this.props.model.set('url', null);
        };

        var firSelectionToolbar = this.props.model.get('firSelectionTools')
            ? <FirSelectionToolbar model={this.props.model.get('firSelectionModel')} />
            : null;

        var fastighetsforteckning = this.renderFastighetsForteckning();
        var analysFunctions = this.renderAnalysFunctions();


        // Infoknapp
        var instructionBtn;
        var instructionTxt;
        console.log("--- Instruction for Sökning", this.props);
        if (typeof this.props.model.get("instructionSokning") !== 'undefined' && this.props.model.get("instructionSokning") !== null && this.props.model.get("instructionSokning").length > 0) {
            instructionBtn = (
                <button onClick={() => this.openInstruction("sokning")} className='btn-info' id='instructionBox' ><img src={infologo} /></button>
            );
            instructionTxt = (
                <div className='panel-body-instruction instructionsText' id='instructionsTextFirsokning' dangerouslySetInnerHTML={{__html: this.props.model.get("instructionSokning")}} />
            );
        }
        var navPanel = document.getElementById('navigation-panel');
        navPanel.style.width = '417px';

        return (
                <div className='search-tools'>
                <div className='panel panel-default'>
                    <div className='panel-heading'>Sökning {instructionBtn}<button id="FIRSearchMinimizeButton" onClick={() => this.minBox('FIRSearchMinimizeBox', "FIRSearchMinimizeButton")} className={this.props.model.get("searchExpandedClassButton")}></button>
                        {instructionTxt}
                        </div>
                    <div className='panel-body visible' id='FIRSearchMinimizeBox'>
                        <div className='form-group'>
                        {options}
                        <div className='input-group'>
                            <div className='input-group-addon'>
                                <i className='fa fa-search' />
                            </div>
                            <input
                                type='text'
                                ref='searchInput'
                                className='form-control'
                                placeholder='Ange fastighet..'
                                value={value}
                                onKeyDown={this.handleKeyDown}
                                onChange={search_on_input} />
                        </div>
                        <div className='clearfix'>
                            <input type="checkbox" id="exaktMatching" onClick={(e)=> this.exaktMatching(e)} />  Sök exakt matching <br/>
                            {/*<span className='info-text clearfix'>Inled sökningen med * för att söka på delar av en text.</span>*/}
                        </div><br/>
                            {firSelectionToolbar}
                    </div>
                        <div className='pull-right'>
                            <button onClick={search_on_click} type='submit' className='btn btn-primary'>Sök</button>&nbsp;
                            <button onClick={this.clear} type='submit' className='btn btn-primary' id='sokRensa'>Rensa</button>
                        </div>
                    </div>
                    </div>
                    {analysFunctions}
                    {fastighetsforteckning}
                    {results}
                </div>
        );
    }
};

/**
 * SearchView module.<br>
 * Use <code>require('components/search')</code> for instantiation.
 * @module SearchView-module
 * @returns {SearchView}
 */
module.exports = React.createClass(FirSearchView);




