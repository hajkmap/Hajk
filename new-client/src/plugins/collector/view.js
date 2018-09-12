import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import CollectorModel from "./model.js";
import CollectorForm from "./components/CollectorForm.js";
import "./style.css";

class Collector extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.activateMarker = this.activateMarker.bind(this);
    this.abort = this.abort.bind(this);
    this.state = {
      toggled: false,
      markerActive: false,
      displayForm: false,
      description: "",
      text: "Laddar..."
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.collectorModel = new CollectorModel({
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
    if (!this.state.toggled) {
      if (this.props.toolbar) {
        this.props.toolbar.hide();
      }
    }
    this.setState({
      toggled: !this.state.toggled
    });
    if (this.props.toolbar) {
      this.props.tool.app.togglePlugin("collector");
    }
  }

  getActiveClass() {
    var activeClass = "tool-toggle-button active";
    var inactiveClass = "tool-toggle-button";
    return this.state.toggled
      ? activeClass
      : inactiveClass;
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "static-popup"
      : "static-popup hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  activateMarker() {
    this.setState({
      markerActive: !this.state.markerActive,
      description: this.state.markerActive ? "" : "Ställ in kartan på vald plats"
    }, () => {
      if (this.state.markerActive) {

          this.setState({
            displayForm: true,
            displayCross: true
          });

      } else {
        this.collectorModel.deactivate('addPoint');
      }
    });
  }

  abort() {
    this.setState({
      markerActive: false,
      displayForm: false
    });
    this.collectorModel.clear();
  }

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <div className="popup-content">
          <div>Här kan du tycka till om en viss plats eller ett område.</div>
          <CollectorForm />
        </div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          <i className="material-icons">forum</i>
          <i className="tool-text">Tyck till</i>
        </div>
        {this.renderPanel()}
      </div>
    );
  }
}

export default Collector;
