import React, { Component } from "react";
import Observer from "react-event-observer";
import InformationModel from "./model.js";
import { createPortal } from "react-dom";
import "./style.css";
import dialogPolyfill from "dialog-polyfill";

class Information extends Component {
  constructor() {
    super();
    // this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      target: "map"
    };
  }

  componentDidMount() {
    // Register polyfill
    this.dialog = document.querySelector("dialog");
    dialogPolyfill.registerDialog(this.dialog);

    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.InformationModel = new InformationModel({
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

  toggle = () => {
    if (!this.state.toggled && this.props.toolbar) {
      this.props.toolbar.hide();
    }
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("information");
  };

  getActiveClass() {    
    var activeClass = "tool-toggle-button active";
    var inactiveClass = "tool-toggle-button";
    return this.state.toggled
      ? activeClass
      : inactiveClass;
  }

  getVisibilityClass() {
    return this.state.toggled ? "modal" : "modal hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  renderDialogContent() {
    return (
      <div>
        <div className="header">
          <i
            className="material-icons pull-right"
            onClick={() => {
              this.toggle();
            }}
          >
            close
          </i>
          <h1>Information</h1>
        </div>
        <div className="tool-panel-content">Information</div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          <i className="material-icons">info</i>
          <i className="tool-text">Information</i>
        </div>
        {createPortal(
          <dialog className="information-dialog" open={this.getOpen()}>
            {this.renderDialogContent()}
          </dialog>,
          document.getElementById("map")
        )}
      </div>
    );
  }
}

export default Information;
