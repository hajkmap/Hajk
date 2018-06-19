import React, { Component } from "react";
import Observer from "react-event-observer";
import EditModel from "./model.js";
import { createPortal } from "react-dom";
import "./style.css";

class Draw extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.editModel = new EditModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
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
    this.props.tool.app.togglePlugin("information");
  }

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled ? "modal" : "modal hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          Info
        </div>
        {createPortal(
          <dialog open={this.getOpen()}>Information</dialog>,
          document.getElementById("map")
        )}
      </div>
    );
  }
}

export default Draw;
