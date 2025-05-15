import React, { useState } from "react";
import withSnackbar from "components/WithSnackbar";
import LsIconButton from "./LsIconButton";

import {
  Box,
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
  staticLayerConfig,
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
          `${theme.spacing(quickAccessSectionExpanded ? 0.2 : 0.0)} solid ${theme.palette.divider}`,
      }}
    >
      <ListItemButton
        disableRipple
        onClick={() => {
          if (!quickAccessSectionExpanded && qaLayers?.length === 0) {
            return;
          }
          setQuickAccessSectionExpanded(!quickAccessSectionExpanded);
        }}
        sx={{
          p: 0,
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        }}
        dense
      >
        <LsIconButton
          size="small"
          sx={{
            pr: 0,
            visibility: qaLayers?.length > 0 ? "visible" : "hidden",
          }}
          disableRipple
        >
          <KeyboardArrowRightOutlinedIcon
            style={{
              transform: quickAccessSectionExpanded ? "rotate(90deg)" : "",
              transition: "transform 300ms ease",
            }}
          ></KeyboardArrowRightOutlinedIcon>
        </LsIconButton>
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: 0.5,
            pr: 1,
          }}
        >
          <LsIconButton sx={{ pl: 0 }} disableRipple size="small">
            <StarOutlineOutlinedIcon />
          </LsIconButton>

          <ListItemText
            primaryTypographyProps={{
              variant: "body1",
              fontWeight: hasVisibleLayers ? "bold" : "inherit",
            }}
            primary="Snabbåtkomst"
          />

          <ListItemSecondaryAction sx={{ right: "4px" }}>
            {enableQuickAccessPresets && (
              <HajkTooltip title="Teman">
                <LsIconButton onClick={handleQuickAccessPresetsToggle}>
                  <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                </LsIconButton>
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
            layersState={layersState}
            staticLayerConfig={staticLayerConfig}
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
