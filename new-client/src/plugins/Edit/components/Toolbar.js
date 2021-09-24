import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { withTheme } from "@material-ui/styles";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/Delete";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";
import FormatShapesIcon from "@material-ui/icons/FormatShapes";
import Typography from "@material-ui/core/Typography/Typography";
import Grid from "@material-ui/core/Grid";

const styles = (theme) => ({
  rightIcon: {
    marginLeft: theme.spacing(1),
  },
});

class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editFeature: undefined,
    };

    this.props.observer.subscribe("feature-to-update-view", (feature) => {
      this.setState({
        editFeature: feature,
      });
    });
  }

  componentWillUnmount() {
    this.props.observer.unsubscribe("feature-to-update-view");
  }

  changeTool(type, geometryType) {
    const { model, activeTool } = this.props;
    if (geometryType && activeTool === geometryType.toLowerCase()) {
      model.deactivateInteraction();
      return;
    }
    if (activeTool === type) {
      model.deactivateInteraction();
      return;
    }
    model.deactivateInteraction();

    switch (type) {
      case "add":
        model.activateInteraction("add", geometryType);
        break;
      case "remove":
        model.activateInteraction("remove");
        break;
      case "modify":
        model.activateInteraction("modify");
        break;
      case "move":
        model.activateInteraction("move");
        break;
      default:
        break;
    }
  }

  onAddPointClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.toggleActiveTool("point");
    this.changeTool(
      "add",
      this.props.editSource.editMultiPoint ? "MultiPoint" : "Point"
    );
  }

  onAddLineClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.toggleActiveTool("linestring");
    this.changeTool(
      "add",
      this.props.editSource.editMultiLine ? "MultiLineString" : "LineString"
    );
  }

  onAddPolygonClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.toggleActiveTool("polygon");
    this.changeTool(
      "add",
      this.props.editSource.editMultiPolygon ? "MultiPolygon" : "Polygon"
    );
  }

  onRemoveClicked() {
    this.props.toggleActiveTool("remove");
    this.changeTool("remove");
  }

  onModifyClicked() {
    this.props.toggleActiveTool("modify");
    this.changeTool("modify");
  }

  onMoveClicked() {
    this.props.model.layer.dragLocked = false;
    this.props.toggleActiveTool("move");
    this.changeTool("move");
  }

  getSelectedStyle(type) {
    const { theme } = this.props;
    let style = {};
    if (type === this.props.activeTool) {
      style.backgroundColor = theme.palette.action.active;
    }
    return style;
  }

  render() {
    const { editSource, classes } = this.props;
    const { editFeature } = this.state;

    if (!editSource || editFeature) return null;

    return (
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography>Lägg till</Typography>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            disabled={!editSource.editPoint && !editSource.editMultiPoint}
            onClick={() => {
              this.onAddPointClicked();
            }}
            type="button"
            title="Lägg till punkt"
            style={this.getSelectedStyle("point")}
          >
            Punkt
            <ScatterPlotIcon className={classes.rightIcon} />
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            disabled={!editSource.editLine && !editSource.editMultiLine}
            onClick={() => {
              this.onAddLineClicked();
            }}
            type="button"
            title="Lägg till linje"
            style={this.getSelectedStyle("linestring")}
          >
            Linje
            <LinearScaleIcon className={classes.rightIcon} />
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            disabled={!editSource.editPolygon && !editSource.editMultiPolygon}
            onClick={() => {
              this.onAddPolygonClicked();
            }}
            type="button"
            title="Lägg till yta"
            style={this.getSelectedStyle("polygon")}
          >
            Yta
            <BorderStyleIcon className={classes.rightIcon} />
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Typography>Editera</Typography>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              this.onMoveClicked();
            }}
            type="button"
            title="Flytta geometri"
            style={this.getSelectedStyle("move")}
          >
            Flytta
            <ZoomOutMapIcon className={classes.rightIcon} />
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              this.onRemoveClicked();
            }}
            type="button"
            title="Ta bort geometri"
            style={this.getSelectedStyle("remove")}
          >
            Radera
            <DeleteIcon className={classes.rightIcon} />
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              this.onModifyClicked();
            }}
            type="button"
            title="Ändra geometri"
            style={this.getSelectedStyle("modify")}
          >
            Ändra
            <FormatShapesIcon className={classes.rightIcon} />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(withTheme(Toolbar));
