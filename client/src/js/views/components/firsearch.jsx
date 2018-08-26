var FirSelectionToolbar = require('components/firselectiontoolbar');
var FirSearchResultGroup = require('components/firsearchresultgroup');
var firstSlider = true;

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
        var slider = document.getElementById("bufferValue");
        var output = document.getElementById("buffert");
        output.innerHTML = slider.value;

        slider.oninput = function(){
            output.innerHTML = this.value;
        }

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
        this.props.model.clear();

        if (document.getElementById('alertSearchbar') != null) {
            document.getElementById('alertSearchbar').remove();
        }

        this.setState({
            loading: true,
            showResults: true,
            result: []
        });
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
                    result.items.map(item => {
                        var groupName = item.layer;
                        item.hits.map(hit => {
                            this.props.model.highlightResultLayer.getSource().addFeature(hit);
                        });
                    });
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
                this.update();
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
                        <option value='*'>--  Alla  --</option>
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

        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Skapa fastighetsförteckning</div>
                <div className='panel-body'>
                    <p>Inkludera i förteckning:</p>
                    <input type="checkbox" id="traktnamn" onClick={()=> this.checkBoxFir("traktnamn")} /> Fastigheter <br/>
                    <input type="checkbox" id="text" onClick={()=> this.checkBoxFir("text")} /> Marksamfälligheter <br/>
                    <input type="checkbox" id="typ" onClick={()=> this.checkBoxFir("typ")} /> Gemensamhetsanläggningar <br/>
                    <input type="checkbox" id="nyckel" onClick={()=> this.checkBoxFir("nyckel")} /> Rättigheter <br/><br/>
                <div>
                    <span className='pull-left'>{excelButton}</span>&nbsp;&nbsp; <span className='right'>Skapa fastighetsförteckning från sökresultat</span>
                    <div>{downloadLink}</div>
                </div>
                </div>
            </div>
        );
    },

    renderAnalysFunctions: function() {

        /*var slider = document.getElementById("bufferValue");
        var output = document.getElementById("buffert");
        output.innerHTML = this.value;

        slider.oninput = function(){
        output.innerHTML = this.value;
        }
        */
        if(firstSlider){
            console.log("first slider");
            var slider = <input type="range" min="0" max="100" value="50" id="bufferValue" />;
            var output = <span id="buffert"></span>;

            output.innerHTML = 50;
            console.log("slider", slider);
            console.log("output", output);
            firstSlider = false;
        }


        return (
            <div className='panel panel-default'>
                <div className='panel-heading'>Analyser</div>
                <div className='panel-body'>
                    <input type="checkbox" id="hittaNarmaste" onClick={()=> this.checkBoxFir("traktnamn")} /> Hitta närmaste <br/>
                    <input type="range" min="0" max="100" value="50" id="bufferValue" />
                        <p>Buffert: <span id="buffert"></span></p>
                </div>
            </div>
        );
    },

    /*slide: function() {
        console.log(this);
        var output = document.getElementById("buffert");
        console.log("output", output);
        output.innerHTML = this.value;
    },
    */

    minBox: function() {
        var contains = $('#FIRSearchMinimizeBox');
        if(typeof contains === 'undefined'){
            return;
        }
        contains.toggle(function(){
                $('#FIRSearchMinimizeBox').toggleClass("visible, hidden");
            },function(){
                $('#FIRSearchMinimizeBox').toggleClass('hidden, visible');
            }
        );

        var buttonClass = $("#FIRSearchMinimizeBox")[0].attributes["class"].value.indexOf("hidden") !== -1
            ? 'fa fa-angle-up clickable arrow pull-right arrowBoxSize'
            : 'fa fa-angle-down clickable arrow pull-right arrowBoxSize';
        this.props.model.set("searchExpandedClassButton", buttonClass);
        document.getElementById("FIRSearchMinimizeButton").className = buttonClass;

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

        return (
                <div className='search-tools'>
                <div className='panel panel-default'>
                    <div className='panel-heading'>Sökning <button id="FIRSearchMinimizeButton" onClick={() => this.minBox()} className={this.props.model.get("searchExpandedClassButton")}></button></div>
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
                            <span className='info-text clearfix'>Inled sökningen med * för att söka på delar av en text.</span>
                        </div><br/>
                            {firSelectionToolbar}
                    </div>
                        <button onClick={search_on_click} type='submit' className='btn btn-primary'>Sök</button>&nbsp;
                        <button onClick={this.clear} type='submit' className='btn btn-primary' id='sokRensa'>Rensa</button>
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




