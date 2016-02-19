var FilterResultItem = require('components/filterresultitem');
/**
 * React Class Item List
 * @class
 */
var ItemList = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {
      /** */
      matchedServices: [],
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {
    this.setState({matchedServices: this.props.matchedServices});
  },
  /**
   *
   *
   */
  closeDropDown: function () {
    this.setState({matchedServices: []});
  },
  /**
   *
   *
   */
  render: function () {
    var elements = [];
    var matchedServices = this.props.matchedServices;
    var popups = matchedServices;
    var filterList = this.props.filterList;
    var resetGraphics = this.props.resetGraphics;

    if (popups.length < 1) {
        return null;
    }

    if (popups) {
      elements = _.map(popups, (popup, index) => {
        return (
          <FilterResultItem
            key={'FilterResultItem_' + popups[index].num + '_' +popups[index].type}
            type={popups[index].type}
            num={popups[index].num}
            removeFilter={this.props.removeFilter}
            filterList={filterList}
            addFilter={this.props.addFilter} />
        );
      });
    }

    return (
      <div className="filter-popup">
        <i className="fa icon fa-remove" onClick={resetGraphics} style={{cursor: 'pointer'}}></i>
        <div className="list-group filter-search-result-list">
          {elements}
        </div>
      </div>
    );
  }
});

module.exports = ItemList;