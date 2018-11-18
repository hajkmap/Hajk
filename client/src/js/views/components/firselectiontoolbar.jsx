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
            activeTool: this.props.model.get('activeTool')
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
            console.log("///Inside activeTool: undefined");
        } else {
            this.props.model.setActiveTool(name);
            console.log("///Inside activeTool: name is", name);
        }



        var map = this.props.model.get("map");
        map.un('singleclick', this.firRemoveSelected);
        //map.un("singleclick", this.activateTool(name));
        //map.removeInteraction(this.activateTool(name));
    },

    finishedDrawing: function() {
        this.props.model.setActiveTool(undefined);
        // this.props.model.get("drawLayer").getSource().on("addfeature", this.bufferSearchingInput);
    },

    deleteMarker: function(){
        var map = this.props.model.get("map");
        map.on('singleclick', this.firRemoveSelected);

    },

    firRemoveSelected: function(event){
        console.log("firRemoveSelected");
        var map = this.props.model.get("map");
        console.log("firRemoveSelected2");
        var source = this.props.model.get("highlightLayer").get("source");
        console.log("firRemoveSelected3");

        // souce for buffer
        var sourceBuffer = this.props.model.get("firBufferLayer").get("source");
        console.log("firRemoveSelected4");

        map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
            console.log("firRemoveSelected5");
            if (layer.get("caption") === "search-selection-layer") {
                layer.getSource().removeFeature(feature);
            }else if(layer.get("name") === "fir-searching-buffer-layer"){
                layer.getSource().removeFeature(feature);
                console.log("firRemoveSelected6", this);
                console.log("feature (buffer)", feature);
                this.props.model.get("drawLayer").getSource().removeFeature(feature.get("originalFeature"));
            }
        }.bind(this));

        console.log("firRemoveSelected7", this);
        if(!ctrlIsDown) {
            map.un('singleclick', this.firRemoveSelected);
        }
    },

    getClassNames: function (type) {
        return this.state.activeTool === type
            ? 'btn btn-primary'
            : 'btn btn-default';
    },

    /**
     * Render the view
     * @instance
     * @return {external:ReactElement}
     */
    render: function () {
        var anchor = this.props.model.get('anchor');

        return (
            <div className='selection-toolbar'>
                <div><b>Sökområde</b></div>
                <div className='btn-group btn-group-lg'>
                    <button onClick={() => this.activateTool('polygonSelection')} type='button' className={this.getClassNames('polygonSelection')} title='Markera efter polygon' >
                        <i className='fa iconmoon-yta icon' />
                    </button>
                    <button onClick={() => this.activateTool('squareSelection')} type='button' className={this.getClassNames('squareSelection')} title='Markera flera objekt' >
                        <i className='fa fa-square-o icon' />
                    </button>
                    <button onClick={() => this.activateTool('lineSelection')} type='button' className={this.getClassNames('lineSelection')} title='Markera efter polygon' >
                        <i className='fa iconmoon-linje icon' />
                    </button>
                    <button onClick={() => this.activateTool('pointSelection')} type='button' className={this.getClassNames('pointSelection')} title='Markera efter polygon' >
                        <i className='fa fa-circle icon' />
                    </button>
                    <button onClick={() => this.deleteMarker()} type='button' className={this.getClassNames('minusSelection')} title='Ta bort objekt' >
                        <i className='fa fa-trash fa-0' />
                    </button>
                </div>

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
                <div>
                    Lägg till buffert &nbsp; <input id="bufferSearchingInput" type='text' ref='bufferSearchingInput' defaultValue="0" onChange={this.props.model.bufferSearchingInput}/> meter till sökområde
                </div>


            </div>
        );
    }
};

/**
 * SelectionPanelView module.<br>
 * Use <code>require('views/anchorpanel')</code> for instantiation.
 * @module SelectionPanelView-module
 * @returns {SelectionPanelView}
 */
module.exports = React.createClass(FirSelectionPanelView);
