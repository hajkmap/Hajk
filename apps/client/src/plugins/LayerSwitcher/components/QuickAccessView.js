import React from "react";
// import { createPortal } from "react-dom";

// import { styled } from "@mui/material/styles";
import { Box, IconButton, ListItemText, Tooltip } from "@mui/material";

import QuickAccessLayers from "./QuickAccessLayers.js";
import QuickAccessOptions from "./QuickAccessOptions.js";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import Favorites from "./Favorites/Favorites.js";

import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";

const QuickAccessView = ({
  quickAccessSectionExpanded,
  setQuickAccessExpandedCallback,
  map, // A OpenLayers map instance
  app,
  model, // LayerSwitcherModel instance
  enableQuickAccessTopics, // : boolean
  enableUserQuickAccessFavorites,
  handleLayerPackageToggle,
  favoritesViewDisplay,
  handleFavoritesViewToggle,
  favoritesInfoText,
  handleQuickAccessSectionExpanded,
  handleAddLayersToQuickAccess,
  handleClearQuickAccessLayers,
  treeData,
  filterValue,
}) => {
  // TODO This iterates on all OL layers every render, that can be optimized
  const hasVisibleLayers =
    map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true && l.get("visible") === true)
      .length > 0;

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
        setExpandedCallback={setQuickAccessExpandedCallback}
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
            {enableQuickAccessTopics ? (
              <Tooltip title="Teman">
                <IconButton onClick={handleLayerPackageToggle}>
                  <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                </IconButton>
              </Tooltip>
            ) : (
              <div style={{ display: "none" }}>
                <IconButton>
                  <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                </IconButton>
              </div>
            )}
            {enableUserQuickAccessFavorites && (
              <Favorites
                favoriteViewDisplay={favoritesViewDisplay}
                app={app}
                map={map}
                handleFavoritesViewToggle={handleFavoritesViewToggle}
                globalObserver={model.globalObserver}
                favoritesInfoText={favoritesInfoText}
                handleQuickAccessSectionExpanded={
                  handleQuickAccessSectionExpanded
                }
              ></Favorites>
            )}
            <QuickAccessOptions
              handleAddLayersToQuickAccess={handleAddLayersToQuickAccess}
              handleClearQuickAccessLayers={handleClearQuickAccessLayers}
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
    </Box>
  );
};

export default QuickAccessView;
