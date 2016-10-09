/**
 * @class
 */
var MapView = {
  /**
   * Get default properties.
   * @instance
   * @return {object}
   */
  getDefaultProps : function () {
    return {
      id: "",
      loaded: function () {}
    };
  },

  shouldComponentUpdate: function () {
    return false;
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <div id={this.props.id} className="map-fullscreen"></div>
    );
  }
};

/**
 * MapView module.<br>
 * Use <code>require('views/map')</code> for instantiation.
 * @module MapView-module
 * @returns {MapView}
 */
module.exports = React.createClass(MapView);
