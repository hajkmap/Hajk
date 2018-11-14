import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { ChromePicker } from "react-color";
import PropTypes from "prop-types";

const styles = theme => ({});

class DrawView extends React.PureComponent {
  handleColorChange = (color, event) => {
    this.setState({ selectedColor: color.rgb });
  };

  constructor() {
    super();
    this.state = {
      activeDrawTool: null,
      activeModifyTool: null,
      selectedColor: "#aaa"
    };
  }

  getDrawToolClass(symbol) {
    let isActive = this.state.activeDrawTool === symbol ? "active" : "";
    return `btn btn-secondary ${isActive}`;
  }

  getModifyToolClass(symbol) {
    let isActive = this.state.activeModifyTool === symbol ? "active" : "";
    return `btn btn-secondary ${isActive}`;
  }

  getText() {
    return "Rita";
  }

  render() {
    return (
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
    );
  }
}

DrawView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DrawView);
