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
    return (
      <div className="panel navigation-panel-inner">
        <div className="panel-heading">
          <span>{this.props.title}</span>
          <i className="fa fa-times pull-right clickable panel-close" onClick={this.props.onCloseClicked}></i>
        </div>
        <div className="panel-body">
          {this.props.children}
        </div>
      </div>
    );
  }
});

module.exports = Panel;