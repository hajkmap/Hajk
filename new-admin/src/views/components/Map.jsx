import React from "react";
import { Component } from "react";
import OpenLayersMap from "./../../models/OpenLayersMap.js";
import LayerList from "./LayerList.jsx";

const target = "map";

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chapter: props.chapter
    };
  }

  componentDidRecieveProps() {}

  componentDidUpdate() {}

  componentDidMount() {
    this.map = new OpenLayersMap({
      target: target,
      config: this.props.chapter.mapSettings,
      mapSettings: this.props.mapSettings,
      onUpdate: this.props.onMapUpdate,
      wmsUrl: this.props.config.wms_url,
      wmsLayers: this.props.config.wms_layers
    });
    this.setState({
      map: this.map
    });
  }

  update = checkedLayers => {
    if (this.map) {
      this.map.setLayers(checkedLayers);
    }
    this.props.onLayersUpdate(checkedLayers);
  };

  renderCoordinateSystemOptions(coordinateSystems) {
    return coordinateSystems.map((coordinateSystem, i) => (
      <option key={i}>{coordinateSystem}</option>
    ));
  }

  render() {
    return (
      <div id={target} style={{ height: "100%" }}>
        <LayerList
          map={this.props.map}
          config={this.props.config}
          chapter={this.props.chapter}
          onUpdate={this.update}
          onLoaded={layersConfig => {
            this.map.setLayersConfig(layersConfig);
            this.map.setLayers(this.props.chapter.layers);
          }}
        />
      </div>
    );
  }
}

export default Map;
