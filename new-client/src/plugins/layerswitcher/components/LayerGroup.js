import React, { Component } from "react";
import "./LayerGroup.css";

class LayerGroup extends Component {
  
  render() {    
    return (
      this.props.groups.map((group, i) => {        
        return (
          <div key={i}>
            <h1>{group.name}</h1>
            {group.layers.map((layer, i) => { 
              var mapLayer = this.layerSwitcherModel.layerMap[Number(layer.id)];
              if (mapLayer) {
                return (<LayerItem key={i} layer={mapLayer} />);
              } else {
                return null;
              }
            })}            
          </div>
        )        
      })
    );    
  }
}

export default LayerGroup;
