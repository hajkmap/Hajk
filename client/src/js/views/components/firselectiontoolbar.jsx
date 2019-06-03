var Panel = require('views/panel');
var deleteMarkerEnabled = false;
/**
 * @class
 */
var FirSelectionPanelView = {
    /**
     * Get initial state.
     * @instance
     * @return {object}
     */
    getInitialState: function () {
        return {
            activeTool: this.props.model.get('activeTool'),
            importKMLActive: false
        };
    },

    componentDidMount: function(){
        this.props.model.get("drawLayer").getSource().on("addfeature", this.props.model.bufferSearchingInput.bind(this.props.model));
    },

    /**
     * Triggered when the component is successfully mounted into the DOM.
     * @instance
     */
    componentWillMount: function () {
        this.props.model.on('change:activeTool', () => {
            this.setState({
                activeTool: this.props.model.get('activeTool')
            });
        });
    },

    componentWillUnmount () {
        this.props.model.setActiveTool('');
        this.props.model.off('change:activeTool');
    },

    activateTool: function (name) {
        if (this.props.model.get('activeTool') === name) {
            this.props.model.setActiveTool(undefined);
        } else {
            this.props.model.setActiveTool(name);
        }



        var map = this.props.model.get("map");
        map.un('singleclick', this.firRemoveSelected);
    },

    deleteMarker: function(){
        this.props.model.setActiveTool(undefined);
        var map = this.props.model.get("map");
        map.on('singleclick', this.firRemoveSelected);

    },

    firRemoveSelected: function(event){
        var map = this.props.model.get("map");
        var source = this.props.model.get("highlightLayer").get("source");

        // souce for buffer
        var sourceBuffer = this.props.model.get("firBufferLayer").get("source");

        map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
            if (layer.get("caption") === "search-selection-layer") {
                layer.getSource().removeFeature(feature);
            }else if(layer.get("name") === "fir-searching-buffer-layer"){
                layer.getSource().removeFeature(feature);
                this.props.model.get("drawLayer").getSource().removeFeature(feature.get("originalFeature"));
            }
        }.bind(this));

        if(!ctrlIsDown) {
            map.un('singleclick', this.firRemoveSelected);
        }
    },

    getClassNames: function (type) {
        return this.state.activeTool === type
            ? 'btn btn-primary'
            : 'btn btn-default';
    },

    openImportKml: function() {
        this.setState({importKMLActive: !this.state.importKMLActive});
    },


    renderImportKml: function () {
        function upload () {
            this.refs.firUploadIframe.addEventListener('load', () => {
                this.props.model.importDrawLayer(this.refs.firUploadIframe.contentDocument);
                var element = $(kmlImport);
                element.toggle();
                this.setState({ importKMLActive: false });
                this.props.model.setActiveTool(undefined);
                if(!$('#slackaBufferSokomrade').is(":checked")) {
                    $('#slackaBufferSokomrade').click();
                }
            });

        }

        var url = this.props.model.get('kmlImportUrl');
        var style = {display: 'none'};

        if(this.state.importKMLActive) {
            return (
                <div className='selection-toolbar' id='kmlImport'>
                    <p><b>Importera KML-fil</b></p>
                    <p4>Välj KML-fil att importera</p4>
                    <form id='fir-upload-form' method='post' action={url} target='fir-upload-iframe'
                          encType='multipart/form-data'>
                        <input onChange={upload.bind(this)} type='file' name='files[]' accept='.kml' multiple='false'
                               className='btn btn-default'/><br/>
                        <input type='submit' value='Ladda upp' name='fir-upload-file-form'
                               className='btn btn-default'/><br/>
                        <iframe id='fir-upload-iframe' name='fir-upload-iframe' ref='firUploadIframe' style={style}/>
                    </form>
                </div>
            );
        } else {
            return (
                <p></p>
            );
        }
    },
    /**
     * Render the view
     * @instance
     * @return {external:ReactElement}
     */
    render: function () {
        var anchor = this.props.model.get('anchor');
        var importKML = this.renderImportKml();

                return (
                <div className='selection-toolbar'>
                <div>Sökområde</div>
                <div className='btn-group btn-group-lg'>
                    <button onClick={() => this.activateTool('polygonSelection')} type='button' className={this.getClassNames('polygonSelection')} title='Markera efter polygon' >
                        <i className='fa iconmoon-yta icon' />
                    </button>
                    <button onClick={() => this.activateTool('squareSelection')} type='button' className={this.getClassNames('squareSelection')} title='Markera efter square' >
                        <i className='fa fa-square-o icon' />
                    </button>
                    <button onClick={() => this.activateTool('lineSelection')} type='button' className={this.getClassNames('lineSelection')} title='Markera efter Linje' >
                        <i className='fa iconmoon-linje icon' />
                    </button>
                    <button onClick={() => this.activateTool('pointSelection')} type='button' className={this.getClassNames('pointSelection')} title='Markera efter punkt' >
                        <i className='fa fa-circle icon' />
                    </button>
                    <button onClick={() => {this.openImportKml(); this.activateTool('kmlSelection')}} type='button' className={this.getClassNames('kmlSelection')} title='Importera KML-fil' >
                        <i className='fa fa-file-o fa-0' />
                    </button>
                    <button onClick={() => this.deleteMarker()} type='button' className={this.getClassNames('minusSelection')} title='Ta bort objekt' >
                        <i className='fa fa-trash fa-0' />
                    </button>
                </div>
                {importKML}

                    {/*
                <div className='btn-group btn-group-lg'>
                    <button onClick={() => this.finishedDrawing()} type='button' className={this.getClassNames('plusSelection')} style={{backgroundColor: "green"}} title='Markera efter polygon' >
                        <i className='fa fa-check fa-0' />&nbsp;<span style={{fontSize: 16}}>Klar</span>
                    </button>
                    <button onClick={this.deleteMarker} type='button' className={this.getClassNames('minusSelection')} title='Ta bort objekt' >
                        <i className='fa fa-trash fa-0' />&nbsp;<span style={{fontSize: 16}}>Radera Objekt</span>
                    </button>
                </div><br/><br/> */}
                <br/><br/>
                <div className="bufferToSokomrade">
                    Lägg till buffert &nbsp; <input id="bufferSearchingInput" type='text' ref='bufferSearchingInput' defaultValue="0" onChange={this.props.model.bufferSearchingInput}/> meter till sökområde
                </div>


            </div>);
    }
};

/**
 * SelectionPanelView module.<br>
 * Use <code>require('views/anchorpanel')</code> for instantiation.
 * @module SelectionPanelView-module
 * @returns {SelectionPanelView}
 */
module.exports = React.createClass(FirSelectionPanelView);
