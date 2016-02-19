/**
 * React Class Legend Item
 * @class
 */
var LegendItem = React.createClass({
  /**
   *
   *
   */
  onClick: function (e) {
    e.preventDeafult();
  },
  /**
   *
   *
   */
  render: function () {

    var icon = this.props.icon;
    var text = this.props.text;

    return (
      <div className="media">
        <div className="media-left media-top">
          <a href="#layermanager" onClick={this.onClick}>
            <img className="media-object" src={icon} alt="legend" />
          </a>
        </div>
      <div className="media-body">
        <h4 className="media-heading"></h4>
        {text}
      </div>
      </div>
    );
  }
});

module.exports = LegendItem;