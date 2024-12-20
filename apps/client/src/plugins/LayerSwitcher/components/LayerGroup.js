import React, { useState } from "react";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import { Typography, IconButton, ListItemText, Link } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import InfoIcon from "@mui/icons-material/Info";
import HajkToolTip from "components/HajkToolTip";

import { useLayerSwitcherDispatch } from "../LayerSwitcherProvider";

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
      <IconButton sx={{ pl: 0 }} disableRipple size="small">
        {
          {
            checked: <CheckBoxIcon />,
            semichecked: <CheckBoxIcon sx={{ color: "gray" }} />,
            unchecked: <CheckBoxOutlineBlankIcon />,
          }[toggleState]
        }
      </IconButton>
    </div>
  );
};

const GroupInfoDetails = ({
  name,
  infoVisible,
  infogrouptitle = "",
  infogrouptext = "",
  infogroupurl = "",
  infogroupurltext = "",
  infogroupopendatalink = "",
  infogroupowner = "",
}) => {
  if (!infoVisible) {
    return null;
  }
  return (
    <div>
      {infogrouptitle && (
        <Typography variant="subtitle2">{infogrouptitle}</Typography>
      )}
      {infogrouptext && (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: infogrouptext }}
        ></Typography>
      )}
      {infogroupurl && (
        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, mb: 1 }}>
          <Link href={infogroupurl} target="_blank" rel="noreferrer">
            {infogroupurltext}
          </Link>
        </Typography>
      )}
      {infogroupopendatalink && (
        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, mb: 1 }}>
          <Link href={infogroupopendatalink} target="_blank" rel="noreferrer">
            Öppna data: {name}
          </Link>
        </Typography>
      )}
      {infogroupowner && (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: infogroupowner }}
        ></Typography>
      )}
    </div>
  );
};

const GroupInfoToggler = ({
  clickHandler,
  infoVisible,
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
  // Render icons only if one of the states above has a value
  return (
    <HajkToolTip title="Mer information om gruppen">
      <IconButton
        sx={{
          padding: "0px",
          "& .MuiTouchRipple-root": { display: "none" },
        }}
        onClick={(e) => {
          e.stopPropagation();
          clickHandler();
        }}
      >
        {infoVisible ? <RemoveCircleIcon /> : <InfoIcon />}
      </IconButton>
    </HajkToolTip>
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

  const groupName = groupConfig.caption;
  const name = groupConfig.caption;
  const groupIsFiltered = groupConfig.isFiltered;
  const groupIsExpanded = groupConfig.isExpanded;
  const groupIsToggable = groupConfig.toggled;

  const infogrouptitle = groupConfig.infogrouptitle;
  const infogrouptext = groupConfig.infogrouptext;
  const infogroupurl = groupConfig.infogroupurl;
  const infogroupurltext = groupConfig.infogroupurltext;
  const infogroupopendatalink = groupConfig.infogroupopendatalink;
  const infogroupowner = groupConfig.infogroupowner;

  const [infoVisible, setInfoVisible] = useState(false);

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const allLeafLayersInGroup = getAllLayerIdsInGroup(staticGroupTree);

  const filterHitsInGroup =
    filterHits && filterHits.intersection(new Set(allLeafLayersInGroup));
  // hasFilterHits === null means that the filter isn't active
  const hasNoFilterHits = filterHitsInGroup && filterHitsInGroup?.size === 0;
  const filterActiveAndHasHits = filterHits && !hasNoFilterHits;
  // console.log({ name, hasNoFilterHits, filterHitsInGroup, filterHits });
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

  const toggleInfo = () => {
    setInfoVisible(!infoVisible);
  };

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
        <div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <GroupInfoToggler
              clickHandler={() => toggleInfo()}
              infoVisible={infoVisible}
              infogrouptitle={infogrouptitle}
              infogrouptext={infogrouptext}
              infogroupurl={infogroupurl}
              infogroupurltext={infogroupurltext}
              infogroupopendatalink={infogroupopendatalink}
              infogroupowner={infogroupowner}
            />
            <ListItemText
              primaryTypographyProps={{
                py: groupIsToggable ? 0 : "3px",
                pl: groupIsToggable ? 0 : "3px",
                variant: "body1",
                fontWeight: isToggled || isSemiToggled ? "bold" : "inherit",
              }}
              primary={name}
            />
          </div>
          <GroupInfoDetails
            name={groupName}
            infoVisible={infoVisible}
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

          if (filterHits && !filterHits.has(layerId)) {
            // The filter is active and this layer is not a hit.
            return null;
          }

          const layerState = layersState[layerId];

          const layerSettings = staticLayerConfig[layerId];
          if (!layerSettings) {
            return null;
          }

          if (layerSettings.layerType === "group") {
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
  );
};

export default LayerGroup;
