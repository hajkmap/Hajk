var MapView = require('views/map');
var MapModel = require('models/map');
var Toolbar = require('views/toolbar');
var LayerCollection = require('collections/layers');
var Toolcollection = require('collections/tools');
var NavigationPanel = require('views/navigationpanel');
var NavigationPanelModel = require("models/navigation");
/**
 * @class
 */
var ShellView = {
  /**
   * Get default properties.
   * @instance
   * @return {object}
   */
  getDefaultProps : function () {
    return {
      config: {
        layers: [],
        tools: [],
        map: {}
      }
    };
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      mapModel: undefined,
      toolsCollection: undefined,
      navigationModel: undefined,
      scale: 1
    };
  },

  shouldComponentUpdate: function () {
    return true;
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
    this.model = this.props.model;
    this.setState({
      views: [
        <MapView key={this.model.cid} id={this.model.cid} />
      ]
    });
  },

  formatScale: function(number) {
    var s = Math.round(number).toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.model.configure.call(this.model);
    this.setState({
      views: [
        <MapView key={this.model.cid} id={this.model.cid} />,
        <Toolbar key="toolbar" model={this.model.get('toolCollection')} navigationModel={this.model.get('navigation')} />,
        <NavigationPanel key="navigation" model={this.model.get('navigation')} />
      ],
      scale: this.formatScale(this.model.getMap().getScale())
    });

    this.model.getMap().getMap().on('change:view', () => {
      var view = this.model.getMap().getMap().getView();
      view.on('change:resolution', () => {
        this.setState({
          scale: this.formatScale(this.model.getMap().getScale())
        })
      });
    });

  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var views = this.state.views
    ,   scale
    ,   logo;

    if (views.length === 3) {
      if (this.model.get('map').get('logo')) {
        logo = (
          <div className="map-logo">
            <img src={this.model.get('map').get('logo')}></img>
          </div>
        );
      }

      scale = (
        <div className="map-scale">Skala 1:{this.state.scale}</div>
      )
    }

    return (
      <div className="shell">
        {logo}
        {scale}
        {views}
      </div>
    );
  }
};

/**
 * ShellView module.<br>
 * Use <code>require('views/shell')</code> for instantiation.
 * @module ShellView-module
 * @returns {ShellView}
 */
module.exports = React.createClass(ShellView);