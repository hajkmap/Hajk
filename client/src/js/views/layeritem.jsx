var LayerItem = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {
      caption: "",
      visible: false,
      expanded: false,
      name: "",
      legend: [],
      labelFields: [],
      labelVisibility: false,
      filtered: false,
      filterApplied: false,
      filterable: false,
      filterList: []
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {
    this.props.layer.on("change:visible", this.onVisibleChanged, this);
    this.props.layer.on("change:legend", this.onLegendChanged, this);
    this.props.layer.on("change:labelVisibility", this.onLabelVisibility, this);
    this.props.layer.on("change:filterApplied", this.onFilterApplied, this);
    this.props.layer.on("change:filtered", this.onFilteredChanged, this);
    this.props.layer.on('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.get('filterList').on('add', this.onFilterListItemAdded, this);
    this.props.layer.get('filterList').on('remove', this.onFilterListItemRemoved, this);
    this.props.layer.get('filterList').on('reset', this.onFilterListReset, this);
    this.setState({
      caption: this.props.layer.getCaption(),
      visible: this.props.layer.getVisible(),
      showLegend: this.props.layer.get('showLegend'),
      labelVisibility: this.props.layer.getLabelVisibility(),
      legend: this.props.layer.getLegend(),
      labelFields: this.props.layer.getLabelFields(),
      filterable: this.props.layer.getFilterable(),
      filterApplied: this.props.layer.getFilterApplied(),
      filterList: this.props.layer.getFilterList(),
      filtered: this.props.layer.getFiltered(),
    });
  },
  /**
   *
   *
   */
  componentWillUnmount: function () {
    this.props.layer.off("change:visible", this.onVisibleChanged, this);
    this.props.layer.off("change:legend", this.onLegendChanged, this);
    this.props.layer.off("change:labelVisibility", this.onLabelVisibility, this);
    this.props.layer.off("change:filterApplied", this.onFilterApplied, this);
    this.props.layer.off("change:filtered", this.onFilteredChanged, this);
    this.props.layer.off('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.get('filterList').off('add', this.onFilterListItemAdded, this);
    this.props.layer.get('filterList').off('remove', this.onFilterListItemRemoved, this);
    this.props.layer.get('filterList').off('reset', this.onFilterListReset, this);
  },
  /**
   *
   *
   */
  onVisibleChanged: function () {
    this.setState({ visible: this.props.layer.getVisible() });
  },
  /**
   *
   *
   */
  onLegendChanged: function () {
    this.setState({ legend: this.props.layer.getLegend() });
  },
  /**
   *
   *
   */
  onLabelVisibility: function () {
    this.setState({ labelVisibility: this.props.layer.getLabelVisibility() });
  },
  /**
   *
   *
   */
  onFilterApplied: function () {
    this.setState({ filterApplied: this.props.layer.getFilterApplied() });
  },
  /**
   *
   *
   */
  onFilteredChanged: function () {
    this.setState({ filtered: this.props.layer.getFiltered() });
  },
  /**
   *
   *
   */
  onShowLegendChanged: function () {
    this.setState({ showLegend: this.props.layer.get('showLegend') });
  },
  /**
   *
   *
   */
  onFilterListItemAdded: function (m) {
    this.state.filterList.push(m);
    this.setState({filterList: this.state.filterList});
  },
  /**
   *
   *
   */
  onFilterListItemRemoved: function (m) {
    this.state.filterList.splice(_.indexOf(this.state.filterList, m), 1);
    this.setState({filterList: this.state.filterList});
  },
  /**
   *
   *
   */
  onFilterListReset: function () {
    this.setState({ filterList: [] });
  },
  /**
   *
   *
   */
  toggleVisible: function (e) {
    e.stopPropagation();
    this.props.layer.set({ visible: !this.state.visible });
  },
  /**
   *
   *
   */
  toggleLegend: function (e) {
    e.stopPropagation();
    this.props.layer.set('showLegend', !this.state.showLegend);
  },
  /**
   *
   *
   */
  render: function () {
    var caption = this.state.caption;
    var toggleLegend = _.bind(this.toggleLegend, this);
    var expanded = this.state.showLegend;
    var visible = this.state.visible;
    var toggleVisible = _.bind(this.toggleVisible, this);

    if (!caption) {
      return null;
    }

    var components = this.props.layer.getExtendedComponents({
      legendExpanded: expanded
    });

    var innerBodyClass = expanded && components.legend.legendPanel ? "panel-body" : "hidden";

    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading" onClick={toggleLegend}>
          <span onClick={toggleVisible} className="clickable">
            <i className={visible ? 'fa fa-check-square': 'fa fa-square'}></i>&nbsp;
            <span className="layer-item-header-text">{caption}</span>
          </span>
          {components.legend.legendButton}
          {components.filterButton}
        </div>
        <div className={innerBodyClass}>
          {components.labelButton}
          {components.filterList}
          {components.legend.legendPanel}
        </div>
      </div>
    );
  }
});

module.exports = LayerItem;