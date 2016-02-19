/**
 *
 *
 */
var MapView = React.createClass({
  /**
   *
   *
   */
  getDefaultProps : function () {
    return {
      /** */
      id: "",
      /** */
      loaded: function () {}
    };
  },
  /**
   *
   *
   */
  shouldComponentUpdate: function () {
      return false;
  },
  /**
   *
   *
   */
  render: function () {
      return <div id={this.props.id} className="map-fullscreen"></div>;
  }
});

module.exports = MapView;
