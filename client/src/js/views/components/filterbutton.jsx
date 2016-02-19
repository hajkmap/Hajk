/**
 * React Class Filter Button
 * @class
 */
var FilterButton = React.createClass({
  /**
   *
   *
   */
  render: function () {

    if (!this.props.filtered) {
      return null;
    }

    var title = this.props.applied ? "Avaktivera filter" : "Aktivera filter";
    var className = this.props.applied ? "fa fa-filter layer-filter-active" : "fa fa-filter layer-filter-inactive";

    return (
      <span
        className="clickable pull-right pull-right-offset"
        onClick={this.props.clicked} title={title}>
        <i className={className}></i>
      </span>
    );
  }
});

module.exports = FilterButton;