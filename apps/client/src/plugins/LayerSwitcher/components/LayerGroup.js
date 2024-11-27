import React, { useState, useEffect, useRef } from "react";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import { Typography, IconButton, ListItemText, Link } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import InfoIcon from "@mui/icons-material/Info";
import HajkToolTip from "components/HajkToolTip";

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

const LayerGroup = ({ app, group, localObserver, layerMap, options }) => {
  const { name, groups } = group;

  const infogrouptitle = group.infogrouptitle;
  const infogrouptext = group.infogrouptext;
  const infogroupurl = group.infogroupurl;
  const infogroupurltext = group.infogroupurltext;
  const infogroupopendatalink = group.infogroupopendatalink;
  const infogroupowner = group.infogroupowner;

  const [infoVisible, setInfoVisible] = useState(false);

  // Openlayers functions does not use any of our props, so this is safe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allLayers = useRef(app.getMap().getAllLayers(), [app]);

  useEffect(() => {
    bindVisibleChangeForLayersInGroup();
    return () => {
      //LayerGroup is never unmounted atm but we remove listener in case this
      //changes in the future
      unbindVisibleChangeForLayersInGroup();
    };
    // This useEffect corresponds to `componentDidMount` in the previous
    // version. It should never re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO This is a workaround for this component until we change the
  // LayerSwitcher state model. Re-render whenever any layer in the group
  // changes.
  // We force update when a layer in this group has changed visibility to
  // be able to sync togglebuttons in GUI
  // eslint-disable-next-line no-unused-vars
  const [_, forceUpdate] = useState(false);
  const layerVisibilityChanged = (_) => {
    forceUpdate((v) => v + 1);
    // setExpanded(expanded);
  };

  const hasLayers = (group) => {
    return group.layers && group.layers.length > 0;
  };

  const hasSubGroups = (group) => {
    return group.groups && group.groups.length > 0;
  };

  const getAllLayersInGroupAndSubGroups = (groups) => {
    return groups.reduce((layers, group) => {
      if (hasSubGroups(group)) {
        layers = [...layers, ...getAllLayersInGroupAndSubGroups(group.groups)];
      }
      return [...layers, ...group.layers];
    }, []);
  };

  const getAllMapLayersReferencedByGroup = () => {
    const allLayersInGroup = getAllLayersInGroupAndSubGroups([group]);
    return app
      .getMap()
      .getLayers()
      .getArray()
      .filter((mapLayer) => {
        return allLayersInGroup.find((layer) => {
          return layer.id === mapLayer.get("name");
        });
      });
  };

  const bindVisibleChangeForLayersInGroup = () => {
    getAllMapLayersReferencedByGroup().forEach((layer) => {
      layer.on("change:visible", layerVisibilityChanged);
    });
  };

  const unbindVisibleChangeForLayersInGroup = () => {
    getAllMapLayersReferencedByGroup().forEach((layer) => {
      layer.un("change:visible", layerVisibilityChanged);
    });
  };

  const layerInMap = (layer) => {
    const layers = app.getMap().getLayers().getArray();
    let foundMapLayer = layers.find((mapLayer) => {
      return mapLayer.get("name") === layer.id;
    });

    if (foundMapLayer && foundMapLayer.getVisible()) {
      return true;
    } else {
      return false;
    }
  };

  const areSubGroupsAndLayersSemiToggled = (group) => {
    let someSubItemToggled = false;
    if (hasLayers(group)) {
      someSubItemToggled = group.layers.some((layer) => {
        return layerInMap(layer);
      });
    }

    if (hasSubGroups(group) && !someSubItemToggled) {
      someSubItemToggled = group.groups.some((g) => {
        return areSubGroupsAndLayersSemiToggled(g);
      });
    }
    return someSubItemToggled;
  };

  const areAllGroupsAndSubGroupsToggled = (group) => {
    let allGroupsToggled = true;
    let allLayersToggled = true;
    if (hasSubGroups(group)) {
      allGroupsToggled = group.groups.every((g) => {
        return areAllGroupsAndSubGroupsToggled(g);
      });
    }
    if (hasLayers(group)) {
      allLayersToggled = group.layers.every((layer) => {
        return layerInMap(layer);
      });
    }
    return allGroupsToggled && allLayersToggled;
  };
  /**
   * @summary Loops through groups of objects and changes visibility for all layers within group.
   *
   * @param {boolean} visibility
   * @param {array|object} groupsArray
   * @memberof LayerGroup
   */
  const toggleGroups = (visibility, groupsArray) => {
    // Sometimes groupsArray is an array of objects:
    Array.isArray(groupsArray) &&
      groupsArray.forEach((group) => {
        // First call this function on all groups that might be inside this group
        group.groups.length &&
          group.groups.forEach((g) => {
            toggleGroups(visibility, g);
          });

        // Next, call toggleLayers on all layers in group
        toggleLayers(visibility, group.layers);
      });

    // … but sometimes it's not an array but rather an object:
    typeof groupsArray === "object" &&
      groupsArray !== null &&
      groupsArray.hasOwnProperty("groups") &&
      toggleGroups(visibility, groupsArray.groups);

    typeof groupsArray === "object" &&
      groupsArray !== null &&
      groupsArray.hasOwnProperty("layers") &&
      toggleLayers(visibility, groupsArray.layers);
  };

  const toggleLayers = (visibility, layers) => {
    allLayers.current
      .filter((mapLayer) => {
        return layers.some((layer) => layer.id === mapLayer.get("name"));
      })
      .forEach((mapLayer) => {
        if (mapLayer.get("layerType") === "group") {
          if (visibility === true) {
            localObserver.publish("showLayer", mapLayer);
          } else {
            localObserver.publish("hideLayer", mapLayer);
          }
        } else {
          mapLayer.setVisible(visibility);
        }
      });
  };

  const toggleInfo = () => {
    setInfoVisible(!infoVisible);
  };

  let groupsExpanded = false;
  if (group.groups.length === 1 && groups[0].expanded) {
    groupsExpanded = groups[0].id;
  }

  const isToggled = areAllGroupsAndSubGroupsToggled(group);
  const isSemiToggled = areSubGroupsAndLayersSemiToggled(group);
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
              toggleGroups(false, group.groups);
              toggleLayers(false, group.layers);
            } else {
              toggleGroups(true, group.groups);
              toggleLayers(true, group.layers);
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
        {group.layers.map((layer) => {
          const mapLayer = layerMap[layer.id];
          // If mapLayer doesn't exist, the layer shouldn't be displayed
          if (!mapLayer) {
            return null;
          }

          return mapLayer.get("layerType") === "group" ? (
            <GroupLayer
              display={!layer.isFiltered ? "none" : "block"}
              key={mapLayer.get("name")}
              layer={mapLayer}
              draggable={false}
              toggleable={true}
              app={app}
              localObserver={localObserver}
              groupLayer={layer}
            />
          ) : (
            <LayerItem
              display={!layer.isFiltered ? "none" : "block"}
              key={mapLayer.get("name")}
              layer={mapLayer}
              draggable={false}
              toggleable={true}
              app={app}
              localObserver={localObserver}
              groupLayer={layer}
            />
          );
        })}
        {group.groups.map((group, i) => (
          <LayerGroup
            expanded={groupsExpanded === group.id}
            key={i}
            group={group}
            localObserver={localObserver}
            layerMap={layerMap}
            app={app}
            options={options}
          />
        ))}
      </div>
    </LayerGroupAccordion>
  );
};

export default LayerGroup;
