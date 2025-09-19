import React, { useState } from "react";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import { ListItemText } from "@mui/material";
import LsCheckBox from "./LsCheckBox";

import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";
import { getIsMobile } from "../LayerSwitcherUtils";
import BtnShowDetails from "./BtnShowDetails";

/**
 * If Group has "toggleable" property enabled, render the toggle all checkbox.
 */
const ToggleAllComponent = ({ toggleable, toggleState, clickHandler }) => {
  if (!toggleable) {
    return null;
  }
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clickHandler();
      }}
    >
      <LsCheckBox toggleState={toggleState} />
    </div>
  );
};

const GroupInfoToggler = ({
  globalObserver,
  infogroupname = "",
  infogrouptitle = "",
  infogrouptext = "",
  infogroupurl = "",
  infogroupurltext = "",
  infogroupopendatalink = "",
  infogroupowner = "",
}) => {
  if (
    !(
      infogrouptitle ||
      infogrouptext ||
      infogroupurl ||
      infogroupurltext ||
      infogroupopendatalink ||
      infogroupowner
    )
  ) {
    return null;
  }
  // If any of the above variables arent mising, render the show details button
  return (
    <BtnShowDetails
      onClick={(e) => {
        e.stopPropagation();
        globalObserver.publish("setLayerDetails", {
          infogroupname,
          infogrouptitle,
          infogrouptext,
          infogroupurl,
          infogroupurltext,
          infogroupopendatalink,
          infogroupowner,
        });
      }}
    />
  );
};

// TODO move to common file
const getAllLayerIdsInGroup = (group) => {
  if (!group) {
    return [];
  }

  if (!group.children) {
    return [group.id];
  } else {
    return group.children.flatMap((c) => {
      return getAllLayerIdsInGroup(c);
    });
  }
};

const LayerGroup = ({
  globalObserver,
  staticGroupTree,
  staticLayerConfig,
  layersState,
  filterHits,
  filterValue,
}) => {
  const children = staticGroupTree.children;

  const groupId = staticGroupTree.id;
  const groupConfig = staticLayerConfig[groupId];

  const groupName = groupConfig?.caption;
  const name = groupConfig?.caption;

  const groupIsFiltered = groupConfig?.isFiltered;
  const groupIsExpanded = staticGroupTree.defaultExpanded;
  const groupIsToggable = staticGroupTree.groupIsToggable;

  const infogrouptitle = groupConfig?.infogrouptitle;
  const infogrouptext = groupConfig?.infogrouptext;
  const infogroupurl = groupConfig?.infogroupurl;
  const infogroupurltext = groupConfig?.infogroupurltext;
  const infogroupopendatalink = groupConfig?.infogroupopendatalink;
  const infogroupowner = groupConfig?.infogroupowner;

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const allLeafLayersInGroup = getAllLayerIdsInGroup(staticGroupTree);

  const filterHitsInGroup =
    filterHits && filterHits.intersection(new Set(allLeafLayersInGroup));
  // hasFilterHits === null means that the filter isn't active
  const hasNoFilterHits = filterHitsInGroup && filterHitsInGroup?.size === 0;
  const filterActiveAndHasHits = filterHits && !hasNoFilterHits;
  if (hasNoFilterHits) {
    return null;
  }

  const hasVisibleLayer = allLeafLayersInGroup.some(
    (id) => layersState[id]?.visible
  );
  const hasAllLayersVisible = allLeafLayersInGroup.every(
    (id) => layersState[id]?.visible
  );

  const isToggled = hasAllLayersVisible;
  const isSemiToggled = hasVisibleLayer && !hasAllLayersVisible;

  // TODO Refactor the expand close to state
  let groupsExpanded = false;
  // if (subGroups?.length === 1 && subGroups[0].expanded) {
  //   groupsExpanded = subGroups[0].id;
  // }

  const toggleState = isToggled
    ? "checked"
    : isSemiToggled
      ? "semichecked"
      : "unchecked";

  return (
    <div>
      <LayerGroupAccordion
        display={groupIsFiltered ? "none" : "block"}
        toggleable={groupIsToggable}
        expanded={filterActiveAndHasHits || groupIsExpanded}
        toggleDetails={
          <ToggleAllComponent
            toggleable={groupIsToggable}
            toggleState={toggleState}
            clickHandler={() => {
              if (isToggled) {
                layerSwitcherDispatch.setGroupVisibility(groupId, false);
              } else {
                layerSwitcherDispatch.setGroupVisibility(groupId, true);
              }
            }}
          />
        }
        layerGroupTitle={
          <div style={{ width: "100%", display: "flex", flexDirection: "row" }}>
            <ListItemText
              style={{ flex: 1 }}
              primary={name}
              slotProps={{
                primary: {
                  pb: "2px", // jesade-vbg compact mode, added line.
                  py: groupIsToggable ? 0 : getIsMobile() ? "3px" : "1px", // jesade-vbg compact mode
                  pl: groupIsToggable ? 0 : "3px",
                  variant: "body1",
                  fontWeight: isToggled || isSemiToggled ? "bold" : "inherit",
                },
              }}
            />
            <GroupInfoToggler
              globalObserver={globalObserver}
              infogroupname={groupName}
              infogrouptitle={infogrouptitle}
              infogrouptext={infogrouptext}
              infogroupurl={infogroupurl}
              infogroupurltext={infogroupurltext}
              infogroupopendatalink={infogroupopendatalink}
              infogroupowner={infogroupowner}
            />
          </div>
        }
      >
        <div>
          {children?.map((child) => {
            const layerId = child.id;

            const layerState = layersState[layerId];

            const layerSettings = staticLayerConfig[layerId];
            if (!layerSettings) {
              return null;
            }

            if (layerSettings.layerType === "group") {
              // The LayerGroup components check the filter to see if it should
              // display itself or not. So we always have to render it regardless
              // of the filter.
              return (
                <LayerGroup
                  expanded={groupsExpanded === layerId}
                  key={layerId}
                  globalObserver={globalObserver}
                  staticLayerConfig={staticLayerConfig}
                  staticGroupTree={children?.find((g) => g?.id === layerId)}
                  layersState={layersState}
                  filterHits={filterHits}
                  filterValue={filterValue}
                />
              );
            }

            if (filterHits && !filterHits.has(layerId)) {
              // The filter is active and this layer is not a hit.
              return null;
            }

            return layerSettings.layerType === "groupLayer" ? (
              <GroupLayer
                key={layerId}
                layerState={layerState}
                layerConfig={layerSettings}
                draggable={false}
                toggleable={true}
                globalObserver={globalObserver}
                filterHits={filterHits}
                filterValue={filterValue}
              />
            ) : (
              <LayerItem
                key={layerId}
                layerState={layerState}
                layerConfig={layerSettings}
                draggable={false}
                toggleable={true}
                globalObserver={globalObserver}
                filterValue={filterValue}
              />
            );
          })}
        </div>
      </LayerGroupAccordion>
    </div>
  );
};

export default LayerGroup;
