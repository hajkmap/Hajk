var Panel = require('views/panel');
var LayerItem = require('views/layeritem');
/**
 *
 *
 */
var LayerPanel = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {
      /** */
      visible: false
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {
    this.props.model.on("change:layerCollection", this.onLayerCollectionChanged, this);
    this.setState({
      layers: this.props.model.get("layerCollection")
    });
  },
  /**
   *
   *
   */
  componentWillUnmount: function () {
    this.props.model.off("change:layerCollection", this.onLayerCollectionChanged, this);
  },
  /**
   *
   *
   */
  onLayerCollectionChanged: function () {
    this.setState({ layers: this.props.model.get("layerCollection") });
  },

  getLayers: function (group) {
    var layers = this.props.model.get("layerCollection");

    if (!layers) return null;

    layers = layers.toArray();
    return layers
          .filter(layer => layer.get('group') === group)
          .map((layer, index) => <LayerItem key={"layer_" + index} layer={layer} /> )
          .reverse();
  },

  renderGroups: function recursive(groups) {
    return groups.map((group, i) => {
      var layers = this.getLayers(group.id)
      ,   subgroups;
      if (group.hasOwnProperty("groups")) {
        subgroups = recursive.call(this, group.groups);
      }
      return (
        <div key={i}>
          <div>{group.name}</div>
          {layers}
          {subgroups}
        </div>
      )
    })
  },
  /**
   *
   *
   */
  render: function () {
    var layers = []
    var groups = this.renderGroups(this.props.model.get('groups'));

    return (
      <Panel title="Teckenförklaring" onCloseClicked={this.props.onCloseClicked} >
        <div className="layer-panel">
          {groups}
        </div>
      </Panel>
    );
  }
});


module.exports = LayerPanel;