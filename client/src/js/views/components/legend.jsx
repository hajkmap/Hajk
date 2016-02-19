var LegendItem = require('components/legenditem');

/**
 * React Class Legend
 * @class
 */
var Legend = React.createClass({
  /**
   *
   *
   */
  showLabels: false,
  /**
   *
   *
   */
  toggleLabels: function () {
    this.showLabels = !this.showLabels;
    this.props.layer.setLabelVisibility(this.showLabels);
  },
  /**
   *
   *
   */
  render: function () {
    return (
      <div className="legend">
      {
        _.map(this.props.legends, (legend, index) =>  {
          return <LegendItem key={"legend_" + index} icon={legend.Url} text={legend.Description} />;
        })
      }
      </div>
    );
  }
});

module.exports = Legend;