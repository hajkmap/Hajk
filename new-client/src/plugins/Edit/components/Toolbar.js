import React, { Component } from "react";
import withStyles from "@mui/styles/withStyles";
import { withTheme } from "@mui/styles";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FormatShapesIcon from "@mui/icons-material/FormatShapes";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

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
    this.changeTool("add", "Point");
  }

  onAddLineClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.toggleActiveTool("linestring");
    this.changeTool("add", "LineString");
  }

  onAddPolygonClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.toggleActiveTool("polygon");
    this.changeTool("add", "Polygon");
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
            disabled={!editSource.editPoint}
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
            disabled={!editSource.editLine}
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
            disabled={!editSource.editPolygon}
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
