import React, { Component } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ToggleButton from "@material-ui/lab/ToggleButton";
import BrushIcon from "@material-ui/icons/Brush";
import Observer from "react-event-observer";
import DrawModel from "./model.js";
import PanelHeader from "../../components/PanelHeader";
import { ChromePicker } from "react-color";

import "./style.css";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
  }
});

class Draw extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      activeDrawTool: null,
      activeModifyTool: null,
      selectedColor: "#fff"
    };
  }

  componentDidMount() {
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

  toggle() {
    if (!this.state.toggled) {
      this.props.toolbar.hide();
      this.drawModel.activate();
    } else {
      this.drawModel.deactivate();
    }
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("draw");
  }

  // getActiveClass() {
  //   return this.state.toggled
  //     ? "tool-toggle-button active"
  //     : "tool-toggle-button";
  // }

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

  renderActionButton(settings) {}

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

  render() {
    const classes = this.props.classes;
    console.log("render Draw", classes);
    return (
      // <div>
      <ToggleButton value="draw">
        <BrushIcon />
      </ToggleButton>
      /* <Button
          color="primary"
          className={classes.button}
          onClick={this.toggle}
        >
          <i className="material-icons">brush</i>
          Rita
        </Button> */
      // {this.renderPanel()}
      // </div>
      // <div>
      //   <div className={this.getActiveClass()} onClick={this.toggle}>
      //     <i className="material-icons">brush</i>
      //     <i className="tool-text">Rita</i>
      //   </div>
      //   {this.renderPanel()}
      // </div>
    );
  }
}

Draw.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Draw);
