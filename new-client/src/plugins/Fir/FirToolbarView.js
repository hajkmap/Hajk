import React from "react";
import PropTypes from "prop-types";
import { IconPolygon, IconRect, IconLine, IconPoint } from "./FirIcons";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import DeleteIcon from "@material-ui/icons/Delete";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import { Typography } from "@material-ui/core";
import Collapse from "@material-ui/core/Collapse";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Draw, { createBox } from "ol/interaction/Draw.js";

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
    classes: PropTypes.object.isRequired,
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
    const { classes } = this.props;
    return (
      <>
        <div>
          <Typography variant="subtitle2" className={classes.subtitle}>
            Sökområde
          </Typography>
          <ButtonGroup
            className={classes.buttonGroup}
            variant="contained"
            aria-label="outlined button group"
          >
            <Button
              title="Polygon"
              className={classes.iconButton}
              classes={{
                containedPrimary: classes.buttonContainedPrimary,
              }}
              color={this.state.tools.Polygon.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("Polygon");
              }}
            >
              <img src={IconPolygon()} className={classes.svgImg} alt="" />
            </Button>
            <Button
              title="Rektangel"
              className={classes.iconButton}
              classes={{
                containedPrimary: classes.buttonContainedPrimary,
              }}
              color={this.state.tools.Rectangle.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("Rectangle");
              }}
            >
              <img src={IconRect()} className={classes.svgImg} alt="" />
            </Button>
            <Button
              title="Linje"
              className={classes.iconButton}
              classes={{
                containedPrimary: classes.buttonContainedPrimary,
              }}
              color={this.state.tools.LineString.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("LineString");
              }}
            >
              <img src={IconLine()} className={classes.svgImg} alt="" />
            </Button>
            <Button
              title="Punkt"
              className={classes.iconButton}
              classes={{
                containedPrimary: classes.buttonContainedPrimary,
              }}
              color={this.state.tools.Point.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("Point");
              }}
            >
              <img src={IconPoint()} className={classes.svgImg} alt="" />
            </Button>
            <Button
              title="Importera KLM-fil"
              className={classes.iconButton}
              color={this.state.tools.Import.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("Import");
              }}
            >
              <InsertDriveFileIcon />
            </Button>
            <Button
              title="Ta bort objekt"
              className={classes.iconButton}
              color={this.state.tools.Delete.selected ? "primary" : null}
              onClick={() => {
                this.handleToolbarClick("Delete");
              }}
            >
              <DeleteIcon />
            </Button>
          </ButtonGroup>
          <Collapse in={this.state.tools.Import.selected === true}>
            <div className={classes.containerTopPadded}>
              <Typography variant="subtitle2" className={classes.subtitle}>
                Importera KML-fil
              </Typography>
              <div className={classes.fileInputContainer}>
                <input
                  accept=".kml"
                  className={classes.fileInput}
                  id="firFileInput"
                  type="file"
                  onChange={this.handleFileSelection}
                />
                <label htmlFor="firFileInput">
                  <Button
                    variant="contained"
                    color="secondary"
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
              </div>
            </div>
          </Collapse>
        </div>
        <Collapse in={this.state.numberOfObjects > 0}>
          <div className={classes.containerTopDoublePadded}>
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
          </div>
        </Collapse>
      </>
    );
  }
}

const styles = (theme) => ({
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  buttonGroup: {
    width: "100%",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  iconButton: {
    margin: theme.spacing(0),
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: "2.875rem",
    width: "calc(99.9% / 6)",
  },
  fileInputContainer: {
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
  },
  fileInput: {
    display: "none",
  },
  svgImg: {
    height: "24px",
    width: "24px",
  },
  buttonContainedPrimary: {
    "& img": {
      filter: "invert(1)", // fixes icon-colors on geometry icons.
    },
  },
});

export default withStyles(styles)(withSnackbar(FirToolbarView));
