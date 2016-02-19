var FilterResultAlternatives = require('components/filterresultalternatives');
/**
 * React Class Filter Result Item
 * @class
 */
var FilterResultItem = React.createClass ({
  /**
   *
   *
   */
  getInitialState: function() {
    return {
      showAlternatives: false
    };
  },
  /**
   *
   *
   */
  toggleAlternatives: function (e) {
    e.preventDefault();
    if (this.state.showAlternatives) {
      this.setState({showAlternatives: false});
    } else {
      this.setState({showAlternatives: true});
    }
  },
  /**
   *
   *
   */
  render: function () {
    var number = this.props.num;
    var type = this.props.type;
    var filterList = this.props.filterList;
    var toggleAlts = _.bind(this.toggleAlternatives, this);

    //Den yttre diven kan inte vara en knapp utan onClick, då fungerar denna komponent inte i IE.
    return (
      <div className="list-group-item" style={{background: '#f5f5f5'}}>
        <div onClick={this.toggleAlternatives} style={{cursor: 'pointer'}}>
          <span>{number}</span>
          <span className="label label-primary pull-right">{type}</span>
        </div>
        <FilterResultAlternatives
          show={this.state.showAlternatives}
          removeFilter={this.props.removeFilter}
          filterList={filterList}
          addFilter={this.props.addFilter}
          type={type} num={number} />
      </div>
    );
   }
});

module.exports = FilterResultItem;