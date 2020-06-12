import React, { useEffect, useRef, useState } from "react";

import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Draw from "ol/interaction/Draw";

import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import EditIcon from "@material-ui/icons/Edit";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";

import { Paper } from "@material-ui/core";
import { createPortal } from "react-dom";

import GeoJSON from "ol/format/GeoJSON.js";

import Dialog from "../Dialog.js";

const SearchTools = props => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [settingsDialog, setSettingsDialog] = useState(false);

  // Draw options
  const drawInteraction = useRef();
  const drawSource = useRef();
  const drawLayer = useRef();
  const drawOptions = [
    {
      name: "Sök med objekt",
      icon: <AddCircleOutlineIcon />,
      type: "SELECTION"
    },
    {
      name: "Sök med polygon",
      icon: <EditIcon />,
      type: "Polygon"
    },
    {
      name: "Sök med radie",
      icon: <RadioButtonUncheckedIcon />,
      type: "Circle"
    }
  ];
  const map = useRef(props.map);

  const drawStyle = useRef(
    new Style({
      stroke: new Stroke({
        color: "rgba(255, 214, 91, 0.6)",
        width: 4
      }),
      fill: new Fill({
        color: "rgba(255, 214, 91, 0.2)"
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: "rgba(255, 214, 91, 0.6)",
          width: 2
        })
      })
    })
  );

  useEffect(() => {
    drawSource.current = new VectorSource({ wrapX: false });
    drawLayer.current = new VectorLayer({
      source: drawSource.current,
      style: drawStyle.current
    });

    // Add layer that will be used to allow user draw on map - used for spatial search
    map.current.addLayer(drawLayer.current);
  }, []);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleSelection = e => {
    var view = map.current.getView();
    var wmsLayers = map.current.getLayers();

    map.current.clicklock = true;

    map.current.on("singleclick", evt => {
      wmsLayers.forEach(layer => {
        //Found visible TileLayer
        if (layer.get("visible") === true && layer.layersInfo) {
          let subLayers = Object.values(layer.layersInfo);
          let subLayersToQuery = subLayers
            .filter(subLayer => {
              return subLayer.queryable === true;
            })
            .map(queryableSubLayer => {
              return queryableSubLayer.id;
            });

          if (evt.coordinate !== undefined) {
            let url = layer
              .getSource()
              .getFeatureInfoUrl(
                evt.coordinate,
                view.getResolution(),
                view.getProjection().getCode(),
                {
                  INFO_FORMAT: "application/json",
                  QUERY_LAYERS: subLayersToQuery.join(",")
                }
              );

            (async () => {
              try {
                let response = await fetch(url);
                let data = await response.json(); //TODO: Error message when fetching json. It still works though.

                let features = new GeoJSON().readFeatures(data);
                if (features.length > 0) {
                  drawSource.current.addFeatures(features);
                }
              } catch (error) {
                console.error("Det gick inte att hämta json.", error);
              }
            })();
          }
        }
      });
    });

    drawSource.current.on("addfeature", () => {
      props.handleDrawSource(drawSource);
    });
  };

  const toggleDraw = (active, type, freehand = false, drawEndCallback) => {
    if (active) {
      drawInteraction.current = new Draw({
        source: drawSource.current,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: drawStyle.current
      });

      map.current.clicklock = true;
      map.current.addInteraction(drawInteraction.current);

      drawInteraction.current.on("drawstart", () => {
        drawSource.current.clear();
      });

      drawSource.current.on("addfeature", () => {
        map.current.removeInteraction(drawInteraction.current);
        props.handleDrawSource(drawSource);
      });
    } else {
      map.current.removeInteraction(drawInteraction.current);
      map.current.clicklock = false;
      drawSource.current.clear();
    }
  };

  function renderSettingsDialog() {
    if (settingsDialog) {
      return createPortal(
        <Dialog
          options={{
            text: "Avancerade inställningar...",
            headerText: "Inställningar",
            buttonText: "OK"
          }}
          open={settingsDialog}
          onClose={() => {
            setSettingsDialog(false);
          }}
        />,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  }

  const handleMenuItemClick = (event, index, option) => {
    const type = option.type;
    setAnchorEl(null);

    if (type === "SELECTION") {
      toggleSelection();
    } else {
      toggleDraw(true, type);
    }
  };

  return (
    <div>
      {renderSettingsDialog()}
      <IconButton
        aria-haspopup="true"
        aria-controls="lock-menu"
        onClick={handleOpenMenu}
        disabled={props.searchActive === "input"}
      >
        <MoreHorizIcon />
      </IconButton>
      <Paper>
        <Menu
          id="lock-menu"
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {drawOptions.map((option, index) => (
            <MenuItem
              key={index}
              onClick={event => handleMenuItemClick(event, index, option)}
            >
              {option.icon ? <ListItemIcon>{option.icon}</ListItemIcon> : null}
              <Typography variant="inherit" noWrap>
                {option.name}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </div>
  );
};

export default SearchTools;
