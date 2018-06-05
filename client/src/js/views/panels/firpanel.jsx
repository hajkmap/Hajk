var Panel = require('views/panel');

var FirPanelView = {

    getInitialState: function () {
        return{
        };
    },

    componentDidUpdate: function () {
    },

    componentDidMount: function () {
    },

    generate: function () {
    },

    render: function () {
        return (
            <Panel title='FIR' onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={window.atob(this.props.model.get('instruction'))}>
                <div className='panel-content'>
                    <p>FIR</p>
                </div>
            </Panel>
        );
    }
};

module.exports = React.createClass(FirPanelView);