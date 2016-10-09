var LegendItem = React.createClass({
  render: function () {
    return (
      <div>
        <img className="media-object" src={this.props.icon} alt="legend" />
      </div>
    );
  }
});

module.exports = LegendItem;