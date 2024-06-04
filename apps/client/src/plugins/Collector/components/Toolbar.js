import React, { useState, useEffect } from "react";
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

const Toolbar = (props) => {
  const [activeTool, setActiveTool] = useState(undefined);

  useEffect(() => {
    const abortInteraction = () => setActiveTool(undefined);

    props.model.observer.subscribe("abortInteraction", abortInteraction);

    if (props.model.wkt) {
      props.model.vectorSource.clear();
      const format = new WKT();
      const WKTString = props.model.formValues[props.field];
      if (WKTString && WKTString.length > 0) {
        const features = format.readFeatures(WKTString);
        features.forEach((feature) => {
          props.model.vectorSource.addFeature(feature);
        });
      }
    }

    return () => {
      props.model.observer.unsubscribe("abortInteraction", abortInteraction);
      props.model.deactivateInteraction();
    };
  }, [props.model, props.field]);

  const changeTool = (type, geometryType) => {
    const { model } = props;
    props.onChangeTool();
    if (geometryType && activeTool === geometryType.toLowerCase()) {
      model.deactivateInteraction();
      return setActiveTool(undefined);
    }
    if (activeTool === type) {
      model.deactivateInteraction();
      return setActiveTool(undefined);
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
  };

  const onAddPointClicked = () => {
    setActiveTool("point");
    changeTool("add", "Point");
  };

  const onAddLineClicked = () => {
    setActiveTool("linestring");
    changeTool("add", "LineString");
  };

  const onAddPolygonClicked = () => {
    setActiveTool("polygon");
    changeTool("add", "Polygon");
  };

  const getStatusMessage = (data) => {
    if (!data) {
      return (
        <Typography>
          Uppdateringen lyckades men det upptäcktes inte några ändringar.
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
  };

  const onSaveClicked = () => {
    if (!props.model.editSource) {
      return;
    }
    props.model.save((response) => {
      props.model.filty = false;
      props.model.refreshEditingLayer();
      props.app.globalObserver.publish(
        "core.alert",
        getStatusMessage(response)
      );
    });
  };

  const onCancelClicked = () => {
    props.model.deactivate();
    props.panel.setState({
      checked: false,
      enabled: false,
      selectedSource: false,
    });
    setActiveTool(undefined);
  };

  const getSelectedStyle = (type) => {
    return type === activeTool ? { backgroundColor: "#ccc" } : {};
  };

  const storeValues = () => {
    if (!props.model.wkt) {
      return;
    }
    const format = new WKT();
    let wkt = "";

    if (props.model.vectorSource.getFeatures().length > 0) {
      wkt = format.writeFeatures(props.model.vectorSource.getFeatures());
    }

    const formValues = { ...props.model.formValues, [props.field]: wkt };
    props.model.formValues = formValues;
    props.model.vectorSource.clear();
  };

  const source = props.serviceConfig;
  const disabled = !props.enabled;
  let editPoint = false,
    editPolygon = false,
    editLine = false;

  if (props.model.wkt) {
    editPoint = props.geotype.includes("point");
    editPolygon = props.geotype.includes("polygon");
    editLine = props.geotype.includes("line");
  } else if (source) {
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
            disabled={disabled ? !editPoint : disabled}
            onClick={onAddPointClicked}
            type="button"
            title="Lägg till plats"
            style={getSelectedStyle("point")}
          >
            Plats
            <ScatterPlotIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
          <StyledButton
            variant="contained"
            disabled={disabled ? !editLine : disabled}
            onClick={onAddLineClicked}
            type="button"
            title="Lägg till sträcka"
            style={getSelectedStyle("linestring")}
          >
            Sträcka
            <LinearScaleIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
          <StyledButton
            variant="contained"
            disabled={disabled ? !editPolygon : disabled}
            onClick={onAddPolygonClicked}
            type="button"
            title="Lägg till område"
            style={getSelectedStyle("polygon")}
          >
            Område
            <BorderStyleIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </div>
      </ToolbarDiv>
    </div>
  );
};

export default Toolbar;
