/**
 *
 *
 */
var Panel = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {};
  },
  /**
   *
   *
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
});

module.exports = Panel;