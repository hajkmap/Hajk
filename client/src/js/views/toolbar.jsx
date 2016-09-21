/**
 * Tooblar component
 *
 */
var Toolbar = React.createClass({
  /**
   * Load initial state
   *
   */
  getInitialState: function() {
    return {};
  },

  componentWillMount: function() {
    this.props.navigationModel.on('change:activePanelType', () => {
      this.setState({
        activeTool: this.props.navigationModel.get('activePanelType')
      });
    });
  },
  /**
   * Render the component
   * @return {React.Component} component
   */
  render: function () {
    var tools = this.props.model.filter(t => t.get('toolbar')).map((tool, index) => {

      var a = tool.get('panel').toLowerCase();
      var b = this.state.activeTool;

      var c = a === b ? 'btn btn-primary' : 'btn btn-default';

      return (
        <button
          type="button"
          className={c}
          onClick={() => {
            tool.clicked();
            this.props.navigationModel.set('r', Math.random());
          }}
          key={index}
          title={tool.get("title")}>
          <i className={ tool.get("icon") }></i>
        </button>
      );
    });

    return (
      <div className="map-toolbar-wrapper">
        <div
          className="btn-group btn-group-lg map-toolbar"
          role="group"
          aria-label="toolbar">
          {tools}
        </div>
      </div>
    );
  }

});

module.exports = Toolbar;