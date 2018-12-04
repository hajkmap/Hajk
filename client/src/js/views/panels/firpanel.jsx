var Panel = require('views/panel');
var FirSearch = require('components/firsearch');

var FirPanelView = {

    getInitialState: function () {
        return{
            visible: false
        };
    },

    componentDidUpdate: function () {
    },

    componentDidMount: function () {
    },

    componentWillMount: function () {

    },

    generate: function () {
    },


    render: function () {
        return (
            <Panel title='FIR' onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={window.atob(this.props.model.get('instruction'))}>
                <div className='panel-content'>
                    <FirSearch model={this.props.model} navigationPanel={this.props.navigationPanel} />
                </div>
            </Panel>
        );
    }
};

module.exports = React.createClass(FirPanelView);