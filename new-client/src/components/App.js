import React, { Component } from "react";
import AppModel from "./../models/AppModel.js";
import Toolbar from "./Toolbar.js";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.state = {};
  }

  toggleTool(name) {
    this.appModel.togglePlugin(name);
  }

  componentWillMount() {
    this.appModel = new AppModel(this.props.config);
  }

  componentDidMount() {
    var promises = this.appModel
      .configureApplication()
      .createMap()
      .addLayers()
      .loadPlugins(this.props.activeTools, () => {
        this.setState({
          tools: this.appModel.getPlugins()
        });
      });

    Promise.all(promises).then(([...plugins]) => {});
  }

  render() {
    return (
      <div>
        <div className="map" id="map">
          <Toolbar tools={this.appModel.getToolbarPlugins()} />
        </div>
      </div>
    );
  }
}

export default App;
