import React, { Component } from "react";
import Observer from "react-event-observer";
import InformativeModel from "./model.js";
import { createPortal } from "react-dom";
import "./style.css";

class Informative extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      text: "Laddar..."
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
        text: data
      });
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
    if (!this.state.toggled) {
      this.props.toolbar.hide();
    }
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
    return this.state.toggled
      ? "tool-panel informative-panel"
      : "tool-panel informative-panel hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  createMarkup() {
    return { __html: this.state.text };
  }

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <div className="header">
          <i
            className="fa fa-close pull-right big"
            onClick={() => {
              this.toggle();
            }}
          />
          <h1>Översiktsplan</h1>
        </div>
        <div className="tool-panel-content">
          <div
            className="informative"
            dangerouslySetInnerHTML={this.createMarkup()}
          />
        </div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          <i className="fa fa-icon fa-tree icon" />
          <i className="tool-text">Översiktsplan</i>
        </div>
        {this.renderPanel()}
      </div>
    );
  }
}

export default Informative;
