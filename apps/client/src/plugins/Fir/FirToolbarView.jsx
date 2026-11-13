import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { IconPolygon, IconRect, IconLine, IconPoint } from "./FirIcons";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Typography } from "@mui/material";
import Collapse from "@mui/material/Collapse";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Draw, { createBox } from "ol/interaction/Draw";
import FirStyles from "./FirStyles";

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const ContainerTopDoublePadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(4),
}));

const StyledButtonGroup = styled(ButtonGroup)(({ _theme }) => ({
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

const FileInput = styled("input")(({ _theme }) => ({
  visibility: "hidden",
  position: "absolute",
}));

const SvgImg = styled("img")(({ _theme }) => ({
  height: "24px",
  width: "24px",
}));

function FirToolbarView({ model, app, localObserver, prefix = "fir" }) {
  const interactionRef = useRef(null);
  const fnsRef = useRef({});

  const [styles] = useState(() => new FirStyles(model));

  const [state, setStateRaw] = useState(() => ({
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
  }));
  const stateRef = useRef(state);
  const [, setTick] = useState(0);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const forceUpdate = () => {
    setTick((tick) => tick + 1);
  };

  const updateNumberOfObjects = () => {
    setTimeout(() => {
      // TODO: create and listen to update event instead.
      setState({
        numberOfObjects: model.layers.draw.getSource().getFeatures().length,
      });
      forceUpdate();
    }, 100);
  };

  const handleToolbarClick = (id) => {
    let o = { ...stateRef.current.tools };

    for (let type in o) {
      if (type === id) {
        o[type].selected = !o[type].selected;

        if (o[type].selected === true) {
          activateTool(type);
        } else {
          deactivateDraw();
        }
      } else {
        o[type].selected = false;
      }
    }

    setState({
      tools: o,
    });
  };

  const handleDeleteClick = useCallback((e) => {
    fnsRef.current.handleDeleteClick(e);
  }, []);

  const handleKeyDown = useCallback((e) => {
    fnsRef.current.handleKeyDown(e);
  }, []);

  const activateTool = (type) => {
    let tool = stateRef.current.tools[type];
    let geometryFunction = null;

    if (tool.drawTool === true) {
      if (type === "Rectangle") {
        type = "Circle";
        geometryFunction = createBox();
      }

      deactivateDraw();

      interactionRef.current = new Draw({
        source: model.layers.draw.getSource(),
        type: type,
        geometryFunction: geometryFunction,
        geometryName: type,
        style: styles.getSelectionStyle(),
      });
      interactionRef.current.on("drawend", () => {
        deactivateDraw();
        deselectButtonItems();
      });

      activateDraw();
    } else {
      deactivateDraw();
      if (type === "Delete") {
        model.map.on("singleclick", handleDeleteClick);
      }
    }
  };

  const deactivateDraw = () => {
    model.map.un("singleclick", handleDeleteClick);
    if (interactionRef.current) {
      interactionRef.current.abortDrawing();
      model.map.removeInteraction(interactionRef.current);
      model.map.clickLock.delete(`${prefix}-draw`);
      window.removeEventListener("keydown", handleKeyDown);
    }
    updateNumberOfObjects();
  };

  const activateDraw = () => {
    model.map.addInteraction(interactionRef.current);
    model.map.clickLock.add(`${prefix}-draw`);
    window.addEventListener("keydown", handleKeyDown);
    updateNumberOfObjects();
  };

  const deselectButtonItems = () => {
    let o = { ...stateRef.current.tools };
    for (let type in o) {
      o[type].selected = false;
    }
    setState({ tools: o });
  };

  const handleKeyDownLogic = (e) => {
    if (e.keyCode === 27 /* escape */) {
      deactivateDraw();
      deselectButtonItems();
    }
  };

  const handleDeleteClickLogic = (e) => {
    var first = true;
    model.map.forEachFeatureAtPixel(e.pixel, (feature, _layer) => {
      // Handles both drawn features and buffer features. Remove them at the same time as they are linked.

      const type = feature.get(`${prefix}_type`);
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

        model.layers[type].getSource().removeFeature(feature);
        const layerName = type === "draw" ? "buffer" : "draw";
        let secondaryLayer = model.layers[layerName];
        let secondaryFeature = secondaryLayer
          .getSource()
          .getFeatures()
          .find(findFn);

        if (secondaryFeature) {
          secondaryLayer.getSource().removeFeature(secondaryFeature);
        }

        deactivateDraw();
        deselectButtonItems();
      }
      first = false;
    });
    updateNumberOfObjects();
  };

  const handleFileSelection = (e) => {
    if (e && e.target) {
      setState({ files: { list: e.target.files || [] } });
      if (e.target.files.length > 0) {
        localObserver.publish(`${prefix}.file.import`, e.target.files[0]);
        setTimeout(() => {
          e.target.value = "";
        }, 500);
      }
    }
  };

  fnsRef.current = {
    handleDeleteClick: handleDeleteClickLogic,
    handleKeyDown: handleKeyDownLogic,
    handleSearchClear: () => {
      deactivateDraw();
      setState({ files: { list: [] } });
      deselectButtonItems();
    },
  };

  useEffect(() => {
    localObserver.subscribe(`${prefix}.search.clear`, () => {
      fnsRef.current.handleSearchClear();
    });
    model.layers.draw.getSource().on("addfeature", (e) => {
      e.feature.setStyle(styles.getSelectionStyle());
    });
  }, [localObserver, model, prefix, styles]);

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
            on={"" + state.tools.Polygon.selected}
            invert={"" + true}
            color={state.tools.Polygon.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("Polygon");
            }}
          >
            <SvgImg src={IconPolygon()} alt="" />
          </IconButton>
          <IconButton
            title="Rektangel"
            on={"" + state.tools.Rectangle.selected}
            invert={"" + true}
            color={state.tools.Rectangle.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("Rectangle");
            }}
          >
            <SvgImg src={IconRect()} alt="" />
          </IconButton>
          <IconButton
            title="Linje"
            on={"" + state.tools.LineString.selected}
            invert={"" + true}
            color={state.tools.LineString.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("LineString");
            }}
          >
            <SvgImg src={IconLine()} alt="" />
          </IconButton>
          <IconButton
            title="Punkt"
            on={"" + state.tools.Point.selected}
            invert={"" + true}
            color={state.tools.Point.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("Point");
            }}
          >
            <SvgImg src={IconPoint()} alt="" />
          </IconButton>
          <IconButton
            title="Importera KLM-fil"
            on={"" + state.tools.Import.selected}
            invert={"" + false}
            color={state.tools.Import.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("Import");
            }}
          >
            <InsertDriveFileIcon
              style={{
                color: state.tools.Import.selected ? "#fff" : "#000",
              }}
            />
          </IconButton>
          <IconButton
            title="Ta bort objekt"
            on={"" + state.tools.Delete.selected}
            invert={"" + false}
            color={state.tools.Delete.selected ? "primary" : "secondary"}
            onClick={() => {
              handleToolbarClick("Delete");
            }}
          >
            <DeleteIcon
              style={{
                color: state.tools.Delete.selected ? "#fff" : "#000",
              }}
            />
          </IconButton>
        </StyledButtonGroup>
        <Collapse in={state.tools.Import.selected === true}>
          <ContainerTopPadded>
            <Typography variant="subtitle2">Importera KML-fil</Typography>
            <FileInputContainer>
              <FileInput
                accept=".kml"
                id={`${prefix}FileInput`}
                type="file"
                onChange={handleFileSelection}
              />
              <label htmlFor={`${prefix}FileInput`}>
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
                {state.files.list.length > 0
                  ? state.files.list[0].name
                  : "Ingen fil är vald"}
              </span>
            </FileInputContainer>
          </ContainerTopPadded>
        </Collapse>
      </div>
      <Collapse in={state.numberOfObjects > 0}>
        <ContainerTopDoublePadded>
          <TextField
            fullWidth={true}
            label="Lägg till buffer på sökområde"
            value={state.buffer}
            onKeyDown={(e) => {
              return !isNaN(e.key);
            }}
            onChange={(e) => {
              let v = parseInt(e.target.value);
              if (isNaN(v)) {
                v = 0;
              }

              const bufferValue = parseInt(v);
              setState({ buffer: bufferValue });

              localObserver.publish(`${prefix}.layers.bufferValueChanged`, {
                value: bufferValue,
              });
            }}
            onFocus={(_e) => {
              if (stateRef.current.buffer === 0) {
                setState({ buffer: "" });
              }
            }}
            onBlur={(_e) => {
              if (stateRef.current.buffer === "") {
                setState({ buffer: 0 });
              }
            }}
            size="small"
            variant="outlined"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">meter</InputAdornment>
                ),
              },
            }}
          />
        </ContainerTopDoublePadded>
      </Collapse>
    </>
  );
}

FirToolbarView.propTypes = {
  model: PropTypes.object.isRequired,
  prefix: PropTypes.string,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default FirToolbarView;
