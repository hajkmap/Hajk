var Panel = require('views/panel');
var KirSearch = require('components/kirsearch');

var KirPanelView = {
  getInitialState: function () {
    return {
      visible: false
    };
  },

  render: function () {
    return (
      <Panel title='KIR' onCloseClicked={this.props.onCloseClicked}
        onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}
        instruction={window.atob(this.props.model.get('instruction'))}>
          <div className='panel-content'>
              <KirSearch model={this.props.model} navigationPanel={this.props.navigationPanel} />
          </div>
      </Panel>
    );
  }
};

module.exports = React.createClass(KirPanelView);
