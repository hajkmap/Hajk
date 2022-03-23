import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { IconPolygon, IconRect, IconLine, IconPoint } from "./FirIcons";
import { withSnackbar } from "notistack";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import DeleteIcon from "@material-ui/icons/Delete";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import { Typography } from "@mui/material";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Draw, { createBox } from "ol/interaction/Draw.js";

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const ContainerTopDoublePadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(4),
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  width: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
}));

const IconButton = styled(Button)(({ theme, on, invert }) => ({
  ...(on === "false" ? { backgroundColor: "#dcdcdc" } : {}),
  margin: theme.spacing(0),
  paddingLeft: 0,
  paddingRight: 0,
  borderRightColor: "red",
  minWidth: "2.875rem",
  width: "calc(99.9% / 6)",
  "& img": {
    filter: on === "true" && invert === "true" ? "invert(1)" : "", // fixes icon-colors on geometry icons.
  },
}));

const FileInputContainer = styled("div")(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",

  "& > *": {
    display: "flex",
  },

  "& span": {
    whiteSpace: "nowrap",
  },

  "& span.filename": {
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
    display: "block",
    paddingLeft: theme.spacing(1),
    fontWeight: "300",
  },
}));

const FileInput = styled("input")(({ theme }) => ({
  visibility: "hidden",
  position: "absolute",
}));

const SvgImg = styled("img")(({ theme }) => ({
  height: "24px",
  width: "24px",
}));

class FirToolbarView extends React.PureComponent {
  state = {
    tools: {
      Polygon: { selected: false, drawTool: true },
      Rectangle: { selected: false, drawTool: true },
      LineString: { selected: false, drawTool: true },
      Point: { selected: false, drawTool: true },
      Import: { selected: false, drawTool: false },
      Delete: { selected: false, drawTool: false },
    },
    files: { list: [] },
    buffer: 0,
    numberOfObjects: 0,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    prefix: PropTypes.string,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.prefix = this.props.prefix || "fir";
    this.initListeners();
  }

  initListeners = () => {
    this.localObserver.subscribe(`${this.prefix}.search.clear`, () => {
      this.deactivateDraw();
      this.setState({ files: { list: [] } });
      this.deselectButtonItems();
    });
  };

  updateNumberOfObjects = () => {
    setTimeout(() => {
      // TODO: create and listen to update event instead.
      this.setState({
        numberOfObjects: this.model.layers.draw.getSource().getFeatures()
          .length,
      });
      this.forceUpdate();
    }, 100);
  };

  handleToolbarClick(id) {
    let o = { ...this.state.tools };

    for (let type in o) {
      if (type === id) {
        o[type].selected = !o[type].selected;

        if (o[type].selected === true) {
          this.activateTool(type);
        } else {
          this.deactivateDraw();
        }
      } else {
        o[type].selected = false;
      }
    }

    this.setState({
      tools: o,
    });
  }

