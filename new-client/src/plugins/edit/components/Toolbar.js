import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/Delete";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import ZoomOutMapIcon from "@material-ui/icons/ZoomOutMap";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
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
    border: "1px solid",
    padding: "10px"
  },
  toolbarRow: {}
});

class Toolbar extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      activeTool: undefined
    };
  }

  componentWillMount() {
    this.props.observer.on("layerChanged", () => {
      if (this.props.model.layer) {
        this.props.model.layer.dragLocked = true;
        this.props.model.deactivateTools();
        this.setState({
          activeTool: undefined
        });
      }
    });
  }

  changeTool(type) {
    if (this.state.activeTool === type.toLowerCase()) {
      this.props.model.deactivateDrawTool(true);
      return this.setState({
        activeTool: undefined
      });
    }

    switch (type) {
      case "Point":
      case "LineString":
      case "Polygon":
        this.props.model.activateDrawTool(type);
        this.props.model.setRemovalToolMode("off");
        break;
      case "remove":
        this.props.model.deactivateDrawTool(type);
        break;
      case "move":
        this.props.model.deactivateDrawTool(type);
        this.props.model.setRemovalToolMode("off");
        break;
      default:
        break;
    }
  }

  onAddPointClicked() {
    this.props.model.layer.dragLocked = true;
    this.setState({ activeTool: "point" });
    this.changeTool("Point");
  }

  onAddLineClicked() {
    this.props.model.layer.dragLocked = true;
    this.setState({ activeTool: "linestring" });
    this.changeTool("LineString");
  }

  onAddPolygonClicked() {
    this.props.model.layer.dragLocked = true;
    this.setState({ activeTool: "polygon" });
    this.changeTool("Polygon");
  }

  onRemoveClicked() {
    this.props.model.layer.dragLocked = true;
    this.props.model.setRemovalToolMode(
      this.state.activeTool === "remove" ? "off" : "on"
    );
    this.setState({ activeTool: "remove" });
    this.changeTool("remove");
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
      enabled: false
    });
    this.setState({
      activeTool: undefined
    });
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
            >
              Yta
              <BorderStyleIcon className={classes.rightIcon} />
            </Button>
          </div>
          <div className={classes.toolbarRow}>
            <Button
              className={classes.button}
              disabled={disabled}
              onClick={() => {
                this.onMoveClicked();
              }}
              type="button"
              title="Flytta geometri"
            >
              Flytta
              <ZoomOutMapIcon className={classes.rightIcon} />
            </Button>
            <Button
              className={classes.button}
              disabled={disabled}
              onClick={() => {
                this.onRemoveClicked();
              }}
              type="button"
              title="Ta bort geometri"
            >
              Ta bort
              <DeleteIcon className={classes.rightIcon} />
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
