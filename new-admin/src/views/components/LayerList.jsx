import React from "react";
import { Component } from "react";
import LayerListItem from "./LayerListItem.jsx";

class LayerList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      layers: [],
      checkedLayers: props.chapter.layers || []
    };
  }

  componentDidRecieveProps() {}

  componentDidUpdate() {}

  lookup(layerId) {
    var found = undefined;
    var layerTypes = Object.keys(this.layersConfig);
    for (let i = 0; i < layerTypes.length; i++) {
      for (let j = 0; j < this.layersConfig[layerTypes[i]].length; j++) {
        if (
          Number(this.layersConfig[layerTypes[i]][j].id) === Number(layerId)
        ) {
          found = this.layersConfig[layerTypes[i]][j].caption;
          break;
        }
      }
      if (found) {
        break;
      }
    }
    return found;
  }

  getLayers(layers, callback) {
    callback(
      layers
        .map(layer => {
          return {
            id: layer.id,
            name: this.lookup(layer.id)
          };
        })
        .filter(layer => layer.name !== undefined)
    );
  }

  flattern(groups) {
    return groups.reduce((i, group) => {
      var layers = [];
      if (group.groups.length !== 0) {
        layers = [...this.flattern(group.groups)];
      }
      return [...i, ...group.layers, ...layers];
    }, []);
  }

  componentDidMount() {
    async function getJson(url) {
      var reponse = await fetch(url);
      var json = await reponse.json();
      return json;
    }

    function readMapConfig(mapConfig) {
      var layerSwitcherConfig = mapConfig.tools.find(
          tool => tool.type === "layerswitcher"
        ),
        layers = this.flattern(layerSwitcherConfig.options.groups);

      this.getLayers(layers, lookedUpLayers => {
        this.setState({
          layers: lookedUpLayers
        });
      });
    }

    getJson(this.props.config.url_layers).then(layersConfig => {
      this.layersConfig = layersConfig;
      getJson(this.props.config.url_map + "/" + this.props.map).then(
        mapConfig => {
          readMapConfig.call(this, mapConfig);
          this.props.onLoaded(layersConfig);
        }
      );
    });

    this.props.onUpdate(this.state.checkedLayers);
  }

  onLayerListItemChanged(checked, layer) {
    var checkedLayers = this.state.checkedLayers;
    if (checked) {
      checkedLayers = [...checkedLayers, layer.id];
    } else {
      checkedLayers = checkedLayers.filter(layerId => layerId !== layer.id);
    }

    this.setState(
      {
        checkedLayers: checkedLayers
      },
      () => this.props.onUpdate(this.state.checkedLayers)
    );
  }

  render() {
    return (
      <ul className="layer-list-container">
        {this.state.layers.map(layer => {
          var checked = false;
          if (Array.isArray(this.props.chapter.layers)) {
            checked = !!this.props.chapter.layers.find(
              layerId => Number(layerId) === Number(layer.id)
            );
          }
          return (
            <LayerListItem
              checked={checked}
              key={layer.id}
              layer={layer}
              onChange={checked => {
                this.onLayerListItemChanged(checked, layer);
              }}
            />
          );
        })}
      </ul>
    );
  }
}

export default LayerList;
