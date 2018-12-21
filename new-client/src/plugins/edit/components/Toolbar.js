import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/Delete";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";
import FormatShapesIcon from "@material-ui/icons/FormatShapes";
import Typography from "@material-ui/core/Typography/Typography";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
    width: "100px"
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  iconSmall: {
    fontSize: 20
  },
  toolbar: {
    padding: "10px",
    borderRadius: "4px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
  },
  toolbarRow: {}
});

class Toolbar extends Component {
  constructor() {
    super();
    this.state = {
      activeTool: undefined
    };
  }

  componentWillMount() {
    this.props.observer.on("deactivate", () => {
      this.props.panel.setState({
        checked: false,
        enabled: false,
        selectedSource: undefined
      });
      this.setState({
        activeTool: undefined
      });
    });
    this.props.observer.on("layerChanged", layer => {
      this.setState(
        {
          activeTool: undefined
        },
        () => {
          this.props.model.deactivateInteraction();
        }
      );
    });
  }

  changeTool(type, geometryType) {
    const { model } = this.props;
    if (geometryType && this.state.activeTool === geometryType.toLowerCase()) {
      model.deactivateInteraction();
      return this.setState({
        activeTool: undefined
      });
    }
    if (this.state.activeTool === type) {
      model.deactivateInteraction();
      return this.setState({
        activeTool: undefined
      });
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
    this.setState({ activeTool: "point" });
    this.changeTool("add", "Point");
  }

  onAddLineClicked() {
    this.props.model.layer.dragLocked = true;
    this.setState({ activeTool: "linestring" });
    this.changeTool("add", "LineString");
  }

  onAddPolygonClicked() {
    this.props.model.layer.dragLocked = true;
    this.setState({ activeTool: "polygon" });
    this.changeTool("add", "Polygon");
  }

  onRemoveClicked() {
    this.setState({ activeTool: "remove" });
    this.changeTool("remove");
  }

  onModifyClicked() {
    this.setState({ activeTool: "modify" });
    this.changeTool("modify");
  }

  onMoveClicked() {
    this.props.model.layer.dragLocked = false;
    this.setState({ activeTool: "move" });
    this.changeTool("move");
  }

  getStatusMessage(data) {
    if (!data) {
      return `Uppdatateringen lyckades men det upptäcktes inte några ändringar.`;
    }
    if (data.ExceptionReport) {
      return `Uppdateringen misslyckades: ${data.ExceptionReport.Exception.ExceptionText.toString()}`;
    }
    if (
      data.TransactionResponse &&
      data.TransactionResponse.TransactionSummary
    ) {
      return `Uppdateringen lyckades:
        antal skapade objekt: ${
          data.TransactionResponse.TransactionSummary.totalInserted
        }
        antal borttagna objekt: ${
          data.TransactionResponse.TransactionSummary.totalDeleted
        }
        antal uppdaterade objekt: ${
          data.TransactionResponse.TransactionSummary.totalUpdated
        }
      `;
    } else {
      return "Status för uppdateringen kunde inte avläsas ur svaret från servern.";
    }
  }

  onSaveClicked() {
    if (!this.props.model.editSource) {
      return;
    }

    this.props.model.save(data => {
      //Todo: alert user;
      this.props.model.setRemovalToolMode("off");
      this.props.model.filty = false;
      this.props.panel.setLayer(this.props.model.editSource);
    });
  }

  onCancelClicked() {
    this.props.model.deactivate();
    this.props.panel.setState({
      checked: false,
      enabled: false,
      selectedSource: undefined
    });
    this.setState({
      activeTool: undefined
    });
  }

  getSelectedStyle(type) {
    var style = {};
    if (type === this.state.activeTool) {
      style.backgroundColor = "#ccc";
    }
    return style;
  }

  render() {
    const source = this.props.model.editSource;
    var disabled = !this.props.enabled,
      editPoint = false,
      editPolygon = false,
      editLine = false;

    if (source) {
      editPoint = source.editPoint;
      editLine = source.editLine;
      editPolygon = source.editPolygon;
    }
    const { classes } = this.props;

    return (
      <div>
        <div className={classes.toolbar}>
          <Typography>Lägg till</Typography>
          <div className={classes.toolbarRow}>
            <Button
              variant="outlined"
              className={classes.button}
              disabled={disabled === false ? !editPoint : disabled}
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
            <Button
              variant="outlined"
              className={classes.button}
              disabled={disabled === false ? !editLine : disabled}
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
            <Button
              variant="outlined"
              className={classes.button}
              disabled={disabled === false ? !editPolygon : disabled}
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
          </div>
          <Typography>Editera</Typography>
          <div className={classes.toolbarRow}>
            <Button
              size="small"
              className={classes.button}
              disabled={disabled}
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
            <Button
              size="small"
              className={classes.button}
              disabled={disabled}
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
            <Button
              size="small"
              className={classes.button}
              disabled={disabled}
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
          </div>
          <div className={classes.toolbarRow}>
            <Button
              className={classes.button}
              variant="contained"
              color="primary"
              disabled={disabled}
              onClick={e => {
                this.onSaveClicked();
              }}
              type="button"
              title="Spara"
            >
              Spara
              <DeleteIcon className={classes.rightIcon} />
            </Button>
            <Button
              className={classes.button}
              disabled={disabled}
              onClick={e => {
                this.onCancelClicked();
              }}
              type="button"
              title="Avbryt"
            >
              Avbryt
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Toolbar);
