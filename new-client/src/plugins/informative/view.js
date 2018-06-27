import React, { Component } from "react";
import Observer from "react-event-observer";
import InformativeModel from "./model.js";
import { createPortal } from "react-dom";
import "./style.css";

class Draw extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      text: "Laddar...",
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.informativeModel = new InformativeModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
    this.informativeModel.load(data => {
      this.setState({
        text: this.translateMd(data)
      });
    });
  }

  translateMd(nodes) {
    console.log(nodes);
    return Object.keys(nodes).map(key => {
      return (
        <h2>{nodes[key].name}</h2>
      )
    });
  }

  open() {
    this.setState({
      toggled: true
    });
  }

  close() {
    this.setState({
      toggled: false
    });
  }

  minimize() {
    this.setState({
      toggled: false
    });
  }

  toggle() {
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("informative");
  }

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled ? "tool-panel" : "tool-panel hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <h1>Översiktsplan</h1>
        <div>{this.state.text}</div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          ÖP
        </div>
        {this.renderPanel()}
      </div>
    );
  }
}

export default Draw;
