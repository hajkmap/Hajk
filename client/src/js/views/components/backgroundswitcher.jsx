/**
 * React Class Legend Item
 * @class
 */
var BackgroundSwitcher = React.createClass({
  /**
   *
   *
   */
  setBackgroundLayer: function (layer) {
    this.props.layers.forEach(baselayer => {
      var visible = baselayer.id === layer.id;
      baselayer.setVisible(visible);
      baselayer.getLayer().setVisible(visible);
    });
  },
  /**
   *
   *
   */
  getSelected: function (layer) {
    var visibleLayers;
    if (this.state && this.state.selected) {
      if (this.state.selected === layer.get('id')) {
        return true;
      }
    }
    visibleLayers = this.props.layers.filter(layer => layer.getVisible());
    if (visibleLayers[0].id === layer.id) {
      return true;
    }
  },
  /**
   *
   *
   */
  renderLayers: function () {
    return (
      this.props.layers.map((layer, i) => {
        var index = "background-layer-" + i
        ,   checked = this.getSelected(layer);
        return (
          <li key={index}>
            <input id={index} name="background" type="radio" defaultChecked={checked} onChange={() => this.setBackgroundLayer(layer) }></input>
            <label htmlFor={index}>{layer.get('caption')}</label>
          </li>
        );
      })
    )
  },
  /**
   *
   *
   */
  render: function () {
    return (
      <div className="background-switcher">
        <h3>Bakgrundskartor</h3>
        <ul>
          {this.renderLayers()}
        </ul>
      </div>
    );
  }
});

module.exports = BackgroundSwitcher;