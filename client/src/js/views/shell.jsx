var MapView = require('views/map');
var MapModel = require('models/map');
var Toolbar = require('views/toolbar');
var LayerCollection = require('collections/layers');
var Toolcollection = require('collections/tools');
var NavigationPanel = require('views/navigationpanel');
var NavigationPanelModel = require("models/navigation");
/**
 *
 *
 */
var Shell = React.createClass({
  /**
   *
   *
   */
  getDefaultProps : function () {
    return {
      /** */
      config: {
        /** */
        layers: [],
        /** */
        tools: [],
        /** */
        map: {}
      }
    };
  },
  /**
   *
   *
   */
  getInitialState: function () {
    return {
      mapModel: undefined,
      toolsCollection: undefined,
      navigationModel: undefined
    };
  },
  /**
   *
   *
   */
  shouldComponentUpdate: function () {
    return true;
  },
  /**
   *
   *
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
   *
   *
   */
  componentDidMount: function () {
    this.model.configure.call(this.model);
    this.setState({
      views: [
        <MapView key={this.model.cid} id={this.model.cid} />,
        <Toolbar key="toolbar" model={this.model.get('toolCollection')} />,
        <NavigationPanel key="navigation" model={this.model.get('navigation')} />
      ]
    });
  },
  /**
   *
   *
   */
  render: function () {
    var views = this.state.views;
    return (
      <div className="shell">
        <div className="map-logo"></div>
        {views}
      </div>
    );
  }

});


module.exports = Shell;