import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ScatterPlotIcon from "@material-ui/icons/ScatterPlot";
import BorderStyleIcon from "@material-ui/icons/BorderStyle";
import LinearScaleIcon from "@material-ui/icons/LinearScale";
import Typography from "@material-ui/core/Typography/Typography";

const styles = theme => ({
  button: {
    margin: theme.spacing(1),
    width: "115px"
  },
  leftIcon: {
    marginRight: theme.spacing(1)
  },
  rightIcon: {
    marginLeft: theme.spacing(1)
  },
  iconSmall: {
    fontSize: 20
  },
  toolbar: {
    margin: "5px"
  },
  toolbarRow: {}
});

class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTool: undefined
    };
    this.props.model.observer.subscribe("abortInteraction", () => {
      this.setState({
        activeTool: undefined
      });
    });
  }

  componentWillUnmount() {
    this.props.model.observer.unsubscribe("abortInteraction");
    this.props.model.deactivateInteraction();
  }

  changeTool(type, geometryType) {
    const { model } = this.props;
    this.props.onChangeTool();
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
    this.setState({ activeTool: "point" });
    this.changeTool("add", "Point");
  }

  onAddLineClicked() {
    this.setState({ activeTool: "linestring" });
    this.changeTool("add", "LineString");
  }

  onAddPolygonClicked() {
    this.setState({ activeTool: "polygon" });
    this.changeTool("add", "Polygon");
  }

  getStatusMessage(data) {
    if (!data) {
      return (
        <Typography>
          Uppdatateringen lyckades men det upptäcktes inte några ändringar.
        </Typography>
      );
    }
    if (data.ExceptionReport) {
      return (
        <Typography>
          Uppdateringen misslyckades:{" "}
          {data.ExceptionReport.Exception.ExceptionText.toString()}
        </Typography>
      );
    }
    if (
      data.TransactionResponse &&
      data.TransactionResponse.TransactionSummary
    ) {
      return (
        <div>
          <Typography>Uppdateringen lyckades.</Typography>
          <Typography>
            Antal skapade objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalInserted.toString()}
          </Typography>
          <Typography>
            Antal borttagna objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalDeleted.toString()}
          </Typography>
          <Typography>
            Antal uppdaterade objekt:{" "}
            {data.TransactionResponse.TransactionSummary.totalUpdated.toString()}
          </Typography>
        </div>
      );
    } else {
      return (
        <Typography>
          Status för uppdateringen kunde inte avläsas ur svaret från servern.
        </Typography>
      );
    }
  }

  onSaveClicked() {
    if (!this.props.model.editSource) {
      return;
    }
    this.props.model.save(response => {
      this.props.model.filty = false;
      this.props.model.refreshEditingLayer();
      this.props.app.globalObserver.publish(
        "core.alert",
        this.getStatusMessage(response)
      );
    });
  }

  onCancelClicked() {
    this.props.model.deactivate();
    this.props.panel.setState({
      checked: false,
      enabled: false,
      selectedSource: false
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
    const source = this.props.serviceConfig;
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
              title="Lägg till plats"
              style={this.getSelectedStyle("point")}
            >
              Plats
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
              title="Lägg till sträcka"
              style={this.getSelectedStyle("linestring")}
            >
              Sträcka
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
              title="Lägg till område"
              style={this.getSelectedStyle("polygon")}
            >
              Område
              <BorderStyleIcon className={classes.rightIcon} />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Toolbar);
