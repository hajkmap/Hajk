import React from "react";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion";
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

// Collect all child ids (both group and layer nodes) from a parent group
const getAllChildIdsInGroup = (group) => {
  if (!group) {
    return [];
  }
  if (!group.children) {
    return [group.id];
  }
  return [group.id, ...group.children.flatMap((c) => getAllChildIdsInGroup(c))];
};

const LayerGroup = ({
  globalObserver,
  staticGroupTree,
  staticLayerConfig,
  layersState,
  filterHits,
  filterValue,
  isFirstGroup,
  isFirstChild,
  parentGroupHit,
  limitToggleToTree,
  overrideToggleable,
  disableAccordion,
}) => {
  const children = staticGroupTree.children;

  const groupId = staticGroupTree.id;
  const groupConfig = staticLayerConfig[groupId];

  const groupName = groupConfig?.caption;
  const name = groupConfig?.caption;

  const groupIsFiltered = groupConfig?.isFiltered;
  const groupIsExpanded = staticGroupTree.defaultExpanded;
  const groupIsToggable =
    overrideToggleable !== undefined
      ? overrideToggleable
      : staticGroupTree.groupIsToggable;

  const infogrouptitle = groupConfig?.infogrouptitle;
  const infogrouptext = groupConfig?.infogrouptext;
  const infogroupurl = groupConfig?.infogroupurl;
  const infogroupurltext = groupConfig?.infogroupurltext;
  const infogroupopendatalink = groupConfig?.infogroupopendatalink;
  const infogroupowner = groupConfig?.infogroupowner;

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const allLeafLayersInGroup = getAllLayerIdsInGroup(staticGroupTree);
  const allChildIdsInGroup = getAllChildIdsInGroup(staticGroupTree);

  // Determine if this group itself is a direct hit and whether we should skip filtering for it and its descendants
  const groupHit = filterHits ? filterHits.has(groupId) : false;
  const skipFilter = parentGroupHit || groupHit;

  // Compute intersection manually between filterHits and ids relevant to this group
  // Count hits when not skipping due to an ancestor match
  let hasNoFilterHits = false;
  let hasFilterHits = false;
  if (filterHits && !skipFilter) {
    const candidateIds = new Set([
      ...allLeafLayersInGroup,
      ...allChildIdsInGroup,
    ]);
    const hitsInGroupCount = [...filterHits].reduce(
      (count, id) => (candidateIds.has(id) ? count + 1 : count),
      0
    );
    hasNoFilterHits = hitsInGroupCount === 0;
    hasFilterHits = hitsInGroupCount > 0;
  }

  if (filterHits && !skipFilter && hasNoFilterHits) {
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
        isFirstGroup={isFirstGroup}
        isFirstChild={isFirstChild}
        display={groupIsFiltered ? "none" : "block"}
        toggleable={groupIsToggable}
        expanded={
          disableAccordion ? true : groupHit || hasFilterHits || groupIsExpanded
        }
        disableAccordion={disableAccordion}
        toggleDetails={
          <ToggleAllComponent
            toggleable={groupIsToggable}
            toggleState={toggleState}
            clickHandler={() => {
              if (limitToggleToTree) {
                const nextVisible = !isToggled;
                allLeafLayersInGroup.forEach((leafId) => {
                  layerSwitcherDispatch.setLayerVisibility(leafId, nextVisible);
                });
              } else {
                if (isToggled) {
                  layerSwitcherDispatch.setGroupVisibility(groupId, false);
                } else {
                  layerSwitcherDispatch.setGroupVisibility(groupId, true);
                }
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
          {children?.map((child, index) => {
            const layerId = child.id;

            const layerState = layersState[layerId];
            const isFirstChild = index === 0;
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
                  parentGroupHit={skipFilter}
                />
              );
            }

            if (filterHits && !skipFilter && !filterHits.has(layerId)) {
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
                isFirstChild={isFirstChild}
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
