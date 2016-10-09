var LegendItem = require('components/legenditem');

/**
 * @class
 */
var LegendView = {
  /**
   * Render the legend item component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <div className="legend">
      {
        this.props.legends.map((legend, index) =>
          <LegendItem key={"legend_" + index} icon={legend.Url} text={legend.Description} />
        )
      }
      </div>
    );
  }
};

/**
 * LegendView module.<br>
 * Use <code>require('views/legend')</code> for instantiation.
 * @module LegendView-module
 * @returns {LegendView}
 */
module.exports = React.createClass(LegendView);