var Panel = require('views/panel');

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
    },

    addMarker: function() {
        console.log("addMarker", this);

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
                <div>Sök baserat på markering i kartan</div>
                <div className='btn-group btn-group-lg'>
                    <button onClick={() => this.activateTool('drawSelection')} type='button' className={this.getClassNames('drawSelection')} title='Markera efter polygon' >
                        <i className='fa iconmoon-yta icon' />
                    </button>
                    <button onClick={() => this.activateTool('squareSelection')} type='button' className={this.getClassNames('squareSelection')} title='Markera flera objekt' >
                        <i className='fa fa-crop icon' />
                    </button>
                    <button onClick={() => this.activateTool('lineSelection')} type='button' className={this.getClassNames('lineSelection')} title='Markera efter polygon' >
                        <i className='fa iconmoon-linje icon' />
                    </button>
                    <button onClick={() => this.activateTool('pointSelection')} type='button' className={this.getClassNames('pointSelection')} title='Markera efter polygon' >
                        <i className='fa fa-circle icon' />
                    </button>
                </div>&nbsp;&nbsp;&nbsp;&nbsp;<b>Rita sökområde</b><div></div><br/>

                <div className='btn-group btn-group-lg'>
                    <button onClick={() => this.addMarker()} type='button' className={this.getClassNames('plusSelection')} style={{backgroundColor: "green"}} title='Markera efter polygon' >
                        <i className='fa fa-check fa-0' />&nbsp;<span style={{fontSize: 16}}>Klar</span>
                    </button>
                    <button onClick={() => this.deleteMarker()} type='button' className={this.getClassNames('minusSelection')} title='Markera flera objekt' >
                        <i className='fa fa-trash fa-0' />&nbsp;<span style={{fontSize: 16}}>Radera Objekt</span>
                    </button>
                </div>&nbsp;&nbsp;&nbsp;&nbsp;<b>Ändra urval</b>

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
