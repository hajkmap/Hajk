/**
 * @class
 */
var ToolbarView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {};
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function() {
    this.props.navigationModel.on('change:activePanelType', () => {
      this.setState({
        activeTool: this.props.navigationModel.get('activePanelType')
      });
    });
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
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
};

/**
 * ToolbarView module.<br>
 * Use <code>require('views/toolbar')</code> for instantiation.
 * @module ToolbarView-module
 * @returns {ToolbarView}
 */
module.exports = React.createClass(ToolbarView);