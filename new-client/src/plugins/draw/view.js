import React, { Component } from "react";
import Observer from "react-event-observer";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import DrawModel from "./model.js";
import { ChromePicker } from "react-color";
import PanelHeader from "../../components/PanelHeader";

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer
} from "@material-ui/core";
import BrushIcon from "@material-ui/icons/Brush";

const styles = theme => {};

class Draw extends Component {
  constructor() {
    super();
    this.state = {
      toggled: false,
      activeDrawTool: null,
      activeModifyTool: null,
      selectedColor: "#aaa"
    };
  }

  componentWillMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.drawModel = new DrawModel({
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
    if (!this.state.toggled) {
      this.drawModel.activate();
    } else {
      this.drawModel.deactivate();
    }
    this.props.tool.app.togglePlugin("draw");
    this.props.onClick();
  };

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel draw-panel"
      : "tool-panel draw-panel hidden";
  }

  getDrawToolClass(symbol) {
    let isActive = this.state.activeDrawTool === symbol ? "active" : "";
    return `btn btn-secondary ${isActive}`;
  }

  getModifyToolClass(symbol) {
    let isActive = this.state.activeModifyTool === symbol ? "active" : "";
    return `btn btn-secondary ${isActive}`;
  }

  handleColorChange = (color, event) => {
    console.log(color, event);
    this.setState({ selectedColor: color.rgb });
  };

  renderPanel() {
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <PanelHeader title="Rita" toggle={this.toggle} />
        <div className="tool-panel-content">
          <ChromePicker
            onChangeComplete={this.handleColorChange}
            color={this.state.selectedColor}
          />

          <div className="btn-group" role="group">
            <button
              onClick={() => {
                this.setState({
                  activeDrawTool: null,
                  activeModifyTool: "move"
                });
                this.drawModel.activateModifyTool("move");
              }}
              type="button"
              className={this.getModifyToolClass("move")}
            >
              Flytta
            </button>
            <button
              onClick={() => {
                this.setState({
                  activeDrawTool: null,
                  activeModifyTool: "change"
                });
                this.drawModel.activateModifyTool("change");
              }}
              type="button"
              className={this.getModifyToolClass("change")}
            >
              Ändra
            </button>
            <button
              onClick={() => {
                this.setState({
                  activeDrawTool: null,
                  activeModifyTool: "remove"
                });
                this.drawModel.activateModifyTool("remove");
              }}
              type="button"
              className={this.getModifyToolClass("remove")}
            >
              Ta bort
            </button>
          </div>

          <div className="btn-group" role="group">
            <button
              onClick={() => {
                this.setState({
                  activeModifyTool: null,
                  activeDrawTool: "Point"
                });
                this.drawModel.activateDrawTool("Point");
              }}
              value="Point"
              type="button"
              className={this.getDrawToolClass("Point")}
            >
              Punkt
            </button>
            <button
              onClick={() => {
                this.setState({
                  activeModifyTool: null,
                  activeDrawTool: "LineString"
                });
                this.drawModel.activateDrawTool("LineString");
              }}
              value="LineString"
              type="button"
              className={this.getDrawToolClass("LineString")}
            >
              Linje
            </button>
            <button
              onClick={() => {
                this.setState({
                  activeModifyTool: null,
                  activeDrawTool: "Circle"
                });
                this.drawModel.activateDrawTool("Circle");
              }}
              value="Circle"
              type="button"
              className={this.getDrawToolClass("Circle")}
            >
              Cirkel
            </button>
            <button
              onClick={() => {
                this.setState({
                  activeModifyTool: null,
                  activeDrawTool: "Polygon"
                });
                this.drawModel.activateDrawTool("Polygon");
              }}
              value="Polygon"
              type="button"
              className={this.getDrawToolClass("Polygon")}
            >
              Polygon
            </button>
          </div>
        </div>
      </div>,
      document.getElementById("map")
    );
  }

  isToolActive = () => (this.state.toggled ? true : false);

  getText() {
    return "Rita";
  }

  render() {
    return (<BrushIcon />);
    // return (
    //   <div>
    //     <BrushIcon />
    //     {this.renderPanel()}
    //   </div>
    // );
  }
}

Draw.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Draw);
