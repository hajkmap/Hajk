/**
 * @class
 */
var PanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {};
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var toggleIcon = this.props.minimized ? "fa fa-plus" : "fa fa-times";
    toggleIcon += " pull-right clickable panel-close";
    return (
      <div className="panel navigation-panel-inner">
        <div className="panel-heading">
          <span>{this.props.title}</span>
          <i className={toggleIcon} onClick={this.props.onCloseClicked}></i>
        </div>
        <div className="panel-body">
          {this.props.children}
        </div>
      </div>
    );
  }
};

/**
 * PanelView module.<br>
 * Use <code>require('views/panel')</code> for instantiation.
 * @module PanelView-module
 * @returns {PanelView}
 */
module.exports = React.createClass(PanelView);