import React, { Component } from 'react';
import AppModel from './../models/app.js';
import Toolbar from './toolbar.js';
import './app.css';

class App extends Component {

  constructor() {
    super();
    this.state = {};
    this.appModel = new AppModel();
  }

  toggleTool(name) {
    this.appModel.togglePlugin(name);
  }

  componentDidMount() {
    this.appModel.createMap('map');
    this.appModel.loadPlugins(this.props.activeTools, () => {
      this.setState({
        tools: this.appModel.getPlugins()
      });
    });
  }

  render() {
    return (
      <div>
        <div className="map" id="map">
          <Toolbar tools={this.appModel.getToolbarPlugins()}></Toolbar>
        </div>
      </div>
    );
  }
}

export default App;