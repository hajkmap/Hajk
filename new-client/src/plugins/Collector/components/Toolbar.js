import React, { Component } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import Typography from "@mui/material/Typography";
import WKT from "ol/format/WKT";

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  width: "115px",
}));

const ToolbarDiv = styled("div")(({ theme }) => ({
  margin: "5px",
}));

class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTool: undefined,
    };
    this.props.model.observer.subscribe("abortInteraction", () => {
      this.setState({
        activeTool: undefined,
      });
    });

    // Clear layer and attempt to read saved values
    if (this.props.model.wkt) {
      this.props.model.vectorSource.clear();

      const format = new WKT();
      const WKTString = this.props.model.formValues[this.props.field];
      if (WKTString && WKTString.length > 0) {
        let features = format.readFeatures(WKTString);
        features.forEach((feature) => {
          this.props.model.vectorSource.addFeature(feature);
        });
      }
    }
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
        activeTool: undefined,
      });
    }
    if (this.state.activeTool === type) {
      model.deactivateInteraction();
      return this.setState({
        activeTool: undefined,
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
    this.props.model.save((response) => {
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
      selectedSource: false,
    });
    this.setState({
      activeTool: undefined,
    });
  }

  getSelectedStyle(type) {
    var style = {};
    if (type === this.state.activeTool) {
      style.backgroundColor = "#ccc";
    }
    return style;
  }

  storeValues() {
    // Stores any potential features found on the map as WKT before taking the next or previous step.
    //These are later pushed to the server on submission.
    //They are also put on the map again if the user comes back to this step.
    if (!this.props.model.wkt) {
      return;
    }
    const format = new WKT();
    let wkt = "";

    if (this.props.model.vectorSource.getFeatures().length > 0) {
      wkt = format.writeFeatures(this.props.model.vectorSource.getFeatures());
    }

    // Store the converted features in the model
    let formValues = Object.assign({}, this.props.model.formValues);
    formValues[this.props.field] = wkt;
    this.props.model.formValues = formValues;
    // Clear layer
    this.props.model.vectorSource.clear();
  }

  render() {
    const source = this.props.serviceConfig;
    var disabled = !this.props.enabled,
      editPoint = false,
      editPolygon = false,
      editLine = false;

    if (this.props.model.wkt) {
      // WKT gets the information from the tag since there is support for multiple toolbars
      // Different toolbars can therefore support different types of geometries
      editPoint = this.props.geotype.indexOf("point") !== -1;
      editPolygon = this.props.geotype.indexOf("polygon") !== -1;
      editLine = this.props.geotype.indexOf("line") !== -1;
    } else if (source) {
      // Non-WKT only supports insertion of one geometry so it can be retrieved from the source
      editPoint = source.editPoint;
      editLine = source.editLine;
      editPolygon = source.editPolygon;
    }

    return (
      <div>
        <ToolbarDiv>
          <div>
            <StyledButton
              variant="contained"
              disabled={disabled === false ? !editPoint : disabled}
              onClick={() => {
                this.onAddPointClicked();
              }}
              type="button"
              title="Lägg till plats"
              style={this.getSelectedStyle("point")}
            >
              Plats
              <ScatterPlotIcon sx={{ marginLeft: 1 }} />
            </StyledButton>
            <StyledButton
              variant="contained"
              disabled={disabled === false ? !editLine : disabled}
              onClick={() => {
                this.onAddLineClicked();
              }}
              type="button"
              title="Lägg till sträcka"
              style={this.getSelectedStyle("linestring")}
            >
              Sträcka
              <LinearScaleIcon sx={{ marginLeft: 1 }} />
            </StyledButton>
            <StyledButton
              variant="contained"
              disabled={disabled === false ? !editPolygon : disabled}
              onClick={() => {
                this.onAddPolygonClicked();
              }}
              type="button"
              title="Lägg till område"
              style={this.getSelectedStyle("polygon")}
            >
              Område
              <BorderStyleIcon sx={{ marginLeft: 1 }} />
            </StyledButton>
          </div>
        </ToolbarDiv>
      </div>
    );
  }
}

export default Toolbar;