  handleDeleteClick = (e) => {
    var first = true;
    this.model.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      // Handles both drawn features and buffer features. Remove them at the same time as they are linked.

      const type = feature.get(`${this.prefix}_type`);
      if (type && (type === "draw" || type === "buffer") && first) {
        let findFn = null;

        if (type === "draw") {
          findFn = (f) => {
            return feature.ol_uid === f.get("owner_ol_uid");
          };
        } else if (type === "buffer") {
          findFn = (f) => {
            return feature.get("owner_ol_uid") === f.ol_uid;
          };
        }

        this.model.layers[type].getSource().removeFeature(feature);
        const layerName = type === "draw" ? "buffer" : "draw";
        let secondaryLayer = this.model.layers[layerName];
        let secondaryFeature = secondaryLayer
          .getSource()
          .getFeatures()
          .find(findFn);

        if (secondaryFeature) {
          secondaryLayer.getSource().removeFeature(secondaryFeature);
        }

        this.deactivateDraw();
        this.deselectButtonItems();
      }
      first = false;
    });
    this.updateNumberOfObjects();
  };

  activateTool = (type) => {
    let tool = this.state.tools[type];
    let geometryFunction = null;

    if (tool.drawTool === true) {
      if (type === "Rectangle") {
        type = "Circle";
        geometryFunction = createBox();
      }

      this.deactivateDraw();

      this.interaction = new Draw({
        source: this.model.layers.draw.getSource(),
        type: type,
        geometryFunction: geometryFunction,
        geometryName: type,
      });
      this.interaction.on("drawend", () => {
        this.deactivateDraw();
        this.deselectButtonItems();
      });

      this.activateDraw();
    } else {
      this.deactivateDraw();
      if (type === "Delete") {
        this.model.map.on("singleclick", this.handleDeleteClick);
      }
    }
  };

  deactivateDraw = () => {
    this.model.map.un("singleclick", this.handleDeleteClick);
    if (this.interaction) {
      this.interaction.abortDrawing();
      this.model.map.removeInteraction(this.interaction);
      this.model.map.clickLock.delete(`${this.prefix}-draw`);
      window.removeEventListener("keydown", this.handleKeyDown);
    }
    this.updateNumberOfObjects();
  };

  activateDraw = () => {
    this.model.map.addInteraction(this.interaction);
    this.model.map.clickLock.add(`${this.prefix}-draw`);
    window.addEventListener("keydown", this.handleKeyDown);
    this.updateNumberOfObjects();
  };

  deselectButtonItems = () => {
    let o = { ...this.state.tools };
    for (let type in o) {
      o[type].selected = false;
    }
    this.setState({ tools: o });
  };

  handleKeyDown = (e) => {
    if (e.keyCode === 27 /* escape */) {
      this.deactivateDraw();
      this.deselectButtonItems();
    }
  };

  handleFileSelection = (e) => {
    if (e && e.target) {
      this.setState({ files: { list: e.target.files || [] } });
      if (e.target.files.length > 0) {
        this.localObserver.publish(
          `${this.prefix}.file.import`,
          e.target.files[0]
        );
        setTimeout(() => {
          e.target.value = "";
        }, 500);
      }
    }
  };

  render() {
    return (
      <>
        <div>
          <Typography variant="subtitle2">Sökområde</Typography>
          <StyledButtonGroup
            variant="contained"
            aria-label="outlined button group"
          >
            <IconButton
              title="Polygon"
              on={"" + this.state.tools.Polygon.selected}
              invert={"" + true}
              color={
                this.state.tools.Polygon.selected ? "primary" : "secondary"
              }
              onClick={() => {
                this.handleToolbarClick("Polygon");
              }}
            >
              <SvgImg src={IconPolygon()} alt="" />
            </IconButton>
            <IconButton
              title="Rektangel"
              on={"" + this.state.tools.Rectangle.selected}
              invert={"" + true}
              color={
                this.state.tools.Rectangle.selected ? "primary" : "secondary"
              }
              onClick={() => {
                this.handleToolbarClick("Rectangle");
              }}
            >
              <SvgImg src={IconRect()} alt="" />
            </IconButton>
            <IconButton
              title="Linje"
              on={"" + this.state.tools.LineString.selected}
              invert={"" + true}
              color={
                this.state.tools.LineString.selected ? "primary" : "secondary"
              }
              onClick={() => {
                this.handleToolbarClick("LineString");
              }}
            >
              <SvgImg src={IconLine()} alt="" />
            </IconButton>
            <IconButton
              title="Punkt"
              on={"" + this.state.tools.Point.selected}
              invert={"" + true}
              color={this.state.tools.Point.selected ? "primary" : "secondary"}
              onClick={() => {
                this.handleToolbarClick("Point");
              }}
            >
              <SvgImg src={IconPoint()} alt="" />
            </IconButton>
            <IconButton
              title="Importera KLM-fil"
              on={"" + this.state.tools.Import.selected}
              invert={"" + false}
              color={this.state.tools.Import.selected ? "primary" : "secondary"}
              onClick={() => {
                this.handleToolbarClick("Import");
              }}
            >
              <InsertDriveFileIcon />
            </IconButton>
            <IconButton
              title="Ta bort objekt"
              on={"" + this.state.tools.Delete.selected}
              invert={"" + false}
              color={this.state.tools.Delete.selected ? "primary" : "secondary"}
              onClick={() => {
                this.handleToolbarClick("Delete");
              }}
            >
              <DeleteIcon />
            </IconButton>
          </StyledButtonGroup>
          <Collapse in={this.state.tools.Import.selected === true}>
            <ContainerTopPadded>
              <Typography variant="subtitle2">Importera KML-fil</Typography>
              <FileInputContainer>
                <FileInput
                  accept=".kml"
                  id={`${this.prefix}FileInput`}
                  type="file"
                  onChange={this.handleFileSelection}
                />
                <label htmlFor={`${this.prefix}FileInput`}>
                  <Button
                    variant="contained"
                    color="primary"
                    component="span"
                    size="small"
                  >
                    Välj fil
                  </Button>
                </label>
                <span className="filename">
                  {this.state.files.list.length > 0
                    ? this.state.files.list[0].name
                    : "Ingen fil är vald"}
                </span>
              </FileInputContainer>
            </ContainerTopPadded>
          </Collapse>
        </div>
        <Collapse in={this.state.numberOfObjects > 0}>
          <ContainerTopDoublePadded>
            <TextField
              fullWidth={true}
              label="Lägg till buffer på sökområde"
              value={this.state.buffer}
              onKeyDown={(e) => {
                return !isNaN(e.key);
              }}
              onChange={(e) => {
                let v = parseInt(e.target.value);
                if (isNaN(v)) {
                  v = 0;
                }

                const bufferValue = parseInt(v);
                this.setState({ buffer: bufferValue });

                this.localObserver.publish(
                  `${this.prefix}.layers.bufferValueChanged`,
                  {
                    value: bufferValue,
                  }
                );
              }}
              onFocus={(e) => {
                if (this.state.buffer === 0) {
                  this.setState({ buffer: "" });
                }
              }}
              onBlur={(e) => {
                if (this.state.buffer === "") {
                  this.setState({ buffer: 0 });
                }
              }}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">meter</InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </ContainerTopDoublePadded>
        </Collapse>
      </>
    );
  }
}

export default withSnackbar(FirToolbarView);
