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

import Dialog from "../Dialog.js";

const SearchTools = props => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [settingsDialog, setSettingsDialog] = useState(false);

  // Draw options
  const [drawActive, setDrawActive] = useState(false);
  const drawInteraction = useRef();
  const drawSource = useRef();
  const drawLayer = useRef();
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

  const handleToggleDraw = () => {
    setDrawActive(prevState => {
      toggleDraw(!prevState);
      return !prevState;
    });
    handleClose();
  };

  const toggleDraw = (
    active,
    type = "Polygon",
    freehand = false,
    drawEndCallback
  ) => {
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

  return (
    <div>
      {renderSettingsDialog()}
      <IconButton
        aria-haspopup="true"
        aria-controls="lock-menu"
        onClick={handleOpenMenu}
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
          <MenuItem onClick={handleClose} disabled={true}>
            <ListItemIcon>
              <AddCircleOutlineIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              Sök med objekt
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleToggleDraw}>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              Sök med polygon
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleClose} disabled={true}>
            <ListItemIcon>
              <RadioButtonUncheckedIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              Sök med radie
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleClose} disabled={true}>
            <ListItemIcon>
              <AddCircleOutlineIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              Sök i området
            </Typography>
          </MenuItem>
        </Menu>
      </Paper>
    </div>
  );
};

export default SearchTools;
