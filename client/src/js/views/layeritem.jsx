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
      status: "ok",
      labelVisibility: false
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {
    this.props.layer.on("change:status", this.onStatusChanged, this);
    this.props.layer.on("change:visible", this.onVisibleChanged, this);
    this.props.layer.on("change:legend", this.onLegendChanged, this);
    this.props.layer.on("change:labelVisibility", this.onLabelVisibility, this);
    this.props.layer.on('change:showLegend', this.onShowLegendChanged, this);
    this.setState({
      status: this.props.layer.get('status'),
      caption: this.props.layer.getCaption(),
      visible: this.props.layer.getVisible(),
      showLegend: this.props.layer.get('showLegend'),
      labelVisibility: this.props.layer.getLabelVisibility(),
      legend: this.props.layer.getLegend(),
      labelFields: this.props.layer.getLabelFields()
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
    this.props.layer.off('change:showLegend', this.onShowLegendChanged, this);
    this.props.layer.off("change:status", this.onStatusChanged, this);
  },
  /**
   *
   *
   */
  onStatusChanged: function () {
    this.setState({
      status: this.props.layer.get('status')
    });
  },
  /**
   *
   *
   */
  onVisibleChanged: function () {
    if (this.props.layer) {
      this.props.layer.getLayer().setVisible(this.props.layer.getVisible());
    }
    this.setState({
      visible: this.props.layer.getVisible()
    });
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
  onShowLegendChanged: function () {
    this.setState({ showLegend: this.props.layer.get('showLegend') });
  },
  /**
   *
   *
   */
  toggleVisible: function (e) {
    e.stopPropagation();
    this.props.layer.setVisible(!this.state.visible);
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
  renderStatus: function () {
    return this.state.status === "loaderror" ?
    (
      <span href="#" className="tooltip" title="Lagret kunde inte laddas in. Kartservern svarar inte.">
        <span title="" className="fa fa-exclamation-triangle tile-load-warning"></span>
      </span>
    ) : null;
  },
  /**
   *
   *
   */
  render: function () {
    var caption       = this.state.caption
    ,   expanded      = this.state.showLegend
    ,   visible       = this.state.visible
    ,   toggleLegend  = (e) => { this.toggleLegend(e) }
    ,   toggleVisible = (e) => { this.toggleVisible(e) };

    if (!caption) {
      return null;
    }

    var components = this.props.layer.getExtendedComponents({
      legendExpanded: expanded
    });

    var innerBodyClass = expanded && components.legend.legendPanel ? "panel-body" : "hidden";

    var statusClass = this.state.status === "loaderror" ? "fa fa-exclamation-triangle tile-load-warning tooltip" : "";

    return (
      <div className="panel panel-default layer-item">
        <div className="panel-heading" onClick={toggleLegend}>
          <span onClick={toggleVisible} className="clickable">
            <i className={visible ? 'fa fa-check-square': 'fa fa-square'}></i>&nbsp;
            <span className="layer-item-header-text">{caption}</span>&nbsp;
            {this.renderStatus()}
          </span>
          {components.legend.legendButton}
        </div>
        <div className={innerBodyClass}>
          {components.labelButton}
          {components.legend.legendPanel}
        </div>
      </div>
    );
  }
});

module.exports = LayerItem;