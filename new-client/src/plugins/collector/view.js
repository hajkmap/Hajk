import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import CollectorModel from "./model.js";
import PanelHeader from "../../components/PanelHeader.js";
import CollectorForm from "./components/CollectorForm.js";
import "./style.css";
import Button from '@material-ui/core/Button';

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
      this.props.toolbar.hide();
    }
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("collector");
  }

  getActiveClass() {
    return this.state.toggled
      ? "tool-toggle-button active"
      : "tool-toggle-button";
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel collector-panel"
      : "tool-panel collector-panel hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  activateMarker() {    
    this.setState({
      markerActive: !this.state.markerActive,
      description: this.state.markerActive ? "" : "Klicka på en plats i kartan."
    }, () => {
      if (this.state.markerActive) {
        this.collectorModel.activate('addPoint', () => {
          this.setState({
            displayForm: true
          });
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
    var color = this.state.markerActive ? "secondary" : "primary";
    var alertClass = this.state.markerActive ? "alert alert-success" : "";
    var text = this.state.markerActive ? "spara" : "starta";
    var abortButton = this.state.markerActive ? <Button color="primary" onClick={this.abort}>Avbryt</Button> : null;
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <PanelHeader title="Tyck till" toggle={this.toggle} />
        <div className="tool-panel-content">
          <div>Här kan du tycka till om en viss plats eller ett område.</div>          
          <div>            
            <Button variant="contained" color={color} onClick={this.activateMarker}>
              {text}
            </Button>&nbsp;
            {abortButton}&nbsp;            
            <div className={alertClass}>{this.state.description}</div>
            <CollectorForm visible={this.state.displayForm} />
          </div>
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
