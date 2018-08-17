import React from 'react';
import { Component } from 'react';
import OpenLayersMap from './../../models/OpenLayersMap.js';
import LayerList from './LayerList.jsx';

const target = "map";

class Map extends Component {

  constructor(props) {
    super(props);
    this.state = {
      chapter: props.chapter      
    };    
  }

  componentDidRecieveProps() {
  }

  componentDidUpdate() {    
  }

  componentDidMount() {
    this.map = new OpenLayersMap({
      target: target,
      config: this.props.chapter.mapSettings,
      onUpdate: this.props.onMapUpdate
    });    
  }  

  render() {
    return (            
      <div id={target} style={{height: '100%'}}>
        <LayerList chapter={this.props.chapter} onUpdate={this.props.onLayersUpdate}></LayerList>
      </div>      
    )
  }

}

export default Map;