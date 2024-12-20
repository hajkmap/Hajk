import React, { useState } from "react";
import { withSnackbar } from "notistack";
// import { createPortal } from "react-dom";

// import { styled } from "@mui/material/styles";
import {
  Box,
  IconButton,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  Collapse,
} from "@mui/material";

import ConfirmationDialog from "../../../components/ConfirmationDialog.js";
import HajkTooltip from "../../../components/HajkToolTip.js";
import QuickAccessLayers from "./QuickAccessLayers.js";
import QuickAccessOptions from "./QuickAccessOptions.js";
import Favorites from "./Favorites/Favorites.js";

import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

const QuickAccessView = ({
  show,
  map, // A OpenLayers map instance
  app,
  globalObserver,
  enableQuickAccessPresets, // : boolean
  enableUserQuickAccessFavorites,
  handleQuickAccessPresetsToggle,
  favoritesViewDisplay,
  handleFavoritesViewToggle,
  favoritesInfoText,
  filterValue,
  enqueueSnackbar,
  layersState,
}) => {
  const qaLayers = Object.values(layersState).filter((obj) => obj.quickAccess);
  const hasVisibleLayers = qaLayers.some((l) => l.visible);

  const [quickAccessSectionExpanded, setQuickAccessSectionExpanded] =
    useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Handles click on clear quickAccess menu item
  const handleShowDeleteConfirmation = (e) => {
    e.stopPropagation();
    setShowDeleteConfirmation(true);
  };

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  // Handles click on confirm clear quickAccess button
  const handleClearQuickAccessLayers = () => {
    setShowDeleteConfirmation(false);
    layerSwitcherDispatch.clearQuickAccess();
  };

  // Handles click on AddLayersToQuickAccess menu item
  const handleAddLayersToQuickAccess = (e) => {
    e.stopPropagation();
    // Add visible layers to quickAccess section
    layerSwitcherDispatch.addVisibleLayersToQuickAccess();

    // Show snackbar
    enqueueSnackbar &&
      enqueueSnackbar(`Tända lager har nu lagts till i snabbåtkomst.`, {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
    // Expand quickAccess section
    setQuickAccessSectionExpanded(true);
  };

  return (
    <Box
      sx={{
        display: show ? "block" : "none",
        borderBottom: (theme) =>
          `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }}
    >
      <ListItemButton
        disableRipple
        onClick={() =>
          setQuickAccessSectionExpanded(!quickAccessSectionExpanded)
        }
        sx={{
          p: 0,
        }}
        dense
      >
        <IconButton
          size="small"
          sx={{
            pr: 0,
            visibility: qaLayers?.length > 0 ? "visibile" : "hidden",
          }}
          disableRipple
        >
          <KeyboardArrowRightOutlinedIcon
            style={{
              transform: quickAccessSectionExpanded ? "rotate(90deg)" : "",
              transition: "transform 300ms ease",
            }}
          ></KeyboardArrowRightOutlinedIcon>
        </IconButton>
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: 0.5,
            pr: 1,
            borderBottom: (theme) => `${theme.spacing(0.2)} solid transparent`,
          }}
        >
          <IconButton sx={{ pl: 0 }} disableRipple size="small">
            <StarOutlineOutlinedIcon />
          </IconButton>

          <ListItemText
            primaryTypographyProps={{
              variant: "body1",
              fontWeight: hasVisibleLayers ? "bold" : "inherit",
            }}
            primary="Snabbåtkomst"
          />

          <ListItemSecondaryAction>
            {enableQuickAccessPresets && (
              <HajkTooltip title="Teman">
                <IconButton onClick={handleQuickAccessPresetsToggle}>
                  <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                </IconButton>
              </HajkTooltip>
            )}
            {enableUserQuickAccessFavorites && (
              <Favorites
                favoriteViewDisplay={favoritesViewDisplay}
                app={app}
                map={map}
                handleFavoritesViewToggle={handleFavoritesViewToggle}
                globalObserver={globalObserver}
                favoritesInfoText={favoritesInfoText}
                handleQuickAccessSectionExpanded={() => {
                  setQuickAccessSectionExpanded(true);
                }}
              ></Favorites>
            )}
            <QuickAccessOptions
              handleAddLayersToQuickAccess={handleAddLayersToQuickAccess}
              handleClearQuickAccessLayers={handleShowDeleteConfirmation}
            ></QuickAccessOptions>
          </ListItemSecondaryAction>
        </Box>
      </ListItemButton>
      <Collapse in={quickAccessSectionExpanded}>
        <Box sx={{ marginLeft: "31px" }}>
          <QuickAccessLayers
            filterValue={filterValue}
            map={map}
            globalObserver={globalObserver}
          ></QuickAccessLayers>
        </Box>
      </Collapse>

      <ConfirmationDialog
        open={showDeleteConfirmation === true}
        titleName="Rensa allt"
        contentDescription="Alla lager i snabbåtkomst kommer nu att tas bort."
        cancel="Avbryt"
        confirm="Rensa"
        handleConfirm={handleClearQuickAccessLayers}
        handleAbort={() => {
          setShowDeleteConfirmation(false);
        }}
      />
    </Box>
  );
};

export default withSnackbar(QuickAccessView);
