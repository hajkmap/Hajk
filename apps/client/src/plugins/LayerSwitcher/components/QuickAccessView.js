import React, { useState } from "react";
import { withSnackbar } from "notistack";
// import { createPortal } from "react-dom";

// import { styled } from "@mui/material/styles";
import { Box, IconButton, ListItemText, Tooltip } from "@mui/material";

import ConfirmationDialog from "../../../components/ConfirmationDialog.js";
import QuickAccessLayers from "./QuickAccessLayers.js";
import QuickAccessOptions from "./QuickAccessOptions.js";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import Favorites from "./Favorites/Favorites.js";

import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";

const QuickAccessView = ({
  map, // A OpenLayers map instance
  app,
  model, // LayerSwitcherModel instance
  enableQuickAccessTopics, // : boolean
  enableUserQuickAccessFavorites,
  handleLayerPackageToggle,
  favoritesViewDisplay,
  handleFavoritesViewToggle,
  favoritesInfoText,
  treeData,
  filterValue,
  enqueueSnackbar,
}) => {
  // TODO This iterates on all OL layers every render, that can be optimized
  const hasVisibleLayers =
    map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true && l.get("visible") === true)
      .length > 0;

  const [quickAccessSectionExpanded, setQuickAccessSectionExpanded] =
    useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Handles click on clear quickAccess menu item
  const handleShowDeleteConfirmation = (e) => {
    e.stopPropagation();
    setShowDeleteConfirmation(true);
  };

  // Handles click on confirm clear quickAccess button
  const handleClearQuickAccessLayers = () => {
    setShowDeleteConfirmation(false);
    map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => l.set("quickAccess", false));
  };

  // Handles click on AddLayersToQuickAccess menu item
  const handleAddLayersToQuickAccess = (e) => {
    e.stopPropagation();
    // Add visible layers to quickAccess section
    map
      .getAllLayers()
      .filter(
        (l) =>
          l.get("visible") === true &&
          l.get("layerType") !== "base" &&
          l.get("layerType") !== "system"
      )
      .map((l) => l.set("quickAccess", true));

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
        borderBottom: (theme) =>
          `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
      }}
    >
      <LayerGroupAccordion
        display={"block"}
        expanded={quickAccessSectionExpanded}
        setExpandedCallback={(expanded) => {
          console.warn({ expanded });
          setQuickAccessSectionExpanded(expanded);
        }}
        layerGroupTitle={
          <ListItemText
            primaryTypographyProps={{
              fontWeight: hasVisibleLayers ? "bold" : "inherit",
            }}
            primary="Snabbåtkomst"
          />
        }
        quickAccess={
          <IconButton sx={{ pl: 0 }} disableRipple size="small">
            <StarOutlineOutlinedIcon />
          </IconButton>
        }
        layerGroupDetails={
          <>
            {enableQuickAccessTopics && (
              <Tooltip title="Teman">
                <IconButton onClick={handleLayerPackageToggle}>
                  <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                </IconButton>
              </Tooltip>
            )}
            {enableUserQuickAccessFavorites && (
              <Favorites
                favoriteViewDisplay={favoritesViewDisplay}
                app={app}
                map={map}
                handleFavoritesViewToggle={handleFavoritesViewToggle}
                globalObserver={model.globalObserver}
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
          </>
        }
        children={
          <QuickAccessLayers
            treeData={treeData}
            filterValue={filterValue}
            model={model}
            map={map}
            app={app}
          ></QuickAccessLayers>
        }
      ></LayerGroupAccordion>

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
