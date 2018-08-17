import React from 'react';
import { Component } from 'react';

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {      
      layers: [
      ]
    };
  }

  componentDidRecieveProps() {
  }

  componentDidUpdate() {    
  }

  getLayers(groups) {
    return groups.reduce((i, group) => {
      var layers = [];
      if (group.groups.length !== 0) {
        layers = [...this.getLayers(group.groups)];
      }
      return  [...i, ...group.layers, ...layers];
    }, []);
  }

  componentDidMount() {  
    fetch('http://localhost:55630/config/map_1').then(response => {            
      response.json().then(config => {        
        var layerSwitcherConfig = config.tools.find(tool => tool.type === "layerswitcher");        
        this.setState({
          layers: this.getLayers(layerSwitcherConfig.options.groups)
        })
      });
    });
  }  

  render() {
    return (            
      <ul className="layer-list-container">
        {this.state.layers.map(layer => 
          <li className="layer-list-item" key={layer.id}>{layer.id}</li>
        )}        
      </ul>      
    )
  }

}

export default Map;