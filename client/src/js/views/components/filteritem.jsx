/**
 * React Class Filter Item
 * @class
 */
var FilterItem = React.createClass ({
  /**
   *
   *
   */
  render: function () {

    var filter = this.props.filter;
    var number = filter.attributes.num;
    var type = filter.attributes.type.charAt(0).toUpperCase() + filter.attributes.type.slice(1);

    return (
      <a
        href="#"
        className="list-group-item filter-item"
        title="Ta bort filter">
        <span>{type} {number}</span>
        <i onClick={this.props.removeFilter} className="delete fa icon fa-remove"></i>
      </a>
    );
  }
});

module.exports = FilterItem;