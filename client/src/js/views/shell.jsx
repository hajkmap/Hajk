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
      navigationModel: undefined
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
      ]
    });
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var views = this.state.views
    ,   logo;

    if (views.length === 3) {
      if (this.model.get('map').get('logo')) {
        logo = (
          <div className="map-logo">
            <img src={this.model.get('map').get('logo')}></img>
          </div>
        );
      }
    }

    return (
      <div className="shell">
        {logo}
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