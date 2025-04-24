import React, { useState, useCallback, useRef } from "react";

import { ListItemText } from "@mui/material";

import LayerGroup from "./LayerGroup.js";
import QuickAccessView from "./QuickAccessView.js";
import LayerListFilter from "./LayerListFilter.js";
import { debounce } from "utils/debounce";

// Layers Tab in the LayerSwitcher

const DEFAULT_MIN_FILTER_LENGTH = 3;

// TODO Use this function
// collapseAllGroups = () => {
//   // const collapseGroups = (groups) => {
//   //   groups.forEach((group) => {
//   //     group.isExpanded = false;
//   //     if (group.groups && group.groups.length > 0) {
//   //       collapseGroups(group.groups);
//   //     }
//   //   });
//   // };
//   // collapseGroups(this.layerTree);
// };

const LayersTab = ({
  layersState,
  staticLayerTree,
  staticLayerConfig,
  layersTabOptions,
  displayContentOverlay,
  handleQuickAccessPresetsToggle,
  handleFavoritesViewToggle,
  globalObserver,
  map,
  app,
  style,
  // scrollContainerRef,
}) => {
  const {
    showFilter,
    showQuickAccess,
    enableQuickAccessPresets,
    enableUserQuickAccessFavorites,
    userQuickAccessFavoritesInfoText,
    layerFilterMinLength,
  } = layersTabOptions || {};

  const minFilterLength = layerFilterMinLength ?? DEFAULT_MIN_FILTER_LENGTH;

  const [filterValue, setFilterValue] = useState(null);

  const handleFilterSubmit = useCallback((value) => {
    const filterValue = value === "" ? null : value;
    if (filterValue?.length > 0) {
      setFilterValue(filterValue);
    }
  }, []);

  const handleFilterValueChange = debounce((value) => {
    const filterValue = value === "" ? null : value;

    if (value === "") {
      setFilterValue(null);
    } else if (filterValue.length >= minFilterLength) {
      setFilterValue(filterValue);
    }
  }, 100);

  let filterHits = null;

  const searchIndex = Object.values(staticLayerConfig).flatMap((l) => {
    let subLayerIndex = [];
    if (l.allSubLayers?.length > 1) {
      subLayerIndex = l.allSubLayers.map((sl) => {
        const subLayerInfo = l.layerInfo.layersInfo[sl];
        return [subLayerInfo.caption, l.id];
      });
    }

    return [...subLayerIndex, [l.caption, l.id]];
  });

  if (filterValue) {
    const lowercaseFilterValue = filterValue.toLocaleLowerCase();
    const hits = searchIndex
      ?.filter(([name, _]) =>
        name.toLocaleLowerCase().includes(lowercaseFilterValue)
      )
      ?.map(([_, id]) => id);
    filterHits = new Set(hits);
  }

  const scrollContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    scrollContainerRef.current.scroll(0, Number.MAX_SAFE_INTEGER, {
      behavior: "smooth",
    });
    scrollContainerRef.current?.scrollIntoView({ block: "end" });
  }, [scrollContainerRef]);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current.scroll(0, 0, { behavior: "smooth" });
  }, [scrollContainerRef]);

  return (
    <div
      // This class is used to style specific elements when the tab is active
      // If you search for this class in the codebase, you can find related style-fixes.
      className={"ls-layers-tab-view"}
      style={{
        ...style,
        position: "relative",
        overflowY: "auto",
        flexGrow: "1",
        height: "inherit",
        maxHeight: "inherit",
        flexDirection: "column",
      }}
    >
      {showFilter && (
        <LayerListFilter
          minFilterLength={minFilterLength}
          handleFilterSubmit={(value) => handleFilterSubmit(value)}
          handleFilterValueChange={(value) => handleFilterValueChange(value)}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      )}
      {filterHits !== null && filterHits.size === 0 && (
        <ListItemText
          sx={{
            py: 1,
            px: 4,
          }}
          primary="Inga resultat"
          primaryTypographyProps={{
            pr: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            variant: "body1",
          }}
        />
      )}
      <div
        ref={scrollContainerRef}
        style={{
          height: "inherit",
          overflowY: "auto",
          overflowX: "hidden",
          flexBasis: "100%",
          flexGrow: "1",
          flexShrink: "1",
          transform: "translateZ(0)", // Force layer into 3D space to prevent flickering
        }}
      >
        {filterHits === null && (
          <QuickAccessView
            show={showQuickAccess}
            map={map}
            app={app}
            globalObserver={globalObserver}
            enableQuickAccessPresets={enableQuickAccessPresets}
            enableUserQuickAccessFavorites={enableUserQuickAccessFavorites}
            handleQuickAccessPresetsToggle={handleQuickAccessPresetsToggle}
            favoritesViewDisplay={displayContentOverlay === "favorites"}
            handleFavoritesViewToggle={handleFavoritesViewToggle}
            favoritesInfoText={userQuickAccessFavoritesInfoText}
            filterValue={filterValue}
            layersState={layersState}
            staticLayerConfig={staticLayerConfig}
          />
        )}
        {staticLayerTree.map((group) => (
          <LayerGroup
            key={group.id}
            staticLayerConfig={staticLayerConfig}
            staticGroupTree={group}
            layersState={layersState}
            globalObserver={globalObserver}
            filterHits={filterHits}
            filterValue={filterValue}
          />
        ))}
      </div>
    </div>
  );
};

export default LayersTab;
