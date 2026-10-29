import { Component } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FormatShapesIcon from "@mui/icons-material/FormatShapes";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import i18n from "src/i18n";

const StyledButton = styled(Button)(({ theme }) => ({
  borderTop: `${theme.spacing(0.5)} solid transparent`,
  borderBottom: `${theme.spacing(0.5)} solid transparent`,
  variants: [
    {
      props: ({ selected }) => selected,
      style: {
        borderBottom: `${theme.spacing(0.5)} solid ${theme.palette.secondary.main}`,
      },
    },
  ],
}));

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

  render() {
    const { editSource } = this.props;
    const { editFeature } = this.state;

    if (!editSource || editFeature) return null;

    return (
      <Grid container spacing={1}>
        <Grid size={12}>
          <Typography>{i18n.t("edit.toolbar.add")}</Typography>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            disabled={!editSource.editPoint && !editSource.editMultiPoint}
            onClick={() => {
              this.onAddPointClicked();
            }}
            selected={this.props.activeTool === "point"}
            type="button"
            title={i18n.t("edit.toolbar.addPoint")}
          >
            {i18n.t("edit.toolbar.point")}
            <ScatterPlotIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            disabled={!editSource.editLine && !editSource.editMultiLine}
            onClick={() => {
              this.onAddLineClicked();
            }}
            type="button"
            title={i18n.t("edit.toolbar.addLine")}
            selected={this.props.activeTool === "linestring"}
          >
            {i18n.t("edit.toolbar.line")}
            <LinearScaleIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            disabled={!editSource.editPolygon && !editSource.editMultiPolygon}
            onClick={() => {
              this.onAddPolygonClicked();
            }}
            type="button"
            title={i18n.t("edit.toolbar.addPolygon")}
            selected={this.props.activeTool === "polygon"}
          >
            {i18n.t("edit.toolbar.polygon")}
            <BorderStyleIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
        <Grid size={12}>
          <Typography>{i18n.t("edit.toolbar.edit")}</Typography>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            onClick={() => {
              this.onMoveClicked();
            }}
            type="button"
            title={i18n.t("edit.toolbar.moveGeometry")}
            selected={this.props.activeTool === "move"}
          >
            {i18n.t("edit.toolbar.move")}
            <ZoomOutMapIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            onClick={() => {
              this.onRemoveClicked();
            }}
            type="button"
            title={i18n.t("edit.toolbar.removeGeometry")}
            selected={this.props.activeTool === "remove"}
          >
            {i18n.t("edit.toolbar.remove")}
            <DeleteIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
        <Grid size={4}>
          <StyledButton
            variant="contained"
            fullWidth
            onClick={() => {
              this.onModifyClicked();
            }}
            type="button"
            title={i18n.t("edit.toolbar.modifyGeometry")}
            selected={this.props.activeTool === "modify"}
          >
            {i18n.t("edit.toolbar.modify")}
            <FormatShapesIcon sx={{ marginLeft: 1 }} />
          </StyledButton>
        </Grid>
      </Grid>
    );
  }
}

export default Toolbar;
