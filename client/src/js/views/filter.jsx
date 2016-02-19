var ItemList = require('components/itemlist');
var FilterResultBar = require('components/filterresultbar');
/**
 *
 *
 */
var Filter = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {
      /** */
      filterableLayers: [],
      /** */
      filterText: '',
      /** */
      popupElements: [{type: 'linje', num: '300'}],
      /** */
      services: [],
      /** */
      matchedServices: [],
      /** */
      resetFilter: false,
      /** */
      filterList: []
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {
    this.props.tool.on('change:matchedServices', (sender, value) => {this.setState({matchedServices: value})});
    this.props.tool.on('change:filterList', (sender, value) => { this.setState({ filterList: value })});
    this.setState({
      filterList: this.props.tool.getFilterList()
    });
  },
  /**
   *
   *
   */
  componentWillUnmount: function () {
    this.props.tool.off('change:matchedServices');
    this.props.tool.off('change:filterList');
  },
  /**
   *
   *
   */
  addFilter: function (filterOptions) {
    this.props.tool.addFilter(filterOptions);
  },
  /**
   *
   *
   */
  removeFilter: function (filterOptions) {
    this.props.tool.removeFilter(filterOptions);
  },
  /**
   *
   *
   */
  clearFilters: function () {
    this.props.tool.clearFilters.call(this.props.tool);
    this.props.tool.resetMatchedServices();
    $(this.getDOMNode()).find('input#filter-bar').val('');
  },
  /**
   *
   *
   */
  handleUserInput: function (userInput) {
    this.props.tool.handleUserInput(userInput);
  },
  /**
   *
   *
   */
  resetFilterGraphics: function () {
    this.props.tool.resetMatchedServices();
    $(this.getDOMNode()).find('input#filter-bar').val('');
  },
  /**
   *
   *
   */
  render: function () {
    var matchedServices = this.state.matchedServices;
    var resetFilter = this.state.resetFilter;
    var filterList = this.state.filterList;
    var removeFilter = _.bind(this.removeFilter, this);
    var addFilter = _.bind(this.addFilter, this);
    var clearFilters = _.bind(this.clearFilters, this);
    var resetFilterGraphics = _.bind(this.resetFilterGraphics, this);
    return (
      <div className="filter">
        <FilterResultBar
          ref="filterBar"
          onUserInput={this.handleUserInput}
          resetFilter={resetFilter}
          clearFilters={clearFilters} />
        <ItemList
          tool={this.props.tool}
          filterList={filterList}
          matchedServices={matchedServices}
          resetGraphics={resetFilterGraphics}
          removeFilter={removeFilter}
          addFilter={addFilter} />
      </div>
    );
  }
});

module.exports = Filter;