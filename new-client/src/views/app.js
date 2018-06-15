import React, { Component } from "react";
import AppModel from "./../models/app.js";
import Toolbar from "./toolbar.js";
import "./app.css";

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
    this.appModel.configureApplication();
    this.appModel.createMap("map");
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
          <Toolbar tools={this.appModel.getToolbarPlugins()} />
        </div>
      </div>
    );
  }
}

export default App;
