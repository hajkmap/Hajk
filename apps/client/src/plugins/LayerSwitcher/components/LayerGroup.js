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
  group,
  globalObserver,
  layerMap,
  staticGroupTree,
  staticLayerConfig,
  layersState,
}) => {
  const { name, groups } = group;

  const infogrouptitle = group.infogrouptitle;
  const infogrouptext = group.infogrouptext;
  const infogroupurl = group.infogroupurl;
  const infogroupurltext = group.infogroupurltext;
  const infogroupopendatalink = group.infogroupopendatalink;
  const infogroupowner = group.infogroupowner;

  const [infoVisible, setInfoVisible] = useState(false);

  const allLeafLayersInGroup = getAllLayerIdsInGroup(staticGroupTree);

  const hasVisibleLayer = allLeafLayersInGroup.some(
    (id) => layersState[id]?.visible
  );
  const hasAllLayersVisible = allLeafLayersInGroup.every(
    (id) => layersState[id]?.visible
  );

  const isToggled = hasAllLayersVisible;
  const isSemiToggled = hasVisibleLayer && !hasAllLayersVisible;

  const layerSwitcherDispatch = useLayerSwitcherDispatch();

  const toggleInfo = () => {
    setInfoVisible(!infoVisible);
  };

  let groupsExpanded = false;
  if (group.groups?.length === 1 && groups[0].expanded) {
    groupsExpanded = groups[0].id;
  }

  const toggleState = isToggled
    ? "checked"
    : isSemiToggled
      ? "semichecked"
      : "unchecked";

  return (
    <LayerGroupAccordion
      display={!group.isFiltered ? "none" : "block"}
      toggleable={group.toggled}
      expanded={group.isExpanded}
      toggleDetails={
        <ToggleAllComponent
          toggleable={group.toggled}
          toggleState={toggleState}
          clickHandler={() => {
            if (isToggled) {
              layerSwitcherDispatch.setGroupVisibility(group.id, false);
            } else {
              layerSwitcherDispatch.setGroupVisibility(group.id, true);
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
                py: group.toggled ? 0 : "3px",
                pl: group.toggled ? 0 : "3px",
                variant: "body1",
                fontWeight: isToggled || isSemiToggled ? "bold" : "inherit",
              }}
              primary={name}
            />
          </div>
          <GroupInfoDetails
            name={group.name}
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
        {group.layers?.map((layer) => {
          const mapLayer = layerMap[layer.id];
          // If mapLayer doesn't exist, the layer shouldn't be displayed
          if (!mapLayer) {
            return null;
          }

          const layerState = {
            // layerIsToggled: mapLayer.get("visible"),
            layerIsToggled: layersState[layer.id]?.visible,
            // visibleSubLayers: mapLayer.get("subLayers"),
            visibleSubLayers: layersState[layer.id]?.visibleSubLayers,
          };

          const layerSettings = staticLayerConfig[layer.id];

          // TODO Get config from static and send to layeritem/grouplayer
          const layerConfig = {
            layerId: mapLayer.get("name"),
            layerCaption: mapLayer.get("caption"),
            layerType: mapLayer.get("layerType"),

            layerIsFakeMapLayer: mapLayer.isFakeMapLayer,
            layerMinZoom: mapLayer.get("minZoom"),
            layerMaxZoom: mapLayer.get("maxZoom"),
            numberOfSubLayers: mapLayer.subLayers.length,
            layerInfo: mapLayer.get("layerInfo"),
            layerLegendIcon: mapLayer.get("legendIcon"),
          };

          return mapLayer.get("layerType") === "group" ? (
            <GroupLayer
              display={!layer.isFiltered ? "none" : "block"}
              key={mapLayer.get("name")}
              layer={mapLayer}
              layerState={layerState}
              layerConfig={layerConfig}
              draggable={false}
              toggleable={true}
              globalObserver={globalObserver}
              groupLayer={layer}
            />
          ) : (
            <LayerItem
              display={!layer.isFiltered ? "none" : "block"}
              key={mapLayer.get("name")}
              layerState={layerState}
              layerConfig={layerConfig}
              draggable={false}
              toggleable={true}
              globalObserver={globalObserver}
            />
          );
        })}
        {group.groups?.map((group, i) => (
          <LayerGroup
            expanded={groupsExpanded === group.id}
            key={i}
            group={group}
            layerMap={layerMap}
            globalObserver={globalObserver}
            staticLayerConfig={staticLayerConfig}
            staticGroupTree={staticGroupTree.children?.find(
              (g) => g.id === group.id
            )}
            layersState={layersState}
          />
        ))}
      </div>
    </LayerGroupAccordion>
  );
};

export default LayerGroup;
