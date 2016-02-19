var Panel = require('views/panel');
var Filter = require('views/filter');
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
      layers: this.props.model.get("layerCollection"),
      filterTool: this.getFilterTool()
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

  /**
   *
   *
   */
  getFilterTool: function () {
    var toolCollection = this.props.model.get("shell").getToolCollection().toArray();
    var filterTool;
    filterTool = _.find(toolCollection, tool => tool.get('type') === 'filter');
    return filterTool;
  },

  /**
   *
   *
   */
  groupLayers: function (layers) {

    var groups = {};

    layers.forEach((layer, i) => {
      var g = layer.get('group');
      if (g) {
        if (!groups.hasOwnProperty(g)) {
          groups[g] = [];
        }
        groups[g].push(layer);
        delete layers[i]; // Pop the layers.
      }
    });

    layers = layers.filter((layer) => layer !== undefined);

    // Put the layergroup on top.
    for (var i in groups) {
      layers.push({
        groupLayer: true,
        layers: groups[i]
      });
    }

    return layers;
  },
  /**
   *
   *
   */
  render: function () {
    var layers = [],
       filterTool = this.getFilterTool();

    if (this.state.layers) {
      layers = this.state.layers
                   .toArray()
                   .map((layer, index) =>
                      <LayerItem key={"layer_" + index} layer={layer} />
                    )
                   .reverse();
    }

    //<Filter tool={filterTool}/>

    return (
      <Panel title="Teckenförklaring" onCloseClicked={this.props.onCloseClicked} >
        <div className="layer-panel">
          {layers}
        </div>
      </Panel>
    );
  }
});


module.exports = LayerPanel;