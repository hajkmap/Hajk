import React, { Component } from 'react';
import {createMap} from './../models/map.js'
import {loadPlugins} from './../models/map.js'
import './map.css';
import Toolbar from './toolbar.js';

var tools = [];

class Map extends Component {

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    createMap('map');

    loadPlugins(["draw"], component => {
      tools = [
        ...tools,
        {
          component: component,
          target: "toolbar"
        }
      ];
      this.setState({
        tools: tools
      });
    });

  }

  r() {
    return tools.map((Tool, i) => {
      return <Tool key={i} />
    });
  }

  render() {
    return (
      <div>
        <div className="map" id="map">
          <Toolbar tools={tools.filter(tool => tool.target === "toolbar")}></Toolbar>
        </div>
      </div>
    );
  }
}

export default Map;